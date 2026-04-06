'use client'
import { useState } from 'react'
import { DIMMETA, DEFAULT_WEIGHTS, DimKey } from '@/lib/constants'
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  weights: Record<DimKey, number>
  onChange: (w: Record<DimKey, number>) => void
}

export default function WeightEditor({ weights, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const total = Math.round(Object.values(weights).reduce((a, b) => a + b * 100, 0))
  const valid = total === 100

  function update(key: DimKey, pct: number) {
    const newW = { ...weights, [key]: pct / 100 }
    onChange(newW)
  }

  function reset() {
    onChange({ ...DEFAULT_WEIGHTS })
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-5)', background: 'none', textAlign: 'left' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-muted)' }}>
          <SlidersHorizontal size={15} /> Customize scoring weights
          {!valid && <span style={{ color: 'var(--error)', fontSize: 'var(--text-xs)' }}>⚠ Must sum to 100% (currently {total}%)</span>}
        </span>
        {open ? <ChevronUp size={16} color="var(--text-faint)" /> : <ChevronDown size={16} color="var(--text-faint)" />}
      </button>

      {open && (
        <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-5)', borderTop: '1px solid var(--divider)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {DIMMETA.map(d => {
            const pct = Math.round(weights[d.key as DimKey] * 100)
            return (
              <div key={d.key} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 40px', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', display: 'flex', gap: 'var(--space-1)' }}>{d.emoji} {d.label}</span>
                <input
                  type="range" min={0} max={60} value={pct}
                  onChange={e => update(d.key as DimKey, Number(e.target.value))}
                  style={{ accentColor: 'var(--primary)', width: '100%' }}
                />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, textAlign: 'right', color: 'var(--primary)' }}>{pct}%</span>
              </div>
            )
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--divider)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: valid ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
              Total: {total}% {valid ? '✓' : '— must equal 100%'}
            </span>
            <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-1) var(--space-3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'var(--surface-off)' }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
