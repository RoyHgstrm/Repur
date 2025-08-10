"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!pk) {
      throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY puuttuu");
    }
    stripePromise = loadStripe(pk);
  }
  return stripePromise;
}


