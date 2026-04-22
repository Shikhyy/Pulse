import { create } from 'zustand'

export interface Payment {
  id?: number
  time: string
  amount: number
  status: 'paid' | 'idle' | 'retry'
  txnId?: string
  arcTxHash?: string
  workerName?: string
  workerId?: string
}

export interface Worker {
  id: string
  name: string
  isActive: boolean
  isPaused: boolean
  sessionId?: string
  sessionDurationSeconds: number
  earnedToday: number
  walletAddress?: string
}

interface User {
  id: string
  name: string
  email: string
  role: 'worker' | 'employer'
  walletAddress?: string
  employerId?: string
}

// ─── Worker Store ─────────────────────────────────────────────────────────────
interface WorkerState {
  user: User | null
  token: string | null
  sessionId: string | null
  sessionEarnings: number
  todayEarnings: number
  weekEarnings: number
  payments: Payment[]
  isClocked: boolean
  sessionStart: Date | null
  isPaused: boolean

  setUser: (user: User, token: string) => void
  setSession: (sessionId: string) => void
  addEarning: (added: number, totalSession: number, totalToday: number, txnId?: string) => void
  addIdlePing: () => void
  clockOut: () => void
  setPaused: (v: boolean) => void
  logout: () => void
}

export const useWorkerStore = create<WorkerState>((set) => ({
  user: null,
  token: null,
  sessionId: null,
  sessionEarnings: 0,
  todayEarnings: 0,
  weekEarnings: 0,
  payments: [],
  isClocked: false,
  sessionStart: null,
  isPaused: false,

  setUser: (user, token) => {
    set({ user, token })
    if (typeof window !== 'undefined') localStorage.setItem('pulse_token', token)
  },

  setSession: (sessionId) =>
    set({ sessionId, isClocked: true, sessionStart: new Date(), sessionEarnings: 0, payments: [] }),

  addEarning: (added, totalSession, totalToday, txnId) =>
    set((s) => ({
      sessionEarnings: totalSession,
      todayEarnings: totalToday,
      payments: [
        {
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          amount: added,
          status: 'paid',
          txnId,
        },
        ...s.payments.slice(0, 49),
      ],
    })),

  addIdlePing: () =>
    set((s) => ({
      payments: [
        {
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          amount: 0,
          status: 'idle',
        },
        ...s.payments.slice(0, 49),
      ],
    })),

  clockOut: () =>
    set({ isClocked: false, sessionId: null, sessionStart: null }),

  setPaused: (v) => set({ isPaused: v }),

  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('pulse_token')
    set({ user: null, token: null, sessionId: null, isClocked: false, sessionEarnings: 0 })
  },
}))

// ─── Employer Store ───────────────────────────────────────────────────────────
interface EmployerState {
  user: User | null
  token: string | null
  employerId: string | null
  companyName: string | null
  inviteCode: string | null
  todaySpend: number
  dailyCap: number
  workers: Worker[]
  recentPayments: Payment[]
  budgetPct: number
  budgetWarning: boolean
  budgetExceeded: boolean

  setUser: (user: User, token: string, employer: { id: string; companyName: string; inviteCode: string } | null) => void
  updateDashboard: (data: any) => void
  addPayment: (payment: any) => void
  setBudgetWarning: (v: boolean) => void
  setBudgetExceeded: (v: boolean) => void
  toggleWorkerPause: (workerId: string, paused: boolean) => Promise<void>
  logout: () => void
}

export const useEmployerStore = create<EmployerState>((set) => ({
  user: null,
  token: null,
  employerId: null,
  companyName: null,
  inviteCode: null,
  todaySpend: 0,
  dailyCap: 50,
  workers: [],
  recentPayments: [],
  budgetPct: 0,
  budgetWarning: false,
  budgetExceeded: false,

  setUser: (user, token, employer) => {
    set({
      user,
      token,
      employerId: employer?.id ?? null,
      companyName: employer?.companyName ?? null,
      inviteCode: employer?.inviteCode ?? null,
    })
    if (typeof window !== 'undefined') localStorage.setItem('pulse_emp_token', token)
  },

  updateDashboard: (data) =>
    set({
      todaySpend: data.todaySpend ?? 0,
      dailyCap: data.dailyCap ?? 50,
      budgetPct: data.budgetPct ?? 0,
      workers: data.workers ?? [],
      recentPayments: (data.recentPayments ?? []).map((p: any) => ({
        time: new Date(p.created_at).toLocaleTimeString('en-US', { hour12: false }),
        amount: p.amount,
        status: 'paid',
        txnId: p.nanopayment_id,
        arcTxHash: p.arc_tx_hash,
        workerName: p.worker_name,
        workerId: p.worker_id,
      })),
    }),

  addPayment: (p) =>
    set((s) => ({
      todaySpend: p.spentToday ?? s.todaySpend + 0.009,
      budgetPct: Math.round(((p.spentToday ?? s.todaySpend + 0.009) / s.dailyCap) * 100),
      recentPayments: [
        {
          time: new Date(p.timestamp ?? Date.now()).toLocaleTimeString('en-US', { hour12: false }),
          amount: p.amount,
          status: 'paid',
          txnId: p.txnId,
          arcTxHash: p.arcTxHash,
          workerName: p.workerName,
          workerId: p.workerId,
        },
        ...s.recentPayments.slice(0, 49),
      ],
      workers: s.workers.map((w) =>
        w.id === p.workerId
          ? { ...w, earnedToday: (w.earnedToday ?? 0) + 0.009 }
          : w
      ),
    })),

  setBudgetWarning: (v) => set({ budgetWarning: v }),
  setBudgetExceeded: (v) => set({ budgetExceeded: v }),

  toggleWorkerPause: async (workerId, paused) => {
    const state = useEmployerStore.getState()
    const token = state.token
    if (!token) return
    try {
      const { api } = await import('./api')
      if (paused) {
        await api.pauseWorker(workerId, token)
      } else {
        await api.resumeWorker(workerId, token)
      }
    } catch (err) {
      console.error('[Store] toggleWorkerPause API call failed:', err)
    }
    // Optimistic update
    set((s) => ({
      workers: s.workers.map((w) => (w.id === workerId ? { ...w, isPaused: paused } : w)),
    }))
  },

  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('pulse_emp_token')
    set({ user: null, token: null, employerId: null })
  },
}))
