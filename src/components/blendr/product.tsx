"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "./reveal";

type ColorKey = "pink" | "ivory";
type CartItem = {
  bundle: 1 | 2 | 3;
  sets: number;
  colors: ColorKey[];
};

const PRICES: Record<1 | 2 | 3, number> = { 1: 49.97, 2: 94.97, 3: 124.97 };
const BAG_KEY = "blendr-preview-bag";

const PRODUCT_ASSETS: Record<
  string,
  { src: string; alt: string; caption: string }
> = {
  pink: {
    src: "/assets/choose-pink.webp",
    alt: "Soft Pink Blendr, full bottle on a studio backdrop",
    caption: "Soft Pink · studio",
  },
  ivory: {
    src: "/assets/choose-ivory.webp",
    alt: "Warm Ivory Blendr, full bottle on a studio backdrop",
    caption: "Warm Ivory · studio",
  },
  gym: {
    src: "/assets/scene-gym.webp",
    alt: "Soft Pink Blendr after a workout",
    caption: "After training",
  },
  car: {
    src: "/assets/scene-car.webp",
    alt: "Warm Ivory Blendr in a parked car",
    caption: "On the move",
  },
  study: {
    src: "/assets/scene-study.webp",
    alt: "Soft Pink Blendr on a sunny study desk",
    caption: "Study break",
  },
};

const labelColor = (c: ColorKey) => (c === "pink" ? "Soft Pink" : "Warm Ivory");
const money = (v: number) => "$" + v.toFixed(2);

function BagIcon() {
  return (
    <svg
      viewBox="0 0 28 30"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9h20l-1.4 18H5.4L4 9Z" />
      <path d="M9 10V7a5 5 0 0 1 10 0v3" />
    </svg>
  );
}

const REVIEWS = [
  {
    name: "Emily R.",
    country: "United States",
    title: "It slipped into my routine.",
    quote:
      "“I was surprised by how often I'd reach for it after Pilates. A small smoothie fits easily into the trip home.”",
  },
  {
    name: "Sophie M.",
    country: "United Kingdom",
    title: "A quick desk break.",
    quote:
      "“The size caught my eye. I like having a fresh drink between meetings without setting up my full blender.”",
  },
  {
    name: "Lena K.",
    country: "Germany",
    title: "One for me, one for a friend.",
    quote:
      "“I picked a second color as a birthday present. It felt practical and personal, and she loved the little recipe book.”",
  },
  {
    name: "Nora V.",
    country: "Netherlands",
    title: "A Christmas gift that gets used.",
    quote:
      "“I gave my sister the ivory one at Christmas. She started sending me photos of her morning mango shakes.”",
  },
  {
    name: "Ava T.",
    country: "Canada",
    title: "Easy to take along.",
    quote:
      "“My favorite part is the compact size. It goes in my bag for class and makes my post-workout routine simpler.”",
  },
];

const FAQS = [
  {
    q: "What's the difference between the sets?",
    a: "Each set contains the same Blendr bottle blender. The Pair includes two bottles and the Trio includes three, at a lower total than buying the same number separately.",
  },
  {
    q: "Can I mix colors in a bundle?",
    a: "Yes. Select Soft Pink or Warm Ivory separately for each bottle before adding your set to the bag.",
  },
  {
    q: "How big is Blendr?",
    a: "It holds 350 ml and measures 82 × 82 × 218 mm. The listed product weight is 490 g.",
  },
  {
    q: "Can I make smoothies and protein shakes?",
    a: "Blendr is designed for quick drinks with fruit, liquid and mix-ins. Cut firm ingredients into small pieces and add enough liquid to help the blend.",
  },
  {
    q: "How do I clean it?",
    a: "Rinse the cup soon after use and follow the care instructions supplied with your unit. Keep the charging contact dry.",
  },
  {
    q: "What comes with the recipe gift?",
    a: "A digital eBook with 50 juice and smoothie recipe ideas is included with any bottle set.",
  },
  {
    q: "Do you ship worldwide?",
    a: "Yes, worldwide delivery is planned. Your shipping options, estimated time and any charges will be shown at checkout before payment.",
  },
  {
    q: "When will I see shipping and payment details?",
    a: "We plan to ship worldwide. Available destinations, delivery costs and estimated times will be shown at checkout before an order is placed.",
  },
];

