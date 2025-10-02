import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";
import { redis } from "~/lib/redis";

// HOW: Favorites are stored in Upstash Redis per user as a Set of listing IDs.
// WHY: Low-latency UX, no schema change; serverless and persistent enough for preferences.

const key = (userId: string) => `favorites:${userId}`;

export const favoritesRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		const ids = await redis.smembers(key(ctx.userId));
		return (ids as string[]) ?? [];
	}),

	isFavorited: protectedProcedure
		.input(z.object({ listingId: z.string() }))
		.query(async ({ ctx, input }) => {
			const exists = await redis.sismember(key(ctx.userId), input.listingId);
			return { favorited: !!exists };
		}),

	toggle: protectedProcedure
		.input(z.object({ listingId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const exists = await redis.sismember(key(ctx.userId), input.listingId);
			if (exists) {
				await redis.srem(key(ctx.userId), input.listingId);
				return { favorited: false };
			}
			await redis.sadd(key(ctx.userId), input.listingId);
			return { favorited: true };
		}),
});
