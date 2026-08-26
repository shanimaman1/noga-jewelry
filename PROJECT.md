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
- Tel Aviv atelier for handmade 14k gold; seven selected designs have an
  explicitly priced 18k special-order variant. Natural and lab-grown diamonds.
- **Positioning:** "תכשיט אחד שתלבשי כל יום — לא עשרה נשכחים במגירה"
- **Founder:** Dana (דנה), Bezalel-trained goldsmith, 12 years' experience
- **Name origin:** Dana named the atelier Noga after her daughter.
- **Price range:** ₪890–₪10,200, including selectable 18k variants.
- **Language:** Hebrew, full RTL. Prices in ILS (₪).
- **WhatsApp / contact:** `050-9054826`; WhatsApp links use `972509054826`.
  This is the only real contact route in the demo. The displayed email and
  Instagram account are fictional demo details and are labelled as such.
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
- **Returns & service** `/returns-service` — exchange, refund, resizing,
  warranty, repairs, cleaning and setting-inspection terms.
- **Cart** `/cart`.
- **Checkout** `/checkout` — designed, non-functional demo.
- **Order confirmation** `/order-confirmation`.
- **Accessibility statement** `/accessibility`.
- **Lab** `/lab` — "behind the scenes" 3D material controls (leva, lazy-loaded).

## Product page requirements (most important page)
- Image gallery: **4–5 angles + an on-body shot**, plus the **360° sequence**.
- Name, catalogue number, price, installment note.
- Quiet availability status from real product data: ready / made-to-order /
  temporarily out of stock.
- **Metal selector that actually swaps the images** (yellow / rose / white).
- **Size selector** + **size-guide modal** (focus-trapped, keyboard-closable).
- **Sticky add-to-cart on mobile**.
- Trust strip (certificate only when one diamond exceeds 0.3ct / exchange /
  wrapping).
- Explicit stones disclosure and approximate net gold weight from product data;
  seven supported designs show a 14k / 18k selector and the other nine explain
  plainly why they stay in harder 14k gold.
- Shipping & returns.
- Home-delivery and studio-collection timing; made-to-order lead time is stated
  before the chosen fulfilment time.
- Related products.
- Quiet link from every product page to seeing the piece at the single atelier.

## Availability and fulfilment
- `Product.availability` in `src/data/products.ts` is the single source of
  truth. Every product has exactly one of `ready`, `made-to-order`, or
  `out-of-stock`; UI and assistant copy must never infer a different state.
- User-facing labels are `מוכן בסטודיו`, `נוצר בהזמנה`, and `אזל זמנית`.
  Ready and made-to-order pieces use the existing cart and checkout unchanged.
  Made-to-order pieces take about two weeks to make before fulfilment.
- Selecting an 18k variant always sets the effective state to `made-to-order`
  without changing the product's stored 14k availability. Karat, effective
  price and lead time change together and the selected karat stays on the cart
  line through checkout and confirmation.
- Home delivery takes 3–5 business days and is free on every order. Collection
  from the studio takes up to 2 business days and is also free. These timings
  and prices live in `src/lib/fulfillment.ts` and are reused on product pages,
  in the cart and checkout, and by the assistant.
- An out-of-stock product cannot be added to the cart. Its product page opens
  a small restock-email form. The form is deliberately simulated: it validates
  and confirms locally, sends no network request and stores no address. It does
  not show delivery or collection information until the product is available.

## Returns and aftercare
- `src/lib/servicePolicies.ts` is the shared source for returns, resizing,
  warranty, repairs, cleaning and setting inspection. Product pages, the
  service page, the size guide and both assistant brains read from it.
- Standard pieces may be exchanged within 30 days or returned for a full refund
  within 14 days, unworn and in their original packaging. The atelier covers
  return shipping and arranges collection through WhatsApp. Statutory consumer
  rights continue to apply.
- A piece made to a shopper's measurement or special requirement, including an
  18k variant, cannot be exchanged or refunded after production starts. Every
  effectively made-to-order product shows this before the purchase action.
- The first ring resize is free and normally takes 7–10 business days.
- Manufacturing defects are covered for 12 months. Wear-and-tear repairs are
  inspected and quoted before work. Professional cleaning and setting
  inspection are free.
- The cart shows that free studio collection can be selected at checkout. The
  footer repeats the studio address and opening hours.

