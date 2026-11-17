import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

/**
 * POST /api/stripe-webhook
 *
 * Verifies the Stripe signature with STRIPE_WEBHOOK_SECRET, then handles:
 *   - payment_intent.succeeded  → fulfill the order (mark paid, send email, ship…)
 *   - payment_intent.payment_failed → log/alert
 *
 * Configure this URL in the Stripe Dashboard → Developers → Webhooks,
 * OR run `stripe listen --forward-to localhost:3000/api/stripe-webhook`
 * for local testing (that prints a whsec_... signing secret to use).
 *
 * The body must be the RAW request (not parsed JSON) because Stripe
 * verifies the signature over the exact bytes — so we read the buffer.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        console.log(
          `[stripe-webhook] payment_intent.succeeded id=${intent.id} amount=${
            intent.amount
          } ${intent.currency} metadata=`,
          intent.metadata
        );
        // TODO: fulfillment hook — create a DB order, send a confirmation
        // email, notify the warehouse, etc. Metadata on the intent includes
        // `items`, `bottle_count`, `cart_json` (see create-payment-intent).
        break;
      }
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        console.warn(
          `[stripe-webhook] payment_failed id=${intent.id} reason=`,
          intent.last_payment_error?.message
        );
        break;
      }
      default:
        // Other event types — ignore for now.
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe-webhook] handler error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
