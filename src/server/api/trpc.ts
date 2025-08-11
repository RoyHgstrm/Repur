/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from 'nanoid';
import { limiter } from "~/lib/rate-limiter";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId, sessionId, getToken } = await auth();
  console.log("User ID in tRPC context:", userId);
  return {
    db,
    userId,
    sessionId,
    getToken,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path, type, ctx, getRawInput }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const durationMs = Date.now() - start;
  const user = ctx.userId ?? 'anonymous';
  let inputKeys: string[] = [];
  try {
    const raw = await getRawInput();
    inputKeys = raw && typeof raw === 'object' ? Object.keys(raw as object) : [];
  } catch {}
  const baseMsg = `[tRPC] ${type?.toUpperCase?.() ?? 'op'} ${path} by ${user} in ${durationMs}ms`;
  if (result.ok) {
    console.log(`${baseMsg} OK`);
  } else {
    console.error(`${baseMsg} ERROR: ${result.error.message}`, { code: result.error.code, inputKeys });
  }

  return result;
});

const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  const ip = ctx.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await limiter.limit(ip);
  if (!success) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later.",
    });
  }
  return next();
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware).use(rateLimitMiddleware);

export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(rateLimitMiddleware)
  .use(async ({ ctx, next }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource'
      });
    }

    // Fetch Clerk user details
    const clerkUser = await currentUser();
    if (!clerkUser || !clerkUser.emailAddresses?.[0]?.emailAddress) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Clerk user details not available'
      });
    }

    // Sync/Upsert Clerk user → DB on every protected call to keep DB up to date
    let user = await ctx.db.query.users.findFirst({ where: eq(users.clerkId, ctx.userId) });
    const email = clerkUser.emailAddresses?.[0]?.emailAddress!;
    const displayName = clerkUser.firstName || clerkUser.username || email;

    if (!user) {
      // If not found by clerkId, try match by email (handles previous records without clerkId binding)
      const existingByEmail = await ctx.db.query.users.findFirst({ where: eq(users.email, email) });
      if (existingByEmail) {
        await ctx.db
          .update(users)
          .set({
            clerkId: ctx.userId,
            name: displayName ?? existingByEmail.name,
          })
          .where(eq(users.id, existingByEmail.id));
        user = await ctx.db.query.users.findFirst({ where: eq(users.id, existingByEmail.id) });
      } else {
        // Insert new row; guard with onConflict to avoid unique violations
        try {
          const newUserId = nanoid();
          await ctx.db
            .insert(users)
            .values({
              id: newUserId,
              clerkId: ctx.userId,
              email,
              name: displayName || email,
              role:
                (clerkUser.publicMetadata as any)?.role === 'ADMIN' ||
                (clerkUser.publicMetadata as any)?.role === 'EMPLOYEE'
                  ? (clerkUser.publicMetadata as any).role
                  : 'CUSTOMER',
            })
            .onConflictDoNothing({ target: users.email });
        } catch {
          // no-op; fetch below
        }
        // Fetch after insert/do-nothing to ensure we have the record; try by clerkId first
        user =
          (await ctx.db.query.users.findFirst({ where: eq(users.clerkId, ctx.userId) })) ??
          (await ctx.db.query.users.findFirst({ where: eq(users.email, email) }));
      }
      if (!user) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to ensure user in database' });
      }
    } else {
      // Update basic fields if changed (email/name/role)
      const newRole = (clerkUser.publicMetadata as any)?.role as string | undefined;
      const shouldUpdate = (email && email !== user.email) || (displayName && displayName !== user.name) || (newRole && newRole !== user.role);
      if (shouldUpdate) {
        await ctx.db
          .update(users)
          .set({
            email: email ?? user.email,
            name: displayName ?? user.name,
            role: newRole ?? user.role,
          })
          .where(eq(users.id, user.id));
      }
    }

    return next({
      ctx: {
        ...ctx,
        userId: user.id, // internal user ID
        userRole: user.role,
      },
    });
  });
