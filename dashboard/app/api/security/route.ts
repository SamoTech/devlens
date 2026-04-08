/**
 * DevLens Mega Security Scanner — API Route
 * GET /api/security?repo=owner/name[&force=1]
 *
 * Modules:
 *   Security  — Dependabot CVEs, Secret Scanning, CodeQL/SAST, OSV.dev, License
 *   Code Quality (NEW)
 *     Option C — GitHub CI check-runs (lint, tests, type checks)
 *     Option B — SonarCloud public API, DeepSource public API, Codecov public API
 *
 * Results cached in Upstash Redis for 15 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  MegaScanReport, DependabotModule, SecretsModule, CodeScanModule,
  OsvModule, LicenseModule, TotalCounts, ScoringResult, ScoreDeduction,
  SeverityCounts, Severity, CodeQualityModule, CiQualityModule,
  CiCheckRun, CheckRunConclusion, SonarModule, DeepSourceModule, CodecovModule,
} from '@/lib/security-types';

const GH_TOKEN    = process.env.GITHUB_TOKEN ?? '';
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL ?? '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';
const CACHE_TTL   = 900; // 15 minutes

const GH_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ghGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: GH_HEADERS,
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch { return null; }
}

async function osvQuery(
  pkg: string, version: string, ecosystem: string,
): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version, package: { name: pkg, ecosystem } }),
    });
    const data = await res.json() as { vulns?: Record<string, unknown>[] };
    return data.vulns ?? [];
  } catch { return []; }
}

const SEV_ORDER: Record<string, number> = {
  CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4, UNKNOWN: 5,
};
function sevSort<T extends { severity: string }>(arr: T[]): T[] {
  return [...arr].sort(
    (a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5),
  );
}

const COPYLEFT   = new Set(['AGPL-3.0','GPL-2.0','GPL-3.0','LGPL-2.1','LGPL-3.0','EUPL-1.2','SSPL-1.0']);
const PERMISSIVE = new Set(['MIT','Apache-2.0','BSD-2-Clause','BSD-3-Clause','ISC','0BSD','Unlicense']);

// Known CI check name patterns → category labels
const LINT_PATTERNS  = [/eslint/i, /tslint/i, /lint/i, /prettier/i, /stylelint/i, /oxlint/i];
const TEST_PATTERNS  = [/jest/i, /vitest/i, /mocha/i, /playwright/i, /cypress/i, /test/i, /spec/i];
const BUILD_PATTERNS = [/build/i, /compile/i, /tsc/i, /type.?check/i, /typecheck/i];

function classifyCheck(name: string): 'lint' | 'test' | 'build' | 'other' {
  if (LINT_PATTERNS.some(r => r.test(name)))  return 'lint';
  if (TEST_PATTERNS.some(r => r.test(name)))  return 'test';
  if (BUILD_PATTERNS.some(r => r.test(name))) return 'build';
  return 'other';
}

// ── Security Scanners ─────────────────────────────────────────────────────────

async function scanDependabot(owner: string, repo: string): Promise<DependabotModule> {
  const alerts = await ghGet<Record<string, unknown>[]>(
    `/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=100`,
  );
  if (!alerts) return { enabled: false, findings: [], counts: {}, total: 0, error: 'Not enabled or insufficient permissions' };
  const counts: SeverityCounts = {};
  const findings = alerts.map((a) => {
    const sev = ((a.security_advisory as Record<string, unknown>)?.severity as string ?? 'UNKNOWN').toUpperCase() as Severity;
    counts[sev] = (counts[sev] ?? 0) + 1;
    const pkg = (a.dependency as Record<string, unknown>)?.package as Record<string, unknown>;
    const adv = a.security_advisory as Record<string, unknown>;
    const fpv = ((a.security_vulnerability as Record<string, unknown>)?.first_patched_version as Record<string, unknown>)?.identifier as string;
    return {
      id: adv?.ghsa_id as string ?? '', cve: adv?.cve_id as string ?? '',
      package: pkg?.name as string ?? '', ecosystem: pkg?.ecosystem as string ?? '',
      severity: sev, summary: adv?.summary as string ?? '',
      fixed_in: fpv ?? 'N/A', url: a.html_url as string ?? '',
    };
  });
  return { enabled: true, findings: sevSort(findings), counts, total: findings.length };
}

async function scanSecrets(owner: string, repo: string): Promise<SecretsModule> {
  const alerts = await ghGet<Record<string, unknown>[]>(
    `/repos/${owner}/${repo}/secret-scanning/alerts?state=open&per_page=100`,
  );
  if (!alerts) return { enabled: false, findings: [], total: 0, error: 'Not enabled' };
  const findings = alerts.map((a) => ({
    type:       (a.secret_type_display_name ?? a.secret_type ?? '') as string,
    state:      a.state as string ?? '',
    created_at: a.created_at as string ?? '',
    url:        a.html_url as string ?? '',
  }));
  return { enabled: true, findings, total: findings.length };
}

async function scanCodeScanning(owner: string, repo: string): Promise<CodeScanModule> {
  const alerts = await ghGet<Record<string, unknown>[]>(
    `/repos/${owner}/${repo}/code-scanning/alerts?state=open&per_page=100`,
  );
  if (!alerts) return { enabled: false, tools: [], findings: [], counts: {}, total: 0, error: 'Not enabled' };
  const counts: SeverityCounts = {};
  const tools = new Set<string>();
  const findings = alerts.map((a) => {
    const rule = a.rule as Record<string, unknown>;
    const sev  = ((rule?.security_severity_level ?? rule?.severity ?? 'UNKNOWN') as string).toUpperCase() as Severity;
    counts[sev] = (counts[sev] ?? 0) + 1;
    const tool = (a.tool as Record<string, unknown>)?.name as string ?? 'unknown';
    tools.add(tool);
    const loc = ((a.most_recent_instance as Record<string, unknown>)?.location as Record<string, unknown>);
    return {
      rule: rule?.id as string ?? '', description: rule?.description as string ?? '',
      severity: sev, tool,
      file: loc?.path as string ?? '', line: loc?.start_line as number ?? '',
      url: a.html_url as string ?? '',
    };
  });
  return { enabled: true, tools: [...tools], findings: sevSort(findings), counts, total: findings.length };
}

async function scanOsv(owner: string, repo: string): Promise<OsvModule> {
  const findings: OsvModule['findings'] = [];
  let checked = 0;
  const pkgJsonRaw = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/package.json`);
  if (pkgJsonRaw?.content) {
    try {
      const pkgJson = JSON.parse(Buffer.from(pkgJsonRaw.content, 'base64').toString()) as Record<string, unknown>;
      const deps = {
        ...(pkgJson.dependencies as Record<string, string> ?? {}),
        ...(pkgJson.devDependencies as Record<string, string> ?? {}),
      };
      for (const [name, verRaw] of Object.entries(deps).slice(0, 50)) {
        const ver = (verRaw as string).replace(/^[^~>=<]*/, '').replace(/[^0-9.].*$/, '') || verRaw as string;
        const vulns = await osvQuery(name, ver, 'npm');
        checked++;
        for (const v of vulns) {
          let sev: Severity = 'UNKNOWN';
          for (const s of (v.severity as Record<string, string>[] ?? [])) {
            if (s.type === 'CVSS_V3') {
              const score = parseFloat(s.score ?? '0');
              sev = score >= 9 ? 'CRITICAL' : score >= 7 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW';
            }
          }
          findings.push({
            id: v.id as string ?? '', package: name, version: ver as string,
            ecosystem: 'npm', severity: sev, summary: v.summary as string ?? '',
            url: `https://osv.dev/vulnerability/${v.id}`,
          });
        }
      }
    } catch { /* skip malformed */ }
  }
  const counts: SeverityCounts = {};
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  return { packages_checked: checked, findings: sevSort(findings), counts, total: findings.length };
}

