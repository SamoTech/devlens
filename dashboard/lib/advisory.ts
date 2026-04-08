/**
 * advisory.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GitHub Advisory Database cross-reference engine.
 *
 * Pipeline per repo:
 *   1. Parse manifest files (package.json, requirements.txt, Pipfile, Gemfile,
 *      go.mod, Cargo.toml, composer.json, pom.xml, build.gradle)
 *   2. For each ecosystem detected, query:
 *        a. GitHub Dependabot Alerts API  (if token has repo scope)
 *        b. GitHub Advisory GraphQL API  (public, no auth required)
 *        c. OSV.dev batch query          (public)
 *   3. Cross-reference each installed version against advisory affected ranges
 *   4. Return structured AdvisoryReport with per-package findings
 */

const GH_REST    = 'https://api.github.com'
const GH_GQL     = 'https://api.github.com/graphql'
const OSV_BATCH  = 'https://api.osv.dev/v1/querybatch'

// ── Severity ordering ──────────────────────────────────────────────────────
export type Severity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN'
const SEV_RANK: Record<Severity, number> = {
  CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1, UNKNOWN: 0,
}

export interface AdvisoryFinding {
  package:      string
  ecosystem:    string
  installedVer: string          // version pinned in manifest
  patchedVer:   string | null   // first safe version
  severity:     Severity
  cvss:         number | null   // CVSS 3.x base score
  ghsaId:       string          // GHSA-xxxx-xxxx-xxxx
  cveId:        string | null
  summary:      string
  url:          string
  source:       'dependabot' | 'advisory_db' | 'osv'
}

export interface AdvisoryReport {
  owner:        string
  name:         string
  scannedAt:    string
  packages:     ParsedPackage[]
  findings:     AdvisoryFinding[]
  counts: {
    critical: number
    high:     number
    moderate: number
    low:      number
    total:    number
  }
  /** 0-100 security sub-score derived from findings */
  securityScore: number
  ecosystems:   string[]
}

export interface ParsedPackage {
  name:      string
  version:   string
  ecosystem: string  // npm | pip | rubygems | go | cargo | packagist | maven
}

// ── Shared fetch helpers ───────────────────────────────────────────────────
function ghHeaders(token?: string) {
  return {
    Accept:         'application/vnd.github.json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function safeFetch(url: string, init?: RequestInit): Promise<any | null> {
  try {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) })
    if (!r.ok) return null
    return r.json()
  } catch { return null }
}

// ── 1. Manifest parsers ────────────────────────────────────────────────────
async function fetchFile(owner: string, name: string, path: string, token?: string): Promise<string | null> {
  const data = await safeFetch(
    `${GH_REST}/repos/${owner}/${name}/contents/${path}`,
    { headers: ghHeaders(token) }
  )
  if (!data?.content) return null
  try { return atob(data.content.replace(/\n/g, '')) } catch { return null }
}

function parsePackageJson(content: string): ParsedPackage[] {
  try {
    const pkg  = JSON.parse(content)
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    return Object.entries(deps).map(([n, v]) => ({
      name:      n,
      version:   String(v).replace(/^[^\d]*/, '').split(' ')[0].split('-')[0] || '0.0.0',
      ecosystem: 'npm',
    }))
  } catch { return [] }
}

function parseRequirementsTxt(content: string): ParsedPackage[] {
  return content.split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('-'))
    .map(l => {
      const m = l.match(/^([A-Za-z0-9_.-]+)([=><! ].+)?$/)
      if (!m) return null
      const ver = m[2] ? m[2].replace(/^[=><! ]+/, '').split(',')[0].trim() : '0'
      return { name: m[1], version: ver, ecosystem: 'pip' }
    })
    .filter(Boolean) as ParsedPackage[]
}

function parseGoMod(content: string): ParsedPackage[] {
  return content.split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('require') || (l.match(/^[a-z]/i) && l.includes(' v')))
    .flatMap(l => {
      const m = l.match(/([\w./\-]+)\s+v([\d.]+)/)
      if (!m) return []
      return [{ name: m[1], version: m[2], ecosystem: 'go' }]
    })
}

function parseCargoToml(content: string): ParsedPackage[] {
  const pkgs: ParsedPackage[] = []
  const re = /^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    pkgs.push({ name: m[1], version: m[2].replace(/^[^\d]*/, ''), ecosystem: 'cargo' })
  }
  return pkgs
}

