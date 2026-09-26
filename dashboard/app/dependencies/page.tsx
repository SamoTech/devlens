'use client'

import { useState } from 'react'
import Link from 'next/link'

const UPDATE_META = {
  up_to_date: { label: 'Current', color: 'var(--success)' },
  patch: { label: 'Patch', color: 'var(--warning)' },
  minor: { label: 'Minor', color: 'var(--warning)' },
  major: { label: 'Major', color: 'var(--danger)' },
  unknown: { label: 'Unknown', color: 'var(--text-faint)' },
}

export default function DependenciesPage() {
  const [repo, setRepo] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function scan() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/dependencies?repo=' + encodeURIComponent(repo.trim()))
      const json = await response.json()
      if (!response.ok) throw new Error(json.message ?? json.error ?? 'Dependency scan failed')
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dependency scan failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--space-12) var(--space-6)' }}>
      <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>← Home</Link>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 800, margin: 'var(--space-4) 0 var(--space-2)' }}>Dependency Intelligence</h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: 760, lineHeight: 1.7 }}>
        Inventory declared dependencies, correlate known vulnerabilities, and check npm packages for available releases.
        Registry freshness is currently available for npm; other ecosystems remain vulnerability-focused.
      </p>

      <div style={{ display: 'flex', gap: 8, margin: 'var(--space-6) 0', maxWidth: 760 }}>
        <input value={repo} onChange={e => setRepo(e.target.value)} onKeyDown={e => e.key === 'Enter' && scan()}
          placeholder="owner/name" style={{ flex: 1, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)' }} />
        <button onClick={scan} disabled={loading || !repo.trim()}
          style={{ padding: '12px 18px', border: 0, borderRadius: 8, background: 'var(--primary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Scanning…' : 'Scan'}
        </button>
      </div>

      {error && <div role="alert" style={{ padding: 14, borderRadius: 8, background: 'rgba(255,59,92,.08)', color: 'var(--danger)', marginBottom: 20 }}>{error}</div>}

      {data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 20 }}>
            <SummaryCard label="Packages" value={data.summary.total} />
            <SummaryCard label="npm" value={data.summary.npm} />
            <SummaryCard label="Vulnerable" value={data.summary.vulnerable} />
            <SummaryCard label="Outdated" value={data.summary.outdated} />
            <SummaryCard label="Major" value={data.summary.majorUpdates} />
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Package</th>
                <th style={{ padding: 12 }}>Ecosystem</th>
                <th style={{ padding: 12 }}>Installed</th>
                <th style={{ padding: 12 }}>Latest</th>
                <th style={{ padding: 12 }}>Update</th>
                <th style={{ padding: 12 }}>Vulnerabilities</th>
                <th style={{ padding: 12 }}>Fix</th>
                <th style={{ padding: 12 }}>Sources</th>
              </tr></thead>
              <tbody>
                {data.packages.map(d => {
                  const meta = UPDATE_META[d.updateType] ?? UPDATE_META.unknown
                  return (
                    <tr key={d.ecosystem + ':' + d.name} style={{ borderBottom: '1px solid var(--divider)' }}>
                      <td style={{ padding: 12, fontWeight: 700 }}>{d.name}</td>
                      <td style={{ padding: 12 }}>{d.ecosystem}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace' }}>{d.installedVersion}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace' }}>{d.latestVersion ?? '—'}</td>
                      <td style={{ padding: 12, color: meta.color, fontWeight: 700 }}>{meta.label}</td>
                      <td style={{ padding: 12, color: d.vulnerabilityCount ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>{d.vulnerabilityCount}</td>
                      <td style={{ padding: 12, color: 'var(--success)', fontFamily: 'monospace' }}>{d.patchedVersion ?? '—'}</td>
                      <td style={{ padding: 12, color: 'var(--text-faint)' }}>{d.sources.length ? d.sources.join(', ') : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div style={{ padding: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
      <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>{label}</div>
    </div>
  )
}
