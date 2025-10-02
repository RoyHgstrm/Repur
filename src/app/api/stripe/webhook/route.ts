

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '~/env';
import { db } from '~/server/db';
import { listings, purchases, warranties } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { limiter } from '~/lib/rate-limiter';
import { redis } from '~/lib/redis';
import { revalidatePath } from 'next/cache';

// HOW: Read raw body to verify Stripe signature.
// WHY: Stripe requires exact raw payload for signature verification to prevent tampering.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

// Use the latest pinned version supported by installed stripe typings
const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.basil' });

export async function POST(req: NextRequest) {
  // Basic rate-limit per IP for webhooks to avoid floods
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await limiter.limit(`stripe:webhook:${ip}`);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  // Next.js App Router provides req.arrayBuffer for raw body
  const buf = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Use Redis to ensure idempotency
  const eventId = event.id;
  const isEventProcessed = await redis.get(`stripe_event:${eventId}`);

  if (isEventProcessed) {
    return NextResponse.json({ received: true, message: 'Event already processed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const purchaseId = session.metadata?.purchaseId; // Retrieve our internal purchaseId
        // const companyListingId = session.metadata?.companyListingId; // Keep for now in case of old sessions
        // const buyerId = session.metadata?.buyerId; // Keep for now in case of old sessions

        const amountTotal = session.amount_total ?? 0; // in cents

        if (purchaseId) {
          console.log(`[Stripe Webhook] Processing checkout.session.completed for purchase: ${purchaseId}`);

          // Fetch the listing associated with the purchase
          const purchase = await db.query.purchases.findFirst({ where: eq(purchases.id, purchaseId) });

          if (purchase) {
            console.log(`[Stripe Webhook] Purchase record found. Attempting to update status to COMPLETED for purchase: ${purchaseId}.`);

            // Update the existing purchase record
            await db.update(purchases).set({
              status: 'COMPLETED',
              // Update paymentMethod and shippingAddress if provided by Stripe, otherwise keep existing
              // paymentMethod: session.payment_method_details?.card?.brand ?? purchase.paymentMethod,
              // shippingAddress: session.customer_details?.address ? JSON.stringify(session.customer_details.address) : purchase.shippingAddress,
              // Ensure purchasePrice is accurate from Stripe session
              purchasePrice: ((amountTotal ?? 0) / 100).toString(),
            }).where(eq(purchases.id, purchaseId));
            console.log(`[Stripe Webhook] Purchase record updated to COMPLETED for purchase: ${purchaseId}.`);

            // Mark listing as SOLD
            if (purchase.companyListingId) {
              console.log(`[Stripe Webhook] Attempting to mark listing ${purchase.companyListingId} as SOLD.`);
              await db.update(listings).set({ status: 'SOLD' }).where(eq(listings.id, purchase.companyListingId));
              console.log(`[Stripe Webhook] Listing status update attempted for listing: ${purchase.companyListingId}.`);
            }

            // Create warranty for this purchase: 12 months default
            try {
              const start = new Date();
              const end = new Date(start);
              end.setMonth(end.getMonth() + 12);
              await db.insert(warranties).values({
                id: purchaseId + ':w',
                purchaseId: purchaseId,
                startDate: start,
                endDate: end,
                status: 'ACTIVE',
                terms: '12 kuukauden takuu kaikille komponenteille',
              }).onConflictDoNothing();
            } catch (e) {
              console.error('Warranty creation failed', e);
            }
            console.log(`[Stripe Webhook] Warranty creation attempted for purchase: ${purchaseId}.`);

            // Invalidate Redis cache
            if (purchase.companyListingId) {
              await redis.del('listings:active');
              await redis.del(`listing:${purchase.companyListingId}`);
              console.log(`[Stripe Webhook] Redis cache invalidated for listing: ${purchase.companyListingId}.`)
            }
            // Revalidate Next.js paths
            revalidatePath('/admin');
            revalidatePath('/osta');
            revalidatePath(`/osta/${purchase.companyListingId}`);
            revalidatePath('/');
          } else {
            console.error(`[Stripe Webhook] Purchase record not found for ID: ${purchaseId}. This might indicate an issue with initial purchase record creation.`);
            // Optionally handle this case, e.g., create a new purchase record here if it's truly missing.
            // For now, we will rely on the initial creation in payments.ts.
          }
        }
        break;
      }
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        // No-op for now
        break;
      }
      default:
        // Ignore other events
        break;
    }

    // Mark event as processed in Redis
    await redis.set(`stripe_event:${eventId}`, 'processed', { ex: 60 * 60 * 24 }); // Expire in 24 hours

  } catch (e) {
    console.error('Stripe webhook handling error:', e);
    return NextResponse.json({ received: true, error: 'handler' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}


