'use client'
import { useState } from 'react'
import type { RepoReport } from '@/lib/scorer'
import ThemeToggle from '@/components/ThemeToggle'
import { Search, Loader2, ArrowRight, Copy, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BadgePage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<RepoReport | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'md' | 'html' | 'url' | null>(null)

  async function analyze(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true); setError(''); setReport(null)
    try {
      const slug = input.trim().replace('https://github.com/', '').replace(/\/$/, '')
      const res = await fetch(`/api/analyze?repo=${encodeURIComponent(slug)}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Analysis failed'); return }
      setReport(data)
    } catch { setError('Network error.') } finally { setLoading(false) }
  }

  function copy(text: string, which: typeof copied) {
    navigator.clipboard.writeText(text)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  const mdBadge = report ? `[![DevLens Health](${report.badgeUrl})](https://devlens-io.vercel.app/report/${report.owner}/${report.name})` : ''
  const htmlBadge = report ? `<a href="https://devlens-io.vercel.app/report/${report.owner}/${report.name}"><img src="${report.badgeUrl}" alt="DevLens Health" /></a>` : ''

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--divider)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-3) var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
              <ArrowLeft size={15} /> Back
            </Link>
            <span style={{ color: 'var(--divider)' }}>|</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-base)' }}>Badge Generator</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main style={{ flex: 1, padding: 'clamp(2rem, 6vw, 5rem) var(--space-6)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-2)' }}>Embed your health badge</h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>Show your repo's DevLens score in your README with one line.</p>
          </div>
          <form onSubmit={analyze} style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="owner/repo" style={{ width: '100%', padding: `var(--space-3) var(--space-3) var(--space-3) calc(var(--space-3) + 24px)`, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-2)', color: 'var(--text)', fontSize: 'var(--text-sm)', outline: 'none' }} />
            </div>
            <button type="submit" disabled={loading} style={{ padding: 'var(--space-3) var(--space-5)', background: loading ? 'var(--primary-hl)' : 'var(--primary)', color: 'white', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: 'var(--text-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
              Generate
            </button>
          </form>
          {error && <p style={{ color: 'var(--error)', fontSize: 'var(--text-sm)' }}>{error}</p>}
          {report && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.badgeUrl} alt="DevLens Health" />
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>{report.repo} — Health score: {report.healthScore}/100</p>
              </div>
              {([
                { label: 'Markdown', value: mdBadge, key: 'md' as const },
                { label: 'HTML', value: htmlBadge, key: 'html' as const },
                { label: 'Direct URL', value: report.badgeUrl, key: 'url' as const },
              ]).map(item => (
                <div key={item.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{item.label}</span>
                    <button onClick={() => copy(item.value, item.key)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius-md)', background: 'var(--surface-off)' }}>
                      {copied === item.key ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                      {copied === item.key ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre style={{ background: 'var(--surface-off)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--text)', margin: 0 }}>{item.value}</pre>
                </div>
              ))}
              <Link href={`/report/${report.owner}/${report.name}`} style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--primary)', textDecoration: 'none' }}>
                View full report for {report.repo} →
              </Link>
            </div>
          )}
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } } input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px var(--primary-hl) }`}</style>
    </div>
  )
}
