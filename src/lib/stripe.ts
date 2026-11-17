import Stripe from "stripe";
import { CURRENCY } from "@/lib/blendr-catalog";

/**
 * Server-only Stripe instance.
 *
 * Reads the secret key from STRIPE_SECRET_KEY.
 * In test mode the key looks like `sk_test_...`; in live mode `sk_live_...`.
 *
 * IMPORTANT: this file must never be imported by a Client Component.
 * Only use it inside Route Handlers (app/api/**) or Server Actions.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add it to .env.local (see STRIPE_SETUP.md)."
    );
  }
  cached = new Stripe(secretKey, {
    apiVersion: "2025-09-30.clover" as Stripe.LatestApiVersion,
    appInfo: { name: "Blendr Juice", version: "1.0.0" },
    typescript: true,
  });
  return cached;
}

export { CURRENCY };
