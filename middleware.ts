import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define public paths that DON'T require authentication
  const isPublicPath = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/pricing' ||
    pathname.startsWith('/api/auth');

  // 2. Define static/asset paths that should always be accessible
  const isAssetPath = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') || 
    pathname.includes('.') || // matches favicon.ico, images, etc.
    pathname === '/favicon.ico';

  if (isAssetPath) {
    return NextResponse.next();
  }

  // 3. Get token from cookies
  const token = request.cookies.get('auth_token')?.value;

  // 4. Verify token if it exists
  let isValid = false;
  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      isValid = true;
    }
  }

  // 5. Handle Redirection Logic
  
  // If user is NOT logged in and trying to access a protected path
  if (!isValid && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user IS logged in and trying to access login/register
  if (isValid && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Optimized matcher to cover all pages
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) -> we handle auth inside API routes usually, 
     *   but we included /api/auth in public paths above.
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
