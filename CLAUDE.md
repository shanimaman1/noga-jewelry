# NOGA Fine Jewelry — Project Guide (read at the start of every session)

Portfolio **demo** site for a fictional luxury jewelry brand. Demo only — no real
payments or orders — but must look and behave 100% production-grade. Shown to
prospective clients as proof of capability.

> This file is the single source of truth for brand, design, 3D, accessibility
> and performance rules. When something here conflicts with a passing idea, this
> file wins. Keep it updated when decisions change.

## Working rules
- Every task changes **nothing beyond its stated scope**. No opportunistic edits.
- **Flag any deviation from this file before acting on it** — do not silently
  "fix" something that contradicts a decision recorded here; raise it first.
- Decisions live in this file, not in an external plan file. If a decision is
  made, record it here so it survives.

---

## Brand
- **Name:** NOGA Fine Jewelry / נוגה
- Tel Aviv atelier, handmade 14/18k gold, natural & lab diamonds
- **Positioning:** "תכשיט אחד שתלבשי כל יום — לא עשרה נשכחים במגירה"
- **Founder:** Dana (דנה), Bezalel-trained goldsmith, 12 years' experience
- **Price range:** ₪890–₪12,000
- **Language:** Hebrew, full RTL. Prices in ILS (₪).
- **WhatsApp / contact:** `+972-50-000-0000` — deliberately INVALID placeholder, never a real number.

## Two audiences (drives the IA)
1. **Self-purchaser** — browsing, curious, wants detail/materials/photos.
2. **Gift buyer** (often male, time-pressured) — needs help fast: what to buy,
   what size, when it arrives. Needs "gift guide by price" + WhatsApp.

## Visual concept — "The Dark Room"
Land on near-black. A ring floats center, lit by two long narrow light strips.
On scroll: the spotlight moves, the ring rotates slowly, light rolls across the
gold, and the background brightens charcoal → cream. Meaning: the piece lives in
both worlds — the dark atelier and everyday light.

---

## Design language
- **Palette:** charcoal `#0A0908` · cream `#F7F4EF` · gold `#C9A227` (accent ONLY)
  - Gold is **decorative only** — never body text, never small text. It will
    likely fail 4.5:1 contrast on cream; that is an **accepted decision, not a
    bug to "fix" by changing the color.** Use charcoal/stone for readable text.
- **Headings:** David Libre, weight 400 (Hebrew serif — chosen over Heebo
  because sans-serif read as generic, not luxury). letter-spacing 0.08em.
  400 is David Libre's lightest cut — do not request lighter weights on
  headings (there is no 200/300 face). Controlled by one token: `--font-heading`.
- **Body:** Assistant, weight 400
- **CRITICAL:** luxury in Hebrew typography = thin weights, wide letter-spacing,
  generous whitespace. **Never bold headings** — bold reads as "SALE!" in Hebrew.
- **Minimal animation.** Luxury is silence, not motion.
- Fonts are self-hosted via `@fontsource/david-libre` (headings) and
  `@fontsource-variable/assistant` (body), Hebrew subset. No external font CDN.
  Heebo & Frank Ruhl Libre were **uninstalled** after the decision — no dead
  font files in the bundle. `/styleguide` is now a locked type-scale reference.

## Hebrew copy voice
- **Restrained, confident.** No exclamation marks. No marketing clichés.
  No superlatives ("הכי", "מדהים", "הטוב ביותר"). No hype.
- Speak plainly about materials, craft, and the everyday piece. Let the product
  and the whitespace carry the weight. When in doubt, say less.