function parseGemfileLock(content: string): ParsedPackage[] {
  const pkgs: ParsedPackage[] = []
  const re = /^    ([a-zA-Z0-9_-]+) \(([\d.]+)\)/gm
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    pkgs.push({ name: m[1], version: m[2], ecosystem: 'rubygems' })
  }
  return pkgs
}

const MANIFEST_LOADERS: Array<{
  path:  string
  parse: (c: string) => ParsedPackage[]
}> = [
  { path: 'package.json',   parse: parsePackageJson     },
  { path: 'requirements.txt', parse: parseRequirementsTxt },
  { path: 'go.mod',          parse: parseGoMod            },
  { path: 'Cargo.toml',      parse: parseCargoToml        },
  { path: 'Gemfile.lock',    parse: parseGemfileLock      },
]

async function gatherPackages(
  owner: string, name: string, token?: string
): Promise<ParsedPackage[]> {
  const results = await Promise.all(
    MANIFEST_LOADERS.map(async ({ path, parse }) => {
      const content = await fetchFile(owner, name, path, token)
      return content ? parse(content) : []
    })
  )
  // Deduplicate same name+ecosystem (keep first)
  const seen = new Set<string>()
  return results.flat().filter(p => {
    const key = `${p.ecosystem}:${p.name}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── 2a. Dependabot Alerts API ─────────────────────────────────────────────
async function fetchDependabotAlerts(
  owner: string, name: string, token?: string
): Promise<AdvisoryFinding[]> {
  if (!token) return []
  const data = await safeFetch(
    `${GH_REST}/repos/${owner}/${name}/dependabot/alerts?state=open&per_page=100`,
    { headers: ghHeaders(token) }
  )
  if (!Array.isArray(data)) return []
  return data.map((alert: any): AdvisoryFinding => ({
    package:      alert.dependency?.package?.name      ?? 'unknown',
    ecosystem:    alert.dependency?.package?.ecosystem ?? 'unknown',
    installedVer: alert.dependency?.manifest_path      ?? 'pinned',
    patchedVer:   alert.security_advisory?.references?.[0] ?? null,
    severity:     (alert.security_advisory?.severity?.toUpperCase() ?? 'UNKNOWN') as Severity,
    cvss:         alert.security_advisory?.cvss?.score ?? null,
    ghsaId:       alert.security_advisory?.ghsa_id    ?? '',
    cveId:        alert.security_advisory?.cve_id      ?? null,
    summary:      alert.security_advisory?.summary     ?? '',
    url:          alert.html_url                        ?? '',
    source:       'dependabot',
  }))
}

// ── 2b. GitHub Advisory GraphQL ───────────────────────────────────────────
// Maps our ecosystem strings → GitHub Advisory ecosystem enum values
const GH_ECOSYSTEM: Record<string, string> = {
  npm:       'NPM',
  pip:       'PIP',
  rubygems:  'RUBYGEMS',
  go:        'GO',
  cargo:     'RUST',
  packagist: 'COMPOSER',
  maven:     'MAVEN',
}

async function fetchAdvisoryDB(
  packages: ParsedPackage[], token?: string
): Promise<AdvisoryFinding[]> {
  if (packages.length === 0) return []
  const findings: AdvisoryFinding[] = []

  // Batch by ecosystem, up to 10 packages per GQL query to stay under complexity
  const byEco = packages.reduce<Record<string, ParsedPackage[]>>((acc, p) => {
    const eco = GH_ECOSYSTEM[p.ecosystem]
    if (!eco) return acc
    ;(acc[eco] ??= []).push(p)
    return acc
  }, {})

  for (const [ecoEnum, pkgs] of Object.entries(byEco)) {
    for (let i = 0; i < pkgs.length; i += 10) {
      const batch = pkgs.slice(i, i + 10)
      const query = `
        query AdvisoryBatch {
          ${batch.map((p, idx) => `
            pkg${idx}: securityVulnerabilities(
              ecosystem: ${ecoEnum}
              package: "${p.name}"
              first: 5
            ) {
              nodes {
                advisory { ghsaId summary permalink cvss { score } identifiers { type value } }
                severity
                firstPatchedVersion { identifier }
                vulnerableVersionRange
              }
            }
          `).join('')}
        }
      `
      const resp = await safeFetch(GH_GQL, {
        method: 'POST',
        headers: ghHeaders(token),
        body:    JSON.stringify({ query }),
      })
      if (!resp?.data) continue

      batch.forEach((p, idx) => {
        const nodes: any[] = resp.data[`pkg${idx}`]?.nodes ?? []
        for (const node of nodes) {
          if (!isVersionAffected(p.version, node.vulnerableVersionRange)) continue
          const adv     = node.advisory
          const cveId   = adv.identifiers?.find((id: any) => id.type === 'CVE')?.value ?? null
          findings.push({
            package:      p.name,
            ecosystem:    p.ecosystem,
            installedVer: p.version,
            patchedVer:   node.firstPatchedVersion?.identifier ?? null,
            severity:     (node.severity?.toUpperCase() ?? 'UNKNOWN') as Severity,
            cvss:         adv.cvss?.score ?? null,
            ghsaId:       adv.ghsaId,
            cveId,
            summary:      adv.summary,
            url:          adv.permalink,
            source:       'advisory_db',
          })
        }
      })
    }
  }
  return findings
}

// ── 2c. OSV.dev batch query ───────────────────────────────────────────────
const OSV_ECOSYSTEM: Record<string, string> = {
  npm:       'npm',
  pip:       'PyPI',
  rubygems:  'RubyGems',
  go:        'Go',
  cargo:     'crates.io',
  packagist: 'Packagist',
  maven:     'Maven',
}

async function fetchOSV(packages: ParsedPackage[]): Promise<AdvisoryFinding[]> {
  const eligible = packages.filter(p => OSV_ECOSYSTEM[p.ecosystem] && p.version !== '0' && p.version !== '0.0.0')
  if (eligible.length === 0) return []

  // OSV batch allows up to 1000 queries, but we cap at 50 to stay fast
  const batch = eligible.slice(0, 50).map(p => ({
    version: { version: p.version, package: { name: p.name, ecosystem: OSV_ECOSYSTEM[p.ecosystem] } },
  }))

  const resp = await safeFetch(OSV_BATCH, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ queries: batch }),
  })
  if (!resp?.results) return []

  const findings: AdvisoryFinding[] = []
  resp.results.forEach((result: any, idx: number) => {
    const pkg = eligible[idx]
    for (const vuln of (result.vulns ?? [])) {
      const ghsaId  = vuln.aliases?.find((a: string) => a.startsWith('GHSA-')) ?? vuln.id
      const cveId   = vuln.aliases?.find((a: string) => a.startsWith('CVE-'))  ?? null
      const sev     = osvSeverity(vuln)
      const patched = osvPatched(vuln, pkg)
      findings.push({
        package:      pkg.name,
        ecosystem:    pkg.ecosystem,
        installedVer: pkg.version,
        patchedVer:   patched,
        severity:     sev,
        cvss:         osvCvss(vuln),
        ghsaId,
        cveId,
        summary:      vuln.summary ?? vuln.details?.slice(0, 120) ?? '',
        url:          `https://osv.dev/vulnerability/${vuln.id}`,
        source:       'osv',
      })
    }
  })
  return findings
}

