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
  productDeliveryText,
} from '../../src/lib/fulfillment';
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
const MAX_GEMINI_CALLS_PER_MESSAGE = 4;
const MAX_RECOMMENDATIONS = 3;
const WHATSAPP_MESSAGE = 'היי, אשמח לעזרה בבחירת תכשיט';
const SAFE_GENERIC = 'אין לי מידע מאומת על זה כרגע. אפשר לפנות לדנה בוואטסאפ.';

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

type RequestedField =
  | 'description'
  | 'category'
  | 'metals'
  | 'stones'
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
  sizeGuideRequested: boolean;
  whatsappRequested: boolean;
};

class SystemicFailure extends Error {}
class RecoverableFailure extends Error {}

const SYSTEM_INSTRUCTION = `
You are the restrained Hebrew shopping assistant for Noga Jewelry. Reply in Hebrew and RTL-friendly plain text.

NON-NEGOTIABLE DATA RULES:
- You have no catalogue knowledge until a tool returns it in THIS request. Never rely on memory or prior turns.
- Any message about what the shopper wants, likes, is looking for, is considering or is buying for someone requires search_products BEFORE any prose response. This includes vague or open requests such as "a gift for my mother", "something delicate" and "I do not know what I want". Replying to a shopping or browsing request without first calling search_products is never correct.
- An open request with no usable catalogue filters requires a broad search_products call with no filters. Search broadly, offer real catalogue options, and then narrow. You may ask one clarifying question only after searching, and you must still offer recommendations rather than replying empty-handed.
- Do not put recipients, occasions or vague preferences into query unless those exact words identify a catalogue product. For requests such as a gift for a mother, something delicate or uncertainty about what to choose, call search_products with no arguments.
- Before making any claim about a product name, price, category, metal, stones, availability or delivery, call search_products or get_product in this same request.
- Use get_product.requested_fields to state exactly which facts the shopper asked to see. The application renders those facts from the tool record; do not repeat their values in prose.
- For recommendations, search first and then call present_recommendations only with slugs returned in this request.
- Never write a price, product name, metal, category, stone description, availability label or delivery time in your prose. The application renders them from tool results.
- A slug not returned by a catalogue tool is invalid. Never repair or guess it.
- Reserve the honest "I do not have verified information" response for information the catalogue genuinely does not contain. Shipping cost, discounts and returns are unknown: say so and call offer_whatsapp. Never use that response for an open shopping or browsing request.
- Tools never perform actions. open_size_guide and offer_whatsapp only make buttons available for the shopper to click.
- If no tool supports a factual answer, give a brief generic line and offer WhatsApp.

Voice: concise, helpful, no exclamation marks, no superlatives. The final prose may only be a short conversational transition; catalogue facts are rendered by application code.
`.trim();

