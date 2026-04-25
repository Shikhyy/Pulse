'use client'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--color-bg) 25%, var(--color-bg2) 50%, var(--color-bg) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <Skeleton width={120} height={14} style={{ marginBottom: 12 }} />
      <Skeleton width="60%" height={32} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={14} />
    </div>
  )
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12 }}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <div style={{ flex: 1 }}>
            <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
            <Skeleton width="30%" height={12} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: '12px 16px', background: 'var(--color-bg3)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width="100%" height={12} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowI) => (
        <div key={rowI} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          {Array.from({ length: cols }).map((_, colI) => (
            <Skeleton key={colI} width="100%" height={14} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonInput() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Skeleton width={80} height={12} />
      <Skeleton width="100%" height={42} borderRadius={8} />
    </div>
  )
}

export function SkeletonButton() {
  return <Skeleton width={120} height={42} borderRadius={8} />
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={14} />
      ))}
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-neutral)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          margin: '0 auto 16px',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>Loading...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

export function InlineLoader({ size = 16 }: { size?: number }) {
  return (
    <>
      <div style={{
        width: size,
        height: size,
        border: '2px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        display: 'inline-block',
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}