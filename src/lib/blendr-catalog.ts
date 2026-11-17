/**
 * Shared product catalog — used by both the client cart and the Stripe
 * server routes so prices always agree. Edit in one place.
 *
 * Prices are in USD cents to avoid floating-point issues at the payment layer.
 *
 * Products & Prices were created on the Stripe account via API:
 *   Solo  → prod_VeAroMBdoPz95n  /  price_1UcsWEINb4DvJlyBM12bzZHP
 *   Pair  → prod_VeArLCk9EJpkMT  /  price_1UcsWFINb4DvJlyB65AJFJPY
 *   Trio  → prod_VeAr8itvdaxYK5  /  price_1UcsWFINb4DvJlyBKcBDDdBy
 * They are mirrored here so each Payment Intent carries the matching
 * product/price metadata and the Stripe Dashboard shows clean line items.
 */
export type BundleKey = 1 | 2 | 3;

export const PRICES_USD: Record<BundleKey, number> = {
  1: 49.97,
  2: 94.97,
  3: 124.97,
};

/** Price in cents for the Stripe API (USD has 2 decimals). */
export const PRICES_CENTS: Record<BundleKey, number> = {
  1: 4997,
  2: 9497,
  3: 12497,
};

/** Stripe Price object IDs (one-time prices, USD). */
export const STRIPE_PRICE_IDS: Record<BundleKey, string> = {
  1: "price_1UcsWEINb4DvJlyBM12bzZHP",
  2: "price_1UcsWFINb4DvJlyB65AJFJPY",
  3: "price_1UcsWFINb4DvJlyBKcBDDdBy",
};

/** Stripe Product object IDs. */
export const STRIPE_PRODUCT_IDS: Record<BundleKey, string> = {
  1: "prod_VeAroMBdoPz95n",
  2: "prod_VeArLCk9EJpkMT",
  3: "prod_VeAr8itvdaxYK5",
};

export const BUNDLE_LABELS: Record<BundleKey, string> = {
  1: "Solo",
  2: "Pair",
  3: "Trio",
};

export const CURRENCY = "usd";

/** Hard limit on total bottles per order (Solo=1, Pair=2, Trio=3 × sets). */
export const MAX_BOTTLES_PER_ORDER = 3;

/** Shipping options. Priority is per-order (not per-bottle). */
export const SHIPPING_STANDARD_CENTS = 0; // FREE
export const SHIPPING_PRIORITY_CENTS = 999; // $9.99 per order

export type ShippingOption = "standard" | "priority";

export const SHIPPING_OPTIONS: Record<
  ShippingOption,
  { label: string; cents: number; usd: number }
> = {
  standard: { label: "Standard shipping", cents: SHIPPING_STANDARD_CENTS, usd: 0 },
  priority: { label: "Priority shipping", cents: SHIPPING_PRIORITY_CENTS, usd: 9.99 },
};

export type CartItem = {
  bundle: BundleKey;
  sets: number;
  colors: ("pink" | "ivory")[];
};

/** Compute the USD total for a cart (items only, no shipping). */
export function cartTotalUsd(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + PRICES_USD[item.bundle] * item.sets, 0);
}

/** Compute the total in cents for Stripe (items only, no shipping). */
export function cartTotalCents(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + PRICES_CENTS[item.bundle] * item.sets, 0);
}

/** Total bottle count across a cart (used for order metadata + limit). */
export function cartBottleCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.bundle * item.sets, 0);
}

/** Grand total in cents including shipping. */
export function grandTotalCents(
  cart: CartItem[],
  shipping: ShippingOption
): number {
  return cartTotalCents(cart) + SHIPPING_OPTIONS[shipping].cents;
}

/** Grand total in USD including shipping. */
export function grandTotalUsd(
  cart: CartItem[],
  shipping: ShippingOption
): number {
  return cartTotalUsd(cart) + SHIPPING_OPTIONS[shipping].usd;
}

/** Build a short human description for the Stripe metadata / receipt. */
export function cartDescription(cart: CartItem[]): string {
  if (cart.length === 0) return "Empty bag";
  return cart
    .map((item) => {
      const label = BUNDLE_LABELS[item.bundle];
      const bottles = item.bundle * item.sets;
      const colors = item.colors.map((c) => (c === "pink" ? "Pink" : "Ivory")).join("+");
      const setsSuffix = item.sets > 1 ? ` x${item.sets}` : "";
      return `Blendr ${label}${setsSuffix} (${bottles}b, ${colors})`;
    })
    .join(" | ");
}
