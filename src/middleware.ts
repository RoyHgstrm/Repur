import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// HOW: Define public routes using Clerk's createRouteMatcher helper.
// WHY: Clerk v6 middleware no longer accepts `publicRoutes` directly in options; use a matcher and call
//      `auth().protect()` only for non-public routes to enforce authentication.
const isPublicRoute = createRouteMatcher([
  '/',
  '/osta',
  '/osta/(.*)',
  '/meista',
  '/takuu',
  '/tuki',
  '/tuki/ohjeet',
  '/yhteystiedot',
  '/kayttoehdot',
  '/tietosuoja',
  '/api/trpc/(.*)',
  '/api/upload',
  '/sign-in(.*)',
  '/sign-up(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
};
