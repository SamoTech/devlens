/**
 * DevLens Mega Security Scanner — API Route
 * GET /api/security?repo=owner/name[&force=1]
 *
 * ── 100% FREE scan modules ──────────────────────────────────────────────────
 *  Security
 *    1. GitHub Dependabot Alerts     github.com API (free with token)
 *    2. GitHub Secret Scanning       github.com API (free with token)
 *    3. GitHub Code Scanning (SAST)  github.com API (free with token)
 *    4. OSV.dev                      api.osv.dev — completely free, no key
 *    5. NIST NVD (NEW)               services.nvd.nist.gov — free, optional key
 *    6. GitHub Advisory DB (NEW)     api.github.com GraphQL — free with token
 *    7. PyPI Safety DB (NEW)         pypi.org JSON + osv.dev — free, no key
 *    8. Retire.js CDN heuristic(NEW) jsdelivr CDN list + osv.dev — free, no key
 *    9. License Risk                 github.com API (free)
 *  Code Quality
 *    10. GitHub CI Check Runs        github.com API (free with token)
 *    11. SonarCloud public API       sonarcloud.io — free for public repos
 *    12. DeepSource public GraphQL   api.deepsource.io — free for public repos
 *    13. Codecov public API          codecov.io — free for public repos
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
const NVD_API_KEY = process.env.NVD_API_KEY  ?? ''; // optional — raises rate limit from 5/30s → 50/30s
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL   ?? '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';
const CACHE_TTL   = 900; // 15 minutes

const GH_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
};

// ── Shared helpers ────────────────────────────────────────────────────────────

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

function cvssToSeverity(score: number): Severity {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  if (score  > 0.0) return 'LOW';
  return 'UNKNOWN';
}

const COPYLEFT   = new Set(['AGPL-3.0','GPL-2.0','GPL-3.0','LGPL-2.1','LGPL-3.0','EUPL-1.2','SSPL-1.0']);
const PERMISSIVE = new Set(['MIT','Apache-2.0','BSD-2-Clause','BSD-3-Clause','ISC','0BSD','Unlicense']);

const LINT_PATTERNS  = [/eslint/i, /tslint/i, /lint/i, /prettier/i, /stylelint/i, /oxlint/i];
const TEST_PATTERNS  = [/jest/i, /vitest/i, /mocha/i, /playwright/i, /cypress/i, /test/i, /spec/i];
const BUILD_PATTERNS = [/build/i, /compile/i, /tsc/i, /type.?check/i, /typecheck/i];

function classifyCheck(name: string): 'lint' | 'test' | 'build' | 'other' {
  if (LINT_PATTERNS.some(r => r.test(name)))  return 'lint';
  if (TEST_PATTERNS.some(r => r.test(name)))  return 'test';
  if (BUILD_PATTERNS.some(r => r.test(name))) return 'build';
  return 'other';
}

// ── 1. GitHub Dependabot ──────────────────────────────────────────────────────

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

// ── 2. GitHub Secret Scanning ─────────────────────────────────────────────────

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

// ── 3. GitHub Code Scanning (SAST / CodeQL) ───────────────────────────────────

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

// ── 4. OSV.dev — npm packages ─────────────────────────────────────────────────

async function scanOsv(owner: string, repo: string): Promise<OsvModule> {
  const findings: OsvModule['findings'] = [];
  let checked = 0;
  const pkgJsonRaw = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/package.json`);
  if (pkgJsonRaw?.content) {
    try {
      const pkgJson = JSON.parse(Buffer.from(pkgJsonRaw.content, 'base64').toString()) as Record<string, unknown>;
      const deps = {
        ...(pkgJson.dependencies    as Record<string, string> ?? {}),
        ...(pkgJson.devDependencies as Record<string, string> ?? {}),
      };
      for (const [name, verRaw] of Object.entries(deps).slice(0, 50)) {
        const ver = (verRaw as string).replace(/^[^~>=<]*/, '').replace(/[^0-9.].*$/, '') || verRaw as string;
        const vulns = await osvQuery(name, ver, 'npm');
        checked++;
        for (const v of vulns) {
          let sev: Severity = 'UNKNOWN';
          for (const s of (v.severity as Record<string, string>[] ?? [])) {
            if (s.type === 'CVSS_V3') sev = cvssToSeverity(parseFloat(s.score ?? '0'));
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

// ── 5. NIST NVD (NEW — free, optional API key) ────────────────────────────────
// Endpoint: https://services.nvd.nist.gov/rest/json/cves/2.0
// Rate limit: 5 req/30s without key, 50 req/30s with key (register free at nvd.nist.gov)
// We query by keyword (repo name) to surface any publicly known CVEs mentioning this project.

interface NvdModule {
  available: boolean;
  total: number;
  findings: Array<{
    cve_id: string;
    description: string;
    severity: Severity;
    cvss_score: number | null;
    published: string;
    url: string;
  }>;
  counts: SeverityCounts;
  error?: string;
}

async function scanNvd(owner: string, repo: string): Promise<NvdModule> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (NVD_API_KEY) headers['apiKey'] = NVD_API_KEY;

    // Search for CVEs mentioning owner/repo — catches project-specific CVEs
    const keyword = encodeURIComponent(`${owner} ${repo}`);
    const res = await fetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${keyword}&resultsPerPage=20`,
      { headers, next: { revalidate: 0 } },
    );
    if (!res.ok) return { available: false, total: 0, findings: [], counts: {}, error: `NVD returned ${res.status}` };

    const data = await res.json() as {
      totalResults?: number;
      vulnerabilities?: Array<{
        cve: {
          id: string;
          descriptions: Array<{ lang: string; value: string }>;
          published: string;
          metrics?: {
            cvssMetricV31?: Array<{ cvssData: { baseScore: number; baseSeverity: string } }>;
            cvssMetricV30?: Array<{ cvssData: { baseScore: number; baseSeverity: string } }>;
            cvssMetricV2?:  Array<{ cvssData: { baseScore: number } }>;
          };
        };
      }>;
    };

    const findings = (data.vulnerabilities ?? []).map((v) => {
      const cve = v.cve;
      const desc = cve.descriptions.find(d => d.lang === 'en')?.value ?? '';
      const m31  = cve.metrics?.cvssMetricV31?.[0]?.cvssData;
      const m30  = cve.metrics?.cvssMetricV30?.[0]?.cvssData;
      const m2   = cve.metrics?.cvssMetricV2?.[0]?.cvssData;
      const score = m31?.baseScore ?? m30?.baseScore ?? m2?.baseScore ?? null;
      const sev   = score !== null ? cvssToSeverity(score)
        : (m31?.baseSeverity ?? m30?.baseSeverity ?? 'UNKNOWN').toUpperCase() as Severity;

      return {
        cve_id:      cve.id,
        description: desc.slice(0, 200),
        severity:    sev,
        cvss_score:  score,
        published:   cve.published,
        url:         `https://nvd.nist.gov/vuln/detail/${cve.id}`,
      };
    });

    const counts: SeverityCounts = {};
    for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;

    return { available: true, total: findings.length, findings: sevSort(findings), counts };
  } catch (e) {
    return { available: false, total: 0, findings: [], counts: {}, error: String(e) };
  }
}

