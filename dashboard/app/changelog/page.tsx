import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'DevLens release history and what\'s new.'
};

const releases = [
  {
    version: 'v0.4.0',
    date: 'April 6, 2026',
    badge: 'latest',
    changes: [
      { type: 'new', text: 'Web dashboard — live score for any public repo' },
      { type: 'new', text: 'Compare two repos side by side at /compare' },
      { type: 'new', text: '8-week health trend chart (Recharts)' },
      { type: 'new', text: '"Add to your repo" copy-paste snippet modal' },
      { type: 'new', text: 'All legal & info pages (about, faq, terms, privacy, cookies, sponsor)' },
      { type: 'new', text: 'Dark / light mode with system preference detection' },
      { type: 'improved', text: 'README score now detects DevLens markers (+4 pts)' },
    ]
  },
  {
    version: 'v0.3.0',
    date: 'March 2026',
    changes: [
      { type: 'new', text: 'CODE_OF_CONDUCT.md, SECURITY.md, docs/index.md added to repo' },
      { type: 'new', text: 'Documentation dimension score improved to 96/100' },
      { type: 'improved', text: 'README scorer — added example, section heading, checklist checks' },
      { type: 'improved', text: 'Overall DevLens health score raised to 97/100' },
    ]
  },
  {
    version: 'v0.2.0',
    date: 'February 2026',
    changes: [
      { type: 'new', text: 'Weekly Discord digest via webhook' },
      { type: 'new', text: 'AI insight line powered by Groq / Llama 3' },
      { type: 'new', text: 'CHANGELOG.md, CONTRIBUTING.md, LICENSE added' },
      { type: 'fixed', text: 'README injection now correctly preserves surrounding content' },
    ]
  },
  {
    version: 'v0.1.0',
    date: 'January 2026',
    changes: [
      { type: 'new', text: '7-dimension health score engine' },
      { type: 'new', text: 'Auto README table injection between <!-- DEVLENS:START/END --> markers' },
      { type: 'new', text: 'shields.io badge auto-generated' },
      { type: 'new', text: 'Initial GitHub Action release' },
    ]
  },
];

const badgeColor: Record<string, string> = {
  new:      'var(--color-primary)',
  improved: 'var(--color-success)',
  fixed:    'var(--color-warning)',
  breaking: 'var(--color-error)',
};

export default function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Changelog</h1>
      <p className="mb-10" style={{ color: 'var(--color-text-muted)' }}>What's new in DevLens.</p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-2 bottom-2 w-px" style={{ background: 'var(--color-border)' }} />

        <div className="space-y-10">
          {releases.map(({ version, date, badge, changes }) => (
            <div key={version} className="relative pl-10">
              {/* Dot */}
              <div className="absolute left-0 top-1.5 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: 'var(--color-primary)', color: '#fff', fontSize: 10, fontWeight: 700 }}>v</div>

              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{version}</h2>
                {badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'var(--color-primary)' }}>{badge}</span>
                )}
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{date}</span>
              </div>

              <ul className="space-y-2">
                {changes.map(({ type, text }, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 px-1.5 py-0.5 rounded text-xs font-bold text-white flex-shrink-0"
                      style={{ background: badgeColor[type] ?? 'var(--color-primary)', fontSize: 9, letterSpacing: '0.05em' }}>
                      {type.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
