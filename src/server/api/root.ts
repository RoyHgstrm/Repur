import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "~/server/api/trpc";
import { listingsRouter } from "./routers/listings";
import { paymentsRouter } from "~/server/api/routers/payments";
import { purchasesRouter } from "~/server/api/routers/purchases";
import { metricsRouter } from "~/server/api/routers/metrics";
import { favoritesRouter } from "~/server/api/routers/favorites";
import { warrantiesRouter } from "~/server/api/routers/warranties";

export const appRouter = createTRPCRouter({
  // Public route example
  hello: publicProcedure.query(() => {
    return { message: "Hello, world!" };
  }),

  // All listing-related procedures (company listings and trade-ins)
  listings: listingsRouter,
  // Stripe payments-related procedures
  payments: paymentsRouter,
  // Purchases management (admin)
  purchases: purchasesRouter,
  favorites: favoritesRouter,
  metrics: metricsRouter,
  warranties: warrantiesRouter,
});

export type AppRouter = typeof appRouter;
