import { getStore } from '@netlify/blobs';
import { products, getProduct } from '../../src/data/products';
import {
  CATEGORY_LABELS,
  METAL_LABELS,
  findProducts,
  type CatalogFilters,
  type PriceBand,
} from '../../src/lib/agent/catalog';
import {
  AVAILABILITY_LABELS,
  DELIVERY_TIMES,
  SHIPPING,
  productDeliveryText,
} from '../../src/lib/fulfillment';
import { formatPrice } from '../../src/lib/format';
import { stoneDescription } from '../../src/lib/productMaterials';
import { STUDIO } from '../../src/lib/constants';
import type { Availability, Category, Metal, Product } from '../../src/types/catalog';
import type { AgentChatResponse, LlmClientAction } from '../../src/lib/agent/llmProtocol';

/** One-line model swap, deliberately server-only. */
export const GEMINI_MODEL = 'gemini-3.5-flash-lite';

const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const CANONICAL_ORIGIN = 'https://noga-jewelry.netlify.app';
const STORE_NAME = 'agent-usage-limits';
const DAILY_REQUEST_CAP = 200;
const MAX_MESSAGES_PER_SESSION = 20;
const MAX_MESSAGE_LENGTH = 500;
const MAX_CONTEXT_MESSAGES = 2;
const MAX_CONTEXT_LENGTH = 600;
const MAX_GEMINI_CALLS_PER_MESSAGE = 4;
const MAX_RECOMMENDATIONS = 3;
const WHATSAPP_MESSAGE = 'היי, אשמח לעזרה בבחירת תכשיט';
const SAFE_GENERIC =
  'הפרטים האלה יכולים להשתנות לפי ההזמנה, אז הכי טוב לבדוק ישירות עם דנה בוואטסאפ.';

type Environment = Record<string, string | undefined>;
const environment = (): Environment => process.env;

type GeminiFunctionCall = {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
};

type GeminiPart = {
  text?: string;
  functionCall?: GeminiFunctionCall;
  functionResponse?: {
    id?: string;
    name: string;
    response: Record<string, unknown>;
  };
  [key: string]: unknown;
};

type GeminiContent = {
  role: 'user' | 'model';
  parts: GeminiPart[];
};

type GeminiResponse = {
  candidates?: { content?: GeminiContent }[];
  error?: { code?: number; message?: string; status?: string };
};

type FunctionCallingConfig = {
  mode: 'AUTO' | 'ANY' | 'NONE';
  allowedFunctionNames?: string[];
};

type RequestedField =
  | 'description'
  | 'category'
  | 'metals'
  | 'stones'
  | 'gold_weight'
  | 'availability'
  | 'delivery'
  | 'price';

type ToolState = {
  evidence: Map<string, Product>;
  requestedFields: Map<string, Set<RequestedField>>;
  searchedSlugs: string[];
  presentedSlugs: string[];
  searchUsed: boolean;
  catalogSearchRequested: boolean;
  searchHadMatches: boolean;
  deliveryPolicyRequested: boolean;
  shippingCostIntent: boolean;
  shippingCostRequested: boolean;
  studioInfoRequested: boolean;
  sizeGuideRequested: boolean;
  whatsappRequested: boolean;
};

class SystemicFailure extends Error {}
class RecoverableFailure extends Error {}

