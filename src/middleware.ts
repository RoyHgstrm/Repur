import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"; // Import auth and clerkMiddleware
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"; // Import Supabase middleware client
import { NextResponse, type NextRequest } from "next/server"; // Import NextResponse and NextRequest

// HOW: Define public routes using Clerk's createRouteMatcher helper.
// WHY: Clerk v6 middleware no longer accepts `publicRoutes` directly in options; use a matcher and call
//      `auth().protect()` only for non-public routes to enforce authentication.
const isPublicRoute = createRouteMatcher([
	"/",
	"/osta",
	"/osta/(.*)",
	// Serve uploaded images directly
	"/uploads/(.*)",
	"/meista",
	"/takuu",
	"/tuki",
	"/tuki/ohjeet",
	"/yhteystiedot",
	"/kayttoehdot",
	"/tietosuoja",
	// Webhooks must be public to allow Stripe to reach them
	"/api/stripe/webhook",
	"/api/trpc/(.*)",
	"/sign-in(.*)",
	"/sign-up(.*)",
]);

export default clerkMiddleware(async (authCtx, req: NextRequest) => {
	const res = NextResponse.next();

	// Create Supabase client with req and res to enable cookie handling
	const supabase = createMiddlewareClient({ req, res });

	// Log the Supabase client initialization details (useful for debugging env vars)
	console.log(
		"Middleware: Supabase Client Initialized with URL:",
		process.env.NEXT_PUBLIC_SUPABASE_URL,
	);

	// Get Clerk session from authCtx
	const { userId, getToken } = await authCtx(); // Await authCtx() to get the session object

	if (userId) {
		try {
			// Get Clerk's JWT token
			const clerkToken = await getToken(); // Removed template: 'supabase'

			if (clerkToken) {
				// Set the Supabase session using Clerk's token
				await supabase.auth.setSession({
					access_token: clerkToken,
					refresh_token: "", // Clerk handles refresh; Supabase doesn't need to manage it
				});
				console.log("Middleware: Supabase session set from Clerk token.");
			} else {
				console.warn("Middleware: Clerk token (supabase template) not found.");
			}
		} catch (error) {
			console.error(
				"Middleware: Error setting Supabase session from Clerk token:",
				error,
			);
		}
	}

	// Refresh Supabase session (important to ensure cookies are sent back)
	const {
		data: { session },
		error: sessionError,
	} = await supabase.auth.getSession();

	console.log("Middleware: Supabase Session Data after sync:", session);
	if (sessionError) {
		console.error(
			"Middleware: Supabase Session Error after sync:",
			sessionError,
		);
	}

	if (!isPublicRoute(req)) {
		// Protect routes that are not public.
		await authCtx.protect(); // Call protect directly from the destructured auth object
	}
	return res; // Return the response with the refreshed cookie
});

export const config = {
	matcher: [
		"/((?!.*\\..*|_next).*)-match",
		"/",
		"/(api|trpc)(.*)",
		"/(admin)(.*)",
	],
};