async function scanLicense(owner: string, repo: string): Promise<LicenseModule> {
  const data = await ghGet<{ license?: { spdx_id?: string | null }; html_url?: string }>(
    `/repos/${owner}/${repo}/license`,
  );
  const raw  = data?.license?.spdx_id ?? null;
  const spdx = (!raw || raw === 'NOASSERTION' || raw === 'NONE') ? null : raw;

  if (!spdx) {
    const candidates = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'];
    let hasLicenseFile = false;
    for (const filename of candidates) {
      const f = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/${filename}`);
      if (f?.content) { hasLicenseFile = true; break; }
    }
    if (!hasLicenseFile) {
      return {
        found: false, spdx: null, displaySpdx: 'None', risk: 'high',
        note: 'No license file found. All rights reserved by default — others cannot legally use, copy, or distribute this code.',
      };
    }
    return {
      found: true, spdx: null, displaySpdx: 'Custom', risk: 'medium',
      url: data?.html_url,
      note: 'A license file was found but GitHub could not match it to a standard SPDX identifier. Review the file manually.',
    };
  }
  const risk = PERMISSIVE.has(spdx) ? 'low' : COPYLEFT.has(spdx) ? 'high' : 'medium';
  return { found: true, spdx, displaySpdx: spdx, risk, url: data?.html_url };
}

// ── Option C: GitHub CI Check Runs ────────────────────────────────────────────

async function scanCiCheckRuns(owner: string, repo: string): Promise<CiQualityModule> {
  // Get default branch SHA first
  const repoData = await ghGet<{ default_branch: string }>(`/repos/${owner}/${repo}`);
  if (!repoData) return { overall: 'unknown', total_runs: 0, passed: 0, failed: 0, skipped: 0, runs: [], lint_found: false, test_found: false, error: 'Could not fetch repo info' };

  const branch  = repoData.default_branch;
  const commits = await ghGet<{ sha: string }[]>(`/repos/${owner}/${repo}/commits?sha=${branch}&per_page=1`);
  if (!commits || commits.length === 0) return { overall: 'unknown', total_runs: 0, passed: 0, failed: 0, skipped: 0, runs: [], lint_found: false, test_found: false, error: 'No commits found' };

  const sha  = commits[0].sha;
  const data = await ghGet<{ check_runs: Record<string, unknown>[] }>(
    `/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`,
  );
  if (!data) return { overall: 'unknown', total_runs: 0, passed: 0, failed: 0, skipped: 0, runs: [], lint_found: false, test_found: false, error: 'No check runs found' };

  const runs: CiCheckRun[] = data.check_runs.map((r) => ({
    name:         r.name as string ?? '',
    app:          (r.app as Record<string, unknown>)?.slug as string ?? 'unknown',
    conclusion:   r.conclusion as CheckRunConclusion | null,
    status:       r.status as string ?? '',
    started_at:   r.started_at as string ?? '',
    completed_at: r.completed_at as string | null ?? null,
    url:          r.html_url as string ?? '',
    category:     classifyCheck(r.name as string ?? ''),
  } as CiCheckRun & { category: string }));

  let passed = 0, failed = 0, skipped = 0;
  for (const r of runs) {
    if (r.conclusion === 'success')                         passed++;
    else if (r.conclusion === 'skipped' || r.conclusion === 'neutral') skipped++;
    else if (r.conclusion && r.conclusion !== null)         failed++;
  }

  const lint_found = runs.some(r => LINT_PATTERNS.some(p => p.test(r.name)));
  const test_found = runs.some(r => TEST_PATTERNS.some(p => p.test(r.name)));

  const overall = failed > 0 ? 'fail'
    : passed > 0  ? 'pass'
    : runs.length > 0 ? 'partial'
    : 'unknown';

  return { overall, total_runs: runs.length, passed, failed, skipped, runs, lint_found, test_found };
}

// ── Option B: SonarCloud Public API ───────────────────────────────────────────

async function scanSonarCloud(owner: string, repo: string): Promise<SonarModule> {
  // SonarCloud project key format: owner_repo (lowercase)
  const projectKey = `${owner}_${repo}`.toLowerCase();
  const baseUrl    = `https://sonarcloud.io/api`;

  try {
    // Check if project exists on SonarCloud
    const measuresRes = await fetch(
      `${baseUrl}/measures/component?component=${projectKey}&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
    );
    if (!measuresRes.ok) {
      return { available: false, issues: [], error: `Project "${projectKey}" not found on SonarCloud. Add sonar.yml to enable.` };
    }
    const measuresData = await measuresRes.json() as {
      component?: { measures?: { metric: string; value: string }[] };
    };
    const measures = measuresData.component?.measures ?? [];
    const get = (k: string) => {
      const m = measures.find(m => m.metric === k);
      return m ? parseFloat(m.value) : null;
    };

    // Fetch open issues (bugs + vulnerabilities, max 50)
    const issuesRes = await fetch(
      `${baseUrl}/issues/search?componentKeys=${projectKey}&types=BUG,VULNERABILITY&statuses=OPEN&ps=50`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
    );
    const issuesData = issuesRes.ok
      ? await issuesRes.json() as { issues?: Record<string, unknown>[] }
      : { issues: [] };

    const issues = (issuesData.issues ?? []).map(i => ({
      key:       i.key as string ?? '',
      type:      i.type as 'BUG' | 'VULNERABILITY' | 'CODE_SMELL',
      severity:  i.severity as 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO',
      message:   i.message as string ?? '',
      component: (i.component as string ?? '').replace(`${projectKey}:`, ''),
      line:      i.line as number | null ?? null,
      url:       `https://sonarcloud.io/project/issues?id=${projectKey}&open=${i.key}`,
    }));

    return {
      available:      true,
      project_key:    projectKey,
      bugs:           get('bugs') ?? 0,
      vulnerabilities: get('vulnerabilities') ?? 0,
      code_smells:    get('code_smells') ?? 0,
      coverage:       get('coverage'),
      duplications:   get('duplicated_lines_density'),
      issues,
      url: `https://sonarcloud.io/project/overview?id=${projectKey}`,
    };
  } catch (e) {
    return { available: false, issues: [], error: String(e) };
  }
}

