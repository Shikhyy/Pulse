import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Pulse — Agentic Compute Network',
  description:
    'Atomic economy for AI agents. Pay per inference. Powered by Circle Nanopayments on Arc Testnet.',
  keywords: 'agentic compute, AI agents, USDC, nanopayments, Circle, Arc testnet, pay per inference',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}