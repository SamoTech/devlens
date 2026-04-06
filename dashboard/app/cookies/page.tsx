import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "Cookie Policy | DevLens" };

export default function CookiesPage() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "var(--space-16) var(--space-6)" }}>
      <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", marginBottom: "var(--space-4)" }}>
        <Link href="/" style={{ color: "var(--primary)", textDecoration: "none" }}>← Home</Link>
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 800, marginBottom: "var(--space-2)" }}>Cookie Policy</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-10)" }}>Last updated: April 2026</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)", color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.8 }}>
        <p>
          DevLens uses minimal cookies. Here is a complete list of every cookie this site may set.
          We do not use advertising, tracking, or analytics cookies of any kind.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {["Name", "Purpose", "Duration", "Type"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "var(--space-2) var(--space-3)", fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["authjs.session-token", "Stores your encrypted GitHub OAuth session to maintain sign-in state", "Session (browser close)", "Strictly necessary"],
                ["authjs.csrf-token", "Cross-site request forgery protection for auth flows", "Session (browser close)", "Strictly necessary"],
                ["__Secure-authjs.session-token", "Secure (HTTPS-only) variant of the session token", "Session (browser close)", "Strictly necessary"],
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--divider)", background: i % 2 === 0 ? "transparent" : "var(--surface)" }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "var(--space-2) var(--space-3)", fontFamily: j === 0 ? "monospace" : "inherit", color: j === 3 ? "var(--primary)" : "inherit" }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)", marginBottom: "var(--space-2)" }}>What we do NOT use</h2>
          <ul style={{ paddingLeft: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            {[
              "No Google Analytics or similar analytics cookies",
              "No advertising or retargeting cookies",
              "No third-party tracking pixels",
              "No persistent user preference cookies",
            ].map(item => (
              <li key={item} style={{ listStyleType: "disc" }}>{item}</li>
            ))}
          </ul>
        </div>
        <p>
          You can disable cookies in your browser settings. Doing so will prevent GitHub OAuth sign-in
          from working, but all analysis features remain available without signing in.
        </p>
      </div>
    </div>
  );
}
