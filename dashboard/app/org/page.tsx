'use client'
import { useState, useEffect } from 'react'
import type { RepoReport } from '@/lib/scorer'
import type { OrgEntry } from '@/app/api/org-watchlist/route'
import ThemeToggle from '@/components/ThemeToggle'
import ScoreRing from '@/components/ScoreRing'
import { Search, Loader2, ArrowLeft, ExternalLink, Building2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const scoreColor = (s: number) => s >= 80 ? 'var(--success)' : s >= 50 ? 'var(--warning)' : 'var(--danger)'

export default function OrgPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<RepoReport[]>([])
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [recentOrgs, setRecentOrgs] = useState<OrgEntry[]>([])
  const [recentLoading, setRecentLoading] = useState(true)

  useEffect(() => {
    fetch('/api/org-watchlist')
      .then(r => r.json())
      .then(d => setRecentOrgs(d.list ?? []))
      .catch(() => {})
      .finally(() => setRecentLoading(false))
  }, [])

  async function analyze(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true); setError(''); setRepos([])
    try {
      const res = await fetch(`/api/org?org=${encodeURIComponent(input.trim())}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setRepos(data.repos)
      setOrgName(data.org)

      if (data.repos?.length > 0) {
        const scores: number[] = data.repos.map((r: any) => r.healthScore ?? 0)
        const avgScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        const top = data.repos[0]
        const entry: OrgEntry = {
          org: data.org,
          repoCount: data.repos.length,
          avgScore,
          topRepo: top ? top.name : null,
          savedAt: new Date().toISOString(),
        }
        fetch('/api/org-watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {})
        // Optimistically prepend to recent list
        setRecentOrgs(prev => [entry, ...prev.filter(o => o.org !== data.org)])
      }
    } catch { setError('Network error.') } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--divider)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-3) var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
              <ArrowLeft size={15} /> Back
            </Link>
            <span style={{ color: 'var(--divider)' }}>|</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-base)' }}>Org Health</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ flex: 1, padding: 'clamp(2rem, 5vw, 4rem) var(--space-6)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-10)' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Org Repo Health</h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>Score all public repos in a GitHub organization, ranked by health.</p>
          </div>

          {/* Search form */}
          <form onSubmit={analyze} style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
              <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="org name (e.g. vercel, facebook)"
                style={{ width: '100%', padding: `var(--space-3) var(--space-3) var(--space-3) calc(var(--space-3) + 24px)`, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 'var(--text-sm)', outline: 'none' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{ padding: 'var(--space-3) var(--space-6)', background: loading ? 'var(--primary-hl)' : 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</> : 'Analyze Org'}
            </button>
          </form>

          {error && <p style={{ color: 'var(--error)', textAlign: 'center', fontSize: 'var(--text-sm)' }}>{error}</p>}

          {loading && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
              Analyzing up to 30 repos in parallel...
            </div>
          )}

          {/* Org results */}
          {repos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-muted)' }}>{repos.length} repos in {orgName}, ranked by health</h2>
              {repos.map((r, i) => (
                <div key={r.repo} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', boxShadow: 'var(--shadow-sm)' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-faint)', minWidth: 24, textAlign: 'right' }}>#{i + 1}</span>
                  <Image src={r.avatar} alt={r.owner} width={36} height={36} style={{ borderRadius: 'var(--radius-md)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Link href={`/repo/${r.owner}/${r.name}`} style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)', textDecoration: 'none' }}>{r.name}</Link>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-faint)' }}><ExternalLink size={12} /></a>
                    </div>
                    {r.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</p>}
                  </div>
                  <ScoreRing score={r.healthScore} size={48} />
                </div>
              ))}
            </div>
          )}

          {/* Recently Checked Orgs */}
          {!loading && repos.length === 0 && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Building2 size={16} style={{ color: 'var(--text-faint)' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 800 }}>Recently Checked Orgs</h2>
              </div>

              {recentLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-faint)', fontSize: 'var(--text-sm)' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                </div>
              )}

              {!recentLoading && recentOrgs.length === 0 && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-faint)' }}>No orgs checked yet — try analysing one above.</p>
              )}

              {!recentLoading && recentOrgs.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px,100%),1fr))', gap: 'var(--space-3)' }}>
                  {recentOrgs.map(o => (
                    <button
                      key={o.org}
                      onClick={() => { setInput(o.org); }}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'left', cursor: 'pointer', transition: 'background .15s' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--surface-off)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={18} style={{ color: 'var(--text-faint)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{o.org}</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)', margin: 0 }}>
                          {o.repoCount} repos{o.topRepo ? ` · top: ${o.topRepo}` : ''}
                        </p>
                      </div>
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800, color: scoreColor(o.avgScore), flexShrink: 0 }}>{o.avgScore}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-hl) }`}</style>
    </div>
  )
}
