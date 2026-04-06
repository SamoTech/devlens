'use client';
import { useState } from 'react';
import RepoCard from '@/components/RepoCard';
import ThemeToggle from '@/components/ThemeToggle';
import type { AnalysisResult } from '@/lib/types';

export default function ComparePage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<[AnalysisResult, AnalysisResult] | null>(null);
  const [error, setError] = useState('');

  const parseRepo = (val: string) => {
    const m = val.match(/github\.com\/([^/]+\/[^/]+)/);
    if (m) return m[1].replace(/\.git$/, '');
    if (/^[\w.-]+\/[\w.-]+$/.test(val)) return val;
    return null;
  };

  const compare = async () => {
    const ra = parseRepo(a.trim());
    const rb = parseRepo(b.trim());
    if (!ra || !rb) { setError('Enter two valid repo slugs'); return; }
    setError('');
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch(`/api/compare?a=${encodeURIComponent(ra)}&b=${encodeURIComponent(rb)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Compare failed');
      setResults([data.a, data.b]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <nav style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
        className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          DevLens
        </a>
        <div className="flex items-center gap-4">
          <a href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }} className="hover:underline">Home</a>
          <ThemeToggle />
        </div>
      </nav>

      <section className="px-6 py-14 text-center">
        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Compare Two Repos</h1>
        <p className="mb-10" style={{ color: 'var(--color-text-muted)' }}>Side-by-side health scores for any two public repos.</p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-4">
          <input value={a} onChange={e => setA(e.target.value)} placeholder="owner/repo-a"
            className="flex-1 px-4 py-3 rounded-xl text-base outline-none"
            style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }} />
          <span className="self-center font-bold" style={{ color: 'var(--color-text-muted)' }}>vs</span>
          <input value={b} onChange={e => setB(e.target.value)} placeholder="owner/repo-b"
            className="flex-1 px-4 py-3 rounded-xl text-base outline-none"
            style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', color: 'var(--color-text)' }} />
        </div>
        <button onClick={compare} disabled={loading}
          className="px-8 py-3 rounded-xl font-semibold text-white"
          style={{ background: loading ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
          {loading ? 'Analyzing…' : 'Compare'}
        </button>
        {error && <p className="mt-4 text-sm" style={{ color: 'var(--color-error)' }}>{error}</p>}
      </section>

      {results && (
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto px-6 pb-16 animate-fadein">
          <RepoCard result={results[0]} />
          <RepoCard result={results[1]} />
        </div>
      )}

      <footer className="text-center py-10" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Built by{' '}
        <a href="https://github.com/SamoTech" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>SamoTech</a>
        {' · '}
        <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>GitHub</a>
      </footer>
    </div>
  );
}
