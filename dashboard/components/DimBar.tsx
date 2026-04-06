import type { DimensionScore } from '@/lib/types';

function scoreColor(s: number) {
  if (s >= 80) return 'var(--color-success)';
  if (s >= 50) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export default function DimBar({ dim }: { dim: DimensionScore }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--color-text)' }}>
          <span>{dim.emoji}</span>
          <span className="font-medium">{dim.label}</span>
          <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>{dim.weight}%</span>
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(dim.score) }}>{dim.score}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${dim.score}%`, background: scoreColor(dim.score) }}
        />
      </div>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{dim.detail}</p>
    </div>
  );
}
