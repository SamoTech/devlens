import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'DevLens Cookie Policy — we use no tracking cookies.'
};

export default function CookiesPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Cookie Policy</h1>
      <p className="text-sm mb-10" style={{ color: 'var(--color-text-muted)' }}>Last updated: April 6, 2026</p>

      <div className="p-4 rounded-xl mb-8 flex items-start gap-3"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <span className="text-2xl">🍪</span>
        <div>
          <p className="font-semibold mb-1" style={{ color: 'var(--color-text)' }}>Short version: we use no tracking cookies.</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>DevLens does not use cookies for advertising, analytics, or user tracking of any kind.</p>
        </div>
      </div>

      {[
        {
          title: 'Strictly necessary cookies',
          body: 'DevLens does not set any strictly necessary cookies. There is no login, no session management, and no persistent state on the server side.'
        },
        {
          title: 'Analytics cookies',
          body: 'We do not use Google Analytics, Facebook Pixel, or any other third-party analytics cookies. Vercel may collect aggregate, cookieless analytics (page views) — this does not involve cookies or personal data.'
        },
        {
          title: 'Preference storage',
          body: 'Your dark/light mode preference is stored in a JavaScript variable in memory only. It is not saved to a cookie or localStorage. It resets when you close the tab.'
        },
        {
          title: 'Third-party cookies',
          body: 'DevLens embeds no third-party widgets, social media buttons, or ad networks that would set cookies in your browser.'
        },
        {
          title: 'Your rights',
          body: 'Since we use no cookies, there is nothing to opt out of. If you have concerns, you can use your browser\'s developer tools to verify that no cookies are set by devlens-io.vercel.app.'
        },
        {
          title: 'Changes',
          body: 'If we ever introduce cookies in the future, this policy will be updated at least 30 days in advance and you will be notified via a banner on the site.'
        },
        {
          title: 'Contact',
          body: 'Cookie questions? Email samo.hossam@gmail.com.'
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
