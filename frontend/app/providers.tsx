'use client'
import { ReactNode } from 'react'
import NetworkBanner from '../components/NetworkBanner'
import ToastContainer from '../components/Toast'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <NetworkBanner showNetwork={false} showDemoMode={false} />
      <ToastContainer />
      {children}
    </>
  )
}