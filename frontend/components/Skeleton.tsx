'use client'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: number
  style?: React.CSSProperties
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 6,
  style = {},
}: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        background: 'var(--bg2)',
        ...style,
      }}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="card">
      <Skeleton width={120} height={16} style={{ marginBottom: 12 }} />
      <Skeleton width={80} height={32} style={{ marginBottom: 8 }} />
      <Skeleton width={160} height={12} />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <Skeleton width="30%" height={16} />
        <Skeleton width="20%" height={16} />
        <Skeleton width="20%" height={16} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16 }}>
          <Skeleton width="30%" height={40} />
          <Skeleton width="20%" height={40} />
          <Skeleton width="20%" height={40} />
        </div>
      ))}
    </div>
  )
}

export function FormSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <Skeleton width={80} height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="100%" height={44} />
      </div>
      <div>
        <Skeleton width={80} height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="100%" height={44} />
      </div>
      <Skeleton width={200} height={44} />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ flex: 1 }}>
            <Skeleton width={80} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width={60} height={32} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 100 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton
            key={i}
            width={40}
            height={40 + Math.random() * 50}
          />
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div>
      <div className="metric-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <ChartSkeleton />
    </div>
  )
}

export function PaymentFeedSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card">
      <Skeleton width={160} height={18} style={{ marginBottom: 16 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 0',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Skeleton width={60} height={12} />
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={12} />
        </div>
      ))}
    </div>
  )
}

export function WorkerListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            borderBottom: '1px solid var(--border)',
          }}
        >
          <Skeleton width={40} height={40} borderRadius={20} />
          <div style={{ flex: 1 }}>
            <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
            <Skeleton width={200} height={12} />
          </div>
          <Skeleton width={80} height={32} borderRadius={16} />
        </div>
      ))}
    </div>
  )
}