// ── Option B: DeepSource Public API ───────────────────────────────────────────

async function scanDeepSource(owner: string, repo: string): Promise<DeepSourceModule> {
  try {
    // DeepSource GraphQL API — public repos are accessible without auth
    const query = `{
      repository(login: "${owner}", name: "${repo}") {
        issues(first: 50, issueState: OPEN) {
          totalCount
          edges {
            node {
              issueCode
              category
              title
              occurrenceCount
              shortcode
            }
          }
        }
      }
    }`;
    const res = await fetch('https://api.deepsource.io/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 0 },
    });
    if (!res.ok) return { available: false, checks: [], error: 'DeepSource project not found or not public' };
    const json = await res.json() as { data?: { repository?: { issues?: { totalCount: number; edges: Record<string, unknown>[] } } }; errors?: unknown };
    if (json.errors || !json.data?.repository) {
      return { available: false, checks: [], error: 'Repository not analysed by DeepSource' };
    }
    const issuesData = json.data.repository.issues;
    const checks = (issuesData?.edges ?? []).map(e => {
      const n = e.node as Record<string, unknown>;
      return {
        issue_code:  n.issueCode as string ?? '',
        category:    n.category as string ?? '',
        title:       n.title as string ?? '',
        occurrences: n.occurrenceCount as number ?? 0,
        url: `https://app.deepsource.com/gh/${owner}/${repo}/issues/?analyzer=${n.shortcode}`,
      };
    });
    const bugs        = checks.filter(c => c.category?.toLowerCase().includes('bug')).reduce((s, c) => s + c.occurrences, 0);
    const antiPatterns = checks.filter(c => c.category?.toLowerCase().includes('anti')).reduce((s, c) => s + c.occurrences, 0);
    return {
      available: true, bugs, anti_patterns: antiPatterns, checks,
      url: `https://app.deepsource.com/gh/${owner}/${repo}/`,
    };
  } catch (e) {
    return { available: false, checks: [], error: String(e) };
  }
}