// ── 6. GitHub Advisory Database GraphQL (NEW — free with GITHUB_TOKEN) ────────
// Queries the official GitHub Advisory Database for known vulnerabilities
// in the ecosystems detected from the repo's package files.
// Free — no separate key, uses the same GITHUB_TOKEN.

interface GhAdvisoryModule {
  available: boolean;
  total: number;
  findings: Array<{
    ghsa_id: string;
    cve_id: string | null;
    package: string;
    ecosystem: string;
    severity: Severity;
    summary: string;
    vulnerable_versions: string;
    patched_versions: string;
    url: string;
  }>;
  counts: SeverityCounts;
  error?: string;
}

async function scanGhAdvisory(owner: string, repo: string): Promise<GhAdvisoryModule> {
  // Detect ecosystems from package files present in the repo
  const ecosystems: Array<{ file: string; ecosystem: string }> = [
    { file: 'package.json',        ecosystem: 'NPM'      },
    { file: 'requirements.txt',    ecosystem: 'PIP'      },
    { file: 'Gemfile',             ecosystem: 'RUBYGEMS' },
    { file: 'go.mod',              ecosystem: 'GO'       },
    { file: 'pom.xml',             ecosystem: 'MAVEN'    },
    { file: 'Cargo.toml',          ecosystem: 'RUST'     },
    { file: 'composer.json',       ecosystem: 'COMPOSER' },
  ];

  // Check which files exist (run in parallel)
  const checks = await Promise.all(
    ecosystems.map(async (e) => {
      const f = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/${e.file}`);
      return f ? e.ecosystem : null;
    }),
  );
  const detected = checks.filter(Boolean) as string[];

  if (detected.length === 0) {
    return { available: true, total: 0, findings: [], counts: {}, error: 'No supported package files detected' };
  }

  // Query GitHub Advisory DB for each detected ecosystem
  const allFindings: GhAdvisoryModule['findings'] = [];

  for (const ecosystem of detected.slice(0, 3)) { // cap at 3 ecosystems to avoid rate limits
    const query = `
      query($eco: SecurityAdvisoryEcosystem!) {
        securityVulnerabilities(ecosystem: $eco, first: 30, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            advisory {
              ghsaId
              summary
              severity
              identifiers { type value }
              permalink
            }
            package { name ecosystem }
            vulnerableVersionRange
            firstPatchedVersion { identifier }
          }
        }
      }
    `;

    try {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          ...GH_HEADERS,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables: { eco: ecosystem } }),
      });

      if (!res.ok) continue;

      const json = await res.json() as {
        data?: {
          securityVulnerabilities?: {
            nodes?: Array<{
              advisory: {
                ghsaId: string;
                summary: string;
                severity: string;
                identifiers: Array<{ type: string; value: string }>;
                permalink: string;
              };
              package: { name: string; ecosystem: string };
              vulnerableVersionRange: string;
              firstPatchedVersion: { identifier: string } | null;
            }>;
          };
        };
      };

      const nodes = json.data?.securityVulnerabilities?.nodes ?? [];
      for (const n of nodes) {
        const cveId = n.advisory.identifiers.find(i => i.type === 'CVE')?.value ?? null;
        const sev   = n.advisory.severity.toUpperCase() as Severity;
        allFindings.push({
          ghsa_id:             n.advisory.ghsaId,
          cve_id:              cveId,
          package:             n.package.name,
          ecosystem:           n.package.ecosystem,
          severity:            sev,
          summary:             n.advisory.summary,
          vulnerable_versions: n.vulnerableVersionRange,
          patched_versions:    n.firstPatchedVersion?.identifier ?? 'No patch available',
          url:                 n.advisory.permalink,
        });
      }
    } catch { continue; }
  }

  const counts: SeverityCounts = {};
  for (const f of allFindings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;

  return {
    available: true,
    total:     allFindings.length,
    findings:  sevSort(allFindings),
    counts,
  };
}

// ── 7. PyPI Safety DB via OSV.dev (NEW — free, no key needed) ─────────────────
// Reads requirements.txt / pyproject.toml and cross-references each package
// against OSV.dev with the PyPI ecosystem.

interface PypiSafetyModule {
  available: boolean;
  packages_checked: number;
  total: number;
  findings: Array<{
    id: string;
    package: string;
    version: string;
    severity: Severity;
    summary: string;
    url: string;
  }>;
  counts: SeverityCounts;
  error?: string;
}

async function scanPypiSafety(owner: string, repo: string): Promise<PypiSafetyModule> {
  // Try requirements.txt first, then pyproject.toml
  let rawContent: string | null = null;
  let sourceFile = '';

  for (const filename of ['requirements.txt', 'requirements/base.txt', 'requirements/prod.txt']) {
    const f = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/${filename}`);
    if (f?.content) {
      rawContent = Buffer.from(f.content, 'base64').toString();
      sourceFile = filename;
      break;
    }
  }

  if (!rawContent) {
    return { available: false, packages_checked: 0, total: 0, findings: [], counts: {}, error: 'No requirements.txt found' };
  }

  // Parse package==version lines
  const deps: Array<{ name: string; version: string }> = [];
  for (const line of rawContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue;
    const match = trimmed.match(/^([A-Za-z0-9._-]+)==([0-9][^\s;,]*)/);
    if (match) deps.push({ name: match[1], version: match[2] });
  }

  const findings: PypiSafetyModule['findings'] = [];
  let checked = 0;

  for (const { name, version } of deps.slice(0, 40)) {
    const vulns = await osvQuery(name, version, 'PyPI');
    checked++;
    for (const v of vulns) {
      let sev: Severity = 'UNKNOWN';
      for (const s of (v.severity as Record<string, string>[] ?? [])) {
        if (s.type === 'CVSS_V3') sev = cvssToSeverity(parseFloat(s.score ?? '0'));
      }
      findings.push({
        id:       v.id as string ?? '',
        package:  name,
        version,
        severity: sev,
        summary:  v.summary as string ?? '',
        url:      `https://osv.dev/vulnerability/${v.id}`,
      });
    }
  }

  const counts: SeverityCounts = {};
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;

  return {
    available:        true,
    packages_checked: checked,
    total:            findings.length,
    findings:         sevSort(findings),
    counts,
  };
}

