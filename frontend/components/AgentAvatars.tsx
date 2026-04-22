'use client'

export const ActivityAgentSVG = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="rgba(0,229,160,0.08)" />
    {/* Circle head */}
    <circle cx="32" cy="20" r="10" stroke="#00e5a0" strokeWidth="1.5" />
    {/* Arc body */}
    <path d="M24 34 Q32 44 40 34" stroke="#00e5a0" strokeWidth="1.5" strokeLinecap="round" />
    {/* Rect feet */}
    <rect x="27" y="44" width="10" height="10" rx="3" fill="rgba(0,229,160,0.2)" stroke="#00e5a0" strokeWidth="1.5" />
    {/* ECG waveform */}
    <path 
      d="M12 32 L18 32 L22 24 L26 40 L30 28 L34 36 L38 32 L44 32 L52 32" 
      stroke="#00e5a0" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
  </svg>
)

export const PaymentEngineSVG = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="rgba(59,130,246,0.08)" />
    {/* Outer circle */}
    <circle cx="32" cy="32" r="18" stroke="rgba(59,130,246,0.3)" strokeWidth="1.5" />
    {/* Inner circle */}
    <circle cx="32" cy="32" r="12" fill="#3b82f6" />
    {/* Dollar stems */}
    <path d="M32 22 L32 26" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M32 38 L32 42" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    {/* Dollar S-curve */}
    <path 
      d="M27 29 C27 27 29 26 32 26 C35 26 37 27.5 37 30 C37 32.5 35 33 32 33 C29 33 27 34 27 36 C27 38 29 39 32 39 C35 39 37 38 37 36" 
      stroke="#ffffff" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    {/* Left arrow */}
    <path d="M6 24 L14 24" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 20 L14 24 L10 28" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Right arrow */}
    <path d="M58 40 L50 40" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M54 36 L50 40 L54 44" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const BudgetGuardSVG = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="16" fill="rgba(245,158,11,0.08)" />
    {/* Card shape */}
    <rect x="12" y="18" width="40" height="28" rx="6" stroke="#f59e0b" strokeWidth="1.5" />
    {/* Card line */}
    <path d="M12 26 L52 26" stroke="#f59e0b" strokeOpacity="0.4" strokeWidth="1.5" />
    {/* Card chip */}
    <rect x="18" y="32" width="8" height="8" rx="2" fill="rgba(245,158,11,0.3)" />
    {/* Shield */}
    <path 
      d="M38 30 L38 38 Q38 42 32 44 Q26 42 26 38 L26 30 L32 28 Z" 
      fill="rgba(245,158,11,0.08)" 
      stroke="#f59e0b" 
      strokeWidth="1.5" 
      strokeLinejoin="round" 
    />
    {/* Checkmark */}
    <path d="M29 36 L31 38 L35 33" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const AgentAvatars = {
  activity: ActivityAgentSVG,
  payment: PaymentEngineSVG,
  budget: BudgetGuardSVG
}
