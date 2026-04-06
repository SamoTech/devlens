import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documentation',
  description: 'DevLens documentation — setup, configuration, scoring, and API reference.'
};

const sections = [
  {
    title: '⚡ Quick Start',
    anchor: 'quickstart',
    content: (
      <div>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Get DevLens running in your repo in under 2 minutes.</p>
        <h3 className="font-semibold mb-2 text-sm" style={{ color: 'var(--color-text)' }}>Step 1 — Add markers to README.md</h3>
        <pre className="text-xs p-4 rounded-lg overflow-x-auto mb-4" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>{`<!-- DEVLENS:START -->
<!-- DEVLENS:END -->`}</pre>
        <h3 className="font-semibold mb-2 text-sm" style={{ color: 'var(--color-text)' }}>Step 2 — Create .github/workflows/devlens.yml</h3>
        <pre className="text-xs p-4 rounded-lg overflow-x-auto" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>{`name: DevLens Health Check
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 8 * * 1'
permissions:
  contents: write
jobs:
  devlens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: SamoTech/devlens@v1
        with:
          github_token: \${{ secrets.GITHUB_TOKEN }}
          groq_api_key: \${{ secrets.GROQ_API_KEY }}`}</pre>
      </div>
    )
  },
  {
    title: '🔧 Inputs Reference',
    anchor: 'inputs',
    content: (
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Input', 'Required', 'Default', 'Description'].map(h => (
              <th key={h} className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--color-text)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody style={{ color: 'var(--color-text-muted)' }}>
          {[
            ['github_token', '✅', '—', 'secrets.GITHUB_TOKEN — required'],
            ['groq_api_key', '❌', '""', 'Free Groq key for AI insights'],
            ['groq_model', '❌', 'llama-3.1-8b-instant', 'Groq model ID'],
            ['badge_style', '❌', 'flat', 'flat · flat-square · for-the-badge'],
            ['update_readme', '❌', 'true', 'Auto-inject health table into README'],
            ['notify_discord', '❌', '""', 'Discord webhook URL'],
          ].map(([input, req, def, desc]) => (
            <tr key={input} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="py-2 pr-4 font-mono text-xs" style={{ color: 'var(--color-primary)' }}>{input}</td>
              <td className="py-2 pr-4">{req}</td>
              <td className="py-2 pr-4 font-mono text-xs">{def}</td>
              <td className="py-2">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  },
  {
    title: '📤 Outputs Reference',
    anchor: 'outputs',
    content: (
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Output', 'Description'].map(h => (
              <th key={h} className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--color-text)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody style={{ color: 'var(--color-text-muted)' }}>
          {[
            ['health_score', 'Integer 0–100'],
            ['badge_url', 'Ready-to-embed shields.io badge URL'],
            ['report_json', 'Full JSON of all 7 dimension scores'],
          ].map(([out, desc]) => (
            <tr key={out} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="py-2 pr-4 font-mono text-xs" style={{ color: 'var(--color-primary)' }}>{out}</td>
              <td className="py-2">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  },
  {
    title: '📊 Score Dimensions',
    anchor: 'dimensions',
    content: (
      <div className="space-y-3">
        {[
          { e: '📝', d: 'README Quality',   w: '20%', desc: 'Checks length, sections (##), code blocks, badges, examples, setup instructions, and DevLens markers.' },
          { e: '🔥', d: 'Commit Activity',  w: '20%', desc: 'Counts commits in the last 90 days. 30+ commits = 100. Scales linearly below that.' },
          { e: '🌿', d: 'Repo Freshness',   w: '15%', desc: 'Days since last push. <7 days = 100, <30 = 85, <90 = 65, <180 = 40, otherwise = 15.' },
          { e: '📚', d: 'Documentation',    w: '15%', desc: 'Checks for LICENSE, CONTRIBUTING.md, CHANGELOG.md, CODE_OF_CONDUCT.md, SECURITY.md, and a docs/ folder.' },
          { e: '⚙️', d: 'CI/CD Setup',      w: '15%', desc: 'Detects GitHub Actions workflows. 0 workflows = 0. Each workflow adds 10 pts (base 60), capped at 100.' },
          { e: '🎯', d: 'Issue Response',   w: '10%', desc: 'Ratio of closed to total issues. No issues = 100. All closed = 100. Scales with close rate.' },
          { e: '⭐', d: 'Community Signal', w: '5%',  desc: 'Based on stars: 0=0, <10=15, <50=30, <200=55, <1000=75, 1000+=100.' },
        ].map(({ e, d, w, desc }) => (
          <div key={d} className="p-3 rounded-lg" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{e} {d}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: 'var(--color-primary)' }}>{w}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
          </div>
        ))}
      </div>
    )
  },
  {
    title: '🌐 API Reference',
    anchor: 'api',
    content: (
      <div className="space-y-4">
        {[
          { method: 'GET', path: '/api/analyze?repo=owner/name', desc: 'Full 7-dimension analysis. Cached 5 min.' },
          { method: 'GET', path: '/api/compare?a=owner/a&b=owner/b', desc: 'Parallel analysis of two repos.' },
          { method: 'GET', path: '/api/history?repo=owner/name', desc: 'Current score + 8-week trend data.' },
        ].map(({ method, path, desc }) => (
          <div key={path} className="p-3 rounded-lg" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ background: 'var(--color-success)' }}>{method}</span>
              <code className="text-xs" style={{ color: 'var(--color-primary)' }}>{path}</code>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
          </div>
        ))}
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>All routes run on Edge Runtime. Base URL: <code style={{ color: 'var(--color-primary)' }}>https://devlens-io.vercel.app</code></p>
      </div>
    )
  },
];

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Documentation</h1>
      <p className="mb-10" style={{ color: 'var(--color-text-muted)' }}>Everything you need to set up and get the most out of DevLens.</p>

      {/* TOC */}
      <nav className="p-4 rounded-xl mb-10" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>On this page</p>
        <ul className="space-y-1">
          {sections.map(({ title, anchor }) => (
            <li key={anchor}>
              <a href={`#${anchor}`} className="text-sm hover:underline" style={{ color: 'var(--color-primary)' }}>{title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-12">
        {sections.map(({ title, anchor, content }) => (
          <section key={anchor} id={anchor}>
            <h2 className="text-2xl font-bold mb-5" style={{ color: 'var(--color-text)' }}>{title}</h2>
            {content}
          </section>
        ))}
      </div>

      <div className="mt-12 p-5 rounded-xl text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Something missing from the docs?</p>
        <Link href="https://github.com/SamoTech/devlens/issues" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}>
          Open a GitHub issue →
        </Link>
      </div>
    </div>
  );
}