// ── 8. Retire.js style — JS CDN library heuristic (NEW — free) ────────────────
// Checks if the repo's HTML/JS files reference known vulnerable CDN-hosted
// library versions by parsing script src URLs against known version patterns.
// Uses OSV.dev to verify actual CVEs for detected versions.

interface RetireJsModule {
  available: boolean;
  cdn_libs_found: number;
  total: number;
  findings: Array<{
    library: string;
    version: string;
    source: string;
    severity: Severity;
    vuln_id: string;
    summary: string;
    url: string;
  }>;
  counts: SeverityCounts;
  error?: string;
}

async function scanRetireJs(owner: string, repo: string): Promise<RetireJsModule> {
  // Check for common HTML entry points
  const htmlFiles = ['index.html', 'public/index.html', 'src/index.html', 'app/index.html'];
  const cdnPattern = /(?:cdn\.|unpkg\.com\/|cdnjs\.cloudflare\.com\/|jsdelivr\.net\/)([a-z0-9._-]+)[@/]([0-9]+\.[0-9]+[.0-9]*)/gi;

  const findings: RetireJsModule['findings'] = [];
  const libsFound = new Set<string>();

  for (const htmlFile of htmlFiles) {
    const f = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/${htmlFile}`);
    if (!f?.content) continue;

    const html = Buffer.from(f.content, 'base64').toString();
    let match;
    while ((match = cdnPattern.exec(html)) !== null) {
      const [, library, version] = match;
      const key = `${library}@${version}`;
      if (libsFound.has(key)) continue;
      libsFound.add(key);

      // Check OSV.dev for this library + version in npm ecosystem
      const vulns = await osvQuery(library, version, 'npm');
      for (const v of vulns) {
        let sev: Severity = 'UNKNOWN';
        for (const s of (v.severity as Record<string, string>[] ?? [])) {
          if (s.type === 'CVSS_V3') sev = cvssToSeverity(parseFloat(s.score ?? '0'));
        }
        findings.push({
          library,
          version,
          source:   htmlFile,
          severity: sev,
          vuln_id:  v.id as string ?? '',
          summary:  v.summary as string ?? '',
          url:      `https://osv.dev/vulnerability/${v.id}`,
        });
      }
    }
  }

  const counts: SeverityCounts = {};
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;

  return {
    available:      true,
    cdn_libs_found: libsFound.size,
    total:          findings.length,
    findings:       sevSort(findings),
    counts,
  };
}

