import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import { listings, purchases } from "~/server/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { redis } from "~/lib/redis";

// HOW: Compute hero metrics from DB and cache in Upstash Redis for 5 minutes to reduce load.
// WHY: Live stats improve trust; caching keeps response fast and cost‑efficient on serverless.

const HeroStatsSchema = z.object({
	activeCount: z.number(),
	avgPrice: z.number(),
	sold7: z.number(),
	sold30: z.number(),
	new7: z.number(),
	new30: z.number(),
});

export const metricsRouter = createTRPCRouter({
	getHeroStats: publicProcedure.query(async () => {
		const cacheKey = "metrics:hero:v2";
		try {
			const cached = await redis.get(cacheKey);
			if (cached && typeof cached === "object") {
				const parsed = HeroStatsSchema.safeParse(cached);
				if (parsed.success) return parsed.data;
			}
		} catch {}

		const now = new Date();
		const start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		const [activeRows] = await db
			.select({
				count: sql<number>`count(*)`,
				// HOW: Average effective price considering active discounts (amount subtracted when within window)
				// WHY: Hero should reflect real current prices customers pay.
				avgPrice: sql<string>`coalesce(avg(( ${listings.basePrice} ) - CASE WHEN ${listings.discountAmount} IS NOT NULL AND ( ${listings.discountStart} IS NULL OR ${listings.discountStart} <= now() ) AND ( ${listings.discountEnd} IS NULL OR ${listings.discountEnd} >= now() ) THEN ${listings.discountAmount} ELSE 0 END), '0')`,
			})
			.from(listings)
			.where(eq(listings.status, "ACTIVE"));

		const [sold7Row] = await db
			.select({ count: sql<number>`count(*)` })
			.from(purchases)
			.where(
				and(
					gte(purchases.createdAt, start7),
					eq(purchases.status, "COMPLETED"),
				),
			);

		const [sold30Row] = await db
			.select({ count: sql<number>`count(*)` })
			.from(purchases)
			.where(
				and(
					gte(purchases.createdAt, start30),
					eq(purchases.status, "COMPLETED"),
				),
			);

		const [new7Row] = await db
			.select({ count: sql<number>`count(*)` })
			.from(listings)
			.where(
				and(gte(listings.createdAt, start7), eq(listings.status, "ACTIVE")),
			);

		const [new30Row] = await db
			.select({ count: sql<number>`count(*)` })
			.from(listings)
			.where(
				and(gte(listings.createdAt, start30), eq(listings.status, "ACTIVE")),
			);

		const result = {
			activeCount: Number(activeRows?.count ?? 0),
			avgPrice: Number(activeRows?.avgPrice ?? 0),
			sold7: Number(sold7Row?.count ?? 0),
			sold30: Number(sold30Row?.count ?? 0),
			new7: Number(new7Row?.count ?? 0),
			new30: Number(new30Row?.count ?? 0),
		};

		// Shorter TTL to keep discounted average fresh
		await redis.set(cacheKey, result, { ex: 120 });
		return result;
	}),
});
