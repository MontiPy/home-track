'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4 max-w-md px-4">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          There was an error loading this page. Please try again.
        </p>
        <Button onClick={reset} size="sm">
          Try again
        </Button>
      </div>
    </div>
  )
}
