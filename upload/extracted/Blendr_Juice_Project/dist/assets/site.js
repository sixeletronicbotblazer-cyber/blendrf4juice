// Add the URL of the second, product-selection page here when it is ready.
const PRODUCT_PAGE_URL = 'product.html';

document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.hidden = !open;
});
mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}));

const toast = document.querySelector('.toast');
let toastTimeout;
document.querySelectorAll('.next-page-link').forEach(link => {
  if (PRODUCT_PAGE_URL.trim()) {
    link.href = PRODUCT_PAGE_URL.trim();
  } else {
    link.addEventListener('click', event => {
      event.preventDefault();
      toast.hidden = false;
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => { toast.hidden = true; }, 4800);
    });
  }
});

// The hero changes scenes after a short dwell, and the dots allow a manual choice.
const hero = document.querySelector('.hero');
const heroSlides = [...document.querySelectorAll('[data-hero-slide]')];
const heroDots = [...document.querySelectorAll('[data-hero-dot]')];
const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let heroIndex = 0;
let heroTimer;
let heroBusy = false;
function showHero(next) {
  if (heroBusy || next === heroIndex || !heroSlides[next]) return;
  heroBusy = true;
  const previous = heroSlides[heroIndex];
  const upcoming = heroSlides[next];
  previous.classList.remove('is-active');
  previous.classList.add('is-exiting');
  upcoming.classList.add('is-active');
  heroIndex = next;
  heroDots.forEach((dot, index) => {
    dot.classList.toggle('is-active', index === next);
    dot.setAttribute('aria-pressed', String(index === next));
  });
  window.setTimeout(() => {
    previous.classList.add('is-resetting');
    previous.classList.remove('is-exiting');
    requestAnimationFrame(() => previous.classList.remove('is-resetting'));
    heroBusy = false;
  }, motionReduced.matches ? 0 : 880);
}
function stopHero() { window.clearInterval(heroTimer); }
function startHero() {
  stopHero();
  if (!motionReduced.matches && !document.hidden && heroSlides.length > 1) {
    heroTimer = window.setInterval(() => showHero((heroIndex + 1) % heroSlides.length), 3300);
  }
}
heroDots.forEach(dot => dot.addEventListener('click', () => {
  showHero(Number(dot.dataset.heroDot));
  startHero();
}));
hero?.addEventListener('mouseenter', stopHero);
hero?.addEventListener('mouseleave', startHero);
hero?.addEventListener('focusin', stopHero);
hero?.addEventListener('focusout', event => {
  if (!hero.contains(event.relatedTarget)) startHero();
});
document.addEventListener('visibilitychange', startHero);
motionReduced.addEventListener?.('change', startHero);
startHero();

// Count the two verified community totals only when this section comes into view.
const counters = [...document.querySelectorAll('.count-number')];
function animateCount(element) {
  const end = Number(element.dataset.count);
  const duration = 1400;
  const formatter = new Intl.NumberFormat('en-US');
  let start;
  function frame(now) {
    start ??= now;
    const progress = Math.max(0, Math.min((now - start) / duration, 1));
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = progress === 1 ? element.dataset.final : formatter.format(Math.floor(end * eased));
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if (motionReduced.matches || !('IntersectionObserver' in window)) {
  counters.forEach(element => { element.textContent = element.dataset.final; });
} else if (counters.length) {
  const countObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      counters.forEach(animateCount);
      countObserver.disconnect();
    }
  }), { threshold: 0.35 });
  countObserver.observe(document.querySelector('.proof-numbers'));
}

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }), { rootMargin: '0px 0px 110px 0px', threshold: 0.04 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
}
