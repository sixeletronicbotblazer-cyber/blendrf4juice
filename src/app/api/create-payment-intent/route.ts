import { NextResponse } from "next/server";
import { getStripe, CURRENCY } from "@/lib/stripe";
import {
  PRICES_CENTS,
  STRIPE_PRICE_IDS,
  STRIPE_PRODUCT_IDS,
  BUNDLE_LABELS,
  MAX_BOTTLES_PER_ORDER,
  SHIPPING_OPTIONS,
  cartBottleCount,
  cartDescription,
  type CartItem,
  type BundleKey,
  type ShippingOption,
} from "@/lib/blendr-catalog";

/**
 * POST /api/create-payment-intent
 *
 * Body: { cart: CartItem[], shipping: "standard" | "priority" }
 * Response: { clientSecret, amount, currency, id, shipping, shippingUsd, itemsUsd }
 *
 * Security:
 *   - amount recomputed SERVER-SIDE (client never sends a price)
 *   - total bottles hard-capped at MAX_BOTTLES_PER_ORDER (3)
 *   - shipping value comes from the server's own SHIPPING_OPTIONS table
 *   - the Stripe amount = items + shipping (never charged twice)
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
    let itemsCents = 0;
    let bottleCount = 0;
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
      if (!colors.every((c: unknown) => c === "pink" || c === "ivory")) {
        return NextResponse.json(
          { error: "Invalid color selection." },
          { status: 400 }
        );
      }
      itemsCents += PRICES_CENTS[bundle] * sets;
      bottleCount += bundle * sets;
      sanitized.push({ bundle, sets, colors: colors as CartItem["colors"] });
    }

    // Hard cap on total bottles per order.
    if (bottleCount > MAX_BOTTLES_PER_ORDER) {
      return NextResponse.json(
        {
          error: `This order has ${bottleCount} bottles. The limit is ${MAX_BOTTLES_PER_ORDER} bottles per order.`,
        },
        { status: 400 }
      );
    }

    // Resolve the shipping option server-side — never trust a client-supplied
    // shipping amount. Default to standard (free) if missing/invalid.
    const incomingShipping = String(body?.shipping) as ShippingOption;
    const shipping: ShippingOption =
      incomingShipping === "priority" ? "priority" : "standard";
    const shippingCents = SHIPPING_OPTIONS[shipping].cents;

    const amountCents = itemsCents + shippingCents;

    if (amountCents < 50) {
      return NextResponse.json(
        { error: "Order total is below the minimum." },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Comma-separated lists of Stripe Price IDs + Product IDs for every
    // line item so the Dashboard groups payments by product.
    const priceIds = sanitized
      .map((item) => STRIPE_PRICE_IDS[item.bundle])
      .join(",");
    const productIds = sanitized
      .map((item) => STRIPE_PRODUCT_IDS[item.bundle])
      .join(",");
    const bundleLabels = sanitized
      .map((item) => BUNDLE_LABELS[item.bundle])
      .join(",");

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        brand: "Blendr",
        bottle_count: String(bottleCount),
        items: cartDescription(sanitized).slice(0, 500),
        // store the line items as JSON for the webhook to read
        cart_json: JSON.stringify(sanitized).slice(0, 500),
        // Stripe product/price references — keeps the Dashboard organized
        stripe_price_ids: priceIds,
        stripe_product_ids: productIds,
        bundles: bundleLabels,
        // shipping record so the fulfillment side knows how to ship
        shipping_option: shipping,
        shipping_label: SHIPPING_OPTIONS[shipping].label,
        shipping_cents: String(shippingCents),
        items_cents: String(itemsCents),
        source: "blendr-web",
      },
      description: `Blendr order — ${cartDescription(sanitized)}${
        shipping === "priority" ? " · priority shipping" : ""
      }`.slice(0, 1000),
    });

    return NextResponse.json({
      id: intent.id,
      clientSecret: intent.client_secret,
      amount: intent.amount,
      currency: intent.currency,
      shipping,
      shippingUsd: SHIPPING_OPTIONS[shipping].usd,
      itemsUsd: itemsCents / 100,
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
