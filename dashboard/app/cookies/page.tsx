import type { Metadata } from "next";
export const metadata: Metadata = { title: "Cookie Policy" };
export default function CookiesPage() {
  return (
    <div style={{ maxWidth:"720px",margin:"0 auto",padding:"var(--space-16) var(--space-6)" }}>
      <h1 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-xl)",fontWeight:800,marginBottom:"var(--space-2)" }}>Cookie Policy</h1>
      <p style={{ color:"var(--text-muted)",fontSize:"var(--text-sm)",marginBottom:"var(--space-10)" }}>Last updated: April 2026</p>
      <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-6)",color:"var(--text-muted)",fontSize:"var(--text-sm)",lineHeight:1.8 }}>
        <p>DevLens uses minimal cookies. Here is a complete list of every cookie this site may set:</p>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"var(--text-xs)" }}>
            <thead>
              <tr style={{ borderBottom:"2px solid var(--border)" }}>
                {["Name","Purpose","Duration","Type"].map(h=>(
                  <th key={h} style={{ textAlign:"left",padding:"var(--space-2) var(--space-3)",fontWeight:700,color:"var(--text)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[["authjs.session-token","Stores your GitHub OAuth session","Session","Strictly necessary"],["authjs.csrf-token","Cross-site request forgery protection","Session","Strictly necessary"],["__Secure-authjs.session-token","Secure variant of session token (HTTPS)","Session","Strictly necessary"]].map((row,i)=>(
                <tr key={i} style={{ borderBottom:"1px solid var(--divider)" }}>
                  {row.map((cell,j)=>(
                    <td key={j} style={{ padding:"var(--space-2) var(--space-3)",fontFamily: j===0?"monospace":"inherit" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>We do not use advertising cookies, tracking pixels, or any third-party analytics cookies. You can disable cookies in your browser settings, but doing so will prevent GitHub OAuth sign-in from working.</p>
      </div>
    </div>
  );
}