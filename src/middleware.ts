import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  publicRoutes: [
    '/',
    '/osta',
    '/osta/:id',
    '/meista',
    '/takuu',
    '/tuki',
    '/tuki/ohjeet',
    '/yhteystiedot',
    '/kayttoehdot',
    '/tietosuoja',
    '/api/trpc/.*',
    '/api/upload',
    '/sign-in.*',
    '/sign-up.*',
  ],
  ignoredRoutes: [
    '/api/stripe/webhook'
  ]
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
};
