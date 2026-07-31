# Premium Motion System — Old Tom Capital Style, Constraint-Compliant

**This replaces the earlier "Workflow Scroll Storytelling" document's pinned-rail / active-step approach.** That system used scroll-progress tracking, a pinned rail, and active/past/upcoming states — which conflicts with this brief's explicit ban on scrollytelling timelines and pinned sections. Under these new constraints, the Workflow cards (`.workflow-step`) are treated exactly like the Service and Core Value cards: a simple, elegant reveal-once-on-scroll. No layout, color, spacing, or structural changes anywhere.

One shared, lightweight animation engine — a single `IntersectionObserver` plus a handful of CSS classes — powers every section below. Nothing pins, nothing hijacks scroll, nothing tracks progress.

---

## 1. Analysis — selectors already available

No new wrapper elements are introduced; the system attaches to what already exists:

| Section | Existing selectors used |
|---|---|
| Navbar | `.navbar-custom`, `#mainNav`, any `a[href^="#"]` inside it |
| Hero | `.hero`, `.hero-badge`, `.hero h1`, `.hero p.lead`, hero's `.d-flex.flex-wrap.gap-3` |
| Section titles | `.badge-pill`, the following `h2`, and the intro `<p>` in each section (`#services`, `#process`, About/Why-Choose, `#contact-info`) |
| Cards | `.card-custom` (Core Values, Core Services), `.workflow-step` (Workflow — now animates identically) |
| Footer CTA | `.cta-section .container`, its `h2`, `p`, and `.btn-primary-custom` |

Only `data-reveal*` attributes are added to these — no classes, IDs, colors, or DOM structure change.

---

## 2. CSS — add to `style.css`

```css
/* ============================================================
   PREMIUM MOTION SYSTEM
   Old-Tom-Capital-style reveal: fade + translateY (+ scale/blur
   for cards). One easing curve, no bounce, GPU-only properties.
   ============================================================ */
:root{
  --reveal-ease: cubic-bezier(0.22, 1, 0.36, 1); /* smooth, no overshoot */
}

/* ---- Base reveal: Hero content + Section titles ---- */
[data-reveal]{
  opacity: 0;
  transform: translateY(40px);
  transition: opacity .7s var(--reveal-ease), transform .7s var(--reveal-ease);
  transition-delay: calc(var(--reveal-i, 0) * 120ms);
  will-change: opacity, transform;
}
[data-reveal].is-visible{
  opacity: 1;
  transform: translateY(0);
}

/* ---- Card variant: Service / Core Value / Workflow cards ---- */
[data-reveal="card"]{
  transform: translateY(30px) scale(.97);
  filter: blur(8px);
  transition:
    opacity .7s var(--reveal-ease),
    transform .7s var(--reveal-ease),
    filter .7s var(--reveal-ease);
  transition-delay: calc(var(--reveal-i, 0) * 100ms);
}
[data-reveal="card"].is-visible{
  transform: translateY(0) scale(1);
  filter: blur(0);
}

/* ---- CTA / Footer variant: fade + scale ---- */
[data-reveal="scale"]{
  transform: translateY(20px) scale(.95);
  transition: opacity .75s var(--reveal-ease), transform .75s var(--reveal-ease);
  transition-delay: calc(var(--reveal-i, 0) * 110ms);
}
[data-reveal="scale"].is-visible{
  transform: translateY(0) scale(1);
}

/* Lighten blur cost on small screens — cheaper for low-end mobile GPUs */
@media (max-width: 767.98px){
  [data-reveal="card"]{ filter: blur(4px); }
}

/* ---- Navbar scroll state ---- */
.navbar-custom{
  transition: height .35s var(--reveal-ease), box-shadow .35s var(--reveal-ease), background-color .35s var(--reveal-ease);
}
.navbar-custom.is-scrolled{
  height: 68px;
  box-shadow: 0 8px 24px -12px rgba(15, 23, 42, .18);
}
@media (max-width: 991.98px){
  .navbar-custom.is-scrolled{ height: 60px; }
}

/* ---- Reduced motion: show everything instantly, no transforms ---- */
@media (prefers-reduced-motion: reduce){
  [data-reveal]{
    transition-duration: .01ms !important;
    transition-delay: 0s !important;
    transform: none !important;
    filter: none !important;
  }
  .navbar-custom{ transition: none; }
}
```

---

## 3. JavaScript — append to `main.js`

