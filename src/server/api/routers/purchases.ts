import { z } from "zod";
import Stripe from "stripe";
import { env } from "~/env";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import { purchases } from "~/server/db/schema";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logger } from "~/server/utils/logger";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-09-30.clover",
});

const DateRangeSchema = z
	.object({
		from: z.string().datetime().optional(),
		to: z.string().datetime().optional(),
	})
	.optional();

export const purchasesRouter = createTRPCRouter({
	// Admin/staff: list purchases with optional filters
	getAll: protectedProcedure
		.input(
			z
				.object({
					status: z.string().optional(),
					q: z.string().optional(),
					dateRange: DateRangeSchema,
					limit: z.number().min(1).max(200).optional(),
				})
				.optional(),
		)
		.query(async ({ ctx, input }) => {
			// Only ADMIN/EMPLOYEE
			if (ctx.userRole !== "ADMIN" && ctx.userRole !== "EMPLOYEE") {
				throw new Error("Vain henkilöstö voi nähdä ostot");
			}

			const whereClauses: any[] = [];
			if (input?.status) whereClauses.push(eq(purchases.status, input.status));
			if (input?.dateRange?.from)
				whereClauses.push(
					gte(purchases.createdAt, new Date(input.dateRange.from)),
				);
			if (input?.dateRange?.to)
				whereClauses.push(
					lte(purchases.createdAt, new Date(input.dateRange.to)),
				);

			const rows = await db.query.purchases.findMany({
				where: whereClauses.length ? and(...whereClauses) : undefined,
				orderBy: desc(purchases.createdAt),
				limit: input?.limit ?? 100,
				with: {
					companyListing: true,
					buyer: true,
				},
			});

			// Simple text search filter on server (title/email)
			const q = (input?.q ?? "").trim().toLowerCase();
			return q
				? rows.filter(
						(r) =>
							(r.companyListing?.title ?? "").toLowerCase().includes(q) ||
							(r.buyer?.email ?? "").toLowerCase().includes(q) ||
							(r.id ?? "").toLowerCase().includes(q),
					)
				: rows;
		}),

	// Admin/staff: simple sales analytics
	getStats: protectedProcedure.query(async ({ ctx }) => {
		if (ctx.userRole !== "ADMIN" && ctx.userRole !== "EMPLOYEE") {
			throw new Error("Vain henkilöstö voi nähdä tilastot");
		}

		const now = new Date();
		const start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

		const last7 = await db
			.select({
				count: sql<number>`count(*)`,
				revenue: sql<string>`coalesce(sum(${purchases.purchasePrice}), '0')`,
			})
			.from(purchases)
			.where(
				and(
					gte(purchases.createdAt, start7),
					eq(purchases.status, "COMPLETED"),
				),
			);

		const last30 = await db
			.select({
				count: sql<number>`count(*)`,
				revenue: sql<string>`coalesce(sum(${purchases.purchasePrice}), '0')`,
			})
			.from(purchases)
			.where(
				and(
					gte(purchases.createdAt, start30),
					eq(purchases.status, "COMPLETED"),
				),
			);

		// Daily buckets past 7 days
		const daily = await db
			.select({
				day: sql<string>`to_char(${purchases.createdAt}, 'YYYY-MM-DD')`,
				revenue: sql<string>`sum(${purchases.purchasePrice})`,
				count: sql<number>`count(*)`,
			})
			.from(purchases)
			.where(gte(purchases.createdAt, start7))
			.groupBy(sql`1`)
			.orderBy(sql`1`);

		return {
			last7: {
				count: Number(last7[0]?.count ?? 0),
				revenue: Number(last7[0]?.revenue ?? 0),
			},
			last30: {
				count: Number(last30[0]?.count ?? 0),
				revenue: Number(last30[0]?.revenue ?? 0),
			},
			daily: daily.map((d) => ({
				day: d.day,
				count: Number(d.count ?? 0),
				revenue: Number(d.revenue ?? 0),
			})),
		};
	}),

	// Admin/staff: Get total purchases and total revenue
	totalStats: protectedProcedure.query(async ({ ctx }) => {
		if (ctx.userRole !== "ADMIN" && ctx.userRole !== "EMPLOYEE") {
			throw new Error("Vain henkilöstö voi nähdä tilastot");
		}

		const total = await db
			.select({
				count: sql<number>`count(*)`,
				revenue: sql<string>`coalesce(sum(${purchases.purchasePrice}), '0')`,
			})
			.from(purchases)
			.where(eq(purchases.status, "COMPLETED"));

		return {
			totalCount: Number(total[0]?.count ?? 0),
			totalRevenue: Number(total[0]?.revenue ?? 0),
		};
	}),

	// Admin/staff: Get breakdown of purchases by status
	statusBreakdown: protectedProcedure.query(async ({ ctx }) => {
		if (ctx.userRole !== "ADMIN" && ctx.userRole !== "EMPLOYEE") {
			throw new Error("Vain henkilöstö voi nähdä tilastot");
		}

		const breakdown = await db
			.select({
				status: purchases.status,
				count: sql<number>`count(*)`,
			})
			.from(purchases)
			.groupBy(purchases.status);

		return breakdown.map((b) => ({
			status: b.status,
			count: Number(b.count ?? 0),
		}));
	}),

	// Admin: Refund a purchase via Stripe and email receipt to customer via Stripe
	refund: protectedProcedure
		.input(
			z.object({
				purchaseId: z.string(),
				amount: z.number().positive().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			if (ctx.userRole !== "ADMIN") {
				throw new Error("Vain ylläpitäjä voi tehdä palautuksia");
			}

			const row = await db.query.purchases.findFirst({
				where: eq(purchases.id, input.purchaseId),
			});
			if (!row) throw new Error("Tilausta ei löydy");

			// Use the stored Stripe Checkout Session ID for refund
			// Ensure stripeCheckoutSessionId is not null
			if (!row.stripeCheckoutSessionId) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Stripe Checkout Session ID puuttuu ostotapahtumasta.",
				});
			}
			const session = await stripe.checkout.sessions.retrieve(
				row.stripeCheckoutSessionId, // Use the new column
			);
			const pi = session.payment_intent;
			if (!pi) throw new Error("Maksutapahtumaa ei löydy");

			const refund = await stripe.refunds.create({
				payment_intent: typeof pi === "string" ? pi : pi.id,
				amount: input.amount ? Math.round(input.amount * 100) : undefined,
			});

			// Update local status
			await db
				.update(purchases)
				.set({ status: "REFUNDED" })
				.where(eq(purchases.id, row.id));

			// Send receipt email via Stripe: receipts must be enabled in Stripe Dashboard.
			// Note: Programmatic email sending uses Stripe's email settings – ensure "Email customers" is on.
			return { id: refund.id, status: refund.status };
		}),

	// HOW: New query to fetch the status of a specific purchase.
	// WHY: Enables client-side polling on the success page to confirm purchase completion status from the server.
	getPurchaseStatus: publicProcedure
		.input(z.object({ purchaseId: z.string() }))
		.query(async ({ input, ctx }) => {
			logger.info(
				`[tRPC] getPurchaseStatus received purchaseId: ${input.purchaseId}`,
			);
			const purchase = await ctx.db.query.purchases.findFirst({
				where: eq(purchases.id, input.purchaseId),
			});

			if (!purchase) {
				logger.warn(`[tRPC] getPurchaseStatus: Purchase ${input.purchaseId} not found.`);
				return null;
			}

			logger.info(
				`[tRPC] getPurchaseStatus: Purchase found, status: ${purchase.status}`,
			);

			return {
				id: purchase.id,
				status: purchase.status,
				// Add other relevant purchase details here
			};
		}),

	// HOW: New query to fetch the purchaseId using the Stripe Checkout Session ID.
	// WHY: Enables the client-side success page to retrieve the internal purchaseId after Stripe redirects with a session ID, facilitating subsequent polling for purchase status.
	getPurchaseIdByCheckoutSession: publicProcedure
		.input(z.object({ checkoutSessionId: z.string() }))
		.query(async ({ ctx, input }) => { // eslint-disable-line @typescript-eslint/no-unused-vars
			logger.info(`[tRPC] getPurchaseIdByCheckoutSession received checkoutSessionId: ${input.checkoutSessionId}`);
			const session = await stripe.checkout.sessions.retrieve(
				input.checkoutSessionId,
			);
			logger.info(`[tRPC] getPurchaseIdByCheckoutSession Stripe session retrieved: ${session.id}, metadata: ${JSON.stringify(session.metadata)}`);
			const purchaseId = session.metadata?.purchaseId;

			if (!purchaseId) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Ostotunnusta ei löytynyt Stripe-sessiolta.",
				});
			}

			const purchase = await ctx.db.query.purchases.findFirst({
				where: eq(purchases.id, purchaseId),
				with: { companyListing: true, buyer: true },
			});

			if (!purchase) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Ostotapahtumaa ei löytynyt.",
				});
			}

			return { purchase: purchase };
		}),
});
