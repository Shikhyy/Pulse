'use client'
import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    
    const duration = toast.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, duration)
    }
  },
  
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export function useToast() {
  const { addToast, removeToast } = useToastStore()
  
  return {
    success: (message: string, duration?: number) => 
      addToast({ message, type: 'success', duration }),
    error: (message: string, duration?: number) => 
      addToast({ message, type: 'error', duration }),
    info: (message: string, duration?: number) => 
      addToast({ message, type: 'info', duration }),
    warning: (message: string, duration?: number) => 
      addToast({ message, type: 'warning', duration }),
    remove: removeToast,
  }
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  
  if (toasts.length === 0) return null
  
  const colors = {
    success: { bg: '#00e5a0', color: '#000' },
    error: { bg: 'var(--color-danger)', color: '#fff' },
    info: { bg: 'var(--color-primary)', color: '#fff' },
    warning: { bg: 'var(--color-warning)', color: '#000' },
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            padding: '12px 16px',
            background: colors[toast.type].bg,
            color: colors[toast.type].color,
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            animation: 'slideIn 0.3s ease',
            cursor: 'pointer',
          }}
          onClick={() => useToastStore.getState().removeToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}