## Code / language conventions
- All explanations, questions, summaries to the user: **Hebrew**.
- All code and code comments: **English**.
- RTL is the default. Use CSS logical properties / Tailwind logical utilities
  (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`) — never left/right.

---

## 3D strategy (hybrid — deliberate)
- **Hero (decision 2026-08-02, supersedes Spline):** a real-time **R3F** scene —
  "The Dark Room". The Spline scene was removed (`@splinetool/*` uninstalled):
  it cost +566KB, depended on an external CDN, and couldn't do scroll-driven
  motion. The hero now reuses the shared ring/materials/lights and is
  **scroll-driven**: on scroll the ring rotates, the light rolls across the
  gold, and the backdrop brightens charcoal→cream. Files:
  `src/three/hero/{HeroExperience,HeroCanvas}.tsx`. Scroll drives the scene via
  a Framer Motion `useScroll` MotionValue read inside `useFrame` — no per-frame
  React re-render. `frameloop` pauses when the hero is off-screen or the tab is
  hidden. Lazy chunk (three never in the entry). Never mounted under
  `prefers-reduced-motion` — static poster instead.
  TODO: real poster still → `public/posters/hero-poster.webp` (CSS glow for now).
- **Shared scene code:** `src/three/shared/{Ring,StudioLights}.tsx` — the single
  source for the ring geometry/materials and the Lightformer rig. Hero, `/lab`,
  the product 360° viewer and the story page all consume these. **No leva in
  `shared/`** — leva stays only in the `/lab` wrappers.
- **Product page:** true drag-to-rotate. Applies **only to the solitaire**
  (`solitaire-classic`) — the one product the ring.glb model actually depicts.
  A live R3F `OrbitControls` (Y-azimuth only) viewer, lazy-loaded. The other 14
  products keep their photo gallery (truthfulness: don't present a generic model
  as a specific photographed product). Production-correct alternative would be a
  pre-rendered image sequence per product.
- **`/lab`:** stays in the final build as a "behind the scenes" page with live
  material controls (leva). **leva MUST be code-split + lazy-loaded on `/lab`
  only** — never in the main bundle, never affecting the homepage's initial JS.
  Verify in the production build output that leva lands in its own separate chunk.
- **Additional 3D (decision 2026-08-02, deviation):** one ambient ring moment on
  the **Story** page. This deviates from the original "everywhere else: no 3D"
  rule — accepted by the user ("visuals first"). Still limited: no 3D in the
  catalog or gift guide (those need a fast grid; the gift buyer is time-pressed).
  One canvas per route only (SPA unmounts the previous — avoids WebGL context loss).
- All 3D code is isolated under `src/three/`.

### Performance budget (decision 2026-08-02: RELAXED)
- The "PageSpeed mobile 80+" budget is **relaxed** by explicit user decision
  ("visuals first"). Still take free wins: the entry chunk must NOT statically
  import `three-vendor` (fixed via a dedicated `zustand`→`state` chunk group in
  vite.config — zustand is shared by fiber and the cart store; without the split
  three becomes a static dep of every page). `frameloop` must idle off-screen.
  `prefers-reduced-motion` is NOT relaxed — it fully disables 3D (IS 5568).

### 3D material parameters — DO NOT deviate (difference between "gold" and "grey plastic")
**Gold — MeshStandardMaterial:**
- color `#E8D9A0` — pale champagne gold (rose variant: `#E8C4B8`).
  The original `#D4AF37` was rejected: too saturated, "egg-yolk / AI" yellow —
  wrong for this brand. Do not revert to it.
- metalness `1.0`, roughness `0.28` (0.15 read as glassy plastic;
  real polished gold is slightly less mirror-perfect), envMapIntensity `1.5`

**Diamond — MeshTransmissionMaterial (drei):**
- transmission `1.0`, ior `2.4`, thickness `0.5`, roughness `0.0`,
  chromaticAberration `0.06`, dispersion `0.5`

**Lighting — this is 80% of the result:**
- `<Environment>` built from `<Lightformer>` of `form="rect"`:
  two long/narrow at the sides, one wide above. Studio softbox mimicry.
- Build the environment ENTIRELY from Lightformers — **no HDRI file** and
  **no preset** (`city`/`sunset` contaminate the gold with color casts).

### Mobile 3D downgrade (measured decision, not a static poster)
- Keep **gold real-time** on mobile (cheap; ~85% of what's visible).
- Diamond → `MeshPhysicalMaterial` (no FBO/transmission passes).
- 2 Lightformers instead of 3. `dpr={[1, 1.5]}`. No real-time shadows.
- **Static poster** only for: no-WebGL devices, or `prefers-reduced-motion`.
- If PageSpeed mobile is still < 80 after this, STOP and report numbers before
  degrading further.

---

## Site map (all pages)
- **Home** `/` — hero (3D) → collections (3–4 blocks) → featured products (4) →
  Dana's story → why NOGA (handmade / diamond certificate / 30-day exchange /
  gift wrapping) → testimonials → gift guide by price → instagram + newsletter →
  rich footer.
- **Catalog** `/catalog` — filters (metal / price / category); gift guide by
  price is a filtered view (`/catalog?gift=1`).
- **Product** `/product/:slug` — the most important page (see requirements below).
- **Custom design** `/custom` — lead form.
- **Story** `/story` — Dana / the atelier.
- **Size & care guide** `/size-care`.
- **Cart** `/cart`.
- **Checkout** `/checkout` — designed, non-functional demo.
- **Order confirmation** `/order-confirmation`.
- **Accessibility statement** `/accessibility`.
- **Lab** `/lab` — "behind the scenes" 3D material controls (leva, lazy-loaded).

## Product page requirements (most important page)
- Image gallery: **4–5 angles + an on-body shot**, plus the **360° sequence**.
- Name, price, installment note.
- **Metal selector that actually swaps the images** (yellow / rose / white).
- **Size selector** + **size-guide modal** (focus-trapped, keyboard-closable).
- **Sticky add-to-cart on mobile**.
- Trust strip (handmade / certificate / exchange / wrapping).
- Shipping & returns.
- Related products.

## SEO (dedicated phase)
- Per-page **Hebrew** `<title>` and meta description.
- **Open Graph** tags (title, description, image, type).
- **JSON-LD**: `Product` (on product pages) and `LocalBusiness` (site-wide).
- `sitemap.xml`, `robots.txt`, canonical URLs.
- Reminder: SPA is fine for the demo, but production needs SSR / pre-rendering —
  client-rendered product pages index poorly.

## Non-negotiable constraints
- **Full RTL, Hebrew-first.** Verify no layout breaks in RTL.
- **Accessibility — IS 5568 / WCAG 2.0 AA:** 4.5:1 contrast, full keyboard nav,
  visible focus, alt text, honor `prefers-reduced-motion`, accessibility
  statement page.
- **Performance budget:** GLB < 2MB (Draco), first load < 2.5s, PageSpeed mobile
  **80+ WITH the 3D present**.
- **Mobile:** no real-time shadows, `dpr` capped `[1, 1.5]`, scroll-driven only.

## Stack (client-side only — no backend)
React 19 + Vite + TypeScript + Tailwind **v4** + @react-three/fiber +
@react-three/drei + motion (framer-motion) + lenis + zustand.
Cart in `localStorage`. Checkout is a designed, non-functional demo.

### Pinned versions (3D-related = EXACT, no caret) — verified vs npm 2026-07-24
- `react` **19.2.8**, `react-dom` **19.2.8** (inside fiber peer `>=19 <19.3`)
- `three` **0.185.1**
- `@react-three/fiber` **9.6.1**
- `@react-three/drei` **10.7.7**
- `@react-three/postprocessing` **3.0.4** (bloom — desktop-only; peers: fiber ^9, react ^19)
- `@splinetool/*` — **REMOVED** (2026-08-02). Hero is now R3F; do not reinstall.
- `zustand` — split into its own `state` chunk in vite.config (priority 25, above
  three-vendor's 10). Do NOT remove that group: zustand is shared by
  `@react-three/fiber` and the cart store, and without the split the entry chunk
  statically imports (and preloads) the 1.1MB three-vendor chunk on every page.
- Everything else may use caret. Do NOT bump the pinned 3D packages without
  re-checking peer ranges and re-testing the hero.

## Accepted advisories / non-issues (do not "fix")
- `npm audit` reports 2 high from **react-router** (GHSA-qwww-vcr4-c8h2, "RSC Mode
  CSRF Bypass"). It applies only to **RSC mode + server actions**, which this
  client-only SPA does not use. The offered fix is a **downgrade** to 7.11.0 —
  do NOT run `npm audit fix --force`. Kept `react-router-dom` at 7.18.1.
- Toolchain majors in use: **Vite 8**, **TypeScript 7** (native compiler — note:
  TS7 removed `baseUrl`; path aliases use relative `./src/*`).

## Demo integrity
- A dismissible **"מצב הדגמה"** indicator is always present so no visitor thinks
  a real purchase happened.
- At every simulated integration point, a code comment states EXACTLY what
  replaces it in production:
  - Payment → Cardcom / Grow / Tranzila
  - Forms (contact / custom-design lead) → EmailJS / Formspree
  - Booking (if used) → Arbox-style
- SPA routing is fine for the demo, but note in code that production needs
  SSR / pre-rendering for SEO (client-rendered product pages index poorly).

## Deploy
- Target **Vercel**. Prepare the build; do NOT deploy without explicit go-ahead.

---

## Build phases (see plan file for detail)
0 Foundation & design system · 1a 3D materials+lighting (static `/lab`, timeboxed
~2 days) · 2 Home · 3 Catalog+data · 4 Product page · 5 Cart/checkout · 6 Secondary
pages · 1b ScrollRig+hero integration · SEO · 7 A11y+perf hardening · 8 Polish/QA/Vercel.