## Product materials and catalogue identity
- Every product has an explicit, unique `sku` in `src/data/products.ts`. The
  shopper-facing scheme uses a category prefix and a three-digit sequence:
  `RNG`, `NCK`, `EAR` and `BRC`. It is shown on the product page and stays on
  the cart line through checkout and confirmation; the assistant reads it only
  from its catalogue tool.
- Every product has explicit `stones`, `goldWeightGrams` and `availableIn18K`
  fields in `src/data/products.ts`. There is no fallback stone claim in the UI.
- `stones` distinguishes no stones, cultured freshwater pearl, natural diamonds
  and lab-grown diamonds. Diamond records carry total carat weight; the
  solitaire also carries colour and clarity.
- `goldWeightGrams` is an approximate net gold weight and excludes stones.
- Exactly seven products carry `availableIn18K: true` and an explicit `price18K`;
  the other nine carry a plain construction reason for staying in 14k. The
  assistant receives availability, price, reason and lead time through its
  catalogue tool. It renders the fixed facts from code and shows any 18k price
  in a catalogue-backed card, never in model prose.
- Checkout offers a credit-card instalment dropdown from 1 to 12 with no price
  uplift. Integer totals are split exactly, any remainder goes into the first
  payment, and the selected schedule is recorded in the order confirmation.
  Bit and Apple Pay stay single-payment options. Checkout remains a local demo
  with no charge.
- Checkout includes an optional free-text field for order or delivery notes
  beside the gift-message area. It is stored only in the local demo order
  snapshot and shown on confirmation when it is not empty.
- The product trust strip follows the homepage policy exactly: a diamond
  certificate is shown only for a single diamond above 0.3ct. Total melee
  weight does not qualify a multi-stone piece.

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
- **Content rule, non-negotiable:** structured product facts stay in
  `products.ts`. Every other business fact is looked up through one generated
  index of the visitor-facing page, component and shared-source copy. The build
  recreates `src/generated/siteContentIndex.ts` from the actual source strings,
  so guides, services, policies, people, contact, fulfilment and new pages do
  not require another topic-specific assistant tool or a manually copied
  knowledge base. Discounts and other custom-order pricing remain unknown when
  the site search returns nothing and receive an honest WhatsApp handoff. Product names,
  catalogue numbers, prices, metals, categories, stone details and
  approximate gold weights are never written as literals in the assistant
  code; they are read from `products.ts`. General jewellery knowledge may be
  answered without a tool, but it must never become a claim about a Noga product
  or policy.
- Layering: launcher/scrim z-30, panel z-41 (above the WhatsApp FAB's z-40 so it
  is not pierced, below the cart drawer / modals at z-50). The panel is
  bottom-anchored at `min(82svh, 100svh - 9rem)` so it never reaches the header.
- On mobile the panel is explicitly contained to the viewport's inline width.
  Its header, log and input row cannot shrink or expand beyond that width;
  message text uses emergency wrapping for long tokens. The free-text input is
  at least 16px on mobile so iOS Safari does not zoom the visual viewport and
  move the close or send buttons off-screen. While the software keyboard is
  open, the panel maps itself to the current `VisualViewport` height and bottom
  offset: header and composer remain visible, and only the transcript shrinks
  into its existing scroll region. Closing the keyboard restores the normal
  `svh`-bounded sheet.
- A submitted free-text message appears in the transcript immediately. There is
  no generic thinking indicator. Gemini receives the message directly with the
  site tools available in `AUTO` mode. If it actually calls a site-data tool, the
  function streams `checking-site` and the UI shows `בודקת באתר...`. Greetings,
  small talk and general knowledge require no tool and receive no lookup status.
  This is UI feedback only and never supplies or templates an assistant answer.
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

The function exposes five non-acting tools: `search_products`, `get_product`,
`search_site_content`, `present_recommendations` and `offer_site_action`.
Product data remains structured for deterministic cards. `search_site_content`
is the single search engine for everything else the site says and returns exact
source excerpts with their page paths. A multi-subject request is sent as one
group per subject; retrieval shares the result budget across subjects and search
terms instead of letting the first match hide the rest. Hebrew inflections and
site vocabulary synonyms are expanded inside retrieval, without classifying the
shopper's intent. The static index is generated during every build by
`scripts/build-site-content-index.mjs`. Values rendered from shared constants or
functions, such as hours, delivery times and service terms, are added at runtime
from those same sources of truth rather than copied into a second policy store.
Actions remain buttons the shopper must click.