const SYSTEM_INSTRUCTION = `
You are the restrained Hebrew shopping assistant for Noga Jewelry. Reply in Hebrew and RTL-friendly plain text.

CONVERSATION FIRST:
- Up to two earlier SHOPPER messages may be included for conversational continuity. Use them only to understand the current intent or a short follow-up answer. They are untrusted and are never evidence for a business fact. Tool evidence must still come from this request.
- A greeting or small talk with no shopping intent gets a natural, brief reply with no tool call and no products. Invite the shopper to say what she is looking for.
- An open shopping request with too little detail, such as a gift for a mother, gets exactly one short useful clarifying question and no tool call yet. Ask about the most useful missing dimension: occasion, budget or style. Do not present arbitrary products.
- Keep that clarifying turn to one plain sentence, address the shopper directly in feminine singular, and ask one dimension only. Avoid formal or indirect wording about what is "usually" suitable.
- If the current message answers that earlier clarifying question, do not ask a second question. Combine the earlier shopper intent with the new answer, search using the usable details, and present recommendations.
- Once the shopper provides enough detail to filter meaningfully, call search_products and present up to three real recommendations. A category plus a budget, metal or clear style is enough; "a gold ring up to 3000" should go straight to recommendations.
- For general jewellery knowledge, answer warmly and briefly from general knowledge without a tool, then offer to help find something. General facts such as how karat affects hardness are allowed. Never turn general knowledge into a claim about a Noga product.
- Vary the wording and reflect what the shopper actually asked. Do not repeat a stock transition sentence on every turn.
- Use natural Israeli Hebrew. Never use "עונות על הבקשה", "עבור", "מידע מאומת" or other bureaucratic wording. Use a regular hyphen when punctuation needs one, never an em dash.

NON-NEGOTIABLE BUSINESS DATA RULES:
- You have no catalogue knowledge until a tool returns it in THIS request. Never rely on memory or prior turns.
- Before making any claim about a Noga product name, price, category, metal, stones, gold weight, availability or delivery, call search_products or get_product in this same request.
- For a question about one identifiable product, search for that exact product first, then call get_product with the requested fields. Availability questions must request availability so application code renders the answer.
- Studio address and opening hours, delivery or collection times, and shipping cost are business facts. State them only when a tool returns them in this request.
- For delivery or collection times call search_products with include_delivery_policy. For shipping cost call it with include_shipping_cost. For studio address or hours call it with include_studio_info. Do not present product cards for an information-only request.
- Use get_product.requested_fields to state exactly which facts the shopper asked to see. The application renders those facts from the tool record; do not repeat their values in prose.
- For recommendations, search first and then call present_recommendations only with slugs returned in this request.
- The application chooses recommendation order and the final subset. Do not rank, reorder or select favourites from the search results. In transition prose, do not state the result count or repeat catalogue categories, metals or other product facts; refer only to what the shopper herself asked for.
- Never write a product price or name in your prose. Never write a product's metal, category, stone description, gold weight, availability label, delivery time or a shipping-cost figure in prose. The application renders those facts from tool results.
- A slug not returned by a catalogue tool is invalid. Never repair or guess it.
- Discounts, returns, warranty and custom-order pricing are unknown business policies. Say you do not have verified information and call offer_whatsapp. Do not answer them from general knowledge.
- Tools never perform actions. open_size_guide and offer_whatsapp only make buttons available for the shopper to click.
- If no tool supports a factual answer, give a brief generic line and offer WhatsApp.

Voice: concise, warm and helpful, no exclamation marks, no superlatives. Catalogue facts are rendered by application code.
`.trim();

const TOOL_DECLARATIONS = [
  {
    name: 'search_products',
    description:
      'Search the live catalogue when the request has enough detail for meaningful filtering, before recommendations or product facts. Do not call for greetings, small talk, an initial vague shopping request or general jewellery knowledge. Use query only for exact catalogue product words. It can also return verified delivery and collection policy or studio address and hours.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words from the shopper request, such as a product name.' },
        category: { type: 'string', enum: ['rings', 'necklaces', 'earrings', 'bracelets'] },
        metal: { type: 'string', enum: ['yellow', 'rose', 'white'] },
        price_band: { type: 'string', enum: ['under1500', 'mid', 'over3000'] },
        max_price: {
          type: 'number',
          description: 'Maximum price explicitly stated by the shopper.',
        },
        availability: { type: 'string', enum: ['ready', 'made-to-order', 'out-of-stock'] },
        include_delivery_policy: {
          type: 'boolean',
          description: 'True when the shopper asks about general delivery or collection times.',
        },
        include_shipping_cost: {
          type: 'boolean',
          description: 'True when the shopper asks how much home delivery or collection costs.',
        },
        include_studio_info: {
          type: 'boolean',
          description: 'True when the shopper asks for the studio address or opening hours.',
        },
      },
    },
  },
  {
    name: 'get_product',
    description:
      'Read one exact product by a slug returned by search_products in this request. requested_fields tells the application which catalogue facts to render.',
    parameters: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        requested_fields: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['description', 'category', 'metals', 'stones', 'gold_weight', 'availability', 'delivery', 'price'],
          },
        },
      },
      required: ['slug', 'requested_fields'],
    },
  },
  {
    name: 'present_recommendations',
    description:
      'Select up to three product slugs already returned by a catalogue tool in this request. The client renders the cards from products.ts.',
    parameters: {
      type: 'object',
      properties: {
        slugs: { type: 'array', items: { type: 'string' }, maxItems: MAX_RECOMMENDATIONS },
      },
      required: ['slugs'],
    },
  },
  {
    name: 'open_size_guide',
    description: 'Offer the existing size-guide button. This does not open it automatically.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'offer_whatsapp',
    description:
      'Offer the existing WhatsApp handoff button for unknown information or when human help is useful. This does not send or open anything automatically.',
    parameters: { type: 'object', properties: {} },
  },
] as const;

function json(body: AgentChatResponse, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

function allowedOrigins(): Set<string> {
  const env = environment();
  const values = [CANONICAL_ORIGIN, env.URL, env.DEPLOY_PRIME_URL].filter(
    (value): value is string => Boolean(value),
  );
  if (env.CONTEXT === 'dev' || env.NETLIFY_DEV === 'true') {
    values.push('http://localhost:8888', 'http://127.0.0.1:8888');
  }
  return new Set(values.map((value) => value.replace(/\/$/, '')));
}

function originIsAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  return allowedOrigins().has(origin.replace(/\/$/, ''));
}

