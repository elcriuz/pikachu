import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public routes
  if (path === '/' || path.startsWith('/api/auth/login')) {
    return NextResponse.next()
  }

  // Check authentication
  const user = await getSession(request)
  
  if (!user) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check admin access for settings
  if (path.startsWith('/settings') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/browser', request.url))
  }

  // Check path restrictions for users with startPath
  if (user.startPath && path.startsWith('/browser')) {
    const urlParams = new URL(request.url).searchParams
    const requestedPath = urlParams.get('path') || ''
    
    // Allow access if no specific path is requested (will be handled by browser component)
    if (requestedPath) {
      // Check if requested path is within user's start path
      if (!requestedPath.startsWith(user.startPath)) {
        const redirectUrl = new URL('/browser', request.url)
        redirectUrl.searchParams.set('path', user.startPath)
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  // Check path restrictions for API calls
  if (user.startPath && path.startsWith('/api/files')) {
    const urlParams = new URL(request.url).searchParams
    const requestedPath = urlParams.get('path') || ''
    
    if (requestedPath && !requestedPath.startsWith(user.startPath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}