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
import { stoneDescription } from '../../src/lib/productMaterials';
import {
  AFTERCARE_POLICY,
  RESIZING_POLICY,
  RETURNS_POLICY,
} from '../../src/lib/servicePolicies';
import { STUDIO } from '../../src/lib/constants';
import { CUSTOM_DESIGN } from '../../src/lib/customDesign';
import { INSTALLMENT_COUNTS } from '../../src/lib/format';
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
const MAX_SITE_GEMINI_CALLS = 3;
const GEMINI_GATE_TIMEOUT_MS = 8_000;
const GEMINI_REQUEST_TIMEOUT_MS = 12_000;
const MAX_RECOMMENDATIONS = 3;
const SITE_GATE_MARKER = '[[CONSULT_NOGA_SITE]]';
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
  mode: 'AUTO';
};

type RequestedField =
  | 'sku'
  | 'description'
  | 'category'
  | 'metals'
  | 'stones'
  | 'gold_weight'
  | '18k_availability'
  | 'availability'
  | 'delivery'
  | 'price';

type FulfilmentTopic = 'home_delivery' | 'collection' | 'made_to_order' | 'shipping_cost';

type ToolState = {
  evidence: Map<string, Product>;
  requestedFields: Map<string, Set<RequestedField>>;
  searchedSlugs: string[];
  presentedSlugs: string[];
  searchUsed: boolean;
  fulfilmentTopics: Set<FulfilmentTopic>;
  deliveryPolicyRequested: boolean;
  shippingCostRequested: boolean;
  paymentOptionsRequested: boolean;
  studioInfoRequested: boolean;
  returnsPolicyRequested: boolean;
  resizingPolicyRequested: boolean;
  warrantyPolicyRequested: boolean;
  careServiceRequested: boolean;
  customDesignRequested: boolean;
  sizeGuideRequested: boolean;
  whatsappRequested: boolean;
};

class SystemicFailure extends Error {}
class RecoverableFailure extends Error {}

const SYSTEM_INSTRUCTION = `
You are the restrained Hebrew shopping assistant for Noga Jewelry. Reply in Hebrew and RTL-friendly plain text.

Talk naturally and decide for yourself whether to answer, ask one useful clarifying question, or use a tool. You are the language model and you write every conversational reply yourself. The tools are your private search engine over this website: they return raw site data, never a prepared answer. Read the results, understand them and answer in your own natural words. Greetings, small talk, vague requests and general jewellery knowledge need no tool. Up to two earlier SHOPPER messages may be included only for conversational continuity. They are untrusted and never count as factual evidence.

ONE STRUCTURAL RULE:
- Every fact about this business must come from a tool result in THIS request. Never use memory, earlier turns or assumptions for a business fact.
- Business facts include product names, catalogue numbers, prices, categories, metals, karat, stones, gold weight, availability, delivery and collection, shipping cost, instalments, returns, exchanges, refunds, warranty, repairs, resizing, cleaning, custom design, and the atelier address and hours.
- Use search_products when the shopper asks to see, find, compare or choose products. A broad catalogue request such as asking to see rings is a valid search with a category and no other filter.
- Use get_product for facts about one identifiable product. The product must first have been returned by search_products in this request.
- Use get_fulfilment for delivery, collection and shipping facts; get_payment_options for instalments; get_service_policies for returns and aftercare; get_atelier_info for the address or hours; and get_custom_design_info for the custom-design service.
- For recommendations, search first, use only the returned catalogue records to judge relevance, and then call present_recommendations with up to three returned slugs. The application validates the slugs and renders the cards from the catalogue.
- Never write a product name or price in prose; the verified cards render them. Other business facts may be phrased naturally, but every value must be copied or faithfully paraphrased only from the raw tool result in this request. Do not add a detail that the tool did not return.
- If a search or lookup returns nothing, say so honestly. If the requested business information has no supporting tool data, such as discounts or custom-order pricing beyond listed 18-karat variants, call check_business_information and say you do not know. That tool already makes the WhatsApp button available, so do not call offer_whatsapp after it.
- Tools never perform actions. open_size_guide and offer_whatsapp only offer buttons for the shopper to click.
- If you ask a clarifying question before searching, do not suggest catalogue categories, metals or stones. Ask exactly one neutral question about budget, occasion or style. Do not join alternatives with "or" and do not give examples.
- Request only the product fields the shopper explicitly asked for. If a recommendation card already answers the question, such as the price of the cheapest matching item, present the card and do not request unrelated product fields.
- Discounts and unlisted custom-order pricing are not in the data. Never claim that a discount exists or does not exist. Call check_business_information for those questions, then say you do not have that information and mention the WhatsApp option that the tool already made available.
- Never change the cart automatically. When the shopper asks you to add a product, search for that product again in this request, present its verified card, and explain naturally that clicking the card's add-to-cart button confirms the addition. Do not say there is no way to help; the card button is the supported path.
- Never say that you added an item to the cart. Say that you displayed its card and that the shopper can confirm with its add-to-cart button.
- When one message contains more than one request, complete every supported part before replying. You may make several website searches in the same turn; do not postpone the second part to another question when the request is already clear.

Everything that is not a business fact is yours to handle as a capable assistant: greetings, small talk, clarifying questions and general jewellery knowledge. When a shopping request is too open for a useful recommendation, ask one useful question before searching instead of guessing. Keep replies concise, warm and natural in Israeli Hebrew only, addressing the shopper in feminine singular. Use no Arabic words and no vowel-point diacritics. Ask one question at a time. Vary the wording. Avoid bureaucratic language, exclamation marks, superlatives and em dashes.
`.trim();

