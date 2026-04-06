'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function TrendChart({ repo }: { repo: string }) {
  const [data, setData] = useState<{ week: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/history?repo=${encodeURIComponent(repo)}`)
      .then(r => r.json())
      .then(d => { setData(d.history || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [repo]);

  if (loading) return <div className="skeleton h-32 w-full" />;
  if (!data.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Health Trend (last 8 weeks)
      </p>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: 'var(--color-text-muted)' }}
            itemStyle={{ color: 'var(--color-primary)' }}
          />
          <ReferenceLine y={80} stroke="var(--color-border)" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2}
            dot={{ r: 3, fill: 'var(--color-primary)' }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