// ── 9. License Risk ───────────────────────────────────────────────────────────

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
        note: 'No license file found. All rights reserved by default.',
      };
    }
    return {
      found: true, spdx: null, displaySpdx: 'Custom', risk: 'medium',
      url: data?.html_url,
      note: 'License file found but SPDX identifier not matched by GitHub.',
    };
  }
  const risk = PERMISSIVE.has(spdx) ? 'low' : COPYLEFT.has(spdx) ? 'high' : 'medium';
  return { found: true, spdx, displaySpdx: spdx, risk, url: data?.html_url };
}

// ── 10. GitHub CI Check Runs ──────────────────────────────────────────────────

async function scanCiCheckRuns(owner: string, repo: string): Promise<CiQualityModule> {
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
    if (r.conclusion === 'success')                                  passed++;
    else if (r.conclusion === 'skipped' || r.conclusion === 'neutral') skipped++;
    else if (r.conclusion && r.conclusion !== null)                  failed++;
  }

  const lint_found = runs.some(r => LINT_PATTERNS.some(p => p.test(r.name)));
  const test_found = runs.some(r => TEST_PATTERNS.some(p => p.test(r.name)));
  const overall    = failed > 0 ? 'fail' : passed > 0 ? 'pass' : runs.length > 0 ? 'partial' : 'unknown';

  return { overall, total_runs: runs.length, passed, failed, skipped, runs, lint_found, test_found };
}

