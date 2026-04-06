'use client'
import { useState, useEffect } from 'react'
import { Search, Loader2, ArrowRight, Github, AlertTriangle, X, Zap, BarChart2, Shield, BookOpen, ExternalLink } from 'lucide-react'
import RepoCard from '@/components/RepoCard'
import TrendChart from '@/components/TrendChart'
import SnippetModal from '@/components/SnippetModal'
import WeightEditor from '@/components/WeightEditor'
import type { RepoReport } from '@/lib/scorer'
import { DEFAULT_WEIGHTS, DimKey } from '@/lib/constants'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import type { WatchEntry } from '@/app/api/watchlist/route'

export default function Home() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<RepoReport | null>(null)
  const [history, setHistory] = useState<{ week: string; score: number }[]>([])
  const [error, setError] = useState<{ type: string; message: string } | null>(null)
  const [showSnippet, setShowSnippet] = useState(false)
  const [weights, setWeights] = useState<Record<DimKey, number>>({ ...DEFAULT_WEIGHTS })
  const [recentList, setRecentList] = useState<WatchEntry[]>([])

  useEffect(() => {
    fetch('/api/watchlist')
      .then(r => r.json())
      .then(d => setRecentList((d.list ?? []).slice(-10).reverse()))
      .catch(() => {})
  }, [])

  async function analyze(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true); setError(null); setReport(null); setHistory([])
    try {
      const slug = input.trim().replace('https://github.com/', '').replace(/\/$/, '')
      const weightsSum = Object.values(weights).reduce((a, b) => a + b, 0)
      const normalizedWeights = Object.fromEntries(
        Object.entries(weights).map(([k, v]) => [k, v / weightsSum])
      ) as Record<DimKey, number>
      const weightsJson = JSON.stringify(normalizedWeights)
      const [res, histRes] = await Promise.all([
        fetch(`/api/analyze?repo=${encodeURIComponent(slug)}&weights=${encodeURIComponent(weightsJson)}`),
        fetch(`/api/history?repo=${encodeURIComponent(slug)}`),
      ])
      const data = await res.json()
      if (!res.ok) {
        setError({ type: data.error ?? 'error', message: data.message ?? data.error ?? 'Analysis failed' })
        return
      }
      setReport(data)
      const hData = await histRes.json()
      if (histRes.ok) setHistory(hData.history ?? [])
    } catch { setError({ type: 'error', message: 'Network error. Please try again.' }) }
    finally { setLoading(false) }
  }

  const scoreColor = (s: number) => s >= 80 ? 'var(--success)' : s >= 50 ? 'var(--warning)' : 'var(--danger)'

  return (
    <>
      {showSnippet && report && <SnippetModal repo={report.repo} onClose={() => setShowSnippet(false)} />}

      <main style={{ flex: 1 }}>
        <section style={{ padding: 'clamp(3rem,8vw,6rem) var(--space-6)', textAlign: 'center' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
                Repo Health.<br /><span style={{ color: 'var(--primary)' }}>In 9 Dimensions.</span>
              </h1>
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>Paste any public GitHub repo URL and get a live health score — free, forever.</p>
            </div>
            <form onSubmit={analyze} style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 460 }}>
                <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
                <input value={input} onChange={e => setInput(e.target.value)} placeholder="owner/repo or github.com/owner/repo" aria-label="GitHub repository" style={{ width: '100%', padding: `var(--space-3) var(--space-3) var(--space-3) calc(var(--space-3) + 24px)`, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 'var(--text-sm)', outline: 'none' }} />
              </div>
              <button type="submit" disabled={loading} style={{ padding: 'var(--space-3) var(--space-6)', background: loading ? 'var(--primary-hl)' : 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </form>
            <WeightEditor weights={weights} onChange={setWeights} />

            {/* Feature badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-2)' }}>
              {[
                { icon: <Zap size={13} />, label: 'Live GitHub API' },
                { icon: <BarChart2 size={13} />, label: '9 weighted dimensions' },
                { icon: <Shield size={13} />, label: 'Free forever' },
              ].map(({ icon, label }) => (
                <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: 'var(--space-1) var(--space-3)' }}>
                  {icon}{label}
                </span>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--space-3)' }}>
              <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-5)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--text)', fontWeight: 500, textDecoration: 'none' }}>
                <Github size={15} /> Star on GitHub
              </a>
              <Link href="/docs" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-5)', background: 'var(--primary-hl)', border: '1px solid transparent', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}>
                <BookOpen size={15} /> Read the Docs →
              </Link>
            </div>
          </div>
        </section>

        {/* Recently Checked */}
        {recentList.length > 0 && !report && !loading && (
          <section style={{ maxWidth: 680, margin: '0 auto var(--space-12)', padding: '0 var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text)' }}>Recently Checked</h2>
              <Link href="/checked" style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {recentList.map(w => (
                <div key={w.slug} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3) var(--space-4)' }}>
                  <span style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: scoreColor(w.score), minWidth: 36, textAlign: 'center' }}>{w.score}</span>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Link href={`/?repo=${w.slug}`} style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text)', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {w.slug}
                    </Link>
                    {w.description && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{w.description}</p>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                    {w.language && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{w.language}</span>}
                    <a href={`/repo/${w.slug}`} title="Full report" style={{ color: 'var(--text-faint)', display: 'flex' }}><ExternalLink size={14} /></a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {error?.type === 'rate_limited' && (
          <div style={{ maxWidth: 680, margin: '0 auto var(--space-6)', padding: '0 var(--space-6)' }}>
            <div style={{ background: 'color-mix(in oklch, #d19900 12%, var(--surface))', border: '1px solid color-mix(in oklch, #d19900 30%, var(--border))', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
              <AlertTriangle size={20} color="#d19900" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>GitHub rate limit reached</p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>{error.message}</p>
                <button onClick={() => signIn('github')} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                  <Github size={15} /> Sign in with GitHub
                </button>
              </div>
              <button onClick={() => setError(null)} style={{ color: 'var(--text-faint)', padding: 'var(--space-1)', flexShrink: 0 }}><X size={16} /></button>
            </div>
          </div>
        )}

        {error && error.type !== 'rate_limited' && (
          <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: '0 var(--space-6)' }}>{error.message}</p>
        )}

        {report && (
          <section style={{ padding: '0 var(--space-6) var(--space-16)', maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <RepoCard report={report} onSnippet={() => setShowSnippet(true)} />
            {history.length > 0 && <TrendChart data={history} />}
          </section>
        )}

        {!report && !loading && (
          <section style={{ padding: '0 var(--space-6) var(--space-16)', maxWidth: 960, margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))', gap: 'var(--space-4)' }}>
              {[
                { emoji: '📄', title: 'README Quality', desc: 'Length, sections, badges, code blocks' },
                { emoji: '⚡', title: 'Commit Activity', desc: 'Push frequency over last 90 days' },
                { emoji: '🕐', title: 'Repo Freshness', desc: 'Days since last push to main' },
                { emoji: '📚', title: 'Documentation', desc: 'LICENSE, CONTRIBUTING, CHANGELOG, SECURITY' },
                { emoji: '🔧', title: 'CI/CD Setup', desc: 'GitHub Actions workflows detected' },
                { emoji: '🐛', title: 'Issue Response', desc: 'Closed vs open issue ratio' },
                { emoji: '⭐', title: 'Community Signal', desc: 'Stars, forks, watchers momentum' },
                { emoji: '🔀', title: 'PR Velocity', desc: 'Average pull request merge time' },
                { emoji: '🔒', title: 'Security', desc: 'SECURITY.md, Dependabot, CodeQL' },
              ].map(f => (
                <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '1.5rem' }}>{f.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{f.title}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{f.desc}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--divider)', padding: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>
        Built by <a href="https://github.com/SamoTech" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>SamoTech</a> · Free forever ·{' '}
        <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>GitHub</a>
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } } input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-hl) }`}</style>
    </>
  )
}
