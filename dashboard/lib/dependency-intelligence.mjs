function versionParts(value) {
  const match = String(value ?? '').match(/^(?:v|[<>=~^*\s]*)?(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
  if (!match) return null
  return [Number(match[1]), Number(match[2] ?? 0), Number(match[3] ?? 0)]
}

export function compareVersions(a, b) {
  const av = versionParts(a)
  const bv = versionParts(b)
  if (!av || !bv) return 0
  for (let i = 0; i < 3; i++) if (av[i] !== bv[i]) return av[i] > bv[i] ? 1 : -1
  return 0
}

export function classifyUpdate(installed, latest) {
  const a = versionParts(installed)
  const b = versionParts(latest ?? '')
  if (!a || !b) return 'unknown'
  if (a[0] === b[0] && a[1] === b[1] && a[2] === b[2]) return 'up_to_date'
  if (a[0] !== b[0]) return 'major'
  if (a[1] !== b[1]) return 'minor'
  return 'patch'
}

async function npmLatest(name) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.version ?? null
  } catch {
    return null
  }
}

export async function buildDependencyInventory(report) {
  const findings = report.findings ?? []
  const findingMap = new Map()
  for (const finding of findings) {
    const key = `${finding.ecosystem}:${finding.package}`
    const list = findingMap.get(key) ?? []
    list.push(finding)
    findingMap.set(key, list)
  }

  const packages = report.packages.slice(0, 100)
  const npmPackages = packages.filter(p => p.ecosystem === 'npm').slice(0, 30)
  const latest = new Map<string, string | null>()
  const results = await Promise.all(npmPackages.map(async p => [p.name, await npmLatest(p.name)] ))
  for (const [name, version] of results) latest.set(name, version)

  return packages.map(pkg => {
    const vulns = findingMap.get(`${pkg.ecosystem}:${pkg.name}`) ?? []
    const ranked = [...vulns].sort((a, b) => ({ CRITICAL: 5, HIGH: 4, MODERATE: 3, LOW: 2, UNKNOWN: 1 }[b.severity] ?? 0) - ({ CRITICAL: 5, HIGH: 4, MODERATE: 3, LOW: 2, UNKNOWN: 1 }[a.severity] ?? 0))
    const latestVersion = pkg.ecosystem === 'npm' ? latest.get(pkg.name) ?? null : null
    return {
      name: pkg.name,
      ecosystem: pkg.ecosystem,
      installedVersion: pkg.version,
      latestVersion,
      updateType: classifyUpdate(pkg.version, latestVersion),
      vulnerabilityCount: vulns.length,
      highestSeverity: ranked[0]?.severity ?? null,
      patchedVersion: vulns.find(v => v.patchedVer)?.patchedVer ?? null,
      sources: [...new Set(vulns.flatMap(v => v.sources ?? [v.source]))],
    }
  })
}