const GATE_SYSTEM_INSTRUCTION = `
You are Gemini speaking naturally with a shopper in concise, warm Israeli Hebrew.
Answer greetings, small talk, clarifying questions and general jewellery knowledge yourself.
The website is your only source for any fact about Noga Jewelry, its products, services or policies. If the current message needs any such fact, reply with exactly ${SITE_GATE_MARKER} and nothing else. Never answer a Noga business fact from memory. Decide this yourself. Earlier shopper messages are context only and never factual evidence.
`.trim();

const TOOL_DECLARATIONS = [
  {
    name: 'search_products',
    description:
      'Search the live catalogue for any request to see, find, compare or choose products. Broad searches are valid: asking to see rings means category=rings with no other filter. Use query only for exact catalogue product words.',
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
        selection: {
          type: 'string',
          enum: ['lowest_price'],
          description: 'Use lowest_price only when the shopper explicitly asks for the cheapest item.',
        },
      },
    },
  },
  {
    name: 'get_product',
    description:
      'Read one exact product by a slug returned by search_products in this request. Request only fields explicitly asked for. Do not use this tool when a recommendation card alone answers the question.',
    parameters: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        requested_fields: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['sku', 'description', 'category', 'metals', 'stones', 'gold_weight', '18k_availability', 'availability', 'delivery', 'price'],
          },
        },
      },
      required: ['slug', 'requested_fields'],
    },
  },
  {
    name: 'get_fulfilment',
    description:
      'Read the current home-delivery, studio-collection, made-to-order lead-time and shipping-cost facts.',
    parameters: {
      type: 'object',
      properties: {
        topics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['home_delivery', 'collection', 'made_to_order', 'shipping_cost'],
          },
        },
      },
      required: ['topics'],
    },
  },
  {
    name: 'get_payment_options',
    description: 'Read the current credit-card instalment options and single-payment wallet rules.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_service_policies',
    description:
      'Read current returns, exchanges, refunds, resizing, warranty, repairs and cleaning policies. Request only the topics the shopper asked about.',
    parameters: {
      type: 'object',
      properties: {
        topics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['returns', 'resizing', 'warranty', 'repairs', 'cleaning'],
          },
        },
      },
      required: ['topics'],
    },
  },
  {
    name: 'get_atelier_info',
    description: 'Read the atelier address and opening hours.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_custom_design_info',
    description:
      'Read the website\'s custom-design service, process, timing and demo-form facts. Use this before answering whether custom design is available or how it works.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'check_business_information',
    description:
      'Check a business topic that is absent from all data sources. Always use this for discounts or unlisted custom-order pricing; it verifies that the information is unavailable and makes the WhatsApp handoff available.',
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ['discounts', 'custom_order_pricing'],
        },
      },
      required: ['topic'],
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
      'Offer the existing WhatsApp handoff button for business information absent from all data tools, especially discounts or unlisted custom-order pricing. This does not send or open anything automatically.',
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
      product.sku,
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
    sku: product.sku,
    name: product.name,
    description: product.shortDescription,
    price: product.price,
    category: CATEGORY_LABELS[product.category],
    metals: product.metals.map((variant) => METAL_LABELS[variant.id]),
    stonesDescription: stoneDescription(product.stones),
    goldWeightGrams: product.goldWeightGrams,
    availableIn18K: product.availableIn18K,
    price18K: product.availableIn18K ? product.price18K : null,
    eighteenKExclusionReason: product.availableIn18K ? null : product.eighteenKExclusionReason,
    eighteenKLeadTime: product.availableIn18K ? DELIVERY_TIMES.madeToOrder : null,
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
  'sku',
  'description',
  'category',
  'metals',
  'stones',
  'gold_weight',
  '18k_availability',
  'availability',
  'delivery',
  'price',
];

