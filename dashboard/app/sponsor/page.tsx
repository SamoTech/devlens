import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sponsor DevLens',
  description: 'Support DevLens development — free forever, powered by your sponsorship.'
};

const tiers = [
  {
    name: 'Coffee ☕',
    price: '$5/mo',
    color: 'var(--color-warning)',
    perks: ['Sponsor badge in README', 'My eternal gratitude', 'Keep the lights on']
  },
  {
    name: 'Supporter 💛',
    price: '$15/mo',
    color: 'var(--color-gold, #d19900)',
    perks: ['Everything in Coffee', 'Name in CHANGELOG', 'Priority issue responses', 'Early access to new features']
  },
  {
    name: 'Champion 🏆',
    price: '$50/mo',
    color: 'var(--color-primary)',
    highlight: true,
    perks: ['Everything in Supporter', 'Logo in README + dashboard footer', 'Direct Discord channel', 'Feature request priority']
  },
];

export default function SponsorPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">💛</div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Sponsor DevLens</h1>
        <p className="text-lg" style={{ color: 'var(--color-text-muted)', maxWidth: 480, margin: '0 auto' }}>
          DevLens is free forever. Sponsorships keep it maintained, improved, and running.
        </p>
      </div>

      {/* Why sponsor */}
      <div className="p-5 rounded-xl mb-10" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="font-bold mb-3" style={{ color: 'var(--color-text)' }}>Why sponsor?</h2>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {[
            '🔭 DevLens saves teams hundreds of dollars vs. Code Climate & LinearB',
            '⚡ Every feature is built in free time — sponsorships fund dedicated dev time',
            '🌍 Used by developers worldwide on thousands of repos',
            '♾️ Your sponsorship keeps it free for everyone, forever',
          ].map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </div>

      {/* Tiers */}
      <div className="grid gap-4 mb-10">
        {tiers.map(({ name, price, color, highlight, perks }) => (
          <div key={name}
            className="rounded-xl p-5"
            style={{
              background: highlight ? color : 'var(--color-surface)',
              border: `1.5px solid ${highlight ? color : 'var(--color-border)'}`,
              color: highlight ? '#fff' : 'var(--color-text)'
            }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-lg">{name}</span>
              <span className="font-bold">{price}</span>
            </div>
            <ul className="space-y-1">
              {perks.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span style={{ color: highlight ? 'rgba(255,255,255,0.7)' : 'var(--color-primary)' }}>✓</span>
                  <span style={{ opacity: highlight ? 0.9 : 1 }}>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-center">
        <a href="https://github.com/sponsors/SamoTech" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white text-lg"
          style={{ background: 'var(--color-primary)' }}>
          💛 Sponsor on GitHub
        </a>
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Processed securely by GitHub Sponsors. Cancel any time.
        </p>
      </div>
    </div>
  );
}
