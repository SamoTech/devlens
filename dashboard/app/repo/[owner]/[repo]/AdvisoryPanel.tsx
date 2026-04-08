"use client";
import { useState, useEffect } from 'react'
import type { AdvisoryReport, AdvisoryFinding, Severity } from '@/lib/advisory'
import { ShieldAlert, ShieldCheck, ShieldX, RefreshCw, ExternalLink, Package, ChevronDown, ChevronUp } from 'lucide-react'

const SEV_COLOR: Record<Severity, string> = {
  CRITICAL: 'var(--danger)',
  HIGH:     '#e8720c',
  MODERATE: 'var(--warning)',
  LOW:      'var(--text-muted)',
  UNKNOWN:  'var(--text-faint)',
}

const SEV_BG: Record<Severity, string> = {
  CRITICAL: 'oklch(from var(--danger)  l c h / 0.10)',
  HIGH:     'oklch(40% 0.15 35 / 0.10)',
  MODERATE: 'oklch(from var(--warning) l c h / 0.10)',
  LOW:      'oklch(from var(--text-muted) l c h / 0.06)',
  UNKNOWN:  'oklch(from var(--text-faint) l c h / 0.06)',
}

function SevBadge({ sev }: { sev: Severity }) {
  return (
    <span style={{
      fontSize: 'var(--text-xs)', fontWeight: 700, padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      background: SEV_BG[sev], color: SEV_COLOR[sev],
    }}>
      {sev}
    </span>
  )
}

function ScoreChip({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      background: 'var(--surface)', border: `1px solid ${color}`,
      borderRadius: 'var(--radius-lg)', padding: '8px 16px',
    }}>
      {score >= 80 ? <ShieldCheck size={18} color={color} /> :
       score >= 50 ? <ShieldAlert size={18} color={color} /> :
                     <ShieldX    size={18} color={color} />}
      <div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>Security Score</div>
      </div>
    </div>
  )
}

interface Props {
  owner: string
  repo:  string
}