function searchProductsTool(args: Record<string, unknown>, state: ToolState) {
  state.searchUsed = true;
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
  const filtered = findProducts(filters)
    .filter((product) => !availability || product.availability === availability)
    .filter((product) => maxPrice === undefined || product.price <= maxPrice)
    .filter(
      (product) =>
        words.length === 0 || words.every((word) => searchHaystack(product).includes(word)),
    );
  const matches =
    args.selection === 'lowest_price'
      ? [...filtered].sort((a, b) => a.price - b.price || a.slug.localeCompare(b.slug)).slice(0, 1)
      : filtered.slice(0, 8);

  // `findProducts` has a stable rank (preferred category, featured, price,
  // slug). Multiple searches may contribute candidates in one turn, while
  // catalogue order remains stable inside each result set.
  state.searchedSlugs = [
    ...state.searchedSlugs,
    ...matches.map((product) => product.slug),
  ].filter((slug, index, all) => all.indexOf(slug) === index);
  for (const product of matches) {
    state.evidence.set(product.slug, product);
  }

  return {
    products: matches.map(catalogueRecord),
  };
}

const FULFILMENT_TOPICS: FulfilmentTopic[] = [
  'home_delivery',
  'collection',
  'made_to_order',
  'shipping_cost',
];

function getFulfilmentTool(args: Record<string, unknown>, state: ToolState) {
  const topics = Array.isArray(args.topics)
    ? args.topics.filter(
        (topic): topic is FulfilmentTopic =>
          typeof topic === 'string' && FULFILMENT_TOPICS.includes(topic as FulfilmentTopic),
      )
    : [];
  topics.forEach((topic) => state.fulfilmentTopics.add(topic));
  state.deliveryPolicyRequested ||= topics.some((topic) => topic !== 'shipping_cost');
  state.shippingCostRequested ||= topics.includes('shipping_cost');
  return {
    found: topics.length > 0,
    ...(topics.includes('home_delivery')
      ? { homeDelivery: { time: DELIVERY_TIMES.home, cost: SHIPPING.home } }
      : {}),
    ...(topics.includes('collection')
      ? { studioCollection: { time: DELIVERY_TIMES.collection, cost: SHIPPING.collection } }
      : {}),
    ...(topics.includes('made_to_order')
      ? { madeToOrderLeadTime: DELIVERY_TIMES.madeToOrder }
      : {}),
    ...(topics.includes('shipping_cost')
      ? { shippingCost: { home: SHIPPING.home, collection: SHIPPING.collection } }
      : {}),
  };
}