function osvSeverity(vuln: any): Severity {
  const cvss = vuln.severity?.[0]?.score
  if (!cvss) return 'UNKNOWN'
  const n = parseFloat(cvss)
  if (n >= 9.0) return 'CRITICAL'
  if (n >= 7.0) return 'HIGH'
  if (n >= 4.0) return 'MODERATE'
  return 'LOW'
}

function osvCvss(vuln: any): number | null {
  const s = vuln.severity?.[0]?.score
  return s ? parseFloat(s) : null
}

function osvPatched(vuln: any, pkg: ParsedPackage): string | null {
  for (const aff of (vuln.affected ?? [])) {
    if (aff.package?.ecosystem?.toLowerCase() !== OSV_ECOSYSTEM[pkg.ecosystem]?.toLowerCase()) continue
    for (const range of (aff.ranges ?? [])) {
      for (const ev of (range.events ?? [])) {
        if (ev.fixed) return ev.fixed
      }
    }
  }
  return null
}

// ── 3. Version range checker ──────────────────────────────────────────────
/**
 * Evaluates whether `installedVersion` falls within a GitHub Advisory
 * `vulnerableVersionRange` string, e.g. ">= 1.0.0, < 2.3.1".
 * Returns true (affected) when the range cannot be parsed (safe default).
 */
