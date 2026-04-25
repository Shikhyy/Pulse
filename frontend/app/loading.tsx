'use client'

import { Skeleton } from '../components/Skeleton'

export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      padding: 24,
    }}>
      <Skeleton width={200} height={32} style={{ marginBottom: 32 }} />
      
      <div className="metric-grid" style={{ marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card">
            <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
            <Skeleton width={60} height={28} />
          </div>
        ))}
      </div>

      <div className="card">
        <Skeleton width={200} height={18} style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 16 }}>
              <Skeleton width="30%" height={32} />
              <Skeleton width="20%" height={32} />
              <Skeleton width="20%" height={32} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}