function getPaymentOptionsTool(state: ToolState) {
  state.paymentOptionsRequested = true;
  return {
    creditCardInstallments: INSTALLMENT_COUNTS,
    extraCost: 0,
    bitInstallments: 1,
    applePayInstallments: 1,
  };
}

const SERVICE_TOPICS = ['returns', 'resizing', 'warranty', 'repairs', 'cleaning'] as const;
type ServiceTopic = (typeof SERVICE_TOPICS)[number];

function getServicePoliciesTool(args: Record<string, unknown>, state: ToolState) {
  const topics = Array.isArray(args.topics)
    ? args.topics.filter(
        (topic): topic is ServiceTopic =>
          typeof topic === 'string' && SERVICE_TOPICS.includes(topic as ServiceTopic),
      )
    : [];

  state.returnsPolicyRequested ||= topics.includes('returns');
  state.resizingPolicyRequested ||= topics.includes('resizing');
  state.warrantyPolicyRequested ||= topics.includes('warranty') || topics.includes('repairs');
  state.careServiceRequested ||= topics.includes('cleaning');

  return {
    found: topics.length > 0,
    ...(topics.includes('returns') ? { returns: RETURNS_POLICY } : {}),
    ...(topics.includes('resizing') ? { resizing: RESIZING_POLICY } : {}),
    ...(topics.includes('warranty') || topics.includes('repairs')
      ? { warrantyAndRepairs: AFTERCARE_POLICY }
      : {}),
    ...(topics.includes('cleaning')
      ? {
          cleaning: {
            cleaningFree: AFTERCARE_POLICY.cleaningFree,
            settingInspectionFree: AFTERCARE_POLICY.settingInspectionFree,
          },
        }
      : {}),
  };
}

function getAtelierInfoTool(state: ToolState) {
  state.studioInfoRequested = true;
  return { address: STUDIO.address, hours: STUDIO.hours };
}

function getCustomDesignInfoTool(state: ToolState) {
  state.customDesignRequested = true;
  return CUSTOM_DESIGN;
}

function checkBusinessInformationTool(args: Record<string, unknown>, state: ToolState) {
  const topic =
    args.topic === 'discounts' || args.topic === 'custom_order_pricing' ? args.topic : null;
  if (topic) state.whatsappRequested = true;
  return { topic, available: false, handoffAvailable: Boolean(topic) };
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
  return {
    product: catalogueRecord(product),
  };
}

function presentRecommendationsTool(args: Record<string, unknown>, state: ToolState) {
  const requested = Array.isArray(args.slugs)
    ? new Set(args.slugs.filter((slug): slug is string => typeof slug === 'string'))
    : new Set<string>();
  // Selection is model-led from raw search results, while validation and final
  // ordering stay deterministic and catalogue-backed.
  const accepted = state.searchedSlugs
    .filter((slug) => requested.has(slug))
    .slice(0, MAX_RECOMMENDATIONS);
  state.presentedSlugs = [...state.presentedSlugs, ...accepted]
    .filter((slug, index, all) => all.indexOf(slug) === index)
    .slice(0, MAX_RECOMMENDATIONS);
  return { acceptedSlugs: state.presentedSlugs };
}

