'use client'

import { GlobalError } from './providers'

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <GlobalError error={error} reset={reset} />
}