const toHex = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

async function sessionSignature(id: string, apiKey: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id));
  return toHex(new Uint8Array(signature));
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

async function issueSession(apiKey: string): Promise<{ id: string; token: string }> {
  const id = crypto.randomUUID();
  return { id, token: `${id}.${await sessionSignature(id, apiKey)}` };
}

async function readSession(
  token: unknown,
  apiKey: string,
): Promise<{ id: string; token: string } | null> {
  if (typeof token !== 'string') return issueSession(apiKey);
  const [id, suppliedSignature, extra] = token.split('.');
  if (extra || !id || !suppliedSignature || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const expected = await sessionSignature(id, apiKey);
  return sameString(expected, suppliedSignature) ? { id, token } : null;
}

/** Atomic limit consumption through strong reads plus ETag-guarded writes. */
async function consumeCounter(key: string, limit: number): Promise<boolean> {
  try {
    const store = getStore({ name: STORE_NAME, consistency: 'strong' });

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const entry = await store.getWithMetadata(key, { type: 'text' });
      const current = entry ? Number.parseInt(entry.data, 10) || 0 : 0;
      if (current >= limit) return false;

      const result = entry
        ? entry.etag
          ? await store.set(key, String(current + 1), { onlyIfMatch: entry.etag })
          : { modified: false }
        : await store.set(key, '1', { onlyIfNew: true });

      if (result.modified) return true;
    }
  } catch (error) {
    if (error instanceof SystemicFailure) throw error;
    throw new SystemicFailure('Usage-limit storage is unavailable.');
  }

  throw new SystemicFailure('Usage counter contention did not settle.');
}

const utcDay = () => new Date().toISOString().slice(0, 10);

