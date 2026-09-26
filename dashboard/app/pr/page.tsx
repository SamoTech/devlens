"use client"

import { useState } from 'react'

type Report = { number: number; title: string; state: string; draft: boolean; author: string | null; htmlUrl: string; additions: number; deletions: number; changedFiles: number; changeSize: string; ageHours: number | null; mergeable: boolean | null; review: { approvals: number; changesRequested: number; commented: number }; checks: { total: number; successful: number; failed: number; pending: number; status: string }; sensitiveFiles: string[]; riskSignals: string[] }

export default function PrIntelligencePage() {
  const [repo, setRepo] = useState('')
  const [number, setNumber] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function analyze() {
    setError(''); setReport(null); setLoading(true)
    try {
      const res = await fetch('/api/pr?repo=' + encodeURIComponent(repo) + '&number=' + encodeURIComponent(number))
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'PR analysis failed')
      setReport(data)
    } catch (e: any) { setError(e.message || 'PR analysis failed') }
    finally { setLoading(false) }
  }
  return <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
    <h1 style={{ fontSize: 32, fontWeight: 800 }}>PR Intelligence</h1>
    <p style={{ color: 'var(--text-muted)', maxWidth: 760 }}>Evidence-based pull request analysis covering change size, review state, CI status, age, mergeability, and sensitive-file exposure.</p>
    <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
      <input value={repo} onChange={e => setRepo(e.target.value)} placeholder="owner/repository" style={{ flex: 1, minWidth: 240, padding: 12, border: '1px solid var(--divider)', borderRadius: 8, background: 'var(--surface)' }} />
      <input value={number} onChange={e => setNumber(e.target.value)} placeholder="PR #" inputMode="numeric" style={{ width: 120, padding: 12, border: '1px solid var(--divider)', borderRadius: 8, background: 'var(--surface)' }} />
      <button onClick={analyze} disabled={loading} style={{ padding: '12px 18px', borderRadius: 8, border: 0, background: 'var(--primary)', color: 'white', fontWeight: 700 }}>{loading ? 'Analyzing…' : 'Analyze PR'}</button>
    </section>
    {error && <p style={{ color: '#b42318', marginTop: 16 }}>{error}</p>}
    {report && <section style={{ marginTop: 32, display: 'grid', gap: 16 }}>
      <div style={{ padding: 20, border: '1px solid var(--divider)', borderRadius: 12 }}><h2 style={{ margin: 0 }}>{report.title}</h2><p style={{ color: 'var(--text-muted)' }}>#{report.number} · {report.author ?? 'unknown'} · {report.draft ? 'Draft' : report.state}</p><a href={report.htmlUrl} target="_blank" rel="noopener noreferrer">Open on GitHub</a></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
        {[['Change', report.changeSize], ['Lines', '+' + report.additions + ' / -' + report.deletions], ['Files', String(report.changedFiles)], ['Reviews', report.review.approvals + ' approved / ' + report.review.changesRequested + ' changes requested'], ['CI', report.checks.status], ['Mergeability', report.mergeable === null ? 'unknown' : report.mergeable ? 'mergeable' : 'blocked']].map(([label, value]) => <div key={label} style={{ padding: 16, border: '1px solid var(--divider)', borderRadius: 10 }}><small style={{ color: 'var(--text-muted)' }}>{label}</small><div style={{ fontWeight: 700, marginTop: 6 }}>{value}</div></div>)}
      </div>
      <div style={{ padding: 20, border: '1px solid var(--divider)', borderRadius: 12 }}><h3>Evidence signals</h3>{report.riskSignals.length ? <ul>{report.riskSignals.map(s => <li key={s}>{s.replaceAll('_', ' ')}</li>)}</ul> : <p>No detected risk signals from the available evidence.</p>}{report.sensitiveFiles.length > 0 && <><h3>Sensitive files touched</h3><ul>{report.sensitiveFiles.map(f => <li key={f}><code>{f}</code></li>)}</ul></>}</div>
    </section>}
  </main>
}