// ── 11. SonarCloud (free for public repos) ────────────────────────────────────

async function scanSonarCloud(owner: string, repo: string): Promise<SonarModule> {
  const projectKey = `${owner}_${repo}`.toLowerCase();
  const baseUrl    = `https://sonarcloud.io/api`;

  try {
    const measuresRes = await fetch(
      `${baseUrl}/measures/component?component=${projectKey}&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
    );
    if (!measuresRes.ok) {
      return { available: false, issues: [], error: `Project not found on SonarCloud. Add sonar.yml to enable.` };
    }
    const measuresData = await measuresRes.json() as {
      component?: { measures?: { metric: string; value: string }[] };
    };
    const measures = measuresData.component?.measures ?? [];
    const get = (k: string) => {
      const m = measures.find(m => m.metric === k);
      return m ? parseFloat(m.value) : null;
    };

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
      available:       true,
      project_key:     projectKey,
      bugs:            get('bugs') ?? 0,
      vulnerabilities: get('vulnerabilities') ?? 0,
      code_smells:     get('code_smells') ?? 0,
      coverage:        get('coverage'),
      duplications:    get('duplicated_lines_density'),
      issues,
      url: `https://sonarcloud.io/project/overview?id=${projectKey}`,
    };
  } catch (e) {
    return { available: false, issues: [], error: String(e) };
  }
}

// ── 12. DeepSource (free for public repos) ────────────────────────────────────

async function scanDeepSource(owner: string, repo: string): Promise<DeepSourceModule> {
  try {
    const query = `{
      repository(login: "${owner}", name: "${repo}") {
        issues(first: 50, issueState: OPEN) {
          totalCount
          edges {
            node {
              issueCode category title occurrenceCount shortcode
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
    if (!res.ok) return { available: false, checks: [], error: 'DeepSource project not found' };
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
    const bugs         = checks.filter(c => c.category?.toLowerCase().includes('bug')).reduce((s, c) => s + c.occurrences, 0);
    const antiPatterns = checks.filter(c => c.category?.toLowerCase().includes('anti')).reduce((s, c) => s + c.occurrences, 0);
    return { available: true, bugs, anti_patterns: antiPatterns, checks, url: `https://app.deepsource.com/gh/${owner}/${repo}/` };
  } catch (e) {
    return { available: false, checks: [], error: String(e) };
  }
}

