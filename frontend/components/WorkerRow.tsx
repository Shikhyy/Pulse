'use client'
import type { Worker } from '@/lib/store'

interface WorkerRowProps {
  worker: Worker
  onPause: (id: string) => void
  onResume: (id: string) => void
  loading?: boolean
}

function formatDuration(seconds: number): string {
  if (seconds === 0) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function WorkerRow({ worker: w, onPause, onResume, loading }: WorkerRowProps) {
  const isActive = w.isActive && !w.isPaused

  return (
    <div className="table-row">
      {/* Avatar Circle */}
      <div style={{
        width: 32, height: 32, borderRadius: 16, flexShrink: 0,
        background: 'var(--teal-dim)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16
      }}>
        {/* Placeholder Emoji/Avatar if none provided */}
        {w.name.charAt(0)}
      </div>

      {/* Name + Status text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontFamily: 'var(--sans)', color: 'var(--text)', marginBottom: 2 }}>
          {w.name}
        </div>
        <div style={{ fontSize: 12, fontFamily: 'var(--sans)', color: 'var(--text3)' }}>
          {w.isPaused ? 'Paused' : w.isActive ? `Working · ${formatDuration(w.sessionDurationSeconds)}` : 'Offline'}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ width: 80, display: 'flex', justifyContent: 'center' }}>
        {w.isActive && !w.isPaused && <span className="badge badge-active">Live</span>}
        {w.isPaused && <span className="badge badge-paused">Paused</span>}
        {!w.isActive && !w.isPaused && <span className="badge badge-idle">Offline</span>}
      </div>

      {/* Earned amount */}
      <div style={{ width: 100, textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)' }}>
          ${w.earnedToday.toFixed(2)}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>
          today
        </div>
      </div>

      {/* Action Button */}
      <div style={{ width: 90, textAlign: 'right' }}>
        {w.isPaused ? (
          <button
            className="btn-ghost"
            style={{ padding: '6px 14px', fontSize: 12 }}
            onClick={() => onResume(w.id)}
            disabled={loading}
          >
            Resume
          </button>
        ) : (
          <button
            className="btn-ghost"
            style={{ 
              padding: '6px 14px', fontSize: 12, 
              borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--red)'
            }}
            onClick={() => onPause(w.id)}
            disabled={!w.isActive || loading}
          >
            Pause
          </button>
        )}
      </div>
    </div>
  )
}
