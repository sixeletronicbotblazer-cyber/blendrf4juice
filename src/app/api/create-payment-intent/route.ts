import { NextResponse } from "next/server";
import { getStripe, CURRENCY } from "@/lib/stripe";
import {
  PRICES_CENTS,
  cartBottleCount,
  cartDescription,
  type CartItem,
  type BundleKey,
} from "@/lib/blendr-catalog";

/**
 * POST /api/create-payment-intent
 *
 * Body: { cart: CartItem[] }
 * Response: { clientSecret: string, amount: number, currency: string, id: string }
 *
 * Security: the amount is recomputed SERVER-SIDE from the catalog, never
 * trusted from the client. The client only sends which bundles/sets/colors
 * it wants; the server looks up the canonical price.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const incomingCart = body?.cart;
    if (!Array.isArray(incomingCart) || incomingCart.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty." },
        { status: 400 }
      );
    }

    // Validate + canonicalize every item, summing the price server-side.
    let amountCents = 0;
    const sanitized: CartItem[] = [];
    for (const raw of incomingCart) {
      const bundle = Number(raw?.bundle) as BundleKey;
      if (![1, 2, 3].includes(bundle)) {
        return NextResponse.json(
          { error: `Invalid bundle: ${raw?.bundle}` },
          { status: 400 }
        );
      }
      const sets = Number(raw?.sets);
      if (!Number.isInteger(sets) || sets < 1 || sets > 20) {
        return NextResponse.json(
          { error: `Invalid quantity: ${raw?.sets}` },
          { status: 400 }
        );
      }
      const colors = Array.isArray(raw?.colors) ? raw.colors : [];
      if (
        !colors.every(
          (c: unknown) => c === "pink" || c === "ivory"
        )
      ) {
        return NextResponse.json(
          { error: "Invalid color selection." },
          { status: 400 }
        );
      }
      amountCents += PRICES_CENTS[bundle] * sets;
      sanitized.push({ bundle, sets, colors: colors as CartItem["colors"] });
    }

    if (amountCents < 50) {
      // Stripe minimum is 50 cents (USD).
      return NextResponse.json(
        { error: "Order total is below the minimum." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        brand: "Blendr",
        bottle_count: String(cartBottleCount(sanitized)),
        items: cartDescription(sanitized).slice(0, 500),
        // store the line items as JSON for the webhook to read
        cart_json: JSON.stringify(sanitized).slice(0, 500),
        source: "blendr-web",
      },
      description: `Blendr order — ${cartDescription(sanitized)}`.slice(0, 1000),
    });

    return NextResponse.json({
      id: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[create-payment-intent]", message);
    return NextResponse.json(
      { error: `Could not start checkout: ${message}` },
      { status: 500 }
    );
  }
}
