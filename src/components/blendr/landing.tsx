"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Reveal } from "./reveal";
import { useCountUp } from "./use-reveal";

/** Helper to build the product-page URL on the same `/` route. */
function productUrl(params?: { color?: string; bundle?: number; add?: number }) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("page", "product");
  if (params?.color) url.searchParams.set("color", params.color);
  if (params?.bundle) url.searchParams.set("bundle", String(params.bundle));
  if (params?.add) url.searchParams.set("add", String(params.add));
  url.hash = "bundles";
  return url.pathname + url.search + url.hash;
}

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

export default function BlendrLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(false);

  // hero carousel state — track active + exiting + resetting to match site.js
  const [heroIndex, setHeroIndex] = useState(0);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);
  const [resettingIndex, setResettingIndex] = useState<number | null>(null);
  const heroBusy = useRef(false);
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  const motionReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  const stopHero = useCallback(() => {
    if (heroTimer.current) {
      clearInterval(heroTimer.current);
      heroTimer.current = null;
    }
  }, []);

  const triggerExit = useCallback(
    (current: number, next: number) => {
      heroBusy.current = true;
      setExitingIndex(current);
      setHeroIndex(next);
      const duration = motionReduced?.matches ? 0 : 880;
      window.setTimeout(() => {
        // briefly disable transition, reset to default position (100%), re-enable
        setResettingIndex(current);
        setExitingIndex(null);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setResettingIndex(null));
        });
        heroBusy.current = false;
      }, duration);
    },
    [motionReduced]
  );

  const showHero = useCallback(
    (next: number) => {
      setHeroIndex((current) => {
        if (heroBusy.current || next === current) return current;
        triggerExit(current, next);
        return next;
      });
    },
    [triggerExit]
  );

  const startHero = useCallback(() => {
    stopHero();
    if (
      !motionReduced?.matches &&
      typeof document !== "undefined" &&
      !document.hidden
    ) {
      heroTimer.current = setInterval(() => {
        setHeroIndex((current) => {
          if (heroBusy.current) return current;
          const next = (current + 1) % 2;
          triggerExit(current, next);
          return next;
        });
      }, 3300);
    }
  }, [motionReduced, stopHero, triggerExit]);

  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  useEffect(() => {
    startHero();
    const onVisibility = () => startHero();
    document.addEventListener("visibilitychange", onVisibility);
    const onMotionChange = () => startHero();
    motionReduced?.addEventListener?.("change", onMotionChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      motionReduced?.removeEventListener?.("change", onMotionChange);
      stopHero();
    };
  }, [startHero, stopHero, motionReduced]);

  const onPauseHero = () => stopHero();
  const onResumeHero = () => startHero();

  const [salesRef, salesDisplay] = useCountUp(20000, "20k+");
  const [usersRef, usersDisplay] = useCountUp(5000, "5k+");

  const heroSlides = [
    {
      key: "pink",
      mobile: "/assets/hero-pink-mobile.webp",
      desktop: "/assets/hero-pink-desktop.webp",
      width: 1671,
      height: 941,
    },
    {
      key: "ivory",
      mobile: "/assets/hero-ivory-mobile.webp",
      desktop: "/assets/hero-ivory-desktop.webp",
      width: 1672,
      height: 941,
      lazy: true,
    },
  ];

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        WORLDWIDE SHIPPING <span aria-hidden="true">✦</span> A SPECIAL GIFT WITH
        YOUR BLENDR
      </div>
      <header className="header" id="top">
        <div className="header-inner container">
          <a href="#top" className="brand" aria-label="Blendr home">
            <img src="/assets/logo.png" width={208} height={73} alt="Blendr" />
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#how">How it works</a>
            <a href="#benefits">Why Blendr</a>
            <a href="#colors">The colors</a>
          </nav>
          <div className="header-actions">
            <button
              className="menu-toggle icon-button"
              type="button"
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
            <a
              className="bag-button"
              href="/?page=product"
              aria-label="Choose your Blendr"
            >
              <BagIcon />
            </a>
          </div>
        </div>
        <nav
          className="mobile-menu"
          aria-label="Mobile navigation"
          hidden={!menuOpen}
        >
          <a href="#how" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#benefits" onClick={() => setMenuOpen(false)}>
            Why Blendr
          </a>
          <a href="#colors" onClick={() => setMenuOpen(false)}>
            The colors
          </a>
          <a href="#reviews" onClick={() => setMenuOpen(false)}>
            The community
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-heading" ref={heroRef}>
          <div className="hero-carousel" aria-hidden="true">
            {heroSlides.map((slide, index) => {
              const classes = ["hero-slide"];
              if (index === heroIndex) classes.push("is-active");
              if (index === exitingIndex) classes.push("is-exiting");
              if (index === resettingIndex) classes.push("is-resetting");
              return (
                <div key={slide.key} className={classes.join(" ")}>
                  <picture>
                    <source
                      media="(max-width: 700px)"
                      srcSet={slide.mobile}
                    />
                    <img
                      src={slide.desktop}
                      width={slide.width}
                      height={slide.height}
                      alt=""
                      loading={slide.lazy ? "lazy" : undefined}
                    />
                  </picture>
                </div>
              );
            })}
          </div>
          <div className="hero-shade" />
          <div
            className="hero-inner container"
            onMouseEnter={onPauseHero}
            onMouseLeave={onResumeHero}
            onFocus={onPauseHero}
            onBlur={onResumeHero}
          >
            <div className="hero-copy">
              <p className="eyebrow pill">FRESH BLENDS IN MOTION</p>
              <h1 id="hero-heading">
                Mini. Portable.
                <br />
                Powerful.
              </h1>
              <p className="hero-description">
                Powerful enough to crush ice. Small enough to take anywhere.
              </p>
              <a className="button button-primary hero-cta" href="#colors">
                MEET BLENDR <span aria-hidden="true">→</span>
              </a>
              <div className="hero-badges">
                <span>
                  350 ml <b>•</b> New design
                </span>
                <span>
                  20,000+ sold <b>•</b> Made to move
                </span>
              </div>
            </div>
          </div>
          <div className="hero-controls" aria-label="Hero images">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.key}
                className={`hero-dot ${index === heroIndex ? "is-active" : ""}`}
                type="button"
                aria-label={`Show ${
                  slide.key === "pink" ? "pink" : "ivory"
                } Blendr scene`}
                aria-pressed={index === heroIndex}
                onClick={() => {
                  showHero(index);
                  startHero();
                }}
              />
            ))}
          </div>
        </section>

        <div className="marquee" aria-label="Juices, smoothies and shakes">
          <div className="marquee-track" aria-hidden="true">
            <span>
              JUICES <i>•</i> SMOOTHIES <i>•</i> SHAKES <i>•</i>{" "}
            </span>
            <span>
              JUICES <i>•</i> SMOOTHIES <i>•</i> SHAKES <i>•</i>{" "}
            </span>
            <span>
              JUICES <i>•</i> SMOOTHIES <i>•</i> SHAKES <i>•</i>{" "}
            </span>
            <span>
              JUICES <i>•</i> SMOOTHIES <i>•</i> SHAKES <i>•</i>{" "}
            </span>
          </div>
        </div>

        <section
          className="section movement"
          id="movement"
          aria-labelledby="movement-heading"
        >
          <div className="container movement-grid">
            <Reveal className="movement-copy">
              <p className="kicker">01 / EVERYWHERE YOU GO</p>
              <h2 id="movement-heading">Energy in motion.</h2>
              <p>
                At home, at work, at the gym, in the car, at the beach or away
                for the weekend—Blendr goes wherever you do. Mix fruit, nuts
                and more in moments.
              </p>
              <span className="fact-pill">Up to 15 blends on one charge</span>
              <a className="text-cta" href="/?page=product#bundles">
                CHOOSE YOUR BLENDR <span aria-hidden="true">→</span>
              </a>
            </Reveal>
            <Reveal className="movement-photo">
              <img
                src="/assets/photo-ivory-real.jpg"
                width={790}
                height={1189}
                loading="lazy"
                alt="Woman holding the real ivory Fresh Juice bottle by its body"
              />
              <span className="photo-caption">
                A fresh moment, wherever you are.
              </span>
            </Reveal>
          </div>
        </section>

        <section className="section how" id="how" aria-labelledby="how-heading">
          <div className="container">
            <Reveal className="section-intro">
              <p className="kicker">02 / THE LITTLE RITUAL</p>
              <h2 id="how-heading">Three steps to fresh.</h2>
              <p>
                Fill it, blend it, take it with you. Your fresh drink comes
                together in three easy steps.
              </p>
            </Reveal>
            <div className="steps-grid">
              <Reveal as="article" className="step-card">
                <div className="step-media">
                  <img
                    src="/assets/step-1.gif"
                    width={550}
                    height={691}
                    loading="lazy"
                    alt="Step one: place the Blendr upside down and remove the base"
                  />
                </div>
                <div className="step-copy">
                  <span className="step-number">01</span>
                  <div>
                    <h3>OPEN</h3>
                    <p>
                      Place Blendr upside down on a flat surface and remove the
                      base.
                    </p>
                  </div>
                </div>
              </Reveal>
              <Reveal as="article" className="step-card">
                <div className="step-media step-loop step-loop-add">
                  <img
                    src="/assets/step-2.gif"
                    width={550}
                    height={691}
                    loading="lazy"
                    alt="Step two: add fruit and ingredients to the Blendr cup"
                  />
                </div>
                <div className="step-copy">
                  <span className="step-number">02</span>
                  <div>
                    <h3>ADD</h3>
                    <p>Fill it with the ingredients you love.</p>
                  </div>
                </div>
              </Reveal>
              <Reveal as="article" className="step-card">
                <div className="step-media step-loop step-loop-blend">
                  <img
                    src="/assets/step-3.gif"
                    width={550}
                    height={691}
                    loading="lazy"
                    alt="Step three: reattach Blendr and start blending"
                  />
                </div>
                <div className="step-copy">
                  <span className="step-number">03</span>
                  <div>
                    <h3>BLEND</h3>
                    <p>
                      Put the base back on, double tap the blend button and
                      watch it come together.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
            <a className="button button-primary steps-cta" href="#colors">
              EXPLORE BLENDR <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <section
          className="section design"
          id="design"
          aria-labelledby="design-heading"
        >
          <div className="container design-grid">
            <Reveal className="design-photo">
              <img
                src="/assets/ivory-editorial.webp"
                width={1024}
                height={1365}
                loading="lazy"
                alt="Ivory Blendr held by its loop handle in a sunlit kitchen"
              />
            </Reveal>
            <Reveal className="design-copy">
              <p className="kicker">03 / MADE TO COME ALONG</p>
              <h2 id="design-heading">
                Designed to be seen. Made to be used.
              </h2>
              <p>
                A minimal, stylish little blender that belongs in your daily
                routine. Keep it close for a fresh drink whenever the moment
                calls for one.
              </p>
              <div className="design-accent">
                <span>Compact silhouette</span>
                <span>Everyday convenience</span>
                <span>Two soft colors</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section
          className="section benefits"
          id="benefits"
          aria-labelledby="benefits-heading"
        >
          <div className="container">
            <Reveal className="benefits-head">
              <div>
                <p className="kicker">04 / MORE THAN A GOOD LOOK</p>
                <h2 id="benefits-heading">9 reasons to love Blendr.</h2>
              </div>
              <p>Small details that make it easier to keep a fresh blend close.</p>
            </Reveal>
            <div className="benefit-grid">
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">↗</span>
                <h3>Fits in your bag</h3>
                <p>Ready to go when you are.</p>
              </Reveal>
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">✧</span>
                <h3>Easy to clean</h3>
                <p>Less fuss after every blend.</p>
              </Reveal>
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">◒</span>
                <h3>Compact &amp; stylish</h3>
                <p>A beautiful everyday shape.</p>
              </Reveal>
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">⌁</span>
                <h3>Wireless charging</h3>
                <p>Set it on its charging base.</p>
              </Reveal>
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">◉</span>
                <h3>Water resistant</h3>
                <p>Made for practical everyday use.</p>
              </Reveal>
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">◇</span>
                <h3>Drop resistant</h3>
                <p>Built to come along.</p>
              </Reveal>
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">♡</span>
                <h3>BPA free</h3>
                <p>A material detail that matters.</p>
              </Reveal>
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">15</span>
                <h3>Up to 15 blends</h3>
                <p>From one charge.</p>
              </Reveal>
              <Reveal as="article" className="benefit">
                <span className="benefit-icon">↺</span>
                <h3>Simple returns</h3>
                <p>Support when you need it.</p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section routine" aria-labelledby="routine-heading">
          <div className="container routine-grid">
            <Reveal className="routine-image">
              <img
                src="/assets/photo-pink-real.jpg"
                width={790}
                height={850}
                loading="lazy"
                alt="Real pink Fresh Juice bottle beside strawberries and raspberries"
              />
            </Reveal>
            <Reveal className="routine-content">
              <p className="kicker">05 / YOUR DAY, YOUR WAY</p>
              <h2 id="routine-heading">Shake up your routine.</h2>
              <p>
                Blendr is more than a mini blender. Make a quick morning
                smoothie, a post-workout shake or a little afternoon
                reset—then get on with your day.
              </p>
              <div className="routine-cards">
                <div>
                  <span>✦</span>
                  <strong>Blend in moments</strong>
                  <small>A fresh drink without the long routine.</small>
                </div>
                <div>
                  <span>↗</span>
                  <strong>Go more places</strong>
                  <small>Light, compact and ready to carry.</small>
                </div>
                <div>
                  <span>♡</span>
                  <strong>Make it yours</strong>
                  <small>Choose the flavor that fits the moment.</small>
                </div>
                <div>
                  <span>◉</span>
                  <strong>Keep it simple</strong>
                  <small>Clean, charge and go again.</small>
                </div>
              </div>
              <a className="text-cta" href="/?page=product#bundles">
                SEE COLORS &amp; SETS <span aria-hidden="true">→</span>
              </a>
            </Reveal>
          </div>
        </section>

        <section
          className="section details"
          id="details"
          aria-labelledby="details-heading"
        >
          <div className="container details-grid">
            <Reveal className="details-copy">
              <p className="kicker">06 / THE ORIGINAL BOTTLE BLENDER</p>
              <h2 id="details-heading">A lot of possibility in 350 ml.</h2>
              <p>
                From frozen fruit to a smoothie on the move, the little details
                do the work.
              </p>
              <div className="details-list">
                <div>
                  <b>01</b>
                  <span>
                    <strong>Powerful blend</strong>
                    <small>Stainless-steel blades and a compact motor.</small>
                  </span>
                </div>
                <div>
                  <b>02</b>
                  <span>
                    <strong>Wireless charging</strong>
                    <small>Set the bottle on its charging base.</small>
                  </span>
                </div>
                <div>
                  <b>03</b>
                  <span>
                    <strong>Easy cleaning</strong>
                    <small>Built for a simple rinse and reset.</small>
                  </span>
                </div>
              </div>
            </Reveal>
            <Reveal className="details-visual">
              <img
                src="/assets/pink-product.png"
                width={859}
                height={1832}
                loading="lazy"
                alt="Pink Fresh Juice Blendr bottle"
              />
              <span className="details-orbit orbit-one">350 ml</span>
              <span className="details-orbit orbit-two">Powerful blend</span>
              <span className="details-orbit orbit-three">Wireless charging</span>
              <span className="details-orbit orbit-four">Easy to clean</span>
            </Reveal>
          </div>
        </section>

        <section
          className="section offer"
          id="colors"
          aria-labelledby="offer-heading"
        >
          <div className="container">
            <Reveal className="offer-intro">
              <p className="kicker">07 / FIND YOUR BLENDR</p>
              <h2 id="offer-heading">
                Your fresh start comes in two colors.
              </h2>
              <p>
                Choose your color here, or explore every set on the next page.
              </p>
            </Reveal>
            <div className="color-grid">
              <Reveal as="article" className="color-card">
                <div className="color-image">
                  <img
                    src="/assets/choose-pink.webp"
                    width={1254}
                    height={1254}
                    loading="lazy"
                    alt="Soft Pink Blendr in a warm studio setting with strawberries"
                  />
                </div>
                <div className="color-copy">
                  <span className="color-dot pink" />
                  <div>
                    <h3>Soft Pink</h3>
                    <p>A little color for every day.</p>
                  </div>
                </div>
                <a
                  className="color-card-cta"
                  href="/?page=product&color=pink&bundle=1&add=1#bundles"
                >
                  CHOOSE SOFT PINK <span aria-hidden="true">→</span>
                </a>
              </Reveal>
              <Reveal as="article" className="color-card">
                <div className="color-image">
                  <img
                    src="/assets/choose-ivory.webp"
                    width={1254}
                    height={1254}
                    loading="lazy"
                    alt="Warm Ivory Blendr in a sunlit studio setting with fruit"
                  />
                </div>
                <div className="color-copy">
                  <span className="color-dot ivory" />
                  <div>
                    <h3>Warm Ivory</h3>
                    <p>Clean, timeless and easy to take along.</p>
                  </div>
                </div>
                <a
                  className="color-card-cta"
                  href="/?page=product&color=ivory&bundle=1&add=1#bundles"
                >
                  CHOOSE WARM IVORY <span aria-hidden="true">→</span>
                </a>
              </Reveal>
            </div>
            <Reveal className="gift-bar">
              <img
                className="ebook-cover"
                src="/assets/ebook-cover.webp"
                width={1024}
                height={1536}
                loading="lazy"
                alt="Cover of the Blendr 50 Fresh Recipes eBook"
              />
              <div>
                <span className="gift-label">A LITTLE EXTRA</span>
                <h3>50 recipes to get you started.</h3>
                <p>A juice and smoothie eBook included with your Blendr.</p>
              </div>
              <img
                src="/assets/heart.png"
                width={90}
                height={99}
                alt=""
                className="heart-mark"
              />
            </Reveal>
            <Reveal className="offer-action">
              <p>
                Two colors. One little bottle. A fresh way to take your
                favorites with you.
              </p>
              <a
                className="button button-primary next-page-link"
                href="/?page=product"
              >
                CHOOSE MY BLENDR <span aria-hidden="true">→</span>
              </a>
              <small>
                Color, price and quantity are selected on the next page.
              </small>
            </Reveal>
          </div>
        </section>

        <section
          className="section proof"
          id="reviews"
          aria-labelledby="proof-heading"
        >
          <div className="container proof-grid">
            <Reveal>
              <p className="kicker">08 / THE BLENDR COMMUNITY</p>
              <h2 id="proof-heading">A little bottle, a lot of love.</h2>
              <p>
                People have made space for Blendr in their routines. Take a
                closer look and find your favorite color.
              </p>
            </Reveal>
            <Reveal className="proof-numbers">
              <div>
                <strong
                  ref={salesRef}
                  aria-label="More than twenty thousand sales"
                >
                  {salesDisplay}
                </strong>
                <span>sales</span>
              </div>
              <div>
                <strong
                  ref={usersRef}
                  aria-label="More than five thousand users"
                >
                  {usersDisplay}
                </strong>
                <span>users</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="closing">
          <div className="container closing-inner">
            <div>
              <p>Fresh blends wherever life goes.</p>
              <h2>Mini. Portable. Powerful.</h2>
            </div>
            <a
              className="button button-light next-page-link"
              href="/?page=product"
            >
              CHOOSE MY BLENDR <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <a href="#top" className="footer-logo">
            <img src="/assets/logo.png" width={170} height={60} alt="Blendr" />
          </a>
          <span>Made to move with you.</span>
          <div>
            <a href="#how">How it works</a>
            <a href="#benefits">Benefits</a>
            <a href="#colors">Colors</a>
            <a href="#top">Back to top ↑</a>
          </div>
        </div>
      </footer>
      <div
        className="toast"
        role="status"
        aria-live="polite"
        hidden={!toast}
      >
        The product selection page is coming next.
      </div>
    </>
  );
}
