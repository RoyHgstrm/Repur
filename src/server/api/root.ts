import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "~/server/api/trpc";
import { listingsRouter } from "./routers/listings";

export const appRouter = createTRPCRouter({
  // Public route example
  hello: publicProcedure.query(() => {
    return { message: "Hello, world!" };
  }),

  // All listing-related procedures (company listings and trade-ins)
  listings: listingsRouter,
});

export type AppRouter = typeof appRouter;
