import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, req) => {
  // Only allow unauthenticated access to these routes
  const publicPaths = [
    '/',
    '/sign-in',
    '/sign-up',
    '/favicon.ico',
    '/api/webhooks/clerk',
  ];
  const { pathname } = req.nextUrl;
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  // All other routes require authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|.*\..*).*)',
  ],
};
