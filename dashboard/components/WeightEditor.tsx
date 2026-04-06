'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { DIMMETA, DEFAULT_WEIGHTS, DimKey } from '@/lib/constants'

export default function WeightEditor({
  weights,
  onChange,
}: {
  weights: Record<DimKey, number>
  onChange: (w: Record<DimKey, number>) => void
}) {
  const [open, setOpen] = useState(false)

  function update(key: DimKey, value: number) {
    onChange({ ...weights, [key]: value })
  }

  function reset() {
    onChange({ ...DEFAULT_WEIGHTS })
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <div style={{ width: '100%', maxWidth: 460, margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          padding: 'var(--space-1) var(--space-2)',
          borderRadius: 'var(--radius-md)',
          margin: '0 auto',
        }}
        aria-expanded={open}
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        Customize weights
      </button>

      {open && (
        <div
          style={{
            marginTop: 'var(--space-3)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total: {Math.round(total * 100)}%
            </span>
            <button
              type="button"
              onClick={reset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                fontSize: 'var(--text-xs)',
                color: 'var(--primary)',
                padding: 'var(--space-1) var(--space-2)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          {DIMMETA.map(d => (
            <div key={d.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label
                  htmlFor={`weight-${d.key}`}
                  style={{ fontSize: 'var(--text-xs)', fontWeight: 500, display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}
                >
                  {d.emoji} {d.label}
                </label>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-muted)', minWidth: '2.5rem', textAlign: 'right' }}>
                  {Math.round(weights[d.key as DimKey] * 100)}%
                </span>
              </div>
              <input
                id={`weight-${d.key}`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(weights[d.key as DimKey] * 100)}
                onChange={e => update(d.key as DimKey, Number(e.target.value) / 100)}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
