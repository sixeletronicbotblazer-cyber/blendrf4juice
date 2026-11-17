# Blendr Juice — two-page sales flow

Responsive, static HTML/CSS/JavaScript project. All visitor-facing content is in English. No build step, framework, or package install is required.

## Files and preview

- `dist/index.html` — editorial landing page.
- `dist/product.html` — color and bundle selection, gallery, reviews layout, FAQs, and bag drawer.
- `dist/assets/` — optimized images, source GIFs, styles and scripts.

Open `dist/index.html` locally or serve `dist/` as the web root, for example `python -m http.server 8080 --directory dist`. The landing links to `product.html` using relative paths, so keep these two files and `assets/` together when importing into Z.ai or a similar builder. For Git or static hosting, publish the contents of `dist/` as the site root. The project intentionally contains no Site identity or secret keys.

## Selection flow

The two color-card CTAs on the landing point to `product.html?color=pink|ivory&bundle=1&add=1#bundles`. On arrival, the selected color and Solo set are placed into the local bag, and the bag opens. The `add=1` parameter is removed from the URL after processing so refreshing does not add another unit. Other CTAs open the set selector without automatically adding a product. On the product page, visitors may select Solo, Pair or Trio, choose the color of each bottle, adjust the number of sets, and add selections to a browser-local bag. The bag survives refresh through `localStorage`.

The prices are US$49.97 / US$94.97 / US$124.97 for one / two / three bottles. These totals are editable in `dist/product.html` and the `PRICES` constant in `dist/assets/product.js`. Change both together if the offer changes. The Pair saves US$4.97 and the Trio saves US$24.94 against separate purchases. With unit COGS of US$33–34, gross profits before shipping, payment fees, taxes and advertising are approximately US$15.97–16.97 / US$26.97–28.97 / US$22.97–25.97. The Trio currently yields less gross profit than the Pair; review pricing before launch.

## Checkout integration

The bag and totals are functional for the design preview; `CONTINUE TO CHECKOUT` does **not** charge anyone. It displays a setup message. For Stripe, replace that handler in `dist/assets/product.js` with a request to your server that validates selected items/prices and creates a Checkout Session. Configure shipping destinations/rates and payment methods in your Stripe flow, redirect to the returned session URL, and confirm payment via webhook. Never put a Stripe secret key in these static files. The payment-brand row is an interface preview and should be changed to match actual available methods.

## Review placeholders and content checks

The five reviews in `product.html` are **illustrative copy**, visibly marked SAMPLE REVIEW with a section notice. They are not actual customer statements or ratings. Replace names, countries, stars and quotes with verified feedback (or remove the section) before advertising or selling.

The landing contains inherited marketing claims from the approved concept, including 20,000+ sales, 5,000+ users, ice crushing, 15 blends, wireless charging, resistance claims and BPA-free material. Verify them against the actual product and order history before commercial publication. Worldwide shipping is presented as planned; confirm destination coverage, prices and estimated delivery times when checkout is connected. The 50-recipe eBook must be supplied to buyers if advertised.

The supplied `step-1.gif` is animated. The supplied `step-2.gif` and `step-3.gif` contain only one frame each; CSS adds gentle motion while preserving the full aspect ratio. Replace those two files with the actual animated GIFs when available.