// ── 13. Codecov (free for public repos) ──────────────────────────────────────

async function scanCodecov(owner: string, repo: string): Promise<CodecovModule> {
  try {
    const res = await fetch(
      `https://codecov.io/api/v2/github/${owner}/repos/${repo}/`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 0 } },
    );
    if (!res.ok) return { available: false, error: 'Repository not found on Codecov' };
    const data = await res.json() as { totals?: { coverage?: number | null; patch?: number | null } };
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

// ── Code Quality aggregate ────────────────────────────────────────────────────

function calcCodeQualityScore(
  ci: CiQualityModule,
  sonar: SonarModule,
  deepsource: DeepSourceModule,
  codecov: CodecovModule,
): number {
  let score = 100;
  if (ci.overall === 'fail')    score -= 30;
  if (ci.overall === 'partial') score -= 10;
  if (!ci.lint_found)           score -=  5;
  if (!ci.test_found)           score -=  5;
  if (sonar.available) {
    score -= Math.min((sonar.bugs ?? 0) * 3, 15);
    score -= Math.min((sonar.vulnerabilities ?? 0) * 2, 10);
    if ((sonar.coverage ?? 100) < 60) score -= 5;
  }
  if (deepsource.available) {
    score -= Math.min((deepsource.bugs ?? 0) * 2, 10);
    score -= Math.min((deepsource.anti_patterns ?? 0), 5);
  }
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

// ── Security Score Calculator ─────────────────────────────────────────────────

function calculateScore(report: Partial<MegaScanReport> & {
  nvd?: NvdModule;
  gh_advisory?: GhAdvisoryModule;
  pypi_safety?: PypiSafetyModule;
  retirejs?: RetireJsModule;
}): ScoringResult {
  let score = 100;
  const deductions: ScoreDeduction[] = [];
  const deduct = (pts: number, reason: string) => { score -= pts; deductions.push({ points: pts, reason }); };

  // Dependabot
  const depCounts = report.dependabot?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 10], ['HIGH', 5], ['MEDIUM', 2], ['LOW', 1]] as [Severity, number][]) {
    const n = depCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 3), `${n} ${sev} Dependabot alert(s)`);
  }

  // Secrets
  const secTotal = report.secrets_github?.total ?? 0;
  if (secTotal) deduct(Math.min(secTotal * 8, 25), `${secTotal} exposed secret(s)`);

  // Code Scanning (SAST)
  const csCounts = report.code_scanning?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 8], ['HIGH', 4], ['MEDIUM', 2]] as [Severity, number][]) {
    const n = csCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 3), `${n} ${sev} code scanning finding(s)`);
  }

  // OSV
  const osvCounts = report.osv?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 6], ['HIGH', 3], ['MEDIUM', 1]] as [Severity, number][]) {
    const n = osvCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 4), `${n} ${sev} OSV finding(s)`);
  }

  // NIST NVD (new)
  const nvdCounts = report.nvd?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 5], ['HIGH', 3], ['MEDIUM', 1]] as [Severity, number][]) {
    const n = nvdCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 3), `${n} ${sev} NVD CVE(s)`);
  }

  // GitHub Advisory (new)
  const ghaCounts = report.gh_advisory?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 4], ['HIGH', 2], ['MEDIUM', 1]] as [Severity, number][]) {
    const n = ghaCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 3), `${n} ${sev} GitHub Advisory finding(s)`);
  }

  // PyPI Safety (new)
  const pypiCounts = report.pypi_safety?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 6], ['HIGH', 3], ['MEDIUM', 1]] as [Severity, number][]) {
    const n = pypiCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 3), `${n} ${sev} PyPI vulnerability(ies)`);
  }

  // Retire.js CDN (new)
  const retireCounts = report.retirejs?.counts ?? {};
  for (const [sev, pts] of [['CRITICAL', 5], ['HIGH', 3], ['MEDIUM', 1]] as [Severity, number][]) {
    const n = retireCounts[sev] ?? 0;
    if (n) deduct(Math.min(pts * n, pts * 2), `${n} ${sev} vulnerable CDN library(ies)`);
  }

  // License & policy
  if (report.license?.risk === 'high')  deduct(5, `Copyleft/no license: ${report.license.displaySpdx ?? 'None'}`);
  if (!report.has_security_md)          deduct(3, 'Missing SECURITY.md');

  score = Math.max(0, score);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  return { score, grade, deductions, max_score: 100 };
}

