'use client'

interface EarningsTickerProps {
  value: number
  tickKey: number
  isActive?: boolean
}

export default function EarningsTicker({ value, tickKey, isActive = true }: EarningsTickerProps) {
  const formatted = value.toFixed(3)

  return (
    <div className="ticker-hero">
      <div className="scan-line" />
      
      {/* Live Badge Wrapper */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <div className="ticker-live" style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: 'var(--mono)', fontSize: 11, color: isActive ? 'var(--teal)' : 'var(--text3)',
          background: isActive ? 'var(--teal-dim)' : 'var(--bg3)', 
          border: `1px solid ${isActive ? 'var(--border2)' : 'var(--border)'}`, 
          borderRadius: 100, padding: '4px 12px'
        }}>
          <div className="ping-wrap">
            <div className="ping-dot" style={{ background: isActive ? 'var(--teal)' : 'var(--text3)' }} />
            {isActive && <div className="ping-ring" />}
          </div>
          {isActive ? 'LIVE ON ARC TESTNET' : 'SESSION PAUSED'}
        </div>
      </div>

      <div className="ticker-label">Earned this session</div>
      
      {/* 
        Changing key="tick" forces React to unmount and remount this div, 
        which retriggers the pure CSS transform @keyframes ticker 
      */}
      <div style={{ position: 'relative' }}>
        <div key={tickKey} className="ticker-value" style={{ animation: 'ticker 0.3s ease-out both' }}>
          <span style={{ opacity: 0.5, fontSize: '0.8em', verticalAlign: 'top', marginRight: '4px' }}>$</span>
          {formatted}
        </div>
      </div>

      <div className="ticker-rate">
        $0.0003 / second &middot; $0.009 / 30s ping
      </div>
    </div>
  )
}