const TOOL_DECLARATIONS = [
  {
    name: 'search_products',
    description:
      'Search the live catalogue. Every shopping, preference, gift or browsing request must call this first. With no filters it returns a broad catalogue selection. Use query only for exact catalogue product words, not recipients, occasions or vague preferences. It may also return the verified fulfilment policy.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words from the shopper request, such as a product name.' },
        category: { type: 'string', enum: ['rings', 'necklaces', 'earrings', 'bracelets'] },
        metal: { type: 'string', enum: ['yellow', 'rose', 'white'] },
        price_band: { type: 'string', enum: ['under1500', 'mid', 'over3000'] },
        availability: { type: 'string', enum: ['ready', 'made-to-order', 'out-of-stock'] },
        include_delivery_policy: {
          type: 'boolean',
          description: 'True when the shopper asks about general delivery or collection times.',
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
            enum: ['description', 'category', 'metals', 'stones', 'availability', 'delivery', 'price'],
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
      product.stonesDescription ?? '',
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
    stonesDescription: product.stonesDescription ?? null,
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
  'availability',
  'delivery',
  'price',
];

function searchProductsTool(args: Record<string, unknown>, state: ToolState) {
  state.searchUsed = true;
  if (args.include_delivery_policy === true) state.deliveryPolicyRequested = true;

  const filters: CatalogFilters = {
    category: isCategory(args.category) ? args.category : undefined,
    metal: isMetal(args.metal) ? args.metal : undefined,
    band: isPriceBand(args.price_band) ? args.price_band : undefined,
  };

  const query = typeof args.query === 'string' ? normalize(args.query).slice(0, 120) : '';
  const words = query.split(' ').filter(Boolean);
  const availability = isAvailability(args.availability) ? args.availability : undefined;
  const hasProductCriteria = Boolean(
    query || filters.category || filters.metal || filters.band || availability,
  );
  const isDeliveryPolicyOnly = args.include_delivery_policy === true && !hasProductCriteria;
  const shouldSearchCatalogue = !isDeliveryPolicyOnly;
  state.catalogSearchRequested ||= shouldSearchCatalogue;

  const matches = shouldSearchCatalogue
    ? findProducts(filters)
        .filter((product) => !availability || product.availability === availability)
        .filter(
          (product) =>
            words.length === 0 || words.every((word) => searchHaystack(product).includes(word)),
        )
        .slice(0, 8)
    : [];

  state.searchHadMatches ||= matches.length > 0;
  for (const product of matches) {
    state.evidence.set(product.slug, product);
    if (!state.searchedSlugs.includes(product.slug)) state.searchedSlugs.push(product.slug);
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

function presentRecommendationsTool(args: Record<string, unknown>, state: ToolState) {
  const slugs = Array.isArray(args.slugs) ? args.slugs : [];
  const accepted = slugs
    .filter((slug): slug is string => typeof slug === 'string' && state.evidence.has(slug))
    .filter((slug, index, all) => all.indexOf(slug) === index)
    .slice(0, MAX_RECOMMENDATIONS);
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
        ...(isAvailability(args.availability) ? { availability: args.availability } : {}),
        ...(args.include_delivery_policy === true ? { includeDeliveryPolicy: true } : {}),
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
  functionCallingMode: 'ANY' | 'AUTO',
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
          functionCallingConfig: { mode: functionCallingMode },
        },
        generationConfig: {
          temperature: 0.15,
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

function requestedFactLine(product: Product, fields: Set<RequestedField>): string | null {
  const facts: string[] = [];
  if (fields.has('description')) facts.push(product.shortDescription);
  if (fields.has('category')) facts.push(`קטגוריה: ${CATEGORY_LABELS[product.category]}`);
  if (fields.has('metals')) {
    facts.push(`מתכות: ${product.metals.map((variant) => METAL_LABELS[variant.id]).join(', ')}`);
  }
  if (fields.has('stones')) {
    facts.push(
      product.stonesDescription
        ? `אבנים: ${product.stonesDescription}`
        : 'אין בקטלוג פירוט אבנים נפרד לפריט הזה',
    );
  }
  if (fields.has('availability')) {
    facts.push(`זמינות: ${AVAILABILITY_LABELS[product.availability]}`);
  }
  if (fields.has('delivery')) facts.push(productDeliveryText(product));

  // Price and name are deliberately rendered only by AssistantProductCard.
  if (facts.length === 0 && fields.has('price')) return null;
  return facts.length > 0 ? `${product.name}: ${facts.join('. ')}` : null;
}

function deterministicOutput(state: ToolState, modelText: string) {
  const factLines = [...state.requestedFields.entries()].flatMap(([slug, fields]) => {
    const product = state.evidence.get(slug);
    if (!product) return [];
    const line = requestedFactLine(product, fields);
    return line ? [line] : [];
  });

  const recommendationSlugs = [
    ...state.requestedFields.keys(),
    ...state.presentedSlugs,
    ...(state.catalogSearchRequested &&
    state.presentedSlugs.length === 0 &&
    state.requestedFields.size === 0
      ? state.searchedSlugs.slice(0, MAX_RECOMMENDATIONS)
      : []),
  ]
    .filter((slug, index, all) => all.indexOf(slug) === index && state.evidence.has(slug))
    .slice(0, MAX_RECOMMENDATIONS);

  const lines = [...factLines];
  if (state.deliveryPolicyRequested) {
    lines.push(
      `משלוח עד הבית אורך ${DELIVERY_TIMES.home}, ואיסוף מהסטודיו אפשרי בתוך ${DELIVERY_TIMES.collection}. לפריט שנוצר בהזמנה יש להוסיף ${DELIVERY_TIMES.madeToOrder}, ואז חל זמן המסירה שנבחר.`,
    );
  }
  if (recommendationSlugs.length > 0 && factLines.length === 0) {
    lines.push('מצאתי כמה אפשרויות מהקטלוג שמתאימות לבקשה.');
  }
  if (state.catalogSearchRequested && !state.searchHadMatches) {
    lines.push('לא מצאתי התאמה בקטלוג לפי הבקשה הזאת.');
  }
  if (state.sizeGuideRequested) lines.push('אפשר לפתוח כאן את מדריך המידות.');
  if (state.whatsappRequested) lines.push('אין לי מידע מאומת בנושא הזה. אפשר לפנות לדנה בוואטסאפ.');

  const hasToolBackedOutput =
    state.evidence.size > 0 ||
    state.deliveryPolicyRequested ||
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

async function runToolLoop(apiKey: string, message: string, state: ToolState) {
  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: message }] }];
  let finalText = '';

  for (let callNumber = 0; callNumber < MAX_GEMINI_CALLS_PER_MESSAGE; callNumber += 1) {
    const response = await callGemini(
      apiKey,
      contents,
      callNumber === 0 ? 'ANY' : 'AUTO',
    );
    const content = response.candidates?.[0]?.content;
    if (!content?.parts?.length) throw new RecoverableFailure('Gemini returned no candidate content.');

    const calls = content.parts.flatMap((part) => (part.functionCall ? [part.functionCall] : []));
    const text = content.parts.flatMap((part) => (typeof part.text === 'string' ? [part.text] : [])).join(' ');
    if (text.trim()) finalText = text.trim();
    if (calls.length === 0) return finalText;

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

  let body: { sessionId?: unknown; message?: unknown };
  try {
    body = JSON.parse(rawBody) as { sessionId?: unknown; message?: unknown };
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
      sizeGuideRequested: false,
      whatsappRequested: false,
    };

    const modelText = await runToolLoop(apiKey, message, state);
    const output = deterministicOutput(state, modelText);
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

    return json({
      mode: 'ok',
      sessionId: session.token,
      text: inspectedText,
      recommendationSlugs: output.recommendationSlugs,
      actions:
        inspectedText === SAFE_GENERIC && actions.every((action) => action.kind !== 'whatsapp')
          ? [...actions, { kind: 'whatsapp', message: WHATSAPP_MESSAGE }]
          : actions,
    });
  } catch (error) {
    if (error instanceof SystemicFailure) return json({ mode: 'fallback' });
    return json({ mode: 'retryable-error', sessionId: session.token }, 503);
  }
}
