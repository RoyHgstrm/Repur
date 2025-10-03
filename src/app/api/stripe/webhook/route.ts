// This API route acts as a serverless webhook listener for Stripe events on Vercel.
// Each incoming Stripe event triggers an invocation of this function.
// It's designed to be stateless and scalable, automatically handling varying loads of Stripe events.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "~/env";
import { db } from "~/server/db";
import { listings, purchases, warranties } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { defaultLimiter } from "~/lib/rate-limiter"; // Import the defaultLimiter instance
import { redis } from "~/lib/redis";
import { sendPurchaseConfirmationEmail } from "~/lib/email";
import { Decimal } from "decimal.js";
import { logger } from "~/server/utils/logger"; // Import the custom logger
import { nanoid } from "nanoid";

// HOW: Initialize Stripe with the API key and a specific API version for webhook compatibility.
// WHY: Ensures that webhook payloads are parsed correctly according to the expected Stripe API version.
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-09-30.clover",
});

export async function POST(req: NextRequest) {
	// Basic rate-limit per IP for webhooks to avoid floods
	const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1"; // Use x-forwarded-for for IP
	const { success } = await defaultLimiter.limit(ip); // Use defaultLimiter directly

	if (!success) {
		// Log rate limit exceeded.
		logger.warn(`[Stripe Webhook] Rate limit exceeded for IP: ${ip}`);
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });
	}

	// Log function start
	logger.info("[Stripe Webhook] Function started.");

	// Ensure the request method is POST
	if (req.method !== "POST") {
		logger.warn("[Stripe Webhook] Received non-POST request.");
		return new Response("Method Not Allowed", { status: 405 });
	}

	// Read the request body and Stripe signature
	const body = await req.text();
	const signature = req.headers.get("stripe-signature");

	// Verify signature
	if (!signature) {
		logger.error("[Stripe Webhook] Stripe signature missing.");
		return new Response("No Stripe signature", { status: 400 });
	}

	let event: Stripe.Event;
	const endpointSecret = env.STRIPE_WEBHOOK_SECRET;

	try {
		event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
	} catch (err: any) {
		logger.error(`[Stripe Webhook] Webhook signature verification failed: ${err.message}`);
		return new Response(`Webhook Error: ${err.message}`, { status: 400 });
	}

	const eventId = event.id;

	// Check if event has already been processed using Redis (idempotency)
	const isEventProcessed = await redis.get(`stripe_event:${eventId}`);
	const idempotencyKey = `stripe_event:${eventId}`;

	if (isEventProcessed) {
		logger.info(`[Stripe Webhook] Event ${eventId} already processed.`);
		return new Response(JSON.stringify({ received: true }), { status: 200 });
	}

	logger.info(`[Stripe Webhook] Processing event with ID: ${event.id}, Type: ${event.type}`);

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				if (!session.metadata?.purchaseId || !session.id) {
					logger.error("[Stripe Webhook] Missing purchaseId or session ID in metadata.");
					return new Response("Missing metadata", { status: 400 });
				}
				const purchaseId = session.metadata.purchaseId;
				const stripeCheckoutSessionId = session.id;
				logger.info(
					`[Stripe Webhook] checkout.session.completed - Purchase ID: ${purchaseId}, Stripe Checkout Session ID: ${stripeCheckoutSessionId}`,
				);

				// Fetch the purchase from DB to ensure it exists and get buyer info.
				const purchase = await db.query.purchases.findFirst({
					where: eq(purchases.id, purchaseId),
					with: { buyer: true, companyListing: true },
				});

				if (!purchase) {
					logger.error(`[Stripe Webhook] Purchase not found for ID: ${purchaseId}`);
					return new Response("Purchase not found", { status: 404 });
				}

				if (purchase.status !== "PENDING") {
					logger.info(
						`[Stripe Webhook] Purchase ${purchaseId} already processed (status: ${purchase.status}).`,
					);
					// Mark event as processed even if purchase is already handled to prevent re-processing
					await redis.set(idempotencyKey, "true", { ex: 3600 }); // Cache for 1 hour
					logger.info(`[Stripe Webhook] Idempotency key set for event ${eventId}.`);
					return new Response(JSON.stringify({ received: true }), { status: 200 });
				}

				logger.info(
					`[Stripe Webhook] Processing checkout.session.completed for purchase: ${purchaseId}. Session ID: ${stripeCheckoutSessionId}`,
				);

				// Update the purchase status and link the Stripe session ID
				await db
					.update(purchases)
					.set({ status: "COMPLETED", stripeCheckoutSessionId })
					.where(eq(purchases.id, purchaseId));
				logger.info(`[Stripe Webhook] Purchase ${purchaseId} status updated to COMPLETED.`);

				// Update the listing status to SOLD
				await db
					.update(listings)
					.set({ status: "SOLD" })
					.where(eq(listings.id, purchase.companyListingId));
				logger.info(`[Stripe Webhook] Listing ${purchase.companyListingId} status updated to SOLD.`);

				// Send purchase confirmation email
				if (purchase.buyer?.email && purchase.companyListing) {
					await sendPurchaseConfirmationEmail({
						recipientEmail: purchase.buyer.email,
						purchaseId: purchase.id,
						productName: purchase.companyListing.title,
						totalAmount: new Decimal(purchase.purchasePrice),
					});
					logger.info(`[Stripe Webhook] Purchase confirmation email sent to ${purchase.buyer.email} for purchase ${purchase.id}.`);
				} else {
					logger.warn(`[Stripe Webhook] Cannot send email for purchase ${purchase.id}: buyer email missing.`);
				}

				// Create warranty record (assuming 12 months from purchase date)
				const endDate = new Date();
				endDate.setMonth(endDate.getMonth() + 12);
				await db.insert(warranties).values({
					id: nanoid(),
					purchaseId: purchase.id,
					startDate: new Date(),
					endDate: endDate,
					status: "ACTIVE",
					terms: "12 kuukauden rajoitettu takuu ohjelmistovirheille ja laitteistovioille.", // Example terms
				});
				logger.info(`[Stripe Webhook] Warranty created for purchase: ${purchase.id}.`);

				// Invalidate cache for the listing and related data
				await redis.del(`listing:${purchase.companyListingId}`);
				logger.info(`[Stripe Webhook] Redis cache invalidated for listing: ${purchase.companyListingId}.`);
				break;
			}
			case "payment_intent.succeeded": {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				logger.info(`[Stripe Webhook] PaymentIntent succeeded: ${paymentIntent.id}. Status: ${paymentIntent.status}`);
				// Update order status or fulfill product if not already handled by checkout.session.completed
				break;
			}
			case "invoice.paid": {
				const invoice = event.data.object as Stripe.Invoice;
				logger.info(`[Stripe Webhook] Invoice paid: ${invoice.id}. Customer: ${invoice.customer}. Status: ${invoice.status}`);
				// Handle successful invoice payment (e.g., subscription activated)
				break;
			}
			// Add more event types as needed
			default: {
				logger.warn(`[Stripe Webhook] Unhandled event type: ${event.type}`);
			}
		}
	} catch (error: any) {
		logger.error(`[Stripe Webhook] Error processing event ${eventId}: ${error.message}`, error);
	} finally {
		// Mark event as processed in Redis (idempotency) after attempting to process
		await redis.set(idempotencyKey, "true", { ex: 3600 }); // Cache for 1 hour
		logger.info(`[Stripe Webhook] Idempotency key set for event ${eventId}.`);
	}

	return new Response(JSON.stringify({ received: true }), { status: 200 });
}
