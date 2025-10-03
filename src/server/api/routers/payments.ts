import { z } from "zod";
import Stripe from "stripe";
import { env } from "~/env";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { listings, purchases } from "~/server/db/schema";
import { nanoid } from "nanoid";

// HOW: Server-only Stripe client configured with API version for stability.
// WHY: Explicit API versioning prevents unexpected breaking changes on Stripe upgrades.
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-09-30.clover",
});

export const paymentsRouter = createTRPCRouter({
	// Create a Checkout Session for purchasing a single company listing
	createCheckoutSession: protectedProcedure
		.input(
			z.object({
				companyListingId: z.string(),
				successUrl: z.string().url(),
				cancelUrl: z.string().url(),
				shippingAddress: z.object({
					street: z.string().min(1, "Katuosoite vaaditaan"),
					city: z.string().min(1, "Kaupunki vaaditaan"),
					postalCode: z.string().min(1, "Postinumero vaaditaan"),
					country: z.string().min(1, "Maa vaaditaan"),
					phone: z.string().min(1, "Puhelinnumero vaaditaan"),
				}),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			// Load listing and compute final price (account for discount window if available)
			const listing = await ctx.db.query.listings.findFirst({
				where: eq(listings.id, input.companyListingId),
			});
			if (!listing || listing.status !== "ACTIVE") {
				throw new Error("Listaus ei ole saatavilla");
			}

			const basePriceCents = Math.round(Number(listing.basePrice) * 100);
			let unitAmount = basePriceCents;
			const now = new Date();
			const hasWindow =
				listing.discountStart && listing.discountEnd
					? now >= new Date(String(listing.discountStart)) &&
						now <= new Date(String(listing.discountEnd))
					: false;
			if (hasWindow && listing.discountAmount != null) {
				const discountCents = Math.round(Number(listing.discountAmount) * 100);
				unitAmount = Math.max(0, basePriceCents - discountCents);
			}

			// HOW: Create a pending purchase record in DB before Stripe checkout.
			// WHY: Ensures a local record exists immediately, allowing robust webhook processing and client-side status checks.
			const purchaseId = nanoid();
			await ctx.db.insert(purchases).values({
				id: purchaseId,
				companyListingId: listing.id,
				userId: ctx.userId,
				purchasePrice: (unitAmount / 100).toString(),
				paymentMethod: "stripe", // Will be updated by webhook if needed
				                shippingAddress: `${input.shippingAddress.street}, ${input.shippingAddress.postalCode} ${input.shippingAddress.city}, ${input.shippingAddress.country}`,
				                shippingPhone: input.shippingAddress.phone,
				                stripeCheckoutSessionId: null, // Will be updated by webhook if needed
				                status: "PENDING",			});

			// Create Checkout Session
			const session = await stripe.checkout.sessions.create({
				mode: "payment",
				payment_method_types: ["card"],
				line_items: [
					{
						quantity: 1,
						price_data: {
							currency: "eur",
							product_data: {
								name: listing.title,
								description: listing.description,
							},
							unit_amount: unitAmount,
						},
					},
				],
				metadata: {
					purchaseId: purchaseId, // Pass our internal purchaseId to Stripe
				},
				success_url: `${input.successUrl}?checkoutSessionId={CHECKOUT_SESSION_ID}`,
				cancel_url: input.cancelUrl,
			});

			return { id: session.id, url: session.url, purchaseId: purchaseId };
		}),
});