function aggregateTotals(report: Partial<MegaScanReport> & {
  nvd?: NvdModule;
  gh_advisory?: GhAdvisoryModule;
  pypi_safety?: PypiSafetyModule;
  retirejs?: RetireJsModule;
}): TotalCounts {
  const agg: TotalCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, TOTAL: 0, SECRETS: 0 };
  const modules = ['dependabot', 'code_scanning', 'osv', 'nvd', 'gh_advisory', 'pypi_safety', 'retirejs'] as const;
  for (const mod of modules) {
    const counts = (report[mod as keyof typeof report] as { counts?: SeverityCounts })?.counts ?? {};
    for (const sev of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const) agg[sev] += counts[sev] ?? 0;
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

async function cacheSet(key: string, value: unknown): Promise<void> {
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
  const cacheKey = `devlens:security:v2:${owner}/${repo}`;

  if (!force) {
    const cached = await cacheGet(cacheKey);
    if (cached) return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT' } });
  }

  // ── Run ALL 13 scans in parallel ─────────────────────────────────────────────
  const [
    dependabot,
    secrets_github,
    code_scanning,
    osv,
    nvd,
    gh_advisory,
    pypi_safety,
    retirejs,
    license,
    code_quality,
    secMdRaw,
  ] = await Promise.all([
    scanDependabot(owner, repo),
    scanSecrets(owner, repo),
    scanCodeScanning(owner, repo),
    scanOsv(owner, repo),
    scanNvd(owner, repo),
    scanGhAdvisory(owner, repo),
    scanPypiSafety(owner, repo),
    scanRetireJs(owner, repo),
    scanLicense(owner, repo),
    scanCodeQuality(owner, repo),
    ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/SECURITY.md`),
  ]);

  const has_security_md = !!secMdRaw?.content;

  const partial = {
    meta: {
      owner, repo, target_url: null,
      scanned_at: new Date().toISOString(),
      modules: [
        'dependabot', 'secrets', 'code_scanning',
        'osv', 'nvd', 'gh_advisory', 'pypi_safety', 'retirejs',
        'license', 'ci_checks', 'sonarcloud', 'deepsource', 'codecov',
      ],
    },
    dependabot,
    secrets_github,
    code_scanning,
    osv,
    nvd,
    gh_advisory,
    pypi_safety,
    retirejs,
    license,
    code_quality,
    has_security_md,
    trufflehog: { available: false, message: 'CLI tool — run scripts/mega_scanner.py locally', findings: [] },
    semgrep:    { available: false, message: 'CLI tool — run scripts/mega_scanner.py locally', findings: [] },
    nuclei:     { available: false, message: 'CLI tool — run scripts/mega_scanner.py locally', findings: [] },
    trivy:      { available: false, message: 'CLI tool — run scripts/mega_scanner.py locally', findings: [] },
  };

  const report = {
    ...partial,
    totals:  aggregateTotals(partial),
    scoring: calculateScore(partial),
  };

  await cacheSet(cacheKey, report);
  return NextResponse.json(report, { headers: { 'X-Cache': 'MISS' } });
}
