import { analyzeRepo } from "@/lib/scorer";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import ScoreRing from "@/components/ScoreRing";
import DimBar from "@/components/DimBar";
import type { Metadata } from "next";

type Props = { params: Promise<{ owner: string; name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { owner, name } = await params;
  return {
    title: `${owner}/${name} — DevLens Health`,
    description: `DevLens repo health score for ${owner}/${name}`,
    openGraph: {
      title: `${owner}/${name} — DevLens Health`,
      description: `See the full health score breakdown for ${owner}/${name}`,
      url: `https://devlens-io.vercel.app/repo/${owner}/${name}`,
    },
  };
}

export default async function RepoPage({ params }: Props) {
  const { owner, name } = await params;
  let report: any;
  try {
    const session = await auth();
    const token = (session as any)?.accessToken ?? process.env.GITHUB_TOKEN;
    report = await analyzeRepo(owner, name, token);
  } catch {
    notFound();
  }

  const score: number = report.health_score ?? 0;
  const color = score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--danger)";
  const badgeUrl = `https://devlens-io.vercel.app/api/badge/${owner}/${name}`;
  const permalink = `https://devlens-io.vercel.app/repo/${owner}/${name}`;

  const dims: { label: string; emoji: string; key: string; weight: string }[] = [
    { label: "README Quality",   emoji: "📝", key: "readme",    weight: "20%" },
    { label: "Commit Activity",  emoji: "🔥", key: "commits",   weight: "20%" },
    { label: "Repo Freshness",   emoji: "🌿", key: "freshness", weight: "15%" },
    { label: "Documentation",    emoji: "📚", key: "docs",      weight: "15%" },
    { label: "CI/CD Setup",      emoji: "⚙️",  key: "cicd",      weight: "15%" },
    { label: "Issue Response",   emoji: "🎯", key: "issues",    weight: "10%" },
    { label: "Community Signal", emoji: "⭐",  key: "community", weight: "5%"  },
  ];

  return (
    <main style={{ maxWidth: "720px", margin: "0 auto", padding: "var(--space-10) var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Repo Health Report</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800 }}>
          <a href={`https://github.com/${owner}/${name}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text)", textDecoration: "none" }}>
            {owner}/{name}
          </a>
        </h1>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>Last analysed: {new Date().toISOString().slice(0, 10)}</p>
      </div>

      {/* Score ring */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-8)", flexWrap: "wrap" }}>
        <ScoreRing score={score} />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <p style={{ fontSize: "var(--text-3xl)", fontWeight: 900, color }}>{score}<span style={{ fontSize: "var(--text-lg)", color: "var(--text-muted)", fontWeight: 400 }}>/100</span></p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Work"}</p>
          {report.ai_insight && <p style={{ fontSize: "var(--text-xs)", color: "var(--text-faint)", fontStyle: "italic", maxWidth: "320px" }}>💡 {report.ai_insight}</p>}
        </div>
      </div>

      {/* Dimensions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {dims.map(({ label, emoji, key, weight }) => (
          <DimBar key={key} label={label} emoji={emoji} score={report.dimensions?.[key] ?? 0} weight={weight} />
        ))}
      </div>

      {/* Badge + share */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", background: "var(--surface-off)", borderRadius: "var(--radius-lg)", padding: "var(--space-5)" }}>
        <p style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>🔗 Share this report</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Permalink</p>
          <code style={{ fontSize: "var(--text-xs)", background: "var(--surface)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", wordBreak: "break-all" }}>{permalink}</code>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <p style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Badge (paste in README)</p>
          <code style={{ fontSize: "var(--text-xs)", background: "var(--surface)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", wordBreak: "break-all" }}>{`[![DevLens](${badgeUrl})](${permalink})`}</code>
        </div>
      </div>
    </main>
  );
}