function normalize(value: string): string {
  return value.toLocaleLowerCase('he-IL').replace(/[״׳"']/g, '').replace(/\s+/g, ' ').trim();
}

function searchHaystack(product: Product): string {
  return normalize(
    [
      product.slug,
      product.name,
      product.shortDescription,
      stoneDescription(product.stones),
      CATEGORY_LABELS[product.category],
      ...product.metals.flatMap((variant) => [METAL_LABELS[variant.id], variant.imageAlt]),
    ].join(' '),
  );
}

function catalogueRecord(product: Product) {
  return {
    slug: product.slug,
    name: product.name,
    description: product.shortDescription,
    price: product.price,
    category: CATEGORY_LABELS[product.category],
    metals: product.metals.map((variant) => METAL_LABELS[variant.id]),
    stonesDescription: stoneDescription(product.stones),
    goldWeightGrams: product.goldWeightGrams,
    availability: AVAILABILITY_LABELS[product.availability],
    delivery: productDeliveryText(product),
  };
}

function isCategory(value: unknown): value is Category {
  return value === 'rings' || value === 'necklaces' || value === 'earrings' || value === 'bracelets';
}

function isMetal(value: unknown): value is Metal {
  return value === 'yellow' || value === 'rose' || value === 'white';
}

function isPriceBand(value: unknown): value is PriceBand {
  return value === 'under1500' || value === 'mid' || value === 'over3000';
}

function isAvailability(value: unknown): value is Availability {
  return value === 'ready' || value === 'made-to-order' || value === 'out-of-stock';
}

const REQUESTED_FIELDS: RequestedField[] = [
  'description',
  'category',
  'metals',
  'stones',
  'gold_weight',
  'availability',
  'delivery',
  'price',
];

function searchProductsTool(args: Record<string, unknown>, state: ToolState) {
  state.searchUsed = true;
  if (args.include_delivery_policy === true) state.deliveryPolicyRequested = true;
  const includeShippingCost = args.include_shipping_cost === true || state.shippingCostIntent;
  if (includeShippingCost) state.shippingCostRequested = true;
  if (args.include_studio_info === true) state.studioInfoRequested = true;

  const filters: CatalogFilters = {
    category: isCategory(args.category) ? args.category : undefined,
    metal: isMetal(args.metal) ? args.metal : undefined,
    band: isPriceBand(args.price_band) ? args.price_band : undefined,
  };

  const query = typeof args.query === 'string' ? normalize(args.query).slice(0, 120) : '';
  const words = query.split(' ').filter(Boolean);
  const availability = isAvailability(args.availability) ? args.availability : undefined;
  const maxPrice =
    typeof args.max_price === 'number' && Number.isFinite(args.max_price) && args.max_price > 0
      ? args.max_price
      : undefined;
  const hasProductCriteria = Boolean(
    query || filters.category || filters.metal || filters.band || availability || maxPrice,
  );
  const isBusinessInfoOnly =
    !hasProductCriteria &&
    (args.include_delivery_policy === true || includeShippingCost || args.include_studio_info === true);
  const shouldSearchCatalogue = !state.shippingCostIntent && !isBusinessInfoOnly;
  state.catalogSearchRequested ||= shouldSearchCatalogue;

  const matches = shouldSearchCatalogue
    ? findProducts(filters)
        .filter((product) => !availability || product.availability === availability)
        .filter((product) => maxPrice === undefined || product.price <= maxPrice)
        .filter(
          (product) =>
            words.length === 0 || words.every((word) => searchHaystack(product).includes(word)),
        )
        .slice(0, 8)
    : [];

  // `findProducts` has a stable rank (preferred category, featured, price,
  // slug). The latest filter set fully replaces the candidate order, and the
  // first three are always the displayed subset.
  state.searchHadMatches = matches.length > 0;
  state.searchedSlugs = matches.map((product) => product.slug);
  for (const product of matches) {
    state.evidence.set(product.slug, product);
  }

  return {
    products: matches.map(catalogueRecord),
    deliveryPolicy:
      args.include_delivery_policy === true
        ? {
            home: DELIVERY_TIMES.home,
            collection: DELIVERY_TIMES.collection,
            madeToOrder: DELIVERY_TIMES.madeToOrder,
          }
        : null,
    shippingCost:
      includeShippingCost
        ? {
            home: SHIPPING.home,
            freeThreshold: SHIPPING.freeThreshold,
            collection: SHIPPING.collection,
          }
        : null,
    studioInfo:
      args.include_studio_info === true
        ? {
            address: STUDIO.address,
            hours: STUDIO.hours,
          }
        : null,
  };
}

function getProductTool(args: Record<string, unknown>, state: ToolState) {
  const slug = typeof args.slug === 'string' ? args.slug : '';
  const product = getProduct(slug);
  if (!product || !state.evidence.has(product.slug)) return { product: null };

  state.evidence.set(product.slug, product);
  const fields = Array.isArray(args.requested_fields)
    ? args.requested_fields.filter(
        (field): field is RequestedField =>
          typeof field === 'string' && REQUESTED_FIELDS.includes(field as RequestedField),
      )
    : [];
  state.requestedFields.set(product.slug, new Set(fields.length > 0 ? fields : ['description']));
  return { product: catalogueRecord(product) };
}

function presentRecommendationsTool(_args: Record<string, unknown>, state: ToolState) {
  // The model may request presentation, but selection and ordering are fixed
  // by the already-sorted search results. Model-supplied slug order is ignored.
  const accepted = state.searchedSlugs.slice(0, MAX_RECOMMENDATIONS);
  state.presentedSlugs = accepted;
  return { acceptedSlugs: accepted };
}

function executeTool(call: GeminiFunctionCall, state: ToolState): Record<string, unknown> {
  const args = call.args ?? {};
  switch (call.name) {
    case 'search_products':
      return searchProductsTool(args, state);
    case 'get_product':
      return getProductTool(args, state);
    case 'present_recommendations':
      return presentRecommendationsTool(args, state);
    case 'open_size_guide':
      state.sizeGuideRequested = true;
      return { offered: true };
    case 'offer_whatsapp':
      state.whatsappRequested = true;
      return { offered: true };
    default:
      return { error: 'Unknown tool.' };
  }
}

function executeCalls(calls: GeminiFunctionCall[], state: ToolState): Record<string, unknown>[] {
  if (state.shippingCostIntent) {
    for (const call of calls) {
      if (call.name === 'search_products') {
        call.args = { ...(call.args ?? {}), include_shipping_cost: true };
      }
    }
  }
  const results: Record<string, unknown>[] = new Array(calls.length);
  const isDataCall = (call: GeminiFunctionCall) =>
    call.name === 'search_products' || call.name === 'get_product';

  calls.forEach((call, index) => {
    if (isDataCall(call)) results[index] = executeTool(call, state);
  });
  calls.forEach((call, index) => {
    if (!isDataCall(call)) results[index] = executeTool(call, state);
  });
  calls.forEach((call, index) => {
    console.info(
      JSON.stringify({
        event: 'agent_tool_call',
        tool: safeToolName(call.name),
        arguments: safeToolArguments(call),
        resultCount: toolResultCount(call, results[index]),
      }),
    );
  });
  return results;
}

function safeToolName(name: string): string {
  return TOOL_DECLARATIONS.some((tool) => tool.name === name) ? name : 'unknown_tool';
}

function safeToolArguments(call: GeminiFunctionCall): Record<string, unknown> {
  const args = call.args ?? {};
  switch (call.name) {
    case 'search_products':
      return {
        ...(isCategory(args.category) ? { category: args.category } : {}),
        ...(isMetal(args.metal) ? { metal: args.metal } : {}),
        ...(isPriceBand(args.price_band) ? { priceBand: args.price_band } : {}),
        ...(typeof args.max_price === 'number' && Number.isFinite(args.max_price)
          ? { maxPriceProvided: true }
          : {}),
        ...(isAvailability(args.availability) ? { availability: args.availability } : {}),
        ...(args.include_delivery_policy === true ? { includeDeliveryPolicy: true } : {}),
        ...(args.include_shipping_cost === true ? { includeShippingCost: true } : {}),
        ...(args.include_studio_info === true ? { includeStudioInfo: true } : {}),
        queryProvided: typeof args.query === 'string' && args.query.trim().length > 0,
        ...(typeof args.query === 'string' ? { queryLength: args.query.length } : {}),
      };
    case 'get_product':
      {
        const slug = typeof args.slug === 'string' ? args.slug : '';
        const recognizedSlug = Boolean(getProduct(slug));
        return {
          ...(recognizedSlug ? { slug } : { slugRecognized: false }),
          requestedFields: Array.isArray(args.requested_fields)
            ? args.requested_fields.filter(
                (field): field is RequestedField =>
                  typeof field === 'string' && REQUESTED_FIELDS.includes(field as RequestedField),
              )
            : [],
        };
      }
    case 'present_recommendations':
      return {
        slugs: Array.isArray(args.slugs)
          ? args.slugs.filter(
              (slug): slug is string => typeof slug === 'string' && Boolean(getProduct(slug)),
            )
          : [],
        requestedSlugCount: Array.isArray(args.slugs) ? args.slugs.length : 0,
      };
    default:
      return {};
  }
}

function toolResultCount(
  call: GeminiFunctionCall,
  result: Record<string, unknown> | undefined,
): number {
  if (!result) return 0;
  if (call.name === 'search_products') {
    return Array.isArray(result.products) ? result.products.length : 0;
  }
  if (call.name === 'get_product') return result.product ? 1 : 0;
  if (call.name === 'present_recommendations') {
    return Array.isArray(result.acceptedSlugs) ? result.acceptedSlugs.length : 0;
  }
  return result.offered === true ? 1 : 0;
}

async function callGemini(
  apiKey: string,
  contents: GeminiContent[],
  functionCallingConfig: FunctionCallingConfig,
  temperature: number,
): Promise<GeminiResponse> {
  const available = await consumeCounter(`daily/${utcDay()}`, DAILY_REQUEST_CAP);
  if (!available) throw new SystemicFailure('Daily request cap reached.');

  let response: Response;
  try {
    response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        toolConfig: {
          functionCallingConfig,
        },
        generationConfig: {
          temperature,
          maxOutputTokens: 320,
        },
      }),
    });
  } catch {
    throw new RecoverableFailure('Gemini transport error.');
  }

  let payload: GeminiResponse;
  try {
    payload = (await response.json()) as GeminiResponse;
  } catch {
    throw new RecoverableFailure('Gemini returned unreadable JSON.');
  }

  if (response.ok) return payload;
  if (response.status === 429 || response.status === 401 || response.status === 403 || response.status === 404) {
    throw new SystemicFailure(payload.error?.status ?? `Gemini HTTP ${response.status}`);
  }
  if (response.status >= 500) throw new RecoverableFailure(`Gemini HTTP ${response.status}`);
  throw new SystemicFailure(payload.error?.status ?? `Gemini HTTP ${response.status}`);
}

