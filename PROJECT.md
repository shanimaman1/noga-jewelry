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
- **Name origin:** Dana named the atelier Noga after her daughter.
- **Price range:** ₪890–₪12,000
- **Language:** Hebrew, full RTL. Prices in ILS (₪).
- **WhatsApp / contact:** `+972-50-000-0000` — deliberately INVALID placeholder, never a real number.
- **Studio:** שבזי 45, נווה צדק, תל אביב. Sun–Thu 10:00–19:00,
  Fri 10:00–14:00, closed Saturday; booking ahead is recommended.

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
- In user-facing Hebrew, sentence punctuation uses a comma or a regular hyphen
  with spaces, never an em dash. Three periods replace the ellipsis character,
  and Hebrew quotation marks are used inside Hebrew copy. En dashes remain
  unchanged for ranges, and the Hebrew maqaf remains in Hebrew compounds.

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
- **Visit** `/visit` — studio address, embedded map, Waze, hours and contact.
- **Size & care guide** `/size-care`.
- **Cart** `/cart`.
- **Checkout** `/checkout` — designed, non-functional demo.
- **Order confirmation** `/order-confirmation`.
- **Accessibility statement** `/accessibility`.
- **Lab** `/lab` — "behind the scenes" 3D material controls (leva, lazy-loaded).

## Product page requirements (most important page)
- Image gallery: **4–5 angles + an on-body shot**, plus the **360° sequence**.
- Name, price, installment note.
- Quiet availability status from real product data: ready / made-to-order /
  temporarily out of stock.
- **Metal selector that actually swaps the images** (yellow / rose / white).
- **Size selector** + **size-guide modal** (focus-trapped, keyboard-closable).
- **Sticky add-to-cart on mobile**.
- Trust strip (handmade / certificate / exchange / wrapping).
- Shipping & returns.
- Home-delivery and studio-collection timing; made-to-order lead time is stated
  before the chosen fulfilment time.
- Related products.

## Availability and fulfilment
- `Product.availability` in `src/data/products.ts` is the single source of
  truth. Every product has exactly one of `ready`, `made-to-order`, or
  `out-of-stock`; UI and assistant copy must never infer a different state.
- User-facing labels are `מוכן בסטודיו`, `נוצר בהזמנה`, and `אזל זמנית`.
  Ready and made-to-order pieces use the existing cart and checkout unchanged.
  Made-to-order pieces take about two weeks to make before fulfilment.
- Home delivery takes 3–5 business days and costs ₪35, or zero above a ₪1,000
  subtotal. Collection from the studio takes up to 2 business days and costs
  zero. These timings and prices live in `src/lib/fulfillment.ts` and are reused
  on product pages, in the cart and checkout, and by the assistant.
- An out-of-stock product cannot be added to the cart. Its product page opens
  a small restock-email form. The form is deliberately simulated: it validates
  and confirms locally, sends no network request and stores no address.

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

## Stack (client SPA + one serverless assistant endpoint)
React 19 + Vite + TypeScript + Tailwind **v4** + @react-three/fiber +
@react-three/drei + motion (framer-motion) + lenis + zustand.
Cart in `localStorage`. Checkout is a designed, non-functional demo. The only
backend surface is `netlify/functions/agent-chat.ts`, used by the shopping
assistant; it holds the Gemini key and usage limits outside the client bundle.

### Shopping assistant — hybrid Stage 2 (approved 2026-08-20)
`src/lib/agent/` + `src/components/agent/`. A guided shopping assistant that
uses an LLM for free text and retains the four-question deterministic wizard as
a permanent session fallback. Both recommend up to three pieces.

The widget is mounted once in `RootLayout` (so it is absent from `/lab`, which
sits outside that layout). It still calls only `createAgentBrain()` and does not
know there are two brains. Stage 1 itself remains fully client-side and
unchanged: no LLM, API key or network call, and every answer is computed from
`src/data/products.ts` at runtime.

- The chat UI talks ONLY to the `AgentBrain` interface (`lib/agent/types.ts`).
  It never imports the wizard and never branches on which brain it got. Brain
  selection lives in exactly one place: `createAgentBrain()` in
  `lib/agent/index.ts`. Keep it that way — it is what makes stage 2 additive.
- Every option offered is derived from the data at runtime and only when it has
  at least one matching product, so a guided path cannot reach an empty result.
  `relaxationOptions()` is the safety net, not a normal path.
- **Content rule, non-negotiable:** availability is read from each product in
  `products.ts`; delivery timing is read from the shared fulfilment constants.
  Shipping cost is read from the same shared fulfilment source: ₪35 for home
  delivery, free over ₪1,000, and free studio collection. Studio address and
  hours are read from the shared `STUDIO` constant. Discounts, returns, warranty
  and custom-order pricing remain unknown and receive an honest handoff to
  WhatsApp. Product names, prices, metals and
  categories are never written as literals in the assistant code; they are
  read from `products.ts`. General jewellery knowledge may be answered without
  a tool, but it must never become a claim about a Noga product or policy.
- Layering: launcher/scrim z-30, panel z-41 (above the WhatsApp FAB's z-40 so it
  is not pierced, below the cart drawer / modals at z-50). The panel is
  bottom-anchored at `min(82svh, 100svh - 9rem)` so it never reaches the header.
- One deliberate layering exception: `lib/agent/catalog.ts` imports
  `CATEGORY_LABELS` and `PRICE_BANDS` from `components/catalog/FilterBar.tsx`.
  Those are the app's existing user-facing vocabulary — offering different tiers
  than the catalog filters would be inconsistent, and a second copy of the
  Hebrew labels would drift. Do not duplicate them.

