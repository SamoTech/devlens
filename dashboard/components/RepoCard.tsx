"use client";
import type { RepoReport } from "@/lib/scorer";
import { DIM_META } from "@/lib/constants";
import ScoreRing from "./ScoreRing";
import DimBar from "./DimBar";
import { Star, GitFork, ExternalLink, Code2 } from "lucide-react";
import Image from "next/image";

export default function RepoCard({ report, onSnippet }: { report: RepoReport; onSnippet?: () => void; }) {
  return (
    <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius-xl)",padding:"var(--space-6)",boxShadow:"var(--shadow-md)",display:"flex",flexDirection:"column",gap:"var(--space-6)" }}>
      <div style={{ display:"flex",gap:"var(--space-4)",alignItems:"flex-start" }}>
        <Image src={report.avatar} alt={report.owner} width={44} height={44} style={{ borderRadius:"var(--radius-md)",border:"1px solid var(--border)" }} />
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:"var(--space-2)",flexWrap:"wrap" }}>
            <h2 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-lg)",fontWeight:800,color:"var(--text)" }}>{report.repo}</h2>
            <a href={report.url} target="_blank" rel="noopener noreferrer" style={{ color:"var(--text-faint)" }} aria-label="Open on GitHub"><ExternalLink size={14} /></a>
          </div>
          {report.description && <p style={{ fontSize:"var(--text-sm)",color:"var(--text-muted)",marginTop:"var(--space-1)" }}>{report.description}</p>}
          <div style={{ display:"flex",gap:"var(--space-4)",marginTop:"var(--space-2)",flexWrap:"wrap" }}>
            <span style={{ display:"flex",gap:"var(--space-1)",alignItems:"center",fontSize:"var(--text-xs)",color:"var(--text-muted)" }}><Star size={12}/>{report.stars.toLocaleString()}</span>
            <span style={{ display:"flex",gap:"var(--space-1)",alignItems:"center",fontSize:"var(--text-xs)",color:"var(--text-muted)" }}><GitFork size={12}/>{report.forks.toLocaleString()}</span>
            {report.language && <span style={{ display:"flex",gap:"var(--space-1)",alignItems:"center",fontSize:"var(--text-xs)",color:"var(--text-muted)" }}><Code2 size={12}/>{report.language}</span>}
          </div>
        </div>
        <ScoreRing score={report.health_score} size={96} />
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-4)" }}>
        {DIM_META.map(d => <DimBar key={d.key} emoji={d.emoji} label={d.label} weight={d.weight} score={report.scores[d.key as keyof typeof report.scores]} />)}
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"var(--space-4)",borderTop:"1px solid var(--divider)",flexWrap:"wrap",gap:"var(--space-2)" }}>
        <span style={{ fontSize:"var(--text-xs)",color:"var(--text-faint)" }}>Analyzed {new Date(report.generated_at).toLocaleString()}</span>
        {onSnippet && <button onClick={onSnippet} style={{ fontSize:"var(--text-xs)",fontWeight:600,color:"var(--primary)",padding:"var(--space-1) var(--space-3)",border:"1px solid var(--primary-hl)",borderRadius:"var(--radius-md)",background:"var(--primary-hl)" }}>Add to your repo →</button>}
      </div>
    </div>
  );
}
