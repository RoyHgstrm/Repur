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
import { limiter } from "~/lib/rate-limiter";
import { redis } from "~/lib/redis";
import { revalidatePath } from "next/cache";
import { createRateLimiter } from "~/lib/rate-limiter";
import { sendPurchaseConfirmationEmail } from "~/lib/email";
import { headers } from "next/headers";
import { Decimal } from "decimal.js";

// HOW: Read raw body to verify Stripe signature.
// WHY: Stripe requires exact raw payload for signature verification to prevent tampering.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

// Use the latest pinned version supported by installed stripe typings
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
	apiVersion: "2025-08-27.basil",
});

export async function POST(req: NextRequest) {
	// Basic rate-limit per IP for webhooks to avoid floods
	const ip = req.headers.get("x-forwarded-for") ?? "unknown";
	const { success } = await limiter.limit(`stripe:webhook:${ip}`);
	if (!success)
		return NextResponse.json({ error: "Too many requests" }, { status: 429 });

	const rateLimiter = createRateLimiter({
		interval: 10 * 1000, // 10 seconds
		uniqueTokens: 100, // 100 unique tokens
	});

	// Log the start of the webhook function for debugging in production.
	console.log("[Stripe Webhook] Function started.");

	const body = await req.text();
	const signature = (await headers()).get("Stripe-Signature");

	if (!signature)
		return NextResponse.json({ error: "Missing signature" }, { status: 400 });

	// Next.js App Router provides req.arrayBuffer for raw body
	const buf = Buffer.from(body);

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(buf, signature, env.STRIPE_WEBHOOK_SECRET);
	} catch (err: any) {
		return NextResponse.json(
			{ error: `Webhook Error: ${err.message}` },
			{ status: 400 },
		);
	}

	// Log that the event is being processed.
	console.log(`[Stripe Webhook] Processing event with ID: ${event.id}, Type: ${event.type}`);

	// Use Redis to ensure idempotency
	const eventId = event.id;
	const isEventProcessed = await redis.get(`stripe_event:${eventId}`);

	if (isEventProcessed) {
		// Log if the event was already processed.
		console.log(`[Stripe Webhook] Event ${eventId} already processed.`);
		return NextResponse.json({
			received: true,
			message: "Event already processed",
		});
	}

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				const purchaseId = session.metadata?.purchaseId; // Retrieve our internal purchaseId
				const stripeCheckoutSessionId = session.id; // Retrieve Stripe's checkout session ID
				// const companyListingId = session.metadata?.companyListingId; // Keep for now in case of old sessions
				// const buyerId = session.metadata?.buyerId; // Keep for now in case of old sessions

				const amountTotal = session.amount_total ?? 0; // in cents

				// Log the extracted purchaseId and Stripe Checkout Session ID.
				console.log(`[Stripe Webhook] checkout.session.completed - Purchase ID: ${purchaseId}, Stripe Checkout Session ID: ${stripeCheckoutSessionId}`);

				if (purchaseId) {
					console.log(
						`[Stripe Webhook] Processing checkout.session.completed for purchase: ${purchaseId}. Session ID: ${session.id}`,
					);

					// Fetch the listing associated with the purchase
					const purchase = await db.query.purchases.findFirst({
						where: eq(purchases.id, purchaseId),
						with: { companyListing: true }, // Eager load the related companyListing
					});

					if (purchase) {
						console.log(
							`[Stripe Webhook] Purchase record found (ID: ${purchaseId}). Current status: ${purchase.status}. Listing ID: ${purchase.companyListingId}`,
						);

						// Check if the purchase is already completed or processing to prevent redundant updates
						if (
							purchase.status === "COMPLETED" ||
							purchase.status === "PROCESSING"
						) {
							console.log(
								`[Stripe Webhook] Purchase ${purchaseId} already COMPLETED or PROCESSING. Skipping update.`,
							);
							// Ensure idempotency key is set even if not updating
							await redis.set(`stripe_event:${eventId}`, "processed", {
								ex: 60 * 60 * 24 * 7, // 1 week
							});
							// Log idempotency key set.
							console.log(`[Stripe Webhook] Idempotency key set for event ${eventId}.`);
							return NextResponse.json({ received: true });
						}

						// Update the existing purchase record
						await db
							.update(purchases)
							.set({
								status: "COMPLETED",
								paymentMethod: "stripe",
								purchasePrice: new Decimal(amountTotal).dividedBy(100), // Convert cents to EUR
								stripeCheckoutSessionId: stripeCheckoutSessionId, // Store Stripe's checkout session ID
								updatedAt: new Date(),
							})
							.where(eq(purchases.id, purchaseId));

						// Log successful purchase update.
						console.log(`[Stripe Webhook] Purchase ${purchaseId} status updated to COMPLETED.`);

						// Update the listing status to 'SOLD'
						await db
							.update(listings)
							.set({
								status: "SOLD",
								updatedAt: new Date(),
							})
							.where(eq(listings.id, purchase.companyListingId));

						// Log successful listing status update.
						console.log(`[Stripe Webhook] Listing ${purchase.companyListingId} status updated to SOLD.`);

						// Record the event as processed to prevent duplicate processing
						await redis.set(`stripe_event:${eventId}`, "processed", {
							ex: 60 * 60 * 24 * 7, // Keep for 1 week
						});
						// Log idempotency key set.
						console.log(`[Stripe Webhook] Idempotency key set for event ${eventId}.`);

						// Send confirmation email
						if (purchase.userId && purchase.user) {
							await sendPurchaseConfirmationEmail({
								recipientEmail: purchase.user.email,
								purchaseId: purchase.id,
								productName: purchase.companyListing.title,
								totalAmount: new Decimal(amountTotal).dividedBy(100),
							});
							// Log confirmation email sent.
							console.log(`[Stripe Webhook] Purchase confirmation email sent to ${purchase.user.email} for purchase ${purchase.id}.`);
						} else {
							// Log if email could not be sent.
							console.warn(`[Stripe Webhook] Could not send purchase confirmation email for purchase ${purchase.id}. User or email missing.`);
						}
					} else {
						// Log if purchase record not found.
						console.warn(`[Stripe Webhook] Purchase record with ID ${purchaseId} not found.`);
					}
				} else {
					// Log if purchaseId is missing in session metadata.
					console.error("[Stripe Webhook] `purchaseId` missing in checkout session metadata.");
				}
				break;
			}
			case "checkout.session.async_payment_failed":
			case "checkout.session.expired": {
				// No-op for now
				break;
			}
			case "payment_intent.succeeded": {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				// Log PaymentIntent ID for succeeded events.
				console.log(`[Stripe Webhook] PaymentIntent succeeded: ${paymentIntent.id}. Status: ${paymentIntent.status}`);
				break;
			}
			case "payment_intent.payment_failed": {
				const paymentIntent = event.data.object as Stripe.PaymentIntent;
				// Log PaymentIntent ID for failed events.
				console.error(`[Stripe Webhook] PaymentIntent failed: ${paymentIntent.id}. Status: ${paymentIntent.status}. Last payment error: ${paymentIntent.last_payment_error?.message}`);
				break;
			}
			case "invoice.paid": {
				const invoice = event.data.object as Stripe.Invoice;
				// Log Invoice ID for paid events.
				console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}. Customer: ${invoice.customer}. Status: ${invoice.status}`);
				break;
			}
			case "invoice.payment_failed": {
				const invoice = event.data.object as Stripe.Invoice;
				// Log Invoice ID for failed payment events.
				console.error(`[Stripe Webhook] Invoice payment failed: ${invoice.id}. Customer: ${invoice.customer}. Status: ${invoice.status}. Last payment error: ${invoice.last_payment_error?.message}`);
				break;
			}
			// Handle other event types as needed
			default:
				// Log unhandled event types.
				console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
		}
		// After successful processing, mark the event as processed in Redis
		await redis.set(`stripe_event:${eventId}`, "processed", {
			ex: 60 * 60 * 24 * 7, // Keep for 1 week to prevent replay attacks
		});
		// Log idempotency key set.
		console.log(`[Stripe Webhook] Idempotency key set for event ${eventId}.`);
	} catch (error) {
		// Log any errors during event processing.
		console.error(`[Stripe Webhook] Error processing event ${event.id}:`, error);
		// Optionally re-throw or handle specific errors
		return NextResponse.json(
			{ error: "Webhook handler failed" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ received: true });
}
