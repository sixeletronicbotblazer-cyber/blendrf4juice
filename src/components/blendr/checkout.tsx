"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { PRICES_USD, type CartItem } from "@/lib/blendr-catalog";

type StripeConfig = {
  publishableKey: string;
  ready: boolean;
  webhookConfigured: boolean;
  mode: "test" | "live";
};

type IntentResponse = {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
};

const BAG_KEY = "blendr-preview-bag";

function loadCart(): CartItem[] {
  try {
    const saved = JSON.parse(localStorage.getItem(BAG_KEY) || "[]");
    if (Array.isArray(saved)) {
      return saved.filter(
        (item: CartItem) =>
          PRICES_USD[item.bundle as 1 | 2 | 3] &&
          Array.isArray(item.colors) &&
          Number.isInteger(item.sets) &&
          item.sets > 0
      );
    }
  } catch {
    /* ignore */
  }
  return [];
}

function formatAmount(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/** Lazy-loaded singleton Stripe.js instance. */
let stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

function CheckoutForm({
  clientSecret,
  amount,
  currency,
  onClose,
  onPaid,
}: {
  clientSecret: string;
  amount: number;
  currency: string;
  onClose: () => void;
  onPaid: (intentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // After a successful 3-D Secure redirect, return here.
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed. Please try again.");
      setProcessing(false);
    } else if (result.paymentIntent?.status === "succeeded") {
      onPaid(result.paymentIntent.id);
      setProcessing(false);
    } else {
      // Other statuses (requires_action, processing…) — Stripe handles these.
      setError(
        `Payment status: ${result.paymentIntent?.status}. Follow any prompt above.`
      );
      setProcessing(false);
    }
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <div className="checkout-amount-row">
        <span>Total to pay</span>
        <strong>{formatAmount(amount, currency)}</strong>
      </div>
      <PaymentElement
        options={{ layout: "tabs" }}
        onChange={() => setError("")}
      />
      {error ? <p className="checkout-error" role="alert">{error}</p> : null}
      <button
        type="submit"
        className="button button-primary checkout-pay-button"
        disabled={!stripe || !elements || processing}
      >
        {processing ? (
          <>
            <span className="checkout-spinner" aria-hidden="true" />
            PROCESSING…
          </>
        ) : (
          <>
            PAY {formatAmount(amount, currency)} <span aria-hidden="true">→</span>
          </>
        )}
      </button>
      <p className="checkout-secure">
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Secured by Stripe · card details never touch our server
      </p>
    </form>
  );
}

export default function BlendrCheckout({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [intent, setIntent] = useState<IntentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [startError, setStartError] = useState("");
  const [paid, setPaid] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // 1) Load Stripe config from the server.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/stripe-config")
      .then((r) => r.json())
      .then((cfg: StripeConfig) => {
        if (cancelled) return;
        setConfig(cfg);
        setCart(loadCart());
      })
      .catch(() => {
        if (!cancelled) setStartError("Could not reach the checkout service.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Create a PaymentIntent when the modal opens and the cart is ready.
  const createIntent = useCallback(async (items: CartItem[]) => {
    setLoading(true);
    setStartError("");
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: items }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not start checkout.");
      }
      setIntent(data as IntentResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStartError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (config?.ready && cart.length > 0) {
      createIntent(cart);
    }
  }, [config, cart, createIntent]);

  // Esc closes the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock background scroll while modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const cartTotalCents = cart.reduce(
    (sum, item) =>
      sum + PRICES_USD[item.bundle as 1 | 2 | 3] * item.sets * 100,
    0
  );

  return (
    <div
      className="checkout-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="checkout-modal">
        <div className="checkout-header">
          <div>
            <small>SECURE CHECKOUT</small>
            <h2>Pay for your Blendr</h2>
          </div>
          <button
            type="button"
            aria-label="Close checkout"
            className="checkout-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="checkout-body">
          {loading ? (
            <div className="checkout-loading">
              <span className="checkout-spinner" aria-hidden="true" />
              <p>Preparing your secure checkout…</p>
            </div>
          ) : paid ? (
            <div className="checkout-success">
              <div className="checkout-success-icon" aria-hidden="true">
                ✓
              </div>
              <h3>Thank you — payment received</h3>
              <p>
                Your Blendr order is confirmed. A receipt has been sent to your
                email by Stripe.
              </p>
              <p className="checkout-receipt">
                Payment reference: <code>{paid}</code>
              </p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  try {
                    localStorage.removeItem(BAG_KEY);
                  } catch {
                    /* ignore */
                  }
                  onClose();
                  // return to the top of the product page
                  window.location.href = "/?page=product";
                }}
              >
                DONE <span aria-hidden="true">→</span>
              </button>
            </div>
          ) : !config?.ready ? (
            <div className="checkout-not-configured">
              <h3>Stripe is not connected yet</h3>
              <p>
                Add your Stripe keys to <code>.env.local</code> to enable live
                payment. See <code>STRIPE_SETUP.md</code> for the step-by-step.
              </p>
              <ul className="checkout-env-list">
                <li>
                  <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> —{" "}
                  <code>pk_test_…</code> or <code>pk_live_…</code>
                </li>
                <li>
                  <code>STRIPE_SECRET_KEY</code> —{" "}
                  <code>sk_test_…</code> or <code>sk_live_…</code>
                </li>
                <li>
                  <code>STRIPE_WEBHOOK_SECRET</code> —{" "}
                  <code>whsec_…</code> (from Dashboard → Webhooks)
                </li>
              </ul>
              <p className="checkout-mode">
                Current mode:{" "}
                <strong>
                  {config
                    ? `${config.mode} (publishable key ${
                        config.publishableKey ? "present" : "missing"
                      })`
                    : "loading…"}
                </strong>
              </p>
            </div>
          ) : startError ? (
            <div className="checkout-error-state">
              <h3>Could not start checkout</h3>
              <p>{startError}</p>
              <button
                type="button"
                className="button button-primary"
                onClick={() => createIntent(cart)}
              >
                TRY AGAIN <span aria-hidden="true">↻</span>
              </button>
            </div>
          ) : intent ? (
            <Elements
              stripe={getStripePromise(config!.publishableKey)}
              options={{
                clientSecret: intent.clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#7950c5",
                    fontFamily: "'DM Sans', Arial, sans-serif",
                    borderRadius: "12px",
                  },
                },
              }}
            >
              <CheckoutForm
                clientSecret={intent.clientSecret}
                amount={intent.amount}
                currency={intent.currency}
                onClose={onClose}
                onPaid={(id) => setPaid(id)}
              />
            </Elements>
          ) : null}

          {cart.length > 0 && !paid && (
            <div className="checkout-summary">
              <div className="checkout-summary-head">Order summary</div>
              {cart.map((item, i) => (
                <div className="checkout-summary-line" key={i}>
                  <span>
                    Blendr{" "}
                    {item.bundle === 1
                      ? "Solo"
                      : item.bundle === 2
                      ? "Pair"
                      : "Trio"}{" "}
                    · {item.bundle * item.sets}{" "}
                    {item.bundle * item.sets === 1 ? "bottle" : "bottles"}
                    {item.sets > 1 ? ` · ${item.sets} sets` : ""}
                  </span>
                  <strong>
                    $
                    {(
                      PRICES_USD[item.bundle as 1 | 2 | 3] * item.sets
                    ).toFixed(2)}
                  </strong>
                </div>
              ))}
              <div className="checkout-summary-total">
                <span>Total</span>
                <strong>${(cartTotalCents / 100).toFixed(2)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