function executeTool(call: GeminiFunctionCall, state: ToolState): Record<string, unknown> {
  const args = call.args ?? {};
  switch (call.name) {
    case 'search_products':
      return searchProductsTool(args, state);
    case 'get_product':
      return getProductTool(args, state);
    case 'get_fulfilment':
      return getFulfilmentTool(args, state);
    case 'get_payment_options':
      return getPaymentOptionsTool(state);
    case 'get_service_policies':
      return getServicePoliciesTool(args, state);
    case 'get_atelier_info':
      return getAtelierInfoTool(state);
    case 'get_custom_design_info':
      return getCustomDesignInfoTool(state);
    case 'check_business_information':
      return checkBusinessInformationTool(args, state);
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
  const results: Record<string, unknown>[] = new Array(calls.length);
  const isDataCall = (call: GeminiFunctionCall) =>
    call.name !== 'present_recommendations';

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
        ...(args.selection === 'lowest_price' ? { selection: args.selection } : {}),
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
    case 'get_service_policies':
      return {
        topics: Array.isArray(args.topics)
          ? args.topics.filter(
              (topic): topic is ServiceTopic =>
                typeof topic === 'string' && SERVICE_TOPICS.includes(topic as ServiceTopic),
            )
          : [],
      };
    case 'get_fulfilment':
      return {
        topics: Array.isArray(args.topics)
          ? args.topics.filter(
              (topic): topic is FulfilmentTopic =>
                typeof topic === 'string' && FULFILMENT_TOPICS.includes(topic as FulfilmentTopic),
            )
          : [],
      };
    case 'check_business_information':
      return {
        topic:
          args.topic === 'discounts' || args.topic === 'custom_order_pricing'
            ? args.topic
            : 'unrecognized',
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
  if (
    call.name === 'get_fulfilment' ||
    call.name === 'get_payment_options' ||
    call.name === 'get_service_policies' ||
    call.name === 'get_atelier_info' ||
    call.name === 'get_custom_design_info' ||
    call.name === 'check_business_information'
  ) {
    return Object.values(result).filter((value) => value !== null).length;
  }
  return result.offered === true ? 1 : 0;
}

async function callGemini(
  apiKey: string,
  contents: GeminiContent[],
  functionCallingConfig: FunctionCallingConfig,
  systemInstruction = SYSTEM_INSTRUCTION,
  functionDeclarations: readonly unknown[] = TOOL_DECLARATIONS,
  maxOutputTokens = 320,
  timeoutMs = GEMINI_REQUEST_TIMEOUT_MS,
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
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        ...(functionDeclarations.length > 0
          ? {
              tools: [{ functionDeclarations }],
              toolConfig: { functionCallingConfig },
            }
          : {}),
        generationConfig: {
          maxOutputTokens,
          thinkingConfig: { thinkingLevel: 'minimal' },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
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

function assembleGroundedOutput(state: ToolState, modelText: string) {
  const recommendationSlugs = (
    state.presentedSlugs.length > 0
      ? state.presentedSlugs
      : [...state.requestedFields.keys()].slice(0, MAX_RECOMMENDATIONS)
  ).filter((slug) => state.evidence.has(slug));
  const eighteenKSlugs = [...state.requestedFields.entries()]
    .filter(([slug, fields]) => fields.has('18k_availability') && state.evidence.get(slug)?.availableIn18K)
    .map(([slug]) => slug);

  return {
    text: modelText.trim(),
    recommendationSlugs,
    eighteenKSlugs,
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

  if (
    state.evidence.size === 0 &&
    !state.deliveryPolicyRequested &&
    !state.customDesignRequested
  ) {
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
  onSiteLookup: () => void,
) {
  const contextualMessage = contextualShopperMessage(message, context);
  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: contextualMessage }] }];
  let finalText = '';

  for (let callNumber = 0; callNumber < MAX_SITE_GEMINI_CALLS; callNumber += 1) {
    const response = await callGemini(apiKey, contents, { mode: 'AUTO' });
    const content = response.candidates?.[0]?.content;
    if (!content?.parts?.length) {
      throw new RecoverableFailure('Gemini returned no candidate content.');
    }

    const calls = content.parts.flatMap((part) => (part.functionCall ? [part.functionCall] : []));
    const text = content.parts.flatMap((part) => (typeof part.text === 'string' ? [part.text] : [])).join(' ');
    if (text.trim()) {
      finalText = text.trim().replace(/\s*—\s*/g, ', ').replace(/[!！]/g, '');
    }
    if (calls.length === 0) {
      return finalText;
    }

    if (
      calls.some((call) =>
        [
          'search_products',
          'get_product',
          'get_fulfilment',
          'get_payment_options',
          'get_service_policies',
          'get_atelier_info',
          'get_custom_design_info',
          'check_business_information',
        ].includes(call.name),
      )
    ) {
      onSiteLookup();
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

function contextualShopperMessage(message: string, context: string[]): string {
  return context.length > 0
    ? `Earlier shopper messages for intent only:\n${context
        .map((entry, index) => `${index + 1}. ${entry}`)
        .join('\n')}\n\nCurrent shopper message:\n${message}`
    : message;
}

async function runGeminiConversation(
  apiKey: string,
  message: string,
  context: string[],
  state: ToolState,
  onSiteLookup: () => void,
): Promise<string> {
  const gateResponse = await callGemini(
    apiKey,
    [{ role: 'user', parts: [{ text: contextualShopperMessage(message, context) }] }],
    { mode: 'AUTO' },
    GATE_SYSTEM_INSTRUCTION,
    [],
    160,
    GEMINI_GATE_TIMEOUT_MS,
  );
  const gateContent = gateResponse.candidates?.[0]?.content;
  if (!gateContent?.parts?.length) {
    throw new RecoverableFailure('Gemini returned no gate content.');
  }
  const gateText = gateContent.parts
    .flatMap((part) => (typeof part.text === 'string' ? [part.text] : []))
    .join(' ')
    .trim();
  if (gateText !== SITE_GATE_MARKER) {
    return gateText.replace(/\s*—\s*/g, ', ').replace(/[!！]/g, '');
  }

  onSiteLookup();
  return runToolLoop(apiKey, message, context, state, onSiteLookup);
}

function createToolState(): ToolState {
  return {
    evidence: new Map(),
    requestedFields: new Map(),
    searchedSlugs: [],
    presentedSlugs: [],
    searchUsed: false,
    fulfilmentTopics: new Set(),
    deliveryPolicyRequested: false,
    shippingCostRequested: false,
    paymentOptionsRequested: false,
    studioInfoRequested: false,
    returnsPolicyRequested: false,
    resizingPolicyRequested: false,
    warrantyPolicyRequested: false,
    careServiceRequested: false,
    customDesignRequested: false,
    sizeGuideRequested: false,
    whatsappRequested: false,
  };
}

function logAgentError(error: unknown) {
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
}

function streamChat(
  apiKey: string,
  sessionToken: string,
  message: string,
  context: string[],
): Response {
  const encoder = new TextEncoder();
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const emit = (event: Record<string, unknown>) => {
        if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      void (async () => {
        try {
          const state = createToolState();
          let siteLookupAnnounced = false;
          const modelText = await runGeminiConversation(apiKey, message, context, state, () => {
            if (siteLookupAnnounced) return;
            siteLookupAnnounced = true;
            emit({ type: 'status', status: 'checking-site' });
          });
          const output = assembleGroundedOutput(state, modelText);
          const inspectedText = inspectOutgoingText(output.text, state);
          console.info(
            JSON.stringify({
              event: 'agent_grounding',
              replaced: inspectedText !== output.text,
              evidenceCount: state.evidence.size,
              recommendationCount: output.recommendationSlugs.length,
            }),
          );
          const actions = actionsFrom(state);

          emit({
            type: 'result',
            response: {
              mode: 'ok',
              sessionId: sessionToken,
              text: inspectedText,
              recommendationSlugs: output.recommendationSlugs,
              eighteenKSlugs: output.eighteenKSlugs,
              actions:
                inspectedText === SAFE_GENERIC &&
                actions.every((action) => action.kind !== 'whatsapp')
                  ? [...actions, { kind: 'whatsapp', message: WHATSAPP_MESSAGE }]
                  : actions,
            },
          });
        } catch (error) {
          logAgentError(error);
          emit({
            type: 'result',
            response:
              error instanceof SystemicFailure
                ? { mode: 'fallback' }
                : { mode: 'retryable-error', sessionId: sessionToken },
          });
        } finally {
          if (!cancelled) controller.close();
        }
      })();
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
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
  } catch (error) {
    logAgentError(error);
    return json(
      error instanceof SystemicFailure
        ? { mode: 'fallback' }
        : { mode: 'retryable-error', sessionId: session.token },
      error instanceof SystemicFailure ? 200 : 503,
    );
  }

  return streamChat(apiKey, session.token, message, context);
}
