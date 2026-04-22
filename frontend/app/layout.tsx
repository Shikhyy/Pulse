import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pulse — Real-Time Freelancer Payroll',
  description:
    'Pay your team every 30 seconds. No invoices. No waiting. Powered by Circle Nanopayments on Arc Testnet.',
  keywords: 'freelancer payroll, USDC, nanopayments, Circle, Arc testnet, real-time payments',
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
      <body>{children}</body>
    </html>
  )
}
