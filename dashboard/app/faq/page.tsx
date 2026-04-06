import type { Metadata } from "next";
export const metadata: Metadata = { title: "FAQ" };
const faqs = [
  ["Is DevLens free?","Yes, completely free. There are no paid tiers, no rate limits on your end, and no account required to analyze public repositories."],
  ["Does DevLens store any data?","No. Every score is computed live from the GitHub API on each page load. Nothing is persisted in a database."],
  ["Why is my score lower than I expected?","The score reflects objective signals from your repo metadata. Common culprits: fewer than 30 commits in 90 days (activity), missing docs files like CONTRIBUTING.md or SECURITY.md, or a README under 1500 characters."],
  ["Can I analyze private repos?","Not without GitHub OAuth. Sign in with GitHub to analyze your own private repos using your access token."],
  ["How often does the score update?","On every page load. Results are cached for 5 minutes (Next.js revalidation) to stay within GitHub API rate limits."],
  ["How do I add the DevLens badge to my repo?","Analyze your repo, then click \"Add to your repo →\" on the result card. Copy the README marker and the GitHub Actions workflow — DevLens will auto-inject the live 7-row health table on every push."],
  ["What is the GitHub API rate limit?","Unauthenticated: 60 requests/hour. If you sign in with GitHub OAuth (or set GITHUB_TOKEN in your self-hosted instance), you get 5,000 requests/hour."],
  ["Is the source code available?","Yes. DevLens is fully open source at github.com/SamoTech/devlens under the MIT license."],
];
export default function FAQPage() {
  return (
    <div style={{ maxWidth:"720px",margin:"0 auto",padding:"var(--space-16) var(--space-6)" }}>
      <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-xl)",fontWeight:800,marginBottom:"var(--space-2)" }}>Frequently Asked Questions</h1>
      <p style={{ color:"var(--text-muted)",marginBottom:"var(--space-10)" }}>Everything you need to know about DevLens.</p>
      <div style={{ display:"flex",flexDirection:"column",gap:"0" }}>
        {faqs.map(([q,a],i)=>(
          <div key={i} style={{ padding:"var(--space-6) 0",borderBottom:"1px solid var(--divider)" }}>
            <h2 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-base)",fontWeight:700,marginBottom:"var(--space-2)" }}>{q}</h2>
            <p style={{ color:"var(--text-muted)",fontSize:"var(--text-sm)",lineHeight:1.8 }}>{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}