import { z } from 'zod';
import Stripe from 'stripe';
import { env } from '~/env';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { eq } from 'drizzle-orm';
import { listings } from '~/server/db/schema';

// HOW: Server-only Stripe client configured with API version for stability.
// WHY: Explicit API versioning prevents unexpected breaking changes on Stripe upgrades.
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export const paymentsRouter = createTRPCRouter({
  // Create a Checkout Session for purchasing a single company listing
  createCheckoutSession: protectedProcedure
    .input(z.object({
      companyListingId: z.string(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Load listing and compute final price (account for discount window if available)
      const listing = await ctx.db.query.listings.findFirst({
        where: eq(listings.id, input.companyListingId),
      });
      if (!listing || listing.status !== 'ACTIVE') {
        throw new Error('Listaus ei ole saatavilla');
      }

      const basePriceCents = Math.round(Number(listing.basePrice) * 100);
      let unitAmount = basePriceCents;
      const now = new Date();
      const hasWindow = listing.discountStart && listing.discountEnd
        ? now >= new Date(String(listing.discountStart)) && now <= new Date(String(listing.discountEnd))
        : false;
      if (hasWindow && listing.discountAmount != null) {
        const discountCents = Math.round(Number(listing.discountAmount) * 100);
        unitAmount = Math.max(0, basePriceCents - discountCents);
      }

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              product_data: {
                name: listing.title,
                description: listing.description,
              },
              unit_amount: unitAmount,
            },
          },
        ],
        metadata: {
          companyListingId: listing.id,
          buyerId: ctx.userId,
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });

      return { id: session.id, url: session.url };
    }),
});


