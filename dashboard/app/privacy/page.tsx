import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'DevLens Privacy Policy — we store nothing.'
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Privacy Policy</h1>
      <p className="text-sm mb-10" style={{ color: 'var(--color-text-muted)' }}>Last updated: April 6, 2026</p>

      <div className="p-4 rounded-xl mb-8 flex items-start gap-3"
        style={{ background: 'var(--color-primary)', color: '#fff', opacity: 0.92 }}>
        <span className="text-xl">🔒</span>
        <p className="text-sm font-medium">DevLens stores no personal data. Period. No accounts, no cookies, no tracking.</p>
      </div>

      {[
        {
          title: 'What we collect',
          body: 'Nothing. The web dashboard queries the GitHub API directly from Vercel Edge functions and returns the result to your browser. We do not log, store, or process any personal information.'
        },
        {
          title: 'GitHub API data',
          body: 'When you paste a repo URL, we fetch publicly available data from the GitHub REST API (commit counts, file listings, issue counts, workflow files). This data belongs to GitHub and the repo owners. We do not cache or store this data beyond the HTTP response lifetime.'
        },
        {
          title: 'Vercel Analytics',
          body: 'The dashboard may use Vercel\'s built-in analytics for aggregate page view counts. These analytics are cookieless, privacy-preserving, and do not track individuals. No personal data is collected.'
        },
        {
          title: 'Cookies',
          body: 'We use no tracking cookies. The only browser storage used is a theme preference (light/dark mode) stored in memory — not in localStorage or cookies. It resets on every page load. See our Cookies Policy for details.'
        },
        {
          title: 'GitHub Action',
          body: 'The DevLens GitHub Action runs entirely inside your own GitHub Actions runner. It writes only to your README.md. It does not send any data to external servers. If you provide a GROQ_API_KEY, that key is used to call the Groq API directly — your repo data is sent to Groq for AI processing. Review Groq\'s privacy policy at groq.com.'
        },
        {
          title: 'Third-party links',
          body: 'DevLens links to GitHub, Vercel, and Groq. Those services have their own privacy policies which we encourage you to review.'
        },
        {
          title: 'Contact',
          body: 'Privacy questions? Email samo.hossam@gmail.com.'
        },
      ].map(({ title, body }) => (
        <section key={title} className="mb-6">
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>{title}</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{body}</p>
        </section>
      ))}
    </div>
  );
}