export default function AdvisoryPanel({ owner, repo }: Props) {
  const [data,    setData]    = useState<AdvisoryReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = () => {
    setLoading(true); setError(null)
    fetch(`/api/advisory?repo=${owner}/${repo}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [owner, repo])

  if (loading && !data) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px',
      padding: 'var(--space-8)', color: 'var(--text-faint)',
      fontSize: 'var(--text-sm)' }}>
      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
      Scanning dependencies against GitHub Advisory DB, Dependabot &amp; OSV.dev…
    </div>
  )

  if (error) return (
    <div style={{ padding: 'var(--space-5)', background: 'oklch(from var(--danger) l c h / 0.08)',
      borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
      Advisory scan failed: {error}
    </div>
  )

  if (!data) return null

  const { findings, counts, securityScore, packages, ecosystems, scannedAt, cached } = data as any

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* ─ Header bar ─ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 800 }}>Dependency Vulnerability Scan</h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', marginTop: '2px' }}>
            {packages.length} packages scanned · {ecosystems.join(', ')} ·
            {cached ? ' (cached)' : ' live'} · {new Date(scannedAt).toLocaleTimeString()}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <ScoreChip score={securityScore} />
          <button onClick={load} disabled={loading}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '6px 10px', cursor: 'pointer',
              color: 'var(--text-faint)', display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ─ Count chips ─ */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        {([
          { label: 'Critical', key: 'critical', sev: 'CRITICAL' },
          { label: 'High',     key: 'high',     sev: 'HIGH'     },
          { label: 'Moderate', key: 'moderate', sev: 'MODERATE' },
          { label: 'Low',      key: 'low',      sev: 'LOW'      },
        ] as const).map(({ label, key, sev }) => (
          <div key={key} style={{
            padding: 'var(--space-2) var(--space-4)',
            background: SEV_BG[sev as Severity],
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)', fontWeight: 700,
            color: SEV_COLOR[sev as Severity],
            minWidth: '80px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 900, lineHeight: 1 }}>{counts[key]}</div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
        <div style={{
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--surface-off)', borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-muted)',
          minWidth: '80px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 900, lineHeight: 1, color: 'var(--text)' }}>{packages.length}</div>
          <div style={{ fontSize: 'var(--text-xs)' }}>Packages</div>
        </div>
      </div>

      {/* ─ No findings ─ */}
      {findings.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-5)', background: 'oklch(from var(--success) l c h / 0.08)',
          borderRadius: 'var(--radius-lg)', color: 'var(--success)', fontSize: 'var(--text-sm)' }}>
          <ShieldCheck size={20} />
          <div>
            <strong>No known vulnerabilities found</strong>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
              All {packages.length} detected packages are clear in GitHub Advisory DB and OSV.dev.
            </p>
          </div>
        </div>
      )}

      {/* ─ Findings table ─ */}
      {findings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {(findings as AdvisoryFinding[]).map((f, i) => {
            const key = `${f.package}:${f.ghsaId || i}`
            const open = expanded === key
            return (
              <div key={key} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              }}>
                {/* Row header */}
                <button onClick={() => setExpanded(open ? null : key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'left', flexWrap: 'wrap',
                  }}>
                  <SevBadge sev={f.severity} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)' }}>
                    {f.package}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)',
                    background: 'var(--surface-off)', padding: '2px 8px',
                    borderRadius: 'var(--radius-full)', fontFamily: 'monospace' }}>
                    v{f.installedVer}
                  </span>
                  {f.patchedVer && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success)',
                      background: 'oklch(from var(--success) l c h / 0.10)',
                      padding: '2px 8px', borderRadius: 'var(--radius-full)', fontFamily: 'monospace' }}>
                      fix: v{f.patchedVer}
                    </span>
                  )}
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', flexShrink: 0 }}>
                    {f.ecosystem}
                  </span>
                  {open ? <ChevronUp size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
                         : <ChevronDown size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />}
                </button>

                {/* Expanded detail */}
                {open && (
                  <div style={{
                    padding: 'var(--space-4)', borderTop: '1px solid var(--border)',
                    display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
                    background: SEV_BG[f.severity],
                  }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text)', margin: 0 }}>{f.summary}</p>
                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', fontSize: 'var(--text-xs)' }}>
                      {f.ghsaId && <span style={{ color: 'var(--text-muted)' }}><strong>GHSA:</strong> {f.ghsaId}</span>}
                      {f.cveId  && <span style={{ color: 'var(--text-muted)' }}><strong>CVE:</strong> {f.cveId}</span>}
                      {f.cvss   && <span style={{ color: 'var(--text-muted)' }}><strong>CVSS:</strong> {f.cvss}</span>}
                      <span style={{ color: 'var(--text-faint)' }}>Source: {f.source}</span>
                    </div>
                    {f.patchedVer && (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)',
                        background: 'oklch(from var(--success) l c h / 0.08)',
                        padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                        ⚠️ Upgrade <code>{f.package}</code> from <code>v{f.installedVer}</code> to <code>v{f.patchedVer}</code> to fix this vulnerability.
                      </div>
                    )}
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                      View advisory <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ─ Package inventory (collapsed by default) ─ */}
      <details style={{ marginTop: 'var(--space-2)' }}>
        <summary style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          listStyle: 'none', userSelect: 'none' }}>
          <Package size={12} /> {packages.length} packages in manifest inventory
        </summary>
        <div style={{
          marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap',
        }}>
          {(packages as { name: string; version: string; ecosystem: string }[]).map(p => (
            <span key={`${p.ecosystem}:${p.name}`}
              style={{
                fontSize: 'var(--text-xs)', padding: '2px 8px',
                background: 'var(--surface-off)', borderRadius: 'var(--radius-full)',
                color: 'var(--text-muted)', fontFamily: 'monospace',
              }}>
              {p.name}@{p.version}
            </span>
          ))}
        </div>
      </details>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  )
}