function isVersionAffected(installed: string, range: string | null): boolean {
  if (!range) return true  // no range info → assume affected
  const v = parseVer(installed)
  if (!v) return true

  const parts = range.split(',').map(s => s.trim())
  for (const part of parts) {
    const m = part.match(/^([><=!]+)\s*([\d.]+)/)
    if (!m) continue
    const [, op, verStr] = m
    const cmp = parseVer(verStr)
    if (!cmp) continue
    const rel = compareVer(v, cmp)
    if (op === '>='  && rel < 0) return false
    if (op === '>'   && rel <= 0) return false
    if (op === '<'   && rel >= 0) return false
    if (op === '<='  && rel > 0)  return false
    if (op === '='   && rel !== 0) return false
    if (op === '!='  && rel === 0) return false
  }
  return true
}

type SemVer = [number, number, number]
function parseVer(s: string): SemVer | null {
  const m = s.replace(/^v/, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
  if (!m) return null
  return [parseInt(m[1]) || 0, parseInt(m[2]) || 0, parseInt(m[3]) || 0]
}
function compareVer(a: SemVer, b: SemVer): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}

// ── 4. Deduplication ─────────────────────────────────────────────────────
function dedupeFindings(findings: AdvisoryFinding[]): AdvisoryFinding[] {
  const map = new Map<string, AdvisoryFinding>()
  for (const f of findings) {
    const key = `${f.package}:${f.ghsaId || f.cveId || f.summary.slice(0, 40)}`
    const existing = map.get(key)
    if (!existing || SEV_RANK[f.severity] > SEV_RANK[existing.severity]) {
      map.set(key, f)
    }
  }
  return [...map.values()].sort((a, b) => SEV_RANK[b.severity] - SEV_RANK[a.severity])
}

// ── 5. Score derivation ───────────────────────────────────────────────────
function deriveSecurityScore(
  findings: AdvisoryFinding[],
  hasSecurityMd: boolean,
  hasDependabot: boolean,
  hasScanning:   boolean,
): number {
  let score = 100
  for (const f of findings) {
    if (f.severity === 'CRITICAL') score -= 20
    else if (f.severity === 'HIGH')     score -= 10
    else if (f.severity === 'MODERATE') score -= 5
    else if (f.severity === 'LOW')      score -= 2
  }
  if (!hasSecurityMd) score -= 10
  if (!hasDependabot) score -= 10
  if (!hasScanning)   score -= 5
  return Math.max(0, Math.min(100, score))
}

// ── 6. Public API ─────────────────────────────────────────────────────────
export async function runAdvisoryCheck(
  owner:  string,
  name:   string,
  token?: string,
  treePaths?: string[],  // pre-fetched from scorer.ts to avoid duplicate API call
): Promise<AdvisoryReport> {
  // File presence flags (reuse tree if provided)
  const paths = treePaths ?? []
  const hasSecurityMd = paths.some(p => p === 'SECURITY.md' || p.endsWith('/SECURITY.md'))
  const hasDependabot = paths.some(p => p.includes('dependabot.yml') || p.includes('dependabot.yaml'))
  const hasScanning   = paths.some(p => p.includes('.github/workflows/') && (
    p.includes('codeql') || p.includes('trivy') || p.includes('snyk')
  ))

  // Gather installed packages
  const packages = await gatherPackages(owner, name, token)

  // Fetch advisories from all three sources in parallel
  const [dependabotFindings, advisoryDbFindings, osvFindings] = await Promise.all([
    fetchDependabotAlerts(owner, name, token),
    fetchAdvisoryDB(packages, token),
    fetchOSV(packages),
  ])

  const all      = dedupeFindings([...dependabotFindings, ...advisoryDbFindings, ...osvFindings])
  const counts   = {
    critical: all.filter(f => f.severity === 'CRITICAL').length,
    high:     all.filter(f => f.severity === 'HIGH').length,
    moderate: all.filter(f => f.severity === 'MODERATE').length,
    low:      all.filter(f => f.severity === 'LOW').length,
    total:    all.length,
  }
  const ecosystems = [...new Set(packages.map(p => p.ecosystem))]

  return {
    owner,
    name,
    scannedAt:     new Date().toISOString(),
    packages,
    findings:      all,
    counts,
    securityScore: deriveSecurityScore(all, hasSecurityMd, hasDependabot, hasScanning),
    ecosystems,
  }
}