function requiresUnknownPolicyHandoff(message: string): boolean {
  const normalized = normalize(message);
  const asksCustomPrice =
    /(?:עיצוב אישי|הזמנה אישית|הזמנה מיוחדת).*(?:עולה|עלות|מחיר|תמחור)/.test(normalized) ||
    /(?:עולה|עלות|מחיר|תמחור).*(?:עיצוב אישי|הזמנה אישית|הזמנה מיוחדת)/.test(normalized);
  return /הנח|קופון|מבצע|החזר|החלפ|אחריות/.test(normalized) || asksCustomPrice;
}

function asksShippingCost(message: string): boolean {
  const normalized = normalize(message);
  return /(?:משלוח|שליחות|איסוף)/.test(normalized) && /(?:כמה.*עולה|עלות|מחיר|דמי|חינם)/.test(normalized);
}

function shoppingFilterSignalCount(normalized: string): number {
  return [
    /טבעת|שרשרת|עגיל|צמיד/.test(normalized),
    /תקציב|עד\s*\d|\d\s*(?:שח|שקל)/.test(normalized),
    /זהב צהוב|זהב אדום|זהב לבן|רוז גולד/.test(normalized),
    /עדין|עדינה|קלאסי|קלאסית|בולט|בולטת|יומיום/.test(normalized),
  ].filter(Boolean).length;
}

