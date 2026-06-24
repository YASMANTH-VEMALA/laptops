import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySessionToken } from './lib/auth-session'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    // Exempt the login page
    if (pathname === '/admin/login') {
      return NextResponse.next()
    }

    const token = request.cookies.get('admin_session')?.value
    if (!token || !verifySessionToken(token)) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Run on all admin routes
  matcher: ['/admin/:path*', '/admin'],
}