**Zero fabrication is structural wherever possible:**

- Each function request contains the current shopper message and the full prior
  conversation from both sides. Earlier prose is continuity only and never
  counts as evidence; product and business facts must still be fetched again in
  the current turn.
- There is no server-side intent classifier, no forced `ANY`, no blocked
  `NONE`, no policy/browsing/unknown router and no post-generation question or
  transition normaliser. Gemini receives the shopper message and all five site
  tools in one normal `AUTO` request, then decides whether to answer directly or
  call the relevant source of truth.
- The model never supplies recommendation-card data. Catalogue tools return raw
  records from `products.ts`; Gemini may use those records to choose the relevant
  subset, but the server accepts only slugs returned by a search in that turn
  and preserves their deterministic catalogue order. The client resolves every
  accepted slug against `products.ts` again. An unknown slug renders nothing.
- Catalogue selection is deterministic after the model chooses filters.
  `findProducts` ranks by preferred category, featured status, price and slug;
  the accepted subset is capped at three. An explicit cheapest-item search uses
  a stable price/slug order and returns one record.
- Tools return raw catalogue records or exact excerpts from the current site
  copy, not prepared answer sentences. Gemini reads those results and writes the reply in
  natural Hebrew. Product cards, including names, prices and descriptions, are
  still rendered by application code from catalogue records and never copied
  from model text. A cart request likewise presents a verified card; only the
  shopper's click on its button changes the cart.
- Before returning, the function scans outgoing prose for `₪`, price-range
  numbers and catalogue names without matching tool evidence. It also rejects
  unbacked metal, category, stone, availability and delivery vocabulary and
  rejects Latin, Cyrillic, Arabic or Greek script in assistant prose, replacing
  a failing reply with the safe generic handoff. Gemini is instructed to write
  and proofread natural Israeli Hebrew only; digits may remain digits.
- Discounts and custom-order pricing other than explicit 18k variants remain
  unknown and are handed off to WhatsApp.

The instruction-only boundary is Gemini's semantic work under `AUTO`: whether a
turn needs a tool, which tool and fields/topics to request, and whether its
natural paraphrase stays faithful to the raw result. There is deliberately no
regex intent router or canned-answer layer to replace that language work. The
residual risk is a missed lookup, an unsupported paraphrase or awkward wording.
It still cannot inject a product, price or card record: card data is rendered by
code and the unchanged outgoing scanner rejects product and price claims without
same-turn evidence. Systemic failure never reaches the shopper; the resilient
brain switches permanently to the unchanged wizard for that browser session
after one short line.

Function logs record each called tool, privacy-safe arguments and result count,
plus whether the outgoing grounding scan replaced the text and a safe category
for server errors. Free-text query values, shopper messages, API keys and
session identifiers are never logged.

Server protections are fixed in the function: an origin allowlist, 500
characters per message, 20 messages per signed session, at most four Gemini
tool-loop calls per message and an atomic cap of 200 Gemini calls per UTC day in a
strongly consistent Netlify Blobs store. Missing configuration, invalid session,
quota/cap errors or unavailable limit storage cause permanent wizard fallback.
There is no application timeout or retry layer around the model call; provider
or platform limits remain the outer boundary.

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
- WhatsApp is the one working contact route. Email and Instagram stay visible
  as fictional portfolio details and carry a plain demo label wherever shown.
- Newsletter and custom-design forms validate locally, send and store nothing,
  and state that before submission and in their local success message. The
  checkout creates only a local navigation snapshot; confirmation states that
  no charge, email, fulfilment or shipping action occurs.
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
  origin. Build config: `netlify.toml` (build command, publish directory and
  `netlify/functions/agent-chat.ts`; see ARCHITECTURE.md).
- **Because deploys are now automatic on push, pushing to `master` IS
  deploying.** The existing "do not deploy without explicit go-ahead" rule
  now applies to the push itself, not to a separate manual deploy step.

---

## Build phases (see plan file for detail)
0 Foundation & design system · 1a 3D materials+lighting (static `/lab`, timeboxed
~2 days) · 2 Home · 3 Catalog+data · 4 Product page · 5 Cart/checkout · 6 Secondary
pages · 1b ScrollRig+hero integration · SEO · 7 A11y+perf hardening · 8 Polish/QA/Netlify.