**Stage 2 is approved and implemented.** `llmBrain` calls the same-origin
`/.netlify/functions/agent-chat` endpoint, which uses
`gemini-3.5-flash-lite`. The model ID is one server-side constant. The API key
exists only as the Netlify environment variable `GEMINI_API_KEY`; never prefix
it with `VITE_`, place it in `netlify.toml`, or expose it to client code.

The function exposes exactly five non-acting tools: `search_products`,
`get_product`, `present_recommendations`, `open_size_guide` and
`offer_whatsapp`. Search and product lookup read the existing
`lib/agent/catalog.ts` and `products.ts`; there is no second catalogue. Actions
remain buttons the shopper must click.

**Zero fabrication is structural wherever possible:**

- Each function request contains the current shopper message and at most two
  earlier shopper messages for conversational intent. Previous assistant prose,
  cards and catalogue facts are not sent. Context is explicitly untrusted and
  never counts as evidence; product facts must be fetched again in that turn.
- Gemini normally uses `AUTO` function calling on every round. Greetings and
  general jewellery questions may therefore receive natural prose without a
  tool, and an underspecified shopping request gets one clarifying question
  before any products are shown. Once there is enough detail to filter, the
  model must search and may present only results from that turn. A narrow
  `NONE` exception disables tools for a recognisably underspecified shopping
  request so it cannot dump arbitrary products before asking. A second narrow
  exception uses `ANY` with only `offer_whatsapp` allowed for recognisable
  questions about unknown business policies such as discounts, returns,
  warranty or custom-order pricing. A shipping-cost question uses a narrow
  `ANY` call to `search_products`; the server guarantees that call receives the
  shipping-cost flag before the fixed code template is rendered.
- The model never supplies recommendation-card data. It returns tool calls;
  the server derives card slugs only from the sorted catalogue result in that
  turn, and the client resolves every accepted slug against `products.ts`
  again. An unknown slug renders nothing.
- Catalogue selection is deterministic after the model chooses filters.
  `findProducts` ranks by preferred category, featured status, price and slug;
  the server always displays the first three. `present_recommendations` cannot
  reorder or choose a different subset. Filter/tool decisions run at zero
  temperature, while greetings, general knowledge and safe transition prose
  retain conversational sampling.
- Product-specific prose, availability and delivery lines are assembled by
  application code from that turn's tool records. Product names, prices and
  card descriptions are rendered from catalogue records, not model text.
  Availability, delivery, collection and shipping-cost facts use fixed code
  templates. Shipping figures are appended only from the verified tool result,
  after the unchanged model-prose grounding scan.
- Before returning, the function scans outgoing prose for `₪`, price-range
  numbers and catalogue names without matching tool evidence. It also rejects
  unbacked metal, category, stone, availability and delivery vocabulary and
  replaces the whole line with a generic WhatsApp handoff.
- Discounts, returns, warranty and custom-order pricing remain unknown and are
  handed off to WhatsApp.

The remaining instruction-only boundary is semantic intent: under `AUTO`, the
model decides whether a message is small talk, an open request, general
jewellery knowledge or detailed shopping intent, then chooses the matching
tool and requested fields. A model can misunderstand that intent or produce
subtle subjective wording that no finite scanner recognizes. It still cannot
inject a product, price or card record; catalogue facts are ignored from model
prose and rendered by code. This is the residual risk, and systemic failure
never reaches the shopper: the resilient brain switches permanently to the
unchanged wizard for that browser session after one short line.

An underspecified shopping turn is also checked after generation: if Gemini
asks more than one question or combines dimensions with "or", code replaces it
with one short question about the next missing dimension. Known bureaucratic
recommendation phrases are similarly normalised to plain Hebrew; greetings and
general jewellery answers are not templated.

Function logs record each called tool, privacy-safe arguments and result count,
plus whether the outgoing grounding scan replaced the text and a safe category
for server errors. Free-text query values, shopper messages, API keys and
session identifiers are never logged.

Server protections are fixed in the function: an origin allowlist, 500
characters per message, 20 messages per signed session, at most four Gemini
calls per message and an atomic cap of 200 Gemini calls per UTC day in a
strongly consistent Netlify Blobs store. Missing configuration, invalid session,
quota/cap errors or unavailable limit storage cause permanent wizard fallback;
a single recoverable message failure keeps the LLM path available.

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
  - Restock notification → inventory/CRM integration plus EmailJS / Formspree
  - Booking (if used) → Arbox-style
- SPA routing is fine for the demo, but note in code that production needs
  SSR / pre-rendering for SEO (client-rendered product pages index poorly).

## Deploy
- Target **Netlify**, continuous deployment from GitHub. The repo lives at
  github.com/shanimaman1/noga-jewelry; Netlify builds and deploys `master`
  automatically on every push. Drag-and-drop of `dist/` is no longer used.
  The live and canonical origin is `https://noga-jewelry.netlify.app`;
  `src/lib/seo.ts`, `public/sitemap.xml` and `public/robots.txt` use that same
  origin. Build config: `netlify.toml` (build command, publish directory, and a
  reserved functions path; no functions directory or function exists today —
  see ARCHITECTURE.md).
- **Because deploys are now automatic on push, pushing to `master` IS
  deploying.** The existing "do not deploy without explicit go-ahead" rule
  now applies to the push itself, not to a separate manual deploy step.

---

## Build phases (see plan file for detail)
0 Foundation & design system · 1a 3D materials+lighting (static `/lab`, timeboxed
~2 days) · 2 Home · 3 Catalog+data · 4 Product page · 5 Cart/checkout · 6 Secondary
pages · 1b ScrollRig+hero integration · SEO · 7 A11y+perf hardening · 8 Polish/QA/Netlify.
