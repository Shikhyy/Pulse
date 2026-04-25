import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Pulse — Real-Time Freelancer Pay',
  description:
    'Pay freelancers in real-time. No more net-30 payroll. Every 30 seconds, they get paid. Powered by Circle Nanopayments on Arc Testnet.',
  keywords: 'freelancer payments, real-time pay, USDC, nanopayments, Circle, Arc testnet, freelancer payroll',
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