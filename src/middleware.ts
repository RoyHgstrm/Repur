import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/myy(.*)',
  '/ura(.*)',
  '/tuki(.*)',
  '/admin(.*)',
  '/Admin(.*)'
])

export default clerkMiddleware(async (auth, request) => {
  // Check if the route is protected
  if (isProtectedRoute(request)) {
    const { userId, redirectToSignIn, sessionClaims } = await auth();
    
    // If no user is authenticated, redirect to sign-in
    if (!userId) {
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // Role enforcement is handled server-side in admin layout; middleware only ensures authentication
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
}