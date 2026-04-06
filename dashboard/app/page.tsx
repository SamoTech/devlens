'use client';
import { useState, useEffect } from 'react';
import RepoCard from '@/components/RepoCard';
import ThemeToggle from '@/components/ThemeToggle';
import type { AnalysisResult } from '@/lib/types';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const parseRepo = (val: string) => {
    const m = val.match(/github\.com\/([^/]+\/[^/]+)/);
    if (m) return m[1].replace(/\.git$/, '');
    if (/^[\w.-]+\/[\w.-]+$/.test(val)) return val;
    return null;
  };

  const analyze = async () => {
    const repo = parseRepo(input.trim());
    if (!repo) { setError('Enter a valid repo slug like owner/repo or a GitHub URL'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/analyze?repo=${encodeURIComponent(repo)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') analyze(); };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
        className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            <path d="M11 8v6M8 11h6" strokeLinecap="round"/>
          </svg>
          DevLens
        </a>
        <div className="flex items-center gap-4">
          <a href="/compare" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}
            className="hover:underline">Compare</a>
          <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:underline">GitHub</a>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-6"
          style={{ background: 'var(--color-primary)', color: '#fff', opacity: 0.9 }}>
          <span>✦</span> Free forever · No signup required
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-text)', lineHeight: 1.15 }}>
          Repo Health.<br/>In 7 Dimensions.
        </h1>
        <p className="text-xl mb-10" style={{ color: 'var(--color-text-muted)', maxWidth: 520, margin: '0 auto 2.5rem' }}>
          Paste any public GitHub repo URL and get a live health score — free, forever.
        </p>

        {/* Search */}
        <div className="flex gap-3 max-w-xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="SamoTech/devlens or https://github.com/..."
            className="flex-1 px-4 py-3 rounded-xl text-base outline-none"
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              color: 'var(--color-text)'
            }}
          />
          <button
            onClick={analyze}
            disabled={loading}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all"
            style={{ background: loading ? 'var(--color-text-muted)' : 'var(--color-primary)', minWidth: 100 }}
          >
            {loading ? <span className="animate-spin inline-block">⟳</span> : 'Analyze'}
          </button>
        </div>

        {error && <p className="mt-4 text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}

        {/* Quick examples */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {['vercel/next.js', 'facebook/react', 'SamoTech/devlens', 'SamoTech/ebay-store'].map(r => (
            <button key={r} onClick={() => { setInput(r); }}
              className="px-3 py-1 rounded-full text-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              {r}
            </button>
          ))}
        </div>
      </section>

      {/* Result */}
      {loading && (
        <div className="max-w-2xl mx-auto px-6 pb-16">
          <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="skeleton h-8 w-1/2 mb-4" />
            <div className="skeleton h-4 w-full mb-2" />
            <div className="skeleton h-4 w-3/4 mb-6" />
            {[1,2,3,4,5,6,7].map(i => <div key={i} className="skeleton h-6 w-full mb-2" />)}
          </div>
        </div>
      )}
      {result && !loading && (
        <div className="max-w-2xl mx-auto px-6 pb-16 animate-fadein">
          <RepoCard result={result} />
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-10" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Built by{' '}
        <a href="https://github.com/SamoTech" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-primary)' }}>SamoTech</a>
        {' · Free forever · '}
        <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--color-primary)' }}>GitHub</a>
      </footer>
    </div>
  );
}
