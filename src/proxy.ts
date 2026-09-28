import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from './lib/auth/token'

// Fast gate for /admin. Pages and actions still re-validate the user against the DB.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin/login') return NextResponse.next()
  const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
  if (session) return NextResponse.next()
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const url = request.nextUrl.clone()
  url.pathname = '/admin/login'
  url.search = pathname === '/admin' ? '' : `?next=${encodeURIComponent(pathname)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
