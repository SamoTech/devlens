"use client";
import { badgeColor } from "@/lib/constants";

export default function DimBar({ label, emoji, score, weight }: { label:string;emoji:string;score:number;weight:string; }) {
  const color = badgeColor(score);
  return (
    <div style={{ display:"flex",flexDirection:"column",gap:"var(--space-2)" }}>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <span style={{ fontSize:"var(--text-sm)",fontWeight:500,display:"flex",gap:"var(--space-2)",alignItems:"center" }}>
          <span>{emoji}</span><span>{label}</span>
        </span>
        <div style={{ display:"flex",gap:"var(--space-3)",alignItems:"center" }}>
          <span style={{ fontSize:"var(--text-xs)",color:"var(--text-faint)" }}>{weight}</span>
          <span style={{ fontWeight:700,fontSize:"var(--text-sm)",color,minWidth:"2.5rem",textAlign:"right" }}>{score}</span>
        </div>
      </div>
      <div style={{ height:"6px",borderRadius:"var(--radius-full)",background:"var(--surface-off)",overflow:"hidden" }}>
        <div style={{ height:"100%",borderRadius:"var(--radius-full)",background:color,width:`${score}%`,transition:"width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
    </div>
  );
}