// ── Option B: Codecov Public API ──────────────────────────────────────────────

async function scanCodecov(owner: string, repo: string): Promise<CodecovModule> {
  try {
    const res = await fetch(
      `https://codecov.io/api/v2/github/${owner}/repos/${repo}/`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
    );
    if (!res.ok) return { available: false, error: 'Repository not found on Codecov' };
    const data = await res.json() as {
      totals?: { coverage?: number | null; patch?: number | null };
    };
    return {
      available: true,
      coverage:  data.totals?.coverage ?? null,
      patch:     data.totals?.patch ?? null,
      url: `https://app.codecov.io/gh/${owner}/${repo}`,
    };
  } catch (e) {
    return { available: false, error: String(e) };
  }
}

// ── Aggregate Code Quality Score ──────────────────────────────────────────────

function calcCodeQualityScore(
  ci: CiQualityModule,
  sonar: SonarModule,
  deepsource: DeepSourceModule,
  codecov: CodecovModule,
): number {
  let score = 100;

  // CI (40 pts max)
  if (ci.overall === 'fail')    score -= 30;
  if (ci.overall === 'partial') score -= 10;
  if (!ci.lint_found)           score -=  5;
  if (!ci.test_found)           score -=  5;

  // SonarCloud (30 pts max)
  if (sonar.available) {
    score -= Math.min((sonar.bugs ?? 0) * 3, 15);
    score -= Math.min((sonar.vulnerabilities ?? 0) * 2, 10);
    if ((sonar.coverage ?? 100) < 60)  score -= 5;
  }

  // DeepSource (15 pts max)
  if (deepsource.available) {
    score -= Math.min((deepsource.bugs ?? 0) * 2, 10);
    score -= Math.min((deepsource.anti_patterns ?? 0), 5);
  }

  // Codecov (15 pts max)
  if (codecov.available) {
    const cov = codecov.coverage ?? 100;
    if (cov < 80) score -= 5;
    if (cov < 50) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

async function scanCodeQuality(owner: string, repo: string): Promise<CodeQualityModule> {
  const [ci, sonar, deepsource, codecov] = await Promise.all([
    scanCiCheckRuns(owner, repo),
    scanSonarCloud(owner, repo),
    scanDeepSource(owner, repo),
    scanCodecov(owner, repo),
  ]);
  const score = calcCodeQualityScore(ci, sonar, deepsource, codecov);
  return { ci, sonar, deepsource, codecov, score };
}

// ── Score Calculator (Security) ───────────────────────────────────────────────

function calculateScore(report: Partial<MegaScanReport>): ScoringResult {
  let score = 100;
  const deductions: ScoreDeduction[] = [];
  const deduct = (pts: number, reason: string) => { score -= pts; deductions.push({ points: pts, reason }); };

  const depCounts = report.dependabot?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 10], ['HIGH', 5], ['MEDIUM', 2], ['LOW', 1]] as [Severity, number][]) {
    const n = depCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 3), `${n} ${sev} Dependabot alert(s)`);
  }

  const secTotal = report.secrets_github?.total ?? 0;
  if (secTotal) deduct(Math.min(secTotal * 8, 25), `${secTotal} exposed secret(s)`);

  const csCounts = report.code_scanning?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 8], ['HIGH', 4], ['MEDIUM', 2]] as [Severity, number][]) {
    const n = csCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 3), `${n} ${sev} code scanning finding(s)`);
  }

  for (const [mod, label] of [['osv', 'OSV'], ['trivy', 'Trivy']] as const) {
    const modCounts = (report[mod as keyof MegaScanReport] as { counts?: SeverityCounts })?.counts ?? {};
    for (const [sev, pts] of [['CRITICAL', 6], ['HIGH', 3], ['MEDIUM', 1]] as [Severity, number][]) {
      const n = modCounts[sev] ?? 0;
      if (n) deduct(Math.min(pts * n, pts * 4), `${n} ${sev} ${label} finding(s)`);
    }
  }

  if (report.license?.risk === 'high') deduct(5, `Copyleft/no license: ${report.license.displaySpdx ?? 'None'}`);
  if (!report.has_security_md)        deduct(3, 'Missing SECURITY.md');

  score = Math.max(0, score);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  return { score, grade, deductions, max_score: 100 };
}

