/**
 * NextJS Middleware
 * Global middleware for the application
 */

import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from './lib/auth/middleware/auth'

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', process.env.NODE_ENV === 'development' ? '*' : 'same-origin')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers })
  }

  // Run authentication middleware
  const authResult = authMiddleware(request)
  if (authResult) {
    return authResult
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/health (health check endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/health|_next/static|_next/image|favicon.ico|public).*)',
  ],
}