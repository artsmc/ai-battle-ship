/**
 * Authentication Middleware
 * NextJS middleware for protecting routes and managing auth sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '../tokens/jwt'
import { AUTH_CONFIG } from '../config'

/**
 * Get token from request (cookies or header)
 */
function getTokenFromRequest(request: NextRequest): string | null {
  // Try header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Try cookie
  return request.cookies.get(AUTH_CONFIG.sessionCookieName)?.value || null
}

/**
 * Check if route requires authentication
 */
function requiresAuth(pathname: string): boolean {
  const protectedRoutes = [
    '/profile',
    '/game/create',
    '/game/join',
    '/api/user',
    '/api/game',
    '/api/stats',
  ]

  return protectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if route is auth-related
 */
function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth/')
}

/**
 * Authentication middleware function
 */
export function authMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and public routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/'
  ) {
    return null
  }

  // Get token from request
  const token = getTokenFromRequest(request)

  // For protected routes
  if (requiresAuth(pathname)) {
    if (!token) {
      // Redirect to login page or return 401 for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: 'Authentication required' },
          { status: 401 }
        )
      }

      // Redirect to home page with auth modal trigger
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('auth', 'required')
      return NextResponse.redirect(url)
    }

    // Verify token
    const validation = verifyAccessToken(token)
    if (!validation.valid) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired token' },
          { status: 401 }
        )
      }

      // Clear invalid cookies and redirect
      const response = NextResponse.redirect(request.nextUrl.clone())
      response.cookies.delete(AUTH_CONFIG.sessionCookieName)
      response.cookies.delete(AUTH_CONFIG.refreshCookieName)
      return response
    }

    // Add user info to headers for API routes
    if (pathname.startsWith('/api/') && validation.payload) {
      const response = NextResponse.next()
      response.headers.set('x-user-id', validation.payload.userId)
      response.headers.set('x-user-email', validation.payload.email)
      response.headers.set('x-user-username', validation.payload.username)
      return response
    }
  }

  // For auth routes when already authenticated
  if (isAuthRoute(pathname) && token) {
    const validation = verifyAccessToken(token)
    if (validation.valid) {
      // User is already authenticated, some auth endpoints should be restricted
      if (['login', 'register'].some(endpoint => pathname.includes(endpoint))) {
        return NextResponse.json(
          { success: false, message: 'Already authenticated' },
          { status: 409 }
        )
      }
    }
  }

  return null
}