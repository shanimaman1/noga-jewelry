# NOGA Fine Jewelry — Shared Project Guide

Portfolio **demo** site for a fictional luxury jewelry brand. Demo only — no real
payments or orders — but must look and behave 100% production-grade. Shown to
prospective clients as proof of capability.

> This is the tool-neutral, shared source of truth for brand, design, 3D,
> accessibility, performance and cross-tool working rules. Codex and Claude Code
> both read and update this file. Tool-specific instructions live in `AGENTS.md`
> and `CLAUDE.md`; when either conflicts with this file, this file wins.

The current code structure is documented in [ARCHITECTURE.md](ARCHITECTURE.md),
setup and commands in [README.md](README.md), and image work in
[docs/IMAGE_ASSET_REGISTER.md](docs/IMAGE_ASSET_REGISTER.md).

## Working rules
- Every task changes **nothing beyond its stated scope**. No opportunistic edits.
- **Flag any deviation from this file before acting on it** — do not silently
  "fix" something that contradicts a decision recorded here; raise it first.
- Decisions live in this file, not in an external plan file. If a decision is
  made, record it here so it survives.
- **Floating actions hide behind the hero, reveal after it.** The shopping-
  assistant launcher and the WhatsApp FAB are hidden while a page's hero
  section is on screen, and appear together once the user has scrolled past
  it — never one without the other (`src/components/layout/FloatingActions.tsx`).
  This exists because at 375px the two elements cannot fit beside the Home
  hero's headline, subtext and CTA row — an offset/spacing value alone does
  not solve it (measured in a real browser, not assumed; see CHANGELOG.md).
  Any change to hero spacing, or to either floating element, must preserve
  this hide/reveal behaviour and be re-verified at 375px with simulated
  mobile browser chrome.

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

**Diamond — two modes (`diamondMode` prop on `three/shared/Ring`):**
- `transmission` — the canon MeshTransmissionMaterial: transmission `1.0`,
  ior `2.4`, thickness `0.5`, roughness `0.0`, chromaticAberration `0.06`,
  dispersion `0.5`. **Only valid where something sits BEHIND the stone to
  refract** — i.e. `/lab`, which has a lit Stage backdrop. Used there only.
- `reflective` (default, decision 2026-08-03) — MeshPhysicalMaterial:
  metalness `0`, roughness `0`, ior `2.4`, reflectivity `1`, clearcoat `1`,
  envMapIntensity `3`, **emissive `#ffffff` at `0.45`**. Used on every
  transparent canvas (hero, story, product viewer).
  Why this deviates from canon: over a transparent canvas on a dark page the
  transmission material refracts darkness and the stone renders **black**.
  A metallic version renders black too — a mirror can only show the
  environment, and this environment is a dark room with three light strips.
  The emissive floor stands in for the light a real diamond gathers from a
  whole room. User's explicit call: "I'd rather it sparkle than be technically
  correct and black." Do not remove the emissive without re-checking the hero.

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

### Shopping assistant — STAGE 1 ONLY (decision 2026-08-17)
`src/lib/agent/` + `src/components/agent/`. A guided shopping assistant that
narrows the catalogue by four questions and recommends up to three pieces.

**Stage 1 is fully client-side, so the "client-side only — no backend"
constraint above still holds.** No LLM, no API key, no network call: every
answer is computed from `src/data/products.ts` at runtime. Mounted once in
`RootLayout` (so it is absent from `/lab`, which sits outside that layout).

- The chat UI talks ONLY to the `AgentBrain` interface (`lib/agent/types.ts`).
  It never imports the wizard and never branches on which brain it got. Brain
  selection lives in exactly one place: `createAgentBrain()` in
  `lib/agent/index.ts`. Keep it that way — it is what makes stage 2 additive.
- Every option offered is derived from the data at runtime and only when it has
  at least one matching product, so a guided path cannot reach an empty result.
  `relaxationOptions()` is the safety net, not a normal path.
- **Content rule, non-negotiable:** the assistant never states stock,
  delivery time, discounts or shipping cost — this project has no such data.
  Those questions get an honest "not in this demo" answer plus WhatsApp. Product
  names, prices, metals and categories are never written as literals in the
  assistant code; they are read from `products.ts`.
- Layering: launcher/scrim z-30, panel z-41 (above the WhatsApp FAB's z-40 so it
  is not pierced, below the cart drawer / modals at z-50). The panel is
  bottom-anchored at `min(82svh, 100svh - 9rem)` so it never reaches the header.
- One deliberate layering exception: `lib/agent/catalog.ts` imports
  `CATEGORY_LABELS` and `PRICE_BANDS` from `components/catalog/FilterBar.tsx`.
  Those are the app's existing user-facing vocabulary — offering different tiers
  than the catalog filters would be inconsistent, and a second copy of the
  Hebrew labels would drift. Do not duplicate them.

**Stage 2 (an `llmBrain`) is NOT approved.** A real LLM needs a serverless
function to hold the API key (a key in the client bundle is public), which would
break the no-backend constraint and require updating this file. Do not add
`api/`, a server function, or any external network call without that approval.
Cost and abuse-protection analysis was done on 2026-08-17: a hybrid design with
a daily cap and a fallback to this deterministic wizard was the agreed shape if
it is ever approved.

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
- Target **Netlify**, continuous deployment from GitHub. The repo lives at
  github.com/shanimaman1/noga-jewelry; Netlify builds and deploys `master`
  automatically on every push. Drag-and-drop of `dist/` is no longer used.
  Build config: `netlify.toml` (build command, publish directory, and a
  reserved-but-currently-empty functions directory — see ARCHITECTURE.md).
- **Because deploys are now automatic on push, pushing to `master` IS
  deploying.** The existing "do not deploy without explicit go-ahead" rule
  now applies to the push itself, not to a separate manual deploy step.

---

## Build phases (see plan file for detail)
0 Foundation & design system · 1a 3D materials+lighting (static `/lab`, timeboxed
~2 days) · 2 Home · 3 Catalog+data · 4 Product page · 5 Cart/checkout · 6 Secondary
pages · 1b ScrollRig+hero integration · SEO · 7 A11y+perf hardening · 8 Polish/QA/Netlify.