function isUnderspecifiedShoppingRequest(message: string): boolean {
  const normalized = normalize(message);
  const hasOpenShoppingIntent =
    /מחפש|מחפשת|מתנה|לא יודע מה|לא יודעת מה|רוצה לקנות|בא לי/.test(normalized);
  if (!hasOpenShoppingIntent) return false;

  return shoppingFilterSignalCount(normalized) < 2;
}

function deterministicCatalogTurn(message: string, context: string[], state: ToolState): boolean {
  if (state.searchUsed) return true;
  const normalized = normalize([...context, message].join(' '));
  const filterSignals = shoppingFilterSignalCount(normalized);
  return (
    filterSignals >= 2 ||
    (context.length > 0 && filterSignals >= 1) ||
    /מלאי|זמינ|זמן משלוח|זמן איסוף|כתובת|שעות פתיחה/.test(normalized)
  );
}

function oneQuestionOnly(text: string, message: string): string {
  const normalized = normalize(text);
  const questionMarks = (text.match(/[?؟]/g) ?? []).length;
  const dimensions = [
    /תקציב/.test(normalized),
    /אירוע/.test(normalized),
    /סגנון/.test(normalized),
  ].filter(Boolean).length;
  if (questionMarks === 1 && !/\sאו\s/.test(normalized) && dimensions <= 1) {
    return text.trim();
  }

  const request = normalize(message);
  if (!/תקציב|עד\s*\d|\d\s*(?:שח|שקל)/.test(request)) {
    return 'איזה תקציב תרצי להקדיש לזה?';
  }
  return 'איזה סגנון היא אוהבת לענוד?';
}

function requestedFactLine(product: Product, fields: Set<RequestedField>): string | null {
  const facts: string[] = [];
  if (fields.has('description')) facts.push(product.shortDescription);
  if (fields.has('category')) facts.push(`קטגוריה: ${CATEGORY_LABELS[product.category]}`);
  if (fields.has('metals')) {
    facts.push(`מתכות: ${product.metals.map((variant) => METAL_LABELS[variant.id]).join(', ')}`);
  }
  if (fields.has('stones')) {
    facts.push(`אבנים: ${stoneDescription(product.stones)}`);
  }
  if (fields.has('gold_weight')) facts.push(`משקל זהב משוער: ${product.goldWeightGrams} גרם`);
  if (fields.has('availability')) {
    facts.push(`זמינות: ${AVAILABILITY_LABELS[product.availability]}`);
  }
  if (fields.has('delivery')) facts.push(productDeliveryText(product));

  // Price and name are deliberately rendered only by AssistantProductCard.
  if (facts.length === 0 && fields.has('price')) return null;
  return facts.length > 0 ? facts.join('. ') : null;
}

function naturalRecommendationTransition(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'הנה כמה אפשרויות שיכולות להתאים למה שחיפשת.';
  if (/עונות על (?:ה)?בקשה|מתאימות ל(?:ה)?בקשה|לבקשה שלך/.test(trimmed)) {
    return 'הנה כמה אפשרויות שיכולות להתאים למה שחיפשת.';
  }

  const natural = trimmed
    .replace(/אלו האפשרויות/g, 'הנה כמה אפשרויות')
    .replace(/עבור יום ההולדת/g, 'ליום ההולדת')
    .replace(/—/g, ',');
  return /עבור/.test(natural)
    ? 'הנה כמה כיוונים שיכולים להתאים למה שתיארת.'
    : natural;
}

function deterministicOutput(state: ToolState, modelText: string) {
  const factLines = [...state.requestedFields.entries()].flatMap(([slug, fields]) => {
    const product = state.evidence.get(slug);
    if (!product) return [];
    const line = requestedFactLine(product, fields);
    return line ? [line] : [];
  });

  const recommendationSlugs = (
    state.catalogSearchRequested
      ? state.searchedSlugs.slice(0, MAX_RECOMMENDATIONS)
      : [...state.requestedFields.keys()].slice(0, MAX_RECOMMENDATIONS)
  ).filter((slug) => state.evidence.has(slug));

  const lines = [...factLines];
  if (state.deliveryPolicyRequested) {
    lines.push(
      `משלוח עד הבית אורך ${DELIVERY_TIMES.home}, ואיסוף מהסטודיו אפשרי בתוך ${DELIVERY_TIMES.collection}. לפריט שנוצר בהזמנה יש להוסיף ${DELIVERY_TIMES.madeToOrder}, ואז חל זמן המסירה שנבחר.`,
    );
  }
  if (state.shippingCostRequested) lines.push('הנה הפרטים על עלות המשלוח והאיסוף.');
  if (state.studioInfoRequested) {
    lines.push(
      `כתובת הסטודיו היא ${STUDIO.address}. שעות הפתיחה: ${STUDIO.hours
        .map((row) => `${row.days}, ${row.hours}`)
        .join('; ')}.`,
    );
  }
  if (recommendationSlugs.length > 0 && factLines.length === 0) {
    lines.push(naturalRecommendationTransition(modelText));
  }
  if (state.catalogSearchRequested && !state.searchHadMatches) {
    lines.push('לא מצאתי התאמה בקטלוג לפי הבקשה הזאת.');
  }
  if (state.sizeGuideRequested) lines.push('אפשר לפתוח כאן את מדריך המידות.');
  if (state.whatsappRequested) lines.push(SAFE_GENERIC);

  const hasToolBackedOutput =
    state.evidence.size > 0 ||
    state.deliveryPolicyRequested ||
    state.shippingCostRequested ||
    state.studioInfoRequested ||
    state.sizeGuideRequested ||
    state.whatsappRequested ||
    state.searchUsed;

  return {
    text: lines.join(' ').trim() || (hasToolBackedOutput ? SAFE_GENERIC : modelText.trim() || SAFE_GENERIC),
    recommendationSlugs,
  };
}

