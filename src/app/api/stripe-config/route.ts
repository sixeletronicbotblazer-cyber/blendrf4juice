import { NextResponse } from "next/server";

/**
 * GET /api/stripe-config
 *
 * Returns the publishable key (safe to expose to the browser) and whether
 * Stripe is fully configured. The frontend uses this to decide whether to
 * show the embedded checkout or the "not yet configured" notice.
 */
export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const secretConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const webhookConfigured = Boolean(process.env.STRIPE_WEBHOOK_SECRET);

  return NextResponse.json({
    publishableKey,
    ready: Boolean(publishableKey && secretConfigured),
    webhookConfigured,
    mode: publishableKey.startsWith("pk_live") ? "live" : "test",
  });
}
