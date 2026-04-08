/**
 * DevLens Mega Security Scanner — API Route
 * GET /api/security?repo=owner/name[&force=1]
 *
 * Calls all GitHub Security APIs, cross-checks OSV.dev,
 * and returns a unified MegaScanReport JSON.
 * Results cached in Upstash Redis for 15 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  MegaScanReport, DependabotModule, SecretsModule, CodeScanModule,
  OsvModule, LicenseModule, TotalCounts, ScoringResult, ScoreDeduction,
  SeverityCounts, Severity,
} from '@/lib/security-types';

const GH_TOKEN   = process.env.GITHUB_TOKEN ?? '';
const REDIS_URL  = process.env.UPSTASH_REDIS_REST_URL ?? '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? '';
const CACHE_TTL  = 900; // 15 minutes

const GH_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(GH_TOKEN ? { Authorization: `Bearer ${GH_TOKEN}` } : {}),
};

// ── Helpers ──────────────────────────────────────────────────────────────────

async function ghGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers: GH_HEADERS, next: { revalidate: 0 } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch { return null; }
}

async function osvQuery(pkg: string, version: string, ecosystem: string): Promise<Record<string, unknown>[]> {
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

const SEV_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4, UNKNOWN: 5 };
function sevSort<T extends { severity: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (SEV_ORDER[a.severity] ?? 5) - (SEV_ORDER[b.severity] ?? 5));
}

const COPYLEFT   = new Set(['AGPL-3.0','GPL-2.0','GPL-3.0','LGPL-2.1','LGPL-3.0','EUPL-1.2','SSPL-1.0']);
const PERMISSIVE = new Set(['MIT','Apache-2.0','BSD-2-Clause','BSD-3-Clause','ISC','0BSD','Unlicense']);

// ── Module Scanners ───────────────────────────────────────────────────────────

async function scanDependabot(owner: string, repo: string): Promise<DependabotModule> {
  const alerts = await ghGet<Record<string, unknown>[]>(`/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=100`);
  if (!alerts) return { enabled: false, findings: [], counts: {}, total: 0, error: 'Not enabled or insufficient permissions' };
  const counts: SeverityCounts = {};
  const findings = (alerts as Record<string, unknown>[]).map((a) => {
    const sev = ((a.security_advisory as Record<string, unknown>)?.severity as string ?? 'UNKNOWN').toUpperCase() as Severity;
    counts[sev] = (counts[sev] ?? 0) + 1;
    const pkg = (a.dependency as Record<string, unknown>)?.package as Record<string, unknown>;
    const adv = a.security_advisory as Record<string, unknown>;
    const fpv = ((a.security_vulnerability as Record<string, unknown>)?.first_patched_version as Record<string, unknown>)?.identifier as string;
    return { id: adv?.ghsa_id as string ?? '', cve: adv?.cve_id as string ?? '',
             package: pkg?.name as string ?? '', ecosystem: pkg?.ecosystem as string ?? '',
             severity: sev, summary: adv?.summary as string ?? '', fixed_in: fpv ?? 'N/A',
             url: a.html_url as string ?? '' };
  });
  return { enabled: true, findings: sevSort(findings), counts, total: findings.length };
}

async function scanSecrets(owner: string, repo: string): Promise<SecretsModule> {
  const alerts = await ghGet<Record<string, unknown>[]>(`/repos/${owner}/${repo}/secret-scanning/alerts?state=open&per_page=100`);
  if (!alerts) return { enabled: false, findings: [], total: 0, error: 'Not enabled' };
  const findings = (alerts as Record<string, unknown>[]).map((a) => ({
    type: (a.secret_type_display_name ?? a.secret_type ?? '') as string,
    state: a.state as string ?? '',
    created_at: a.created_at as string ?? '',
    url: a.html_url as string ?? '',
  }));
  return { enabled: true, findings, total: findings.length };
}

async function scanCodeScanning(owner: string, repo: string): Promise<CodeScanModule> {
  const alerts = await ghGet<Record<string, unknown>[]>(`/repos/${owner}/${repo}/code-scanning/alerts?state=open&per_page=100`);
  if (!alerts) return { enabled: false, tools: [], findings: [], counts: {}, total: 0, error: 'Not enabled' };
  const counts: SeverityCounts = {};
  const tools = new Set<string>();
  const findings = (alerts as Record<string, unknown>[]).map((a) => {
    const rule = a.rule as Record<string, unknown>;
    const sev = ((rule?.security_severity_level ?? rule?.severity ?? 'UNKNOWN') as string).toUpperCase() as Severity;
    counts[sev] = (counts[sev] ?? 0) + 1;
    const tool = (a.tool as Record<string, unknown>)?.name as string ?? 'unknown';
    tools.add(tool);
    const loc = ((a.most_recent_instance as Record<string, unknown>)?.location as Record<string, unknown>);
    return { rule: rule?.id as string ?? '', description: rule?.description as string ?? '',
             severity: sev, tool, file: loc?.path as string ?? '', line: loc?.start_line as number ?? '',
             url: a.html_url as string ?? '' };
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
      const deps = { ...(pkgJson.dependencies as Record<string,string> ?? {}), ...(pkgJson.devDependencies as Record<string,string> ?? {}) };
      for (const [name, verRaw] of Object.entries(deps).slice(0, 50)) {
        const ver = (verRaw as string).replace(/^[^~>=<]*/, '').replace(/[^0-9.].*$/, '') || verRaw as string;
        const vulns = await osvQuery(name, ver, 'npm');
        checked++;
        for (const v of vulns) {
          let sev: Severity = 'UNKNOWN';
          for (const s of (v.severity as Record<string,string>[] ?? [])) {
            if (s.type === 'CVSS_V3') {
              const score = parseFloat(s.score ?? '0');
              sev = score >= 9 ? 'CRITICAL' : score >= 7 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW';
            }
          }
          findings.push({ id: v.id as string ?? '', package: name, version: ver as string, ecosystem: 'npm',
                          severity: sev, summary: v.summary as string ?? '',
                          url: `https://osv.dev/vulnerability/${v.id}` });
        }
      }
    } catch { /* skip malformed */ }
  }

  const counts: SeverityCounts = {};
  for (const f of findings) counts[f.severity] = (counts[f.severity] ?? 0) + 1;
  return { packages_checked: checked, findings: sevSort(findings), counts, total: findings.length };
}