const SPECS = [
  ["Capacity", "350 ml"],
  ["Size", "82 × 82 × 218 mm"],
  ["Weight", "490 g"],
  ["Rated power", "50 W"],
  ["Battery", "7.4 V · 1400 mAh"],
  ["Input", "DC 5 V · 1 A"],
];

const STORY = [
  {
    img: "/assets/story-gym.webp",
    alt: "Athlete places the pink Blendr on a Pilates bench after training",
    label: "01 / AFTER TRAINING",
    title: "Refuel your way.",
    text: "Fruit, liquid and your favorite additions after class.",
  },
  {
    img: "/assets/story-car.webp",
    alt: "Ivory Blendr held by its body inside a parked car",
    label: "02 / ON THE ROAD",
    title: "Bring the routine.",
    text: "From the car to wherever your day goes next.",
  },
  {
    img: "/assets/story-study.webp",
    alt: "Pink Blendr beside notebook and laptop during a study break",
    label: "03 / FOCUS TIME",
    title: "A fresh reset.",
    text: "Make a smoothie between sessions, without a full kitchen setup.",
  },
];

export default function BlendrProduct() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [gallery, setGallery] = useState<string>("pink");

  const [bundle, setBundle] = useState<1 | 2 | 3>(2);
  const [sets, setSets] = useState<number>(1);
  const [colors, setColors] = useState<ColorKey[]>(["pink", "ivory"]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStatus, setCartStatus] = useState("");
  const closeCartRef = useRef<HTMLButtonElement | null>(null);
  const incomingHandled = useRef(false);

  // hydrate cart from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BAG_KEY) || "[]");
      if (Array.isArray(saved)) {
        const valid = saved.filter(
          (item: CartItem) =>
            PRICES[item.bundle as 1 | 2 | 3] &&
            Array.isArray(item.colors) &&
            Number.isInteger(item.sets) &&
            item.sets > 0
        );
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(valid as CartItem[]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveCart = useCallback((next: CartItem[]) => {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const setBaseColor = useCallback((color: ColorKey) => {
    setColors((prev) => {
      const next = [...prev];
      next[0] = color;
      return next;
    });
    setGallery(color);
  }, []);

  const chooseBundle = useCallback((value: 1 | 2 | 3) => {
    setBundle(value);
    setColors((prev) =>
      Array.from({ length: value }, (_, i) =>
        prev[i] || ((["pink", "ivory", "pink"] as ColorKey[])[i])
      )
    );
  }, []);

  const adjustSets = useCallback((delta: number) => {
    setSets((s) => Math.max(1, Math.min(5, s + delta)));
  }, []);

  const setBottleColor = useCallback((index: number, color: ColorKey) => {
    setColors((prev) => {
      const next = [...prev];
      next[index] = color;
      return next;
    });
    if (index === 0) setGallery(color);
  }, []);

  const addToBag = useCallback(() => {
    setCart((prev) => {
      const next = [...prev, { bundle, sets, colors: [...colors] }];
      saveCart(next);
      return next;
    });
    setCartOpen(true);
  }, [bundle, sets, colors, saveCart]);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => {
      const next = prev.filter((_, i) => i !== index);
      saveCart(next);
      return next;
    });
  }, [saveCart]);

  const openCart = useCallback(() => {
    setCartOpen(true);
    // focus close button after render
    setTimeout(() => closeCartRef.current?.focus(), 30);
  }, []);

  const closeCart = useCallback(() => {
    setCartOpen(false);
    setCartStatus("");
  }, []);

  // lock body scroll when cart open
  useEffect(() => {
    if (cartOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [cartOpen]);

  // Esc closes cart
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cartOpen, closeCart]);

  const total = useMemo(
    () => PRICES[bundle] * sets,
    [bundle, sets]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + PRICES[item.bundle] * item.sets, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.bundle * item.sets, 0),
    [cart]
  );

  const galleryImage = PRODUCT_ASSETS[gallery] || PRODUCT_ASSETS.pink;
  const colorHint =
    colors[0] === "pink" ? "Soft Pink selected" : "Warm Ivory selected";

  // handle incoming URL params (color, bundle, add) — runs once
  useEffect(() => {
    if (incomingHandled.current) return;
    incomingHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const incomingColor = params.get("color");
    const incomingBundle = Number(params.get("bundle"));
    const colorKey =
      incomingColor === "pink" || incomingColor === "ivory"
        ? (incomingColor as ColorKey)
        : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (colorKey) setBaseColor(colorKey);
    const bundleKey = ([1, 2, 3] as const).includes(
      incomingBundle as 1 | 2 | 3
    )
      ? (incomingBundle as 1 | 2 | 3)
      : null;
    if (bundleKey) chooseBundle(bundleKey);

    if (
      params.get("add") === "1" &&
      colorKey &&
      bundleKey
    ) {
      // use the freshly-resolved color/bundle via a microtask so state settles
      const finalColors: ColorKey[] = Array.from(
        { length: bundleKey },
        (_, i) =>
          colorKey || ((["pink", "ivory", "pink"] as ColorKey[])[i])
      );
      const item: CartItem = {
        bundle: bundleKey,
        sets: 1,
        colors: finalColors,
      };
      setCart((prev) => {
        const next = [...prev, item];
        saveCart(next);
        return next;
      });
      setCartOpen(true);
      // remove `add` param so refresh doesn't re-add
      const cleanURL = new URL(window.location.href);
      cleanURL.searchParams.delete("add");
      window.history.replaceState(
        null,
        "",
        cleanURL.pathname + cleanURL.search + cleanURL.hash
      );
    }
  }, []);

  const checkout = useCallback(() => {
    setCartStatus(
      "Checkout is not available in this preview yet. Your selected bag is saved."
    );
  }, []);

  const scrollToBundles = useCallback(() => {
    document
      .getElementById("bundles")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // toggle product-page class on <body> so the cream/white background applies
  useEffect(() => {
    document.body.classList.add("product-page");
    return () => {
      document.body.classList.remove("product-page");
    };
  }, []);

  return (
    <>
      <a className="skip" href="#product-main">
        Skip to product
      </a>
      <div className="announcement">
        WORLDWIDE SHIPPING <span aria-hidden="true">✦</span> 50-RECIPE EBOOK
        INCLUDED
      </div>
      <header className="header" id="top">
        <div className="header-inner container">
          <a href="/?page=landing" className="brand" aria-label="Blendr home">
            <img src="/assets/logo.png" width={208} height={73} alt="Blendr" />
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="/?page=landing">Discover</a>
            <a href="#bundles">Bundles</a>
            <a href="#in-motion">Made to move</a>
            <a href="#faq">Questions</a>
          </nav>
          <div className="header-actions">
            <button
              className="menu-toggle icon-button"
              type="button"
              aria-controls="product-mobile-menu"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
            <button
              className="bag-button product-bag"
              type="button"
              data-open-cart
              aria-label="Open bag"
              onClick={openCart}
            >
              <BagIcon />
              <span className="bag-count" data-bag-count hidden={cartCount === 0}>
                {cartCount}
              </span>
            </button>
          </div>
        </div>
        <nav
          className="mobile-menu"
          aria-label="Mobile navigation"
          hidden={!menuOpen}
        >
          <a href="/?page=landing" onClick={() => setMenuOpen(false)}>
            Discover
          </a>
          <a href="#bundles" onClick={() => setMenuOpen(false)}>
            Bundles
          </a>
          <a href="#in-motion" onClick={() => setMenuOpen(false)}>
            Made to move
          </a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>
            Questions
          </a>
        </nav>
      </header>

      <main id="product-main">
        <div className="container breadcrumb">
          <a href="/?page=landing">Home</a>
          <span aria-hidden="true">/</span>
          <span>Blendr bottle blender</span>
        </div>
        <section
          className="container product-layout"
          aria-labelledby="product-title"
        >
          <div className="gallery" aria-label="Blendr product gallery">
            <div className="gallery-main">
              <img
                id="gallery-image"
                src={galleryImage.src}
                width={1254}
                height={1254}
                alt={galleryImage.alt}
              />
              <span className="gallery-badge">350 ml · made to move</span>
              <span className="gallery-caption">{galleryImage.caption}</span>
            </div>
            <div
              className="gallery-thumbs"
              role="group"
              aria-label="Choose a product image"
            >
              {(
                [
                  ["pink", "Soft Pink studio photo"],
                  ["ivory", "Warm Ivory studio photo"],
                  ["gym", "Blendr after a workout"],
                  ["car", "Blendr in the car"],
                  ["study", "Blendr at a study desk"],
                ] as [string, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={`gallery-thumb ${
                    gallery === key ? "is-active" : ""
                  }`}
                  type="button"
                  aria-pressed={gallery === key}
                  aria-label={label}
                  onClick={() => setGallery(key)}
                >
                  <img src={PRODUCT_ASSETS[key].src} alt="" />
                </button>
              ))}
            </div>
          </div>
          <div className="product-panel" id="bundles">
            <div className="product-kicker">
              THE LITTLE BLEND THAT GOES WITH YOU
            </div>
            <h1 id="product-title">Your fresh drink, wherever you are.</h1>
            <p className="product-lead">
              Meet Blendr: a compact 350 ml bottle blender for smoothies and
              shakes between workouts, commutes and everything else.
            </p>
            <div className="product-facts">
              <span>350 ml capacity</span>
              <span>50 W motor</span>
              <span>Rechargeable</span>
              <span>Worldwide shipping</span>
            </div>
            <div className="from-price">
              From <strong>${PRICES[1].toFixed(2)}</strong>{" "}
              <span>USD · one bottle</span>
            </div>
            <div className="mini-rule" />

            <div className="selector-head">
              <div>
                <span className="field-label">01 / PICK YOUR COLOR</span>
                <h2>Make it yours.</h2>
              </div>
              <span className="selection-note">{colorHint}</span>
            </div>
            <div
              className="color-options"
              role="group"
              aria-label="Choose a starting color"
            >
              <button
                className={`color-option ${colors[0] === "pink" ? "selected" : ""}`}
                type="button"
                data-base-color="pink"
                aria-pressed={colors[0] === "pink"}
                onClick={() => setBaseColor("pink")}
              >
                <span className="swatch swatch-pink" />
                <span>
                  <strong>Soft Pink</strong>
                  <small>Fresh and playful</small>
                </span>
              </button>
              <button
                className={`color-option ${colors[0] === "ivory" ? "selected" : ""}`}
                type="button"
                data-base-color="ivory"
                aria-pressed={colors[0] === "ivory"}
                onClick={() => setBaseColor("ivory")}
              >
                <span className="swatch swatch-ivory" />
                <span>
                  <strong>Warm Ivory</strong>
                  <small>Soft and timeless</small>
                </span>
              </button>
            </div>

            <div className="selector-head bundle-head">
              <div>
                <span className="field-label">02 / CHOOSE YOUR SET</span>
                <h2>One for you. More to share.</h2>
              </div>
            </div>
            <div
              className="bundles"
              role="radiogroup"
              aria-label="Choose a Blendr bundle"
            >
              <button
                className={`bundle-card ${bundle === 1 ? "selected" : ""}`}
                type="button"
                role="radio"
                aria-checked={bundle === 1}
                data-bundle="1"
                onClick={() => chooseBundle(1)}
              >
                <span className="bundle-top">
                  <span className="bundle-name">
                    The Solo <small>1 bottle</small>
                  </span>
                  <strong>${PRICES[1].toFixed(2)}</strong>
                </span>
                <span className="bundle-bottom">
                  A fresh start, all yours.{" "}
                  <b>${PRICES[1].toFixed(2)} each</b>
                </span>
              </button>
              <button
                className={`bundle-card ${bundle === 2 ? "selected" : ""}`}
                type="button"
                role="radio"
                aria-checked={bundle === 2}
                data-bundle="2"
                onClick={() => chooseBundle(2)}
              >
                <span className="bundle-flag">MOST POPULAR</span>
                <span className="bundle-top">
                  <span className="bundle-name">
                    The Pair <small>2 bottles</small>
                  </span>
                  <strong>${PRICES[2].toFixed(2)}</strong>
                </span>
                <span className="bundle-bottom">
                  Keep one, share one.{" "}
                  <b>Save ${(PRICES[1] * 2 - PRICES[2]).toFixed(2)}</b>
                </span>
              </button>
              <button
                className={`bundle-card ${bundle === 3 ? "selected" : ""}`}
                type="button"
                role="radio"
                aria-checked={bundle === 3}
                data-bundle="3"
                onClick={() => chooseBundle(3)}
              >
                <span className="bundle-flag bundle-flag-mint">BEST VALUE</span>
                <span className="bundle-top">
                  <span className="bundle-name">
                    The Trio <small>3 bottles</small>
                  </span>
                  <strong>${PRICES[3].toFixed(2)}</strong>
                </span>
                <span className="bundle-bottom">
                  One for every routine.{" "}
                  <b>Save ${(PRICES[1] * 3 - PRICES[3]).toFixed(2)}</b>
                </span>
              </button>
            </div>
            <div className="bundle-colors">
              <p>Choose the color of each bottle</p>
              <div className="bottle-picks">
                {Array.from({ length: bundle }, (_, i) => (
                  <label className="bottle-pick" key={i}>
                    <span>Bottle {i + 1}</span>
                    <select
                      aria-label={`Color for bottle ${i + 1}`}
                      value={colors[i] || "pink"}
                      onChange={(e) =>
                        setBottleColor(i, e.target.value as ColorKey)
                      }
                    >
                      <option value="pink">Soft Pink</option>
                      <option value="ivory">Warm Ivory</option>
                    </select>
                  </label>
                ))}
              </div>
            </div>
            <div className="ebook-note">
              <img
                src="/assets/ebook-cover.webp"
                alt="Blendr 50 Fresh Recipes eBook cover"
                width={1024}
                height={1536}
              />
              <span>
                <strong>A little extra, on us</strong>
                <small>50 fresh recipes eBook included with every set.</small>
              </span>
              <span className="ebook-free">INCLUDED</span>
            </div>
            <div className="purchase-row">
              <div className="set-qty" aria-label="Number of sets">
                <button
                  type="button"
                  data-qty="minus"
                  aria-label="Remove one set"
                  onClick={() => adjustSets(-1)}
                >
                  −
                </button>
                <output aria-live="polite">{sets}</output>
                <button
                  type="button"
                  data-qty="plus"
                  aria-label="Add one set"
                  onClick={() => adjustSets(1)}
                >
                  +
                </button>
              </div>
              <span className="purchase-total">
                Set total <strong>${total.toFixed(2)}</strong>
              </span>
            </div>
            <button
              className="button button-primary add-button"
              id="add-to-bag"
              type="button"
              onClick={addToBag}
            >
              ADD TO BAG <span aria-hidden="true">→</span>
            </button>
            <p className="checkout-note">
              Choose your colors here. Shipping and payment options appear at
              checkout when available.
            </p>
            <div
              className="payment-strip"
              aria-label="Card brands shown for design preview"
            >
              <span>VISA</span>
              <span>mastercard</span>
              <span>AMEX</span>
              <span>DISCOVER</span>
              <span> Pay</span>
            </div>
          </div>
        </section>

        <section
          className="product-reviews"
          id="community"
          aria-labelledby="community-title"
        >
          <div className="container review-shell">
            <div className="review-head">
              <div>
                <p className="kicker">THE BLENDR COMMUNITY</p>
                <h2 id="community-title">
                  Everyday moments, made fresher.
                </h2>
              </div>
              <p>
                Five example review layouts for the upcoming customer feedback
                section.
              </p>
            </div>
            <p className="review-preview-notice">
              DESIGN PREVIEW — illustrative names, ratings and quotes. Replace
              with verified customer reviews before launch.
            </p>
            <div className="review-list">
              {REVIEWS.map((r) => (
                <article className="review-item" key={r.name}>
                  <div className="review-meta">
                    <span
                      className="review-stars"
                      aria-label="Five-star sample rating"
                    >
                      ★★★★★
                    </span>
                    <strong>{r.name}</strong>
                    <span>{r.country}</span>
                    <small>SAMPLE REVIEW</small>
                  </div>
                  <div>
                    <h3>{r.title}</h3>
                    <p>{r.quote}</p>
                  </div>
                </article>
              ))}
            </div>
            <a className="review-cta" href="#bundles">
              FIND YOUR BLENDR <span aria-hidden="true">↑</span>
            </a>
          </div>
        </section>

        <div className="product-marquee" aria-hidden="true">
          <div>
            BLEND AT HOME <i>✳</i> TAKE IT TO THE GYM <i>✳</i> MAKE THE
            COMMUTE FRESHER <i>✳</i> BLEND AT HOME <i>✳</i> TAKE IT TO THE GYM{" "}
            <i>✳</i> MAKE THE COMMUTE FRESHER <i>✳</i>
          </div>
        </div>

        <section
          className="product-story container"
          id="in-motion"
          aria-labelledby="story-title"
        >
          <div className="story-head">
            <p className="kicker">LIFE, IN MOTION</p>
            <h2 id="story-title">A little Blendr for your big days.</h2>
            <p>
              Pack ingredients, blend when you're ready and bring a fresh drink
              along for the next thing.
            </p>
          </div>
          <div className="story-grid">
            {STORY.map((s) => (
              <article key={s.label}>
                <img src={s.img} alt={s.alt} loading="lazy" />
                <div>
                  <span>{s.label}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="product-details">
          <div className="container details-row">
            <div>
              <p className="kicker">THE LITTLE DETAILS</p>
              <h2>Small by design. Ready for your day.</h2>
              <p>
                Designed around a 350 ml serving, a rechargeable battery and a
                shape that fits into an everyday routine.
              </p>
              <a href="/?page=landing#how" className="text-link">
                See how Blendr works <span aria-hidden="true">↗</span>
              </a>
            </div>
            <dl>
              {SPECS.map(([dt, dd]) => (
                <div key={dt}>
                  <dt>{dt}</dt>
                  <dd>{dd}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="product-faq container" id="faq">
          <div>
            <p className="kicker">GOOD TO KNOW</p>
            <h2 id="faq-title">Questions? We've got you.</h2>
            <p>Everything to know before you choose your Blendr.</p>
          </div>
          <div className="faq-list">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <span>+</span>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="product-end">
          <div className="container">
            <p>Made for fresh moments everywhere.</p>
            <h2>Pick a color. Make it yours.</h2>
            <a href="#bundles" className="button button-light">
              CHOOSE YOUR SET <span aria-hidden="true">↑</span>
            </a>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <a href="/?page=landing" className="footer-logo">
            <img src="/assets/logo.png" width={170} height={60} alt="Blendr" />
          </a>
          <span>Made to move with you.</span>
          <div>
            <a href="/?page=landing">Discover</a>
            <a href="#bundles">Bundles</a>
            <a href="#faq">FAQ</a>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>

      <div className="cart-backdrop" hidden={!cartOpen} onClick={closeCart} />
      <aside
        className="cart-drawer"
        aria-label="Your bag"
        aria-modal="true"
        role="dialog"
        hidden={!cartOpen}
      >
        <div className="cart-header">
          <div>
            <small>YOUR BLENDR BAG</small>
            <h2>Ready to move?</h2>
          </div>
          <button
            ref={closeCartRef}
            id="close-cart"
            type="button"
            aria-label="Close bag"
            onClick={closeCart}
          >
            ×
          </button>
        </div>
        <div className="cart-body">
          {cart.length === 0 ? (
            <p className="cart-empty">
              Your bag is empty. Choose a color and a set to get started.
            </p>
          ) : (
            cart.map((item, index) => (
              <div className="cart-line" key={index}>
                <img
                  src={
                    (PRODUCT_ASSETS[item.colors[0] || "pink"] || PRODUCT_ASSETS.pink).src
                  }
                  alt=""
                />
                <div className="cart-line-content">
                  <strong>
                    Blendr{" "}
                    {item.bundle === 1
                      ? "Solo"
                      : item.bundle === 2
                      ? "Pair"
                      : "Trio"}{" "}
                    · {item.bundle * item.sets}{" "}
                    {item.bundle * item.sets === 1 ? "bottle" : "bottles"}
                  </strong>
                  <small>
                    {item.colors.map(labelColor).join(" + ")}
                    {item.sets > 1 ? ` · ${item.sets} sets` : ""}
                  </small>
                  <button
                    type="button"
                    aria-label={`Remove Blendr ${
                      item.bundle === 1
                        ? "Solo"
                        : item.bundle === 2
                        ? "Pair"
                        : "Trio"
                    } · ${item.bundle * item.sets} ${
                      item.bundle * item.sets === 1 ? "bottle" : "bottles"
                    }`}
                    onClick={() => removeFromCart(index)}
                  >
                    Remove
                  </button>
                </div>
                <span className="cart-line-price">
                  {money(PRICES[item.bundle] * item.sets)}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="cart-footer">
          <div>
            <span>Subtotal</span>
            <strong>${cartSubtotal.toFixed(2)}</strong>
          </div>
          <p>Shipping and payment options will be shown at checkout.</p>
          <button
            id="checkout-button"
            className="button button-primary"
            type="button"
            disabled={cart.length === 0}
            onClick={checkout}
          >
            CONTINUE TO CHECKOUT <span aria-hidden="true">→</span>
          </button>
          <p className="cart-status" role="status" aria-live="polite">
            {cartStatus}
          </p>
        </div>
      </aside>
      <div className="mobile-buybar">
        <span>
          From <strong>${PRICES[1].toFixed(2)}</strong>
        </span>
        <button type="button" id="mobile-buy" onClick={scrollToBundles}>
          CHOOSE MY SET <span aria-hidden="true">↑</span>
        </button>
      </div>
    </>
  );
}
