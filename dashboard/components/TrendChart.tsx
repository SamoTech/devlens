"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TrendChart({ data }: { data: { week: string; score: number }[] }) {
  return (
    <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--radius-xl)",padding:"var(--space-6)",boxShadow:"var(--shadow-sm)" }}>
      <h3 style={{ fontFamily:"var(--font-display)",fontSize:"var(--text-base)",fontWeight:700,marginBottom:"var(--space-4)",color:"var(--text)" }}>Health Trend (last 8 weeks)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top:4,right:4,left:-20,bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
          <XAxis dataKey="week" tick={{ fontSize:11,fill:"var(--text-muted)" }} />
          <YAxis domain={[0,100]} tick={{ fontSize:11,fill:"var(--text-muted)" }} />
          <Tooltip contentStyle={{ background:"var(--surface-2)",border:"1px solid var(--border)",borderRadius:"var(--radius-md)",fontSize:"13px",color:"var(--text)" }} />
          <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill:"var(--primary)",r:4 }} activeDot={{ r:6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