async function scanLicense(owner: string, repo: string): Promise<LicenseModule> {
  // Step 1: try the /license endpoint (works when GitHub auto-detects the license)
  const data = await ghGet<{ license?: { spdx_id?: string | null }; html_url?: string }>(
    `/repos/${owner}/${repo}/license`
  );

  // Step 2: resolve the SPDX id — GitHub may return null, 'NOASSERTION', or 'NONE'
  const raw = data?.license?.spdx_id ?? null;
  const spdx = (!raw || raw === 'NOASSERTION' || raw === 'NONE') ? null : raw;

  // Step 3: if still null, try reading LICENSE / LICENSE.md / COPYING directly
  // to distinguish "no license file" from "license file present but unrecognised"
  if (!spdx) {
    const candidates = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING'];
    let hasLicenseFile = false;
    for (const filename of candidates) {
      const f = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/${filename}`);
      if (f?.content) { hasLicenseFile = true; break; }
    }
    if (!hasLicenseFile) {
      // Truly no license — very high risk (no rights granted to users)
      return { found: false, spdx: null, displaySpdx: 'None', risk: 'high',
               note: 'No license file found. All rights reserved by default — others cannot legally use, copy, or distribute this code.' };
    }
    // License file exists but GitHub couldn\'t identify the SPDX id
    return { found: true, spdx: null, displaySpdx: 'Custom', risk: 'medium',
             url: data?.html_url,
             note: 'A license file was found but GitHub could not match it to a standard SPDX identifier. Review the file manually.' };
  }

  // Step 4: known SPDX id — classify risk
  const risk = PERMISSIVE.has(spdx) ? 'low' : COPYLEFT.has(spdx) ? 'high' : 'medium';
  return { found: true, spdx, displaySpdx: spdx, risk, url: data?.html_url };
}

// ── Score Calculator ──────────────────────────────────────────────────────────

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

  if (report.license?.risk === 'high') deduct(5, `Copyleft license: ${report.license.spdx ?? 'None'}`);
  if (!report.has_security_md) deduct(3, 'Missing SECURITY.md');

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
  agg.TOTAL = agg.CRITICAL + agg.HIGH + agg.MEDIUM + agg.LOW;
  agg.SECRETS = (report.secrets_github?.total ?? 0);
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

  // Run all GitHub-native scans in parallel
  const [dependabot, secrets_github, code_scanning, osv, license] = await Promise.all([
    scanDependabot(owner, repo),
    scanSecrets(owner, repo),
    scanCodeScanning(owner, repo),
    scanOsv(owner, repo),
    scanLicense(owner, repo),
  ]);

  // Check for SECURITY.md
  const secMdRaw = await ghGet<{ content?: string }>(`/repos/${owner}/${repo}/contents/SECURITY.md`);
  const has_security_md = !!secMdRaw?.content;

  const partial: Partial<MegaScanReport> = {
    meta: { owner, repo, target_url: null, scanned_at: new Date().toISOString(), modules: ['dependabot','secrets','code_scanning','osv','license'] },
    dependabot, secrets_github, code_scanning, osv, license, has_security_md,
    // CLI tools (TruffleHog, Semgrep, Nuclei, Trivy) require server-side CLI — not available in edge runtime
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
