

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { env } from '~/env';
import { db } from '~/server/db';
import { listings, purchases, warranties } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import { limiter } from '~/lib/rate-limiter';
import { redis } from '~/lib/redis';

// HOW: Read raw body to verify Stripe signature.
// WHY: Stripe requires exact raw payload for signature verification to prevent tampering.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';

// Use the latest pinned version supported by installed stripe typings
const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-07-30.basil' });

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
        const companyListingId = session.metadata?.companyListingId;
        const buyerId = session.metadata?.buyerId;
        const amountTotal = session.amount_total ?? 0; // in cents

        if (companyListingId) {
          console.log(`[Stripe Webhook] Processing checkout.session.completed for listing: ${companyListingId}, buyer: ${buyerId}`);
          console.log(`[Stripe Webhook] Attempting to mark listing ${companyListingId} as SOLD.`);
          // Mark listing as SOLD and insert purchase row if not already existing
          const listing = await db.query.listings.findFirst({ where: eq(listings.id, companyListingId) });
          if (listing) {
            console.log(`[Stripe Webhook] Listing found. Attempting to insert purchase record for session: ${session.id}`);
            // Upsert purchase by session.id idempotency via unique (id) if we used session.id earlier, otherwise insert new
            await db.insert(purchases).values({
              id: session.id, // use Stripe session id as primary key to ensure idempotency
              companyListingId,
              userId: buyerId ?? null,
              purchasePrice: ((amountTotal ?? 0) / 100).toString(),
              paymentMethod: 'stripe',
              shippingAddress: '-',
              status: 'COMPLETED',
            }).onConflictDoNothing();
            console.log(`[Stripe Webhook] Purchase record insert attempted for session: ${session.id}.`);
            console.log(`[Stripe Webhook] Attempting to update listing status to SOLD for listing: ${companyListingId}.`);

            await db.update(listings).set({ status: 'SOLD' }).where(eq(listings.id, companyListingId));
            console.log(`[Stripe Webhook] Listing status update attempted for listing: ${companyListingId}.`);

            // Create warranty for this purchase: 12 months default
            try {
              const start = new Date();
              const end = new Date(start);
              end.setMonth(end.getMonth() + 12);
              await db.insert(warranties).values({
                id: session.id + ':w',
                purchaseId: session.id,
                startDate: start,
                endDate: end,
                status: 'ACTIVE',
                terms: '12 kuukauden takuu kaikille komponenteille',
              }).onConflictDoNothing();
            } catch (e) {
              // Don't fail webhook if warranty insert races; it can be recomputed
              console.error('Warranty creation failed', e);
            }
            console.log(`[Stripe Webhook] Warranty creation attempted for purchase: ${session.id}.`);

            // Invalidate Redis cache
            await redis.del('listings:active');
            await redis.del(`listing:${companyListingId}`);
            console.log(`[Stripe Webhook] Redis cache invalidated for listing: ${companyListingId}.`)
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