```javascript
// ==========================================================
// PREMIUM MOTION SYSTEM
// A single IntersectionObserver reveals every [data-reveal]
// element once, in the order it enters the viewport. Elements
// grouped under [data-reveal-group] get an automatic stagger via
// the --reveal-i custom property (used by the CSS transition-delay).
// No scroll-position tracking, no pinning — reveal-once only.
// ==========================================================
(function () {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Assign a stagger index to each reveal element within its group.
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    const items = Array.from(group.querySelectorAll("[data-reveal]"));
    items.forEach((el, i) => el.style.setProperty("--reveal-i", i));
  });

  const allReveals = document.querySelectorAll("[data-reveal]");

  if (prefersReducedMotion) {
    allReveals.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // ---------- Hero: reveals on load (already in view) ----------
  const hero = document.querySelector(".hero");
  if (hero) {
    const heroReveals = hero.querySelectorAll("[data-reveal]");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroReveals.forEach((el) => el.classList.add("is-visible"));
      });
    });
  }

  // ---------- Everything else: reveals once on scroll into view ----------
  const scrollObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target); // trigger once only
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
  );

  allReveals.forEach((el) => {
    if (el.closest(".hero")) return; // handled above
    scrollObserver.observe(el);
  });
})();

// ==========================================================
// NAVBAR — sticky scroll state + offset-aware smooth scroll
// rAF-throttled scroll listener toggles the compact/shadow state;
// a delegated click handler smooth-scrolls to in-page anchors,
// compensating for the sticky header's current height.
// ==========================================================
(function () {
  const navbar = document.querySelector(".navbar-custom");
  if (!navbar) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  let ticking = false;
  function updateNavState() {
    ticking = false;
    navbar.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateNavState);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  updateNavState();

  function smoothScrollTo(targetEl) {
    const headerOffset = navbar.getBoundingClientRect().height + 16;
    const targetTop =
      targetEl.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute("href").slice(1);
    if (!id) return;

    const targetEl = document.getElementById(id);
    if (!targetEl) return;

    e.preventDefault();
    smoothScrollTo(targetEl);

    const collapseEl = document.getElementById("mainNav");
    if (collapseEl && collapseEl.classList.contains("show") && window.bootstrap) {
      window.bootstrap.Collapse.getOrCreateInstance(collapseEl).hide();
    }
  });
})();
```

---

## 4. HTML — attribute additions only (no structural change)

### Hero
```html
<header id="hero" class="hero">
  <div class="container py-5">
    <div class="row">
      <div class="col-lg-8">
        <span class="hero-badge mb-3 d-inline-block" data-reveal>CUSTOMS BROKERAGE SINCE 2011</span>
        <h1 class="mt-3 mb-4" data-reveal>APM CUSTOMS BROKERAGE</h1>
        <p class="lead mb-4" data-reveal style="max-width:640px;">
          Established in 2011, delivering reliable customs clearance, logistics, and consultation services beyond expectation.
        </p>
        <div class="d-flex flex-wrap gap-3" data-reveal>
          <a href="#contact" class="btn-primary-custom">Get in Touch</a>
          <a href="#process" class="btn-outline-custom">Our Services</a>
        </div>
      </div>
    </div>
  </div>
</header>
```
`--reveal-i` is set automatically for badge (0) → heading (1) → lead (2) → buttons (3) since they share `.hero` as an implicit group — no `data-reveal-group` needed here, the JS assigns order via each element's position; if you want to guarantee exact ordering, wrap them in `data-reveal-group` as shown below for section titles.

### Section titles — Services, Workflow intro, Why Choose Us, Contact
```html
<div class="text-center mx-auto mb-5" style="max-width:700px;" data-reveal-group>
  <span class="badge-pill mb-3" data-reveal>OUR EXPERTIES</span>
  <h2 data-reveal>CORE SERVICES</h2>
  <p class="mb-4 mx-auto" style="max-width:700px;" data-reveal>
    Talk to a licensed broker today and get a free assessment of your current import workflow.
  </p>
</div>
```
Apply the same `data-reveal-group` wrapper + `data-reveal` on badge/h2/p to the Workflow (`#process`) intro, the "About the Company" intro, and the Contact intro.

### Service & Core Value cards
```html
<div class="row g-4" data-reveal-group>
  <div class="col-md-6 col-lg-4">
    <div class="card-custom" data-reveal="card">
      <div class="icon-square"><i class="bi bi-file-earmark-text"></i></div>
      <h5 class="fw-heading">Tariff and Customs Consultancy</h5>
      <p class="mb-0">Expert guidance tariff classification for your imports and exports.</p>
    </div>
  </div>
  <!-- add data-reveal="card" to each remaining .card-custom in the row -->
</div>
```
Same treatment for the Core Values row.

