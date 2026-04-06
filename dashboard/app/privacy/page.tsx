import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy Policy" };
export default function PrivacyPage() {
  return (
    <div style={{ maxWidth:"720px",margin:"0 auto",padding:"var(--space-16) var(--space-6)" }}>
      <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-xl)",fontWeight:800,marginBottom:"var(--space-2)" }}>Privacy Policy</h1>
      <p style={{ color:"var(--text-muted)",fontSize:"var(--text-sm)",marginBottom:"var(--space-10)" }}>Last updated: April 2026</p>
      <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-6)",color:"var(--text-muted)",fontSize:"var(--text-sm)",lineHeight:1.8 }}>
        {[["Data We Collect","DevLens does not collect, store, or sell any personal data. When you analyze a repository, the repo slug is sent to our API which forwards it to the GitHub public API. No results are stored."],["GitHub OAuth","If you choose to sign in with GitHub, your GitHub OAuth token is stored in an encrypted server-side session cookie for the duration of your browser session only. It is never written to a database."],["Cookies","We use a single session cookie for GitHub OAuth only. No tracking cookies, analytics cookies, or advertising cookies are used. See our Cookies page for details."],["Third-Party Services","We use Vercel for hosting. Vercel may collect standard server access logs (IP address, request path, user agent) as per their privacy policy."],["Contact","For any privacy-related questions, please open an issue at github.com/SamoTech/devlens."]].map(([title,body])=>(
          <div key={title}>
            <h2 style={{ fontFamily:"var(--font-display)",fontWeight:700,color:"var(--text)",marginBottom:"var(--space-2)" }}>{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}