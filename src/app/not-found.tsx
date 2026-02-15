import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-4">
        <div className="text-6xl font-bold text-muted-foreground">404</div>
        <h2 className="text-2xl font-bold">Page not found</h2>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium transition-colors"
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
