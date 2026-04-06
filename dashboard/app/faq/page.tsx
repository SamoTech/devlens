import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about DevLens repo health scoring.'
};

const faqs = [
  {
    q: 'Is DevLens really free?',
    a: 'Yes — completely free, forever. No credit card, no trial, no Pro tier. DevLens runs inside your own GitHub Actions using your GITHUB_TOKEN.'
  },
  {
    q: 'Does it work on private repos?',
    a: 'Yes. Since the action runs inside your own repo with your GITHUB_TOKEN, it has access to private repos. The web dashboard at devlens-io.vercel.app only works with public repos (it uses the unauthenticated GitHub API).'
  },
  {
    q: 'What is the GROQ_API_KEY for?',
    a: 'It\'s optional. If you provide a free Groq API key, DevLens adds a one-line AI insight below the health table — e.g. "Your README has no code examples. Adding one could raise your score by 10 points." Get a free key at console.groq.com.'
  },
  {
    q: 'How is the score calculated?',
    a: 'Seven dimensions are scored 0–100 and combined with fixed weights: README Quality (20%), Commit Activity (20%), Repo Freshness (15%), Documentation (15%), CI/CD Setup (15%), Issue Response (10%), Community Signal (5%).'
  },
  {
    q: 'Can I customize the weights?',
    a: 'Not yet — custom weights are on the roadmap. For now the weights are fixed and the same for all repos.'
  },
  {
    q: 'Why is my Community Signal score 0?',
    a: 'Community Signal is based on stars. A brand-new repo with 0 stars will score 0. It\'s weighted at only 5% so it has minimal impact on your overall score.'
  },
  {
    q: 'The health table in my README isn\'t updating. Why?',
    a: 'Check that: (1) your workflow has `permissions: contents: write`, (2) the markers <!-- DEVLENS:START --> and <!-- DEVLENS:END --> exist in your README.md, (3) the workflow ran successfully in the Actions tab.'
  },
  {
    q: 'Does DevLens store any of my data?',
    a: 'No. The web dashboard queries the GitHub API live on every request and stores nothing. The GitHub Action runs entirely in your own runner and writes only to your README. See our Privacy Policy for details.'
  },
  {
    q: 'How do I get a higher score?',
    a: 'The most impactful improvements: (1) improve your README — add sections, code examples, and badges, (2) commit regularly — at least a few times a week, (3) add CONTRIBUTING.md, LICENSE, and CHANGELOG.md, (4) close open issues promptly.'
  },
  {
    q: 'Can I use devlens@main or should I pin a version?',
    a: 'For stability, pin to a release tag like `SamoTech/devlens@v1`. Using `@main` will always get the latest changes but may include breaking updates between major versions.'
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>FAQ</h1>
      <p className="mb-10" style={{ color: 'var(--color-text-muted)' }}>Everything you need to know about DevLens.</p>

      <div className="space-y-1">
        {faqs.map(({ q, a }, i) => (
          <details key={i} className="group rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
            <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer font-medium list-none select-none"
              style={{ color: 'var(--color-text)' }}>
              <span>{q}</span>
              <span className="text-lg flex-shrink-0 transition-transform group-open:rotate-45"
                style={{ color: 'var(--color-primary)' }}>+</span>
            </summary>
            <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{a}</div>
          </details>
        ))}
      </div>

      <div className="mt-10 p-5 rounded-xl text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Still have a question?</p>
        <a href="https://github.com/SamoTech/devlens/issues" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}>
          Open an issue on GitHub →
        </a>
      </div>
    </div>
  );
}