function inspectOutgoingText(text: string, state: ToolState): string {
  if (text.includes('₪')) return SAFE_GENERIC;

  const numericClaims = [...text.matchAll(/\d[\d,]*/g)]
    .map((match) => Number.parseInt(match[0].replace(/,/g, ''), 10))
    .filter((value) => value >= Math.min(...products.map((product) => product.price)) && value <= Math.max(...products.map((product) => product.price)));
  const evidencePrices = new Set([...state.evidence.values()].map((product) => product.price));
  if (numericClaims.some((value) => !evidencePrices.has(value))) return SAFE_GENERIC;

  const normalizedText = normalize(text);
  for (const product of products) {
    if (
      normalizedText.includes(normalize(product.name)) &&
      !state.evidence.has(product.slug)
    ) {
      return SAFE_GENERIC;
    }
  }

  if (state.evidence.size === 0 && !state.deliveryPolicyRequested) {
    const unbackedAttribute =
      /זהב צהוב|זהב אדום|זהב לבן|טבעות|שרשראות|עגילים|צמידים|יהלום|יהלומים|פנינה|אבנים|מוכן בסטודיו|נוצר בהזמנה|אזל זמנית|ימי עסקים|שבועיים/;
    if (unbackedAttribute.test(text)) return SAFE_GENERIC;
  }

  return text;
}

function actionsFrom(state: ToolState): LlmClientAction[] {
  const actions: LlmClientAction[] = [];
  if (state.sizeGuideRequested) actions.push({ kind: 'size-guide' });
  if (state.whatsappRequested) actions.push({ kind: 'whatsapp', message: WHATSAPP_MESSAGE });
  return actions;
}

