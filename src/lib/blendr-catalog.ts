/**
 * Shared product catalog — used by both the client cart and the Stripe
 * server routes so prices always agree. Edit in one place.
 *
 * Prices are in USD cents to avoid floating-point issues at the payment layer.
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

export const BUNDLE_LABELS: Record<BundleKey, string> = {
  1: "Solo",
  2: "Pair",
  3: "Trio",
};

export const CURRENCY = "usd";

export type CartItem = {
  bundle: BundleKey;
  sets: number;
  colors: ("pink" | "ivory")[];
};

/** Compute the USD total for a cart. */
export function cartTotalUsd(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + PRICES_USD[item.bundle] * item.sets, 0);
}

/** Compute the total in cents for Stripe. */
export function cartTotalCents(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + PRICES_CENTS[item.bundle] * item.sets, 0);
}

/** Total bottle count across a cart (used for order metadata). */
export function cartBottleCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.bundle * item.sets, 0);
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
