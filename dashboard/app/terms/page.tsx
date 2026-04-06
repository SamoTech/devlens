import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'DevLens Terms of Service.'
};

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Terms of Service</h1>
      <p className="text-sm mb-10" style={{ color: 'var(--color-text-muted)' }}>Last updated: April 6, 2026</p>

      {[
        {
          title: '1. Acceptance',
          body: 'By accessing devlens-io.vercel.app or using the DevLens GitHub Action, you agree to these Terms. If you do not agree, do not use the service.'
        },
        {
          title: '2. Description of Service',
          body: 'DevLens provides a free GitHub repository health scoring tool — a web dashboard and a GitHub Action. The service reads publicly available GitHub API data and performs calculations to produce a health score. No data is stored server-side.'
        },
        {
          title: '3. Free Forever',
          body: 'The core service is provided free of charge with no usage limits. We reserve the right to add optional paid features in the future, but the core health scoring functionality will always remain free.'
        },
        {
          title: '4. Use of the GitHub API',
          body: 'The web dashboard uses the GitHub REST API directly from Vercel Edge functions. You are subject to GitHub\'s own Terms of Service and API rate limits. Unauthenticated requests are limited to 60/hour per IP. Providing a GITHUB_TOKEN raises this to 5,000/hour.'
        },
        {
          title: '5. Acceptable Use',
          body: 'You agree not to: (a) use DevLens to scrape or harvest data at scale, (b) attempt to bypass rate limits, (c) use the service for any unlawful purpose, (d) reverse engineer the scoring algorithm for commercial competition.'
        },
        {
          title: '6. No Warranty',
          body: 'DevLens is provided "as is" without warranty of any kind. Health scores are indicative only — they do not represent the full quality or security of a repository. We are not responsible for decisions made based on DevLens scores.'
        },
        {
          title: '7. Limitation of Liability',
          body: 'To the maximum extent permitted by law, SamoTech shall not be liable for any indirect, incidental, or consequential damages arising from your use of DevLens.'
        },
        {
          title: '8. Changes to Terms',
          body: 'We may update these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms.'
        },
        {
          title: '9. Contact',
          body: 'Questions? Email samo.hossam@gmail.com or open an issue at github.com/SamoTech/devlens.'
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
