'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { RepoReport } from '@/lib/scorer'
import { DIMMETA } from '@/lib/constants'
import ThemeToggle from '@/components/ThemeToggle'
import ScoreRing from '@/components/ScoreRing'
import DimBar from '@/components/DimBar'
import TrendChart from '@/components/TrendChart'
import { Star, GitFork, ExternalLink, Share2, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function ReportPage() {
  const params = useParams()
  const owner = params.owner as string
  const repo = params.repo as string
  const [report, setReport] = useState<RepoReport | null>(null)
  const [history, setHistory] = useState<{ week: string; score: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!owner || !repo) return
    setLoading(true)
    Promise.all([
      fetch(`/api/analyze?repo=${encodeURIComponent(`${owner}/${repo}`)}`),
      fetch(`/api/history?repo=${encodeURIComponent(`${owner}/${repo}`)}`),
    ]).then(async ([r1, r2]) => {
      const d1 = await r1.json()
      if (!r1.ok) { setError(d1.error ?? 'Failed'); setLoading(false); return }
      setReport(d1)
      const d2 = await r2.json()
      if (r2.ok) setHistory(d2.history ?? [])
      setLoading(false)
    }).catch(() => { setError('Network error'); setLoading(false) })
  }, [owner, repo])

  function share() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--surface)', borderBottom: '1px solid var(--divider)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-3) var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
              <ArrowLeft size={15} /> Back
            </Link>
            <span style={{ color: 'var(--divider)' }}>|</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-base)' }}>DevLens Report</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button onClick={share} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-3)', background: 'var(--surface-off)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
              {copied ? <Check size={14} color="var(--success)" /> : <Share2 size={14} />}
              {copied ? 'Copied!' : 'Share'}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main style={{ flex: 1, padding: 'var(--space-10) var(--space-6)' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--text-muted)' }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto var(--space-4)' }} />
              Analyzing {owner}/{repo}...
            </div>
          )}
          {error && <p style={{ color: 'var(--error)', textAlign: 'center' }}>{error}</p>}
          {report && (
            <>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-md)', display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                <Image src={report.avatar} alt={report.owner} width={52} height={52} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800 }}>{report.repo}</h1>
                    <a href={report.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-faint)' }}><ExternalLink size={16} /></a>
                  </div>
                  {report.description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>{report.description}</p>}
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}><Star size={12} />{report.stars.toLocaleString()}</span>
                    <span style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}><GitFork size={12} />{report.forks.toLocaleString()}</span>
                    {report.language && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{report.language}</span>}
                  </div>
                </div>
                <ScoreRing score={report.healthScore} size={96} />
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--divider)' }}>Dimension Breakdown</h2>
                {DIMMETA.map(d => (
                  <DimBar key={d.key} emoji={d.emoji} label={d.label} weight={d.weight} score={report.scores[d.key as keyof typeof report.scores]} />
                ))}
              </div>
              {history.length > 1 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-sm)' }}>
                  <TrendChart data={history} />
                </div>
              )}
              {report.suggestions.length > 0 && (
                <div style={{ background: 'color-mix(in oklch, #d19900 8%, var(--surface))', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>💡 How to improve this repo</h2>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', listStyle: 'none' }}>
                    {report.suggestions.map(s => (
                      <li key={s.dim} style={{ fontSize: 'var(--text-sm)', display: 'flex', gap: 'var(--space-2)' }}>
                        <span style={{ flexShrink: 0 }}>{DIMMETA.find(d => d.key === s.dim)?.emoji}</span>
                        <span>{s.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>🏷️ Add badge to your README</h2>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.badgeUrl} alt="DevLens Health" style={{ marginBottom: 'var(--space-3)' }} />
                <pre style={{ background: 'var(--surface-off)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--text)' }}>{`[![DevLens Health](${report.badgeUrl})](https://devlens-io.vercel.app/report/${report.owner}/${report.name})`}</pre>
                <Link href={`/badge?repo=${encodeURIComponent(report.repo)}`} style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', textDecoration: 'none' }}>More badge options →</Link>
              </div>
            </>
          )}
        </div>
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
