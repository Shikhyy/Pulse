'use client'

interface BudgetBarProps {
  spent: number
  cap: number
}

export default function BudgetBar({ spent, cap }: BudgetBarProps) {
  const pct = cap > 0 ? Math.min((spent / cap) * 100, 100) : 0
  const isWarning = pct >= 80 && pct < 95
  const isDanger = pct >= 95

  const barColor = isDanger ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--teal)'

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
          ${spent.toFixed(2)} spent
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
          ${cap.toFixed(2)} cap
        </span>
      </div>

      <div className="budget-bar-track">
        <div 
          className="budget-bar-fill" 
          style={{ width: `${pct}%`, background: barColor }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
          {pct.toFixed(0)}% utilisation
        </span>
        {isDanger && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--red)' }}>
            ⚠ Cap reached
          </span>
        )}
        {isWarning && !isDanger && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--amber)' }}>
            ⚡ 80% warning
          </span>
        )}
        {!isWarning && !isDanger && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>
            Healthy
          </span>
        )}
      </div>
    </div>
  )
}
