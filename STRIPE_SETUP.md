# Stripe checkout setup — Blendr

This project ships with a **transparent (embedded) Stripe checkout**. The card
form renders inside your site (no redirect to Stripe.com), powered by Stripe
Elements. The payment is confirmed on the client and verified on the server
through a webhook.

You only need to add **3 keys** to `.env.local`. Everything else is already
wired.

---

## 1 — Get your keys from Stripe

Sign in at <https://dashboard.stripe.com> and use **test mode** first (the
"Test mode" toggle in the top right).

| Variable | Where to find it | Looks like |
| --- | --- | --- |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Developers → **API keys** → Publishable key | `pk_test_abc123…` |
| `STRIPE_SECRET_KEY` | Developers → **API keys** → Secret key (click "Reveal test key") | `sk_test_abc123…` |
| `STRIPE_WEBHOOK_SECRET` | Developers → **Webhooks** → click your endpoint → Signing secret (or use the CLI, see below) | `whsec_abc123…` |

When you are ready to accept real money, repeat with live keys
(`pk_live_…`, `sk_live_…`).

---

## 2 — Add the keys to `.env.local`

Open `.env.local` (already created with placeholders) and fill in the three
values:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Save the file and restart the dev server (`bun run dev`). The checkout will
switch from "not connected yet" to the live card form automatically.

> If you send me the keys in chat I can apply them for you — paste all three
> and say "apply these". I will write them to `.env.local` and restart the
> server. **Do not paste live keys (`sk_live_…`) in chat.** Use test keys
> (`sk_test_…`) until launch.

---

## 3 — Webhook: how Stripe tells us a payment succeeded

The webhook (`/api/stripe-webhook`) verifies the event signature and marks
the order as paid. You have two ways to set it up:

### Option A — Stripe CLI (recommended for local testing)

Install the Stripe CLI: <https://github.com/stripe/stripe-cli>

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

It prints `> Ready! Your webhook signing secret is whsec_xxxxxx…` — copy that
into `STRIPE_WEBHOOK_SECRET` and restart.

### Option B — Dashboard endpoint (for production)

1. Dashboard → Developers → **Webhooks** → **Add endpoint**
2. Endpoint URL: `https://YOURDOMAIN.com/api/stripe-webhook`
3. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the **Signing secret** (`whsec_…`) into `.env.local`.

---

## 4 — Test a payment

Use any data from <https://stripe.com/docs/testing#cards>:

- Card number: `4242 4242 4242 4242`
- Any future expiry, any CVC, any ZIP

Add a Blendr to the bag → **CONTINUE TO CHECKOUT** → pay with the test card.
The success screen confirms the Payment Intent ID. In the Stripe dashboard
(Payments) you will see the test charge; the server log will show the
`payment_intent.succeeded` webhook firing.

---

## How the integration is structured

```
src/
  lib/
    blendr-catalog.ts    ← prices (USD + cents), shared client/server
    stripe.ts            ← server-only Stripe instance (reads SECRET_KEY)
  app/
    api/
      create-payment-intent/route.ts  ← POST: validates cart, creates intent
      stripe-config/route.ts          ← GET: publishable key + ready flag
      stripe-webhook/route.ts         ← POST: verifies signature, fulfills
    blendr.css           ← checkout modal styles
  components/
    blendr/
      checkout.tsx       ← embedded Stripe Elements modal
      product.tsx        ← opens checkout on CONTINUE TO CHECKOUT
```

**Security model:**
- The **client** never sees the secret key. It only receives a `client_secret`
  tied to the exact server-computed amount.
- The **server** recomputes the total from its own catalog — the cart sent
  by the browser is treated as a *wish list*, not a price source.
- The **webhook** is the source of truth for "was this paid?". Never trust
  the client's success callback alone for fulfillment.

---

## What still needs your input

- [ ] The 3 Stripe keys in `.env.local`
- [ ] Shipping destinations + rates (Stripe Checkout can handle shipping, or
      we add it as a line item — let me know your plan)
- [ ] A fulfillment hook in `stripe-webhook/route.ts` (DB order, email,
      warehouse notification) — currently it just logs
- [ ] Replace the 5 sample reviews with verified customer feedback before
      advertising (the section is already labeled SAMPLE REVIEW)
