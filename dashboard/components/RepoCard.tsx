'use client'
import { useState } from 'react'
import type { RepoReport } from '@/lib/scorer'
import { DIMMETA } from '@/lib/constants'
import ScoreRing from './ScoreRing'
import DimBar from './DimBar'
import { Star, GitFork, ExternalLink, Code2, ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function RepoCard({ report, onSnippet }: { report: RepoReport; onSnippet?: () => void }) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <Image src={report.avatar} alt={report.owner} width={44} height={44} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--text)' }}>{report.repo}</h2>
            <a href={report.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-faint)' }} aria-label="Open on GitHub"><ExternalLink size={14} /></a>
          </div>
          {report.description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>{report.description}</p>}
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}><Star size={12} />{report.stars.toLocaleString()}</span>
            <span style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}><GitFork size={12} />{report.forks.toLocaleString()}</span>
            {report.language && <span style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}><Code2 size={12} />{report.language}</span>}
          </div>
        </div>
        <ScoreRing score={report.healthScore} size={96} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {DIMMETA.map(d => (
          <DimBar key={d.key} emoji={d.emoji} label={d.label} weight={d.weight} score={report.scores[d.key as keyof typeof report.scores]} />
        ))}
      </div>

      {/* Suggestions */}
      {report.suggestions && report.suggestions.length > 0 && (
        <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 'var(--space-4)' }}>
          <button
            onClick={() => setShowSuggestions(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--warning, #d19900)', background: 'none', padding: 0 }}
          >
            💡 {report.suggestions.length} improvement{report.suggestions.length > 1 ? 's' : ''} available
            {showSuggestions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showSuggestions && (
            <ul style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none', background: 'color-mix(in oklch, var(--warning, #d19900) 8%, var(--surface))', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              {report.suggestions.map(s => (
                <li key={s.dim} style={{ fontSize: 'var(--text-sm)', display: 'flex', gap: 'var(--space-2)' }}>
                  <span style={{ flexShrink: 0 }}>{DIMMETA.find(d => d.key === s.dim)?.emoji}</span>
                  <span>{s.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--divider)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>Analyzed {new Date(report.generatedAt).toLocaleString()}</span>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <Link href={`/report/${report.owner}/${report.name}`} style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)', padding: 'var(--space-1) var(--space-3)', border: '1px solid var(--primary-hl)', borderRadius: 'var(--radius-md)', background: 'var(--primary-hl)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Share2 size={11} /> Share report
          </Link>
          {onSnippet && (
            <button onClick={onSnippet} style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)', padding: 'var(--space-1) var(--space-3)', border: '1px solid var(--primary-hl)', borderRadius: 'var(--radius-md)', background: 'var(--primary-hl)' }}>Add to your repo</button>
          )}
        </div>
      </div>
    </div>
  )
}
