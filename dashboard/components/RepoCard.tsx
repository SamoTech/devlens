'use client';
import { useState } from 'react';
import Image from 'next/image';
import DimBar from './DimBar';
import ScoreRing from './ScoreRing';
import TrendChart from './TrendChart';
import SnippetModal from './SnippetModal';
import type { AnalysisResult } from '@/lib/types';

export default function RepoCard({ result }: { result: AnalysisResult }) {
  const [showSnippet, setShowSnippet] = useState(false);
  const { repo, score, dimensions, meta } = result;

  return (
    <>
      <div className="rounded-2xl p-6 animate-fadein"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <Image src={meta.avatar} alt={meta.owner} width={48} height={48}
            className="rounded-full" style={{ border: '2px solid var(--color-border)' }} />
          <div className="flex-1 min-w-0">
            <a href={`https://github.com/${repo}`} target="_blank" rel="noopener noreferrer"
              className="font-bold text-lg hover:underline" style={{ color: 'var(--color-text)' }}>
              {repo}
            </a>
            {meta.description && (
              <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--color-text-muted)' }}>{meta.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              {meta.language && <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{meta.language}</span>}
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>⭐ {meta.stars.toLocaleString()}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>🍴 {meta.forks.toLocaleString()}</span>
            </div>
          </div>
          <ScoreRing score={score} />
        </div>

        {/* 7 Dimensions */}
        <div className="mb-5">
          {dimensions.map(d => <DimBar key={d.key} dim={d} />)}
        </div>

        {/* Trend Chart */}
        <div className="mb-5">
          <TrendChart repo={repo} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Analyzed {new Date(meta.analyzedAt).toLocaleString()}
          </p>
          <button onClick={() => setShowSnippet(true)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--color-primary)' }}>
            Add to your repo →
          </button>
        </div>
      </div>

      {showSnippet && <SnippetModal repo={repo} onClose={() => setShowSnippet(false)} />}
    </>
  );
}
