import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about DevLens — the free GitHub repo health scorer built by SamoTech.'
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>About DevLens</h1>
      <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>The free GitHub repo health scoring tool built by SamoTech.</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>What is DevLens?</h2>
        <p className="leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          DevLens is a free, open-source GitHub Action and web dashboard that scores any public repository
          across 7 health dimensions — README quality, commit activity, repo freshness, documentation,
          CI/CD setup, issue response rate, and community signal.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Why we built it</h2>
        <p className="leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Tools like Code Climate charge $37/dev/month. LinearB charges $49/dev. DevLens does the
          same job — and always will — for $0. No paywalls, no seat limits, no vendor lock-in.
          It runs entirely inside GitHub Actions using your own <code>GITHUB_TOKEN</code>.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>How it works</h2>
        <ol className="space-y-2" style={{ color: 'var(--color-text-muted)' }}>
          {[
            'You add two comment markers to your README and a workflow file.',
            'On every push (or Monday morning), the action runs against the GitHub API.',
            'It calculates a weighted score across 7 dimensions.',
            'It injects a live health table between the markers in your README.',
            'Optionally it sends a Discord digest and an AI-powered insight via Groq.',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--color-primary)' }}>{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Built by</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          <a href="https://github.com/SamoTech" target="_blank" rel="noopener noreferrer"
            className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>Ossama Hashim (SamoTech)</a>
          {' '}— full-stack developer and open-source builder based in Cairo, Egypt.
        </p>
      </section>

      <section className="p-5 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>Open Source</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>DevLens is fully open source under the MIT license. PRs welcome.</p>
        <a href="https://github.com/SamoTech/devlens" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}>
          View on GitHub →
        </a>
      </section>
    </div>
  );
}
