
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { isAdminUser } from '@/lib/security/admin-auth';

export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie = req.cookies.get('admin-session')?.value;

  let isAdmin = false;
  if (sessionCookie) {
    try {
      const decodedToken = await admin.auth().verifySessionCookie(sessionCookie, true);
      isAdmin = await isAdminUser(decodedToken);
    } catch (error) {
      isAdmin = false;
    }
  }

  if (pathname.startsWith('/admin') && !isAdmin) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('error', 'You must be an admin to access this page.');
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && isAdmin) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