async function runToolLoop(
  apiKey: string,
  message: string,
  context: string[],
  state: ToolState,
) {
  const contextualMessage =
    context.length > 0
      ? `Earlier shopper messages for intent only:\n${context
          .map((entry, index) => `${index + 1}. ${entry}`)
          .join('\n')}\n\nCurrent shopper message:\n${message}`
      : message;
  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: contextualMessage }] }];
  let finalText = '';

  for (let callNumber = 0; callNumber < MAX_GEMINI_CALLS_PER_MESSAGE; callNumber += 1) {
    let functionCallingConfig: FunctionCallingConfig = { mode: 'AUTO' };
    if (callNumber === 0 && asksShippingCost(message)) {
      functionCallingConfig = { mode: 'ANY', allowedFunctionNames: ['search_products'] };
    } else if (callNumber === 0 && requiresUnknownPolicyHandoff(message)) {
      functionCallingConfig = { mode: 'ANY', allowedFunctionNames: ['offer_whatsapp'] };
    } else if (callNumber === 0 && isUnderspecifiedShoppingRequest(message)) {
      functionCallingConfig = { mode: 'NONE' };
    }
    const toolFactsComplete =
      state.presentedSlugs.length > 0 ||
      state.requestedFields.size > 0 ||
      state.deliveryPolicyRequested ||
      state.shippingCostRequested ||
      state.studioInfoRequested ||
      state.whatsappRequested ||
      state.sizeGuideRequested;
    const temperature =
      functionCallingConfig.mode === 'ANY' ||
      (!toolFactsComplete && deterministicCatalogTurn(message, context, state))
        ? 0
        : 0.55;
    const response = await callGemini(apiKey, contents, functionCallingConfig, temperature);
    const content = response.candidates?.[0]?.content;
    if (!content?.parts?.length) {
      const hasCompletedToolWork =
        state.searchUsed ||
        state.sizeGuideRequested ||
        state.whatsappRequested ||
        state.deliveryPolicyRequested ||
        state.shippingCostRequested ||
        state.studioInfoRequested;
      if (hasCompletedToolWork) return finalText;
      throw new RecoverableFailure('Gemini returned no candidate content.');
    }

    const calls = content.parts.flatMap((part) => (part.functionCall ? [part.functionCall] : []));
    const text = content.parts.flatMap((part) => (typeof part.text === 'string' ? [part.text] : [])).join(' ');
    if (text.trim()) {
      finalText = text.trim().replace(/\s*—\s*/g, ', ').replace(/[!！]/g, '');
    }
    if (calls.length === 0) {
      return functionCallingConfig.mode === 'NONE'
        ? oneQuestionOnly(finalText, message)
        : finalText;
    }

    const results = executeCalls(calls, state);
    contents.push(content);
    contents.push({
      role: 'user',
      parts: calls.map((call, index) => ({
        functionResponse: {
          ...(call.id ? { id: call.id } : {}),
          name: call.name,
          response: results[index],
        },
      })),
    });
  }

  throw new RecoverableFailure('Gemini exceeded the tool-call loop limit.');
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!originIsAllowed(request)) return new Response('Forbidden', { status: 403 });

  const apiKey = environment().GEMINI_API_KEY;
  if (!apiKey) return json({ mode: 'fallback' });

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json({ mode: 'retryable-error' }, 400);
  }
  if (rawBody.length > 2_000) return json({ mode: 'retryable-error' }, 413);

  let body: { sessionId?: unknown; message?: unknown; context?: unknown };
  try {
    body = JSON.parse(rawBody) as { sessionId?: unknown; message?: unknown; context?: unknown };
  } catch {
    return json({ mode: 'retryable-error' }, 400);
  }

  const session = await readSession(body.sessionId, apiKey);
  if (!session) return json({ mode: 'fallback' });
  if (typeof body.message !== 'string' || body.message.trim().length === 0) {
    return json({ mode: 'retryable-error', sessionId: session.token }, 400);
  }
  const message = body.message.trim();
  if (message.length > MAX_MESSAGE_LENGTH) {
    return json({ mode: 'retryable-error', sessionId: session.token }, 413);
  }
  const context = Array.isArray(body.context)
    ? body.context
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(-MAX_CONTEXT_MESSAGES)
    : [];
  if (
    context.some((entry) => entry.length > MAX_MESSAGE_LENGTH) ||
    context.reduce((total, entry) => total + entry.length, 0) > MAX_CONTEXT_LENGTH
  ) {
    return json({ mode: 'retryable-error', sessionId: session.token }, 413);
  }

  try {
    const sessionAvailable = await consumeCounter(
      `sessions/${session.id}`,
      MAX_MESSAGES_PER_SESSION,
    );
    if (!sessionAvailable) return json({ mode: 'fallback' });

    const state: ToolState = {
      evidence: new Map(),
      requestedFields: new Map(),
      searchedSlugs: [],
      presentedSlugs: [],
      searchUsed: false,
      catalogSearchRequested: false,
      searchHadMatches: false,
      deliveryPolicyRequested: false,
      shippingCostIntent: asksShippingCost(message),
      shippingCostRequested: false,
      studioInfoRequested: false,
      sizeGuideRequested: false,
      whatsappRequested: false,
    };

    const modelText = await runToolLoop(apiKey, message, context, state);
    const output = deterministicOutput(state, modelText);
    const inspectedText = inspectOutgoingText(output.text, state);
    const verifiedShippingText = state.shippingCostRequested
      ? `משלוח עד הבית עולה ${formatPrice(SHIPPING.home)}, וחינם בקנייה מעל ${formatPrice(SHIPPING.freeThreshold)}. איסוף מהסטודיו חינם.`
      : '';
    const responseText = [inspectedText, verifiedShippingText].filter(Boolean).join(' ');
    console.info(
      JSON.stringify({
        event: 'agent_grounding',
        replaced: inspectedText !== output.text,
        evidenceCount: state.evidence.size,
        recommendationCount: output.recommendationSlugs.length,
      }),
    );
    const actions = actionsFrom(state);

    return json({
      mode: 'ok',
      sessionId: session.token,
      text: responseText,
      recommendationSlugs: output.recommendationSlugs,
      actions:
        inspectedText === SAFE_GENERIC && actions.every((action) => action.kind !== 'whatsapp')
          ? [...actions, { kind: 'whatsapp', message: WHATSAPP_MESSAGE }]
          : actions,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'agent_error',
        kind:
          error instanceof SystemicFailure
            ? 'systemic'
            : error instanceof RecoverableFailure
              ? 'recoverable'
              : 'unexpected',
        reason: error instanceof Error ? error.message : 'Unknown error.',
      }),
    );
    if (error instanceof SystemicFailure) return json({ mode: 'fallback' });
    return json({ mode: 'retryable-error', sessionId: session.token }, 503);
  }
}