function aggregateTotals(report: Partial<MegaScanReport>): TotalCounts {
  const agg: TotalCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, TOTAL: 0, SECRETS: 0 };
  for (const mod of ['dependabot', 'code_scanning', 'osv', 'trivy', 'nuclei', 'semgrep'] as const) {
    const counts = (report[mod as keyof MegaScanReport] as { counts?: SeverityCounts })?.counts ?? {};
    for (const sev of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const) {
      agg[sev] += counts[sev] ?? 0;
    }
  }
  agg.TOTAL   = agg.CRITICAL + agg.HIGH + agg.MEDIUM + agg.LOW;
  agg.SECRETS = report.secrets_github?.total ?? 0;
  return agg;
}

// ── Redis Cache ───────────────────────────────────────────────────────────────

async function cacheGet(key: string): Promise<MegaScanReport | null> {
  if (!REDIS_URL) return null;
  try {
    const res = await fetch(`${REDIS_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const data = await res.json() as { result?: string };
    return data.result ? JSON.parse(data.result) as MegaScanReport : null;
  } catch { return null; }
}

async function cacheSet(key: string, value: MegaScanReport): Promise<void> {
  if (!REDIS_URL) return;
  try {
    await fetch(`${REDIS_URL}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: JSON.stringify(value), ex: CACHE_TTL }),
    });
  } catch { /* non-fatal */ }
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const repoParam = searchParams.get('repo') ?? '';
  const force     = searchParams.get('force') === '1';

  if (!repoParam.includes('/')) {
    return NextResponse.json({ error: 'repo param must be owner/name' }, { status: 400 });
  }

  const [owner, repo] = repoParam.split('/');
  const cacheKey = `devlens:security:${owner}/${repo}`;

  if (!force) {
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  // Run all scans — security + code quality — in parallel
  const [dependabot, secrets_github, code_scanning, osv, license, code_quality] = await Promise.all([
    scanDependabot(owner, repo),
    scanSecrets(owner, repo),
    scanCodeScanning(owner, repo),
    scanOsv(owner, repo),
    scanLicense(owner, repo),
    scanCodeQuality(owner, repo),
  ]);

  const secMdRaw       = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/SECURITY.md`);
  const has_security_md = !!secMdRaw?.content;

  const partial: Partial<MegaScanReport> = {
    meta: {
      owner, repo, target_url: null,
      scanned_at: new Date().toISOString(),
      modules: ['dependabot','secrets','code_scanning','osv','license','ci_checks','sonarcloud','deepsource','codecov'],
    },
    dependabot, secrets_github, code_scanning, osv, license, code_quality, has_security_md,
    trufflehog: { available: false, message: 'CLI tool — run scripts/mega_scanner.py locally', findings: [] },
    semgrep:    { available: false, message: 'CLI tool — run scripts/mega_scanner.py locally', findings: [] },
    nuclei:     { available: false, message: 'CLI tool — run scripts/mega_scanner.py locally', findings: [] },
    trivy:      { available: false, message: 'CLI tool — run scripts/mega_scanner.py locally', findings: [] },
  };

  const report: MegaScanReport = {
    ...partial,
    totals:  aggregateTotals(partial),
    scoring: calculateScore(partial),
  } as MegaScanReport;

  await cacheSet(cacheKey, report);
  return NextResponse.json(report, { headers: { 'X-Cache': 'MISS' } });
}
