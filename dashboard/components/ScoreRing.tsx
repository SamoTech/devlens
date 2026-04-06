"use client";
import { badgeColor, scoreLabel } from "@/lib/constants";

export default function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = badgeColor(score);
  return (
    <div style={{ position:"relative",width:size,height:size,flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-off)" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition:"stroke-dasharray 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"2px" }}>
        <span style={{ fontFamily:"var(--font-display)",fontSize:size>100?"var(--text-xl)":"var(--text-lg)",fontWeight:800,color,lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:"var(--text-xs)",color:"var(--text-faint)",lineHeight:1 }}>{scoreLabel(score)}</span>
      </div>
    </div>
  );
}
