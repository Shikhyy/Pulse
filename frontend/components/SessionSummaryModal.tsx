'use client'

interface SessionSummaryModalProps {
  totalEarned: number
  durationSeconds: number
  pingCount: number
  idleCount: number
  onClose: () => void
  onStartNew: () => void
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export default function SessionSummaryModal({
  totalEarned, durationSeconds, pingCount, idleCount, onClose, onStartNew
}: SessionSummaryModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(44,44,42,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>🎉</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Session complete
          </h2>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <Stat label="Earned" value={`$${totalEarned.toFixed(3)}`} highlight />
          <Stat label="Duration" value={formatDuration(durationSeconds)} />
          <Stat label="Payments" value={`${pingCount}`} />
          <Stat label="Idle" value={`${idleCount} pings`} />
        </div>

        {/* USDC note */}
        <div style={{
          background: 'rgba(29,158,117,0.06)',
          border: '1px solid rgba(29,158,117,0.15)',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 13, color: 'var(--color-primary)',
          textAlign: 'center', marginBottom: 20,
        }}>
          USDC is already in your wallet. No invoice needed.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} id="modal-close-btn">
            Done
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onStartNew} id="modal-start-new-btn">
            New session
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ background: 'var(--color-neutral)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: highlight ? 'var(--color-primary)' : 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}
