'use client'
import type { Payment } from '@/lib/store'

interface PaymentFeedProps {
  payments: Payment[]
  showWorkerName?: boolean
  maxRows?: number
}

export default function PaymentFeed({
  payments,
  showWorkerName = false,
  maxRows = 20,
}: PaymentFeedProps) {
  const visible = payments.slice(0, maxRows)

  if (visible.length === 0) {
    return (
      <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
        Waiting for first payment…
      </div>
    )
  }

  return (
    <div className="feed-container" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {visible.map((p, i) => (
        <PaymentRow 
          key={`${p.time}-${i}-${p.txnId}`} 
          payment={p} 
          showWorkerName={showWorkerName} 
          index={i} 
        />
      ))}
    </div>
  )
}

function PaymentRow({
  payment: p,
  showWorkerName,
  index,
}: {
  payment: Payment
  showWorkerName: boolean
  index: number
}) {
  const isIdle = p.status === 'idle'
  const amountFixed = p.amount ? p.amount.toFixed(3) : '0.000'
  const timeStr = typeof p.time === 'string' ? p.time : new Date(p.time).toLocaleTimeString()

  return (
    <div
      className="table-row"
      style={{
        animation: 'slide-right 0.3s ease both',
        animationDelay: `${index * 0.03}s`,
        opacity: isIdle ? 0.5 : 1,
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: isIdle ? 'var(--text3)' : 'var(--teal)', flexShrink: 0 }} />
      
      <div style={{ minWidth: 80, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
        {timeStr}
      </div>

      {showWorkerName ? (
        <div style={{ flex: 1, color: 'var(--text2)', fontSize: 13 }}>
          {p.workerName ?? p.workerId?.slice(0, 8) ?? '—'}
        </div>
      ) : (
        <div style={{ flex: 1, color: 'var(--text2)', fontSize: 13 }}>Nanopayment</div>
      )}

      {isIdle ? (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text3)' }}>idle</div>
      ) : (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--teal)', fontWeight: 500 }}>
          +${amountFixed}
        </div>
      )}

      {!isIdle && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)' }}>
          {p.txnId ? <ArcLink hash={p.arcTxHash || p.txnId} /> : '✓'}
        </div>
      )}
    </div>
  )
}

function ArcLink({ hash }: { hash: string }) {
  const short = hash.startsWith('0x') ? hash.slice(0, 6) + '…' : hash.slice(0, 8)
  const isStub = hash.startsWith('0x00') || hash.includes('aaaa')
  if (isStub) return <span title={hash}>{short}</span>

  return (
    <a
      href={`https://explorer.arc.network/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'var(--teal)', textDecoration: 'none' }}
    >
      {short}
    </a>
  )
}
