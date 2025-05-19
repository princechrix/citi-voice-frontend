import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Since we're using client-side storage, we'll let the client handle the redirects
  // The ProtectedRoute component and useEffect in signin page will handle this
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/signin', '/admin/:path*', '/staff/:path*', '/agency/:path*']
}   