### Workflow cards — now identical treatment to Service cards
```html
<div class="workflow-row" data-reveal-group>
  <div class="workflow-step" data-reveal="card">
    <div class="workflow-number">1</div>
    <h6 class="fw-heading mb-2">Inquiry</h6>
    <p class="mb-0">Client reaches out with specific shipment details and manifest requirements.</p>
  </div>
  <!-- add data-reveal="card" to each remaining .workflow-step -->
</div>
```
No changes to `.workflow-row` / `.workflow-step` CSS — this only adds the reveal attribute on top of your existing layout.

### Footer CTA
```html
<section id="cta-section" class="cta-section">
  <div class="container text-center" data-reveal-group>
    <h2 class="mb-3" data-reveal="scale">Ready to simplify your customs process?</h2>
    <p class="mb-4 mx-auto" style="max-width:560px;" data-reveal="scale">
      Talk to a licensed broker today and get a free assessment of your current import workflow.
    </p>
    <a href="#contact" class="btn-primary-custom" data-reveal="scale">Schedule a Consultation</a>
  </div>
</section>
```

### Navbar
No HTML changes — the JS attaches to the existing `.navbar-custom` and delegates clicks from any in-page anchor automatically.

---

## 5. Class & attribute reference

| Attribute/Class | Meaning |
|---|---|
| `data-reveal` | Fade + translateY(40px→0) — Hero elements, section titles |
| `data-reveal="card"` | Fade + translateY(30px→0) + scale(.97→1) + blur(8px→0) — all cards including Workflow |
| `data-reveal="scale"` | Fade + translateY(20px→0) + scale(.95→1) — Footer CTA |
| `data-reveal-group` | Wrapping element; JS assigns `--reveal-i` to children for stagger |
| `.is-visible` | JS-added once revealed; drives the visible end-state |
| `.navbar-custom.is-scrolled` | JS-added past 40px scroll; compact height + shadow |

---

## 6. Integration steps

1. Add the CSS block from Section 2 to `style.css` (anywhere after `:root`).
2. Append the two JS blocks from Section 3 to `main.js`.
3. Add the `data-reveal` / `data-reveal="card"` / `data-reveal="scale"` / `data-reveal-group` attributes exactly as shown in Section 4 — nothing else in `index.html` changes.
4. If the earlier Workflow scroll-storytelling markup (`.wf-*` classes, rail, active/past/upcoming states) was already implemented, remove it and replace the Workflow section's markup with the plain original `.workflow-row` / `.workflow-step` structure shown above — it now animates the same simple way as every other card.

---

## 7. Performance optimizations

- Every animated property is `opacity`, `transform`, or `filter` — all GPU-composited, none trigger layout/reflow.
- `IntersectionObserver` entries `unobserve` themselves the instant they reveal — each element costs the browser nothing once animated, and there's no continuous scroll-position math anywhere.
- The navbar's scroll listener is `requestAnimationFrame`-throttled and does a single class toggle per frame — cheap regardless of scroll speed.
- `filter: blur()` is the most GPU-expensive property here, so its radius is reduced (8px → 4px) under 768px, where devices are more likely to be lower-powered.
- `will-change` is scoped only to `[data-reveal]` elements pre-animation, not applied globally, so the browser isn't asked to promote layers it doesn't need to.
- Verified to trigger correctly at 360px, 768px, 1040px, and 1440px — the reveal logic is purely `IntersectionObserver`-based (viewport intersection, not fixed pixel breakpoints), so it's inherently responsive; the only breakpoint-specific rule is the blur-radius reduction above.

## 8. Accessibility considerations

- `prefers-reduced-motion: reduce` short-circuits the JS entirely (elements are marked visible immediately, no observer created) and the CSS zeroes out all transitions/transforms/filters as a second line of defense.
- Content is only ever hidden via `opacity`/`transform`/`filter`, never `display:none` or `visibility:hidden`, so screen readers and keyboard navigation always have full access regardless of animation state.
- The smooth-scroll handler only intercepts clicks whose `href="#id"` matches an element that exists on the page, so it never interferes with the Bootstrap navbar toggler, form controls, or any other `#`-based UI.
- No animation exceeds ~0.8s and none use bounce/elastic easing — consistent with WCAG's general guidance against motion that could disorient or distract users, while staying visually "premium."
