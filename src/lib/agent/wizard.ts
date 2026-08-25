/**
 * Stage-1 assistant brain: a deterministic question flow. No LLM, no network,
 * no API key — every answer is computed from `products.ts` at call time.
 *
 * Content rules enforced here, not left to chance:
 *   • Product names, prices, categories and metals are never written as
 *     literals — they are read from the catalogue (see `./catalog`).
 *   • Availability, fulfilment and service policies are answered only from
 *     their shared data sources. Discounts remain unknown and get an honest
 *     WhatsApp handoff.
 *   • A search with no results never dead-ends: it offers to drop exactly the
 *     filters that would genuinely produce matches.
 *
 * Brand voice: restrained, no exclamation marks, no superlatives.
 */

import type { Category, Metal, Product } from '@/types/catalog';
import { products } from '@/data/products';
import {
  AVAILABILITY_LABELS,
  DELIVERY_TIMES,
  SHIPPING,
  availabilityDetail,
  productDeliveryText,
  shippingCostText,
} from '@/lib/fulfillment';
import {
  careServiceText,
  resizingPolicyText,
  returnsPolicyText,
  specialOrderReturnsText,
  warrantyPolicyText,
} from '@/lib/servicePolicies';
import type { AgentBrain, AgentChoice, AgentInput, AgentMessage, AgentTurn } from './types';
import {
  CATEGORY_LABELS,
  METAL_LABELS,
  availableBands,
  availableCategories,
  availableMetals,
  bandLabel,
  findProducts,
  relaxationOptions,
  type CatalogFilters,
  type PriceBand,
  type RelaxableFilter,
} from './catalog';

const MAX_RESULTS = 3;
const ANY = 'any';

type Step = 'audience' | 'budget' | 'category' | 'metal' | 'results';

type Audience = 'self' | 'partner' | 'mother' | 'engagement' | 'undecided';

/**
 * Occasions, and which categories each one points at. `prefer` only affects
 * result *ordering* — it never hides a category the shopper explicitly chose.
 */
const AUDIENCES: { id: Audience; label: string; prefer: readonly Category[] }[] = [
  { id: 'self', label: 'לעצמי', prefer: [] },
  { id: 'partner', label: 'מתנה לבן או בת זוג', prefer: ['necklaces', 'rings'] },
  { id: 'mother', label: 'מתנה לאמא', prefer: ['necklaces', 'bracelets'] },
  { id: 'engagement', label: 'אירוסין', prefer: ['rings'] },
  { id: 'undecided', label: 'עוד לא החלטתי', prefer: [] },
];

const audienceById = (id: Audience) => AUDIENCES.find((a) => a.id === id);

const AVAILABILITY_PATTERN =
  /מלאי|במלאי|זמין|זמינה|זמינות|נשאר|אזל|יש לכם.*(?:במלאי|זמין|זמינה)/;
const DELIVERY_TIME_PATTERN = /משלוח|שילוח|אספקה|מתי יגיע|מתי זה מגיע|כמה זמן לוקח|איסוף/;

/** Topics this project still has no data for. Answered honestly, never guessed. */
const UNSUPPORTED_TOPICS: { pattern: RegExp; topic: string }[] = [
  { pattern: /הנחה|הנחות|מבצע|מבצעים|קופון|סייל|זול יותר/, topic: 'מבצעים ומחירים מיוחדים' },
];

const SIZE_PATTERN = /מידה|מידות|סייז|למדוד|קוטר/;
const RETURNS_PATTERN = /החזר|להחזיר|מחזיר|החזרה|החזרות|החלפ|ביטול/;
const RESIZING_PATTERN = /הקטנ|להקטין|להגדיל|שינוי מידה|התאמת מידה|תיקון מידה/;
const WARRANTY_PATTERN = /אחריות|פגם בייצור|פגמי ייצור|תיקון|תיקונים|נקרע|נשבר/;
const CARE_SERVICE_PATTERN = /ניקוי|לנקות|בדיקת שיבוץ|בדיקת אבנים|פוליש/;

const HEBREW_COUNT: Record<number, string> = { 1: 'הצעה אחת', 2: 'שתי הצעות', 3: 'שלוש הצעות' };

const matchCount = (n: number) => (n === 1 ? 'התאמה אחת' : `${n} התאמות`);

type WizardState = {
  step: Step;
  audience?: Audience;
  band?: PriceBand;
  category?: Category;
  metal?: Metal;
  /** Filters the shopper agreed to drop after an empty result. */
  relaxed: readonly RelaxableFilter[];
};

type Snapshot = { state: WizardState; messages: AgentMessage[] };

const INITIAL_STATE: WizardState = { step: 'audience', relaxed: [] };

/** Filters currently in force, with anything the shopper relaxed removed. */
function filtersOf(state: WizardState): CatalogFilters {
  const filters: CatalogFilters = {
    band: state.band,
    category: state.category,
    metal: state.metal,
  };
  for (const filter of state.relaxed) filters[filter] = undefined;
  return filters;
}

/* ── message construction ────────────────────────────────────────────────── */

let counter = 0;
const nextId = () => `agent-${++counter}`;

const assistant = (text: string, extra: Partial<AgentMessage> = {}): AgentMessage => ({
  id: nextId(),
  sender: 'assistant',
  text,
  ...extra,
});

const user = (text: string): AgentMessage => ({ id: nextId(), sender: 'user', text });

const WHATSAPP_GENERAL = 'היי, אשמח לעזרה בבחירת תכשיט';

/**
 * One honest line about why a piece matched. Built only from catalogue data
 * and from what the shopper actually chose — never a claim about popularity,
 * stock or suitability that the data cannot back.
 */
function buildReason(product: Product, filters: CatalogFilters): string {
  const bits: string[] = [];

  // Only what the shopper actually asked for — never an inferred attribute
  // dressed up as a reason.
  if (filters.metal) bits.push(METAL_LABELS[filters.metal]);
  if (filters.band) bits.push('בתוך הטווח שסימנת');

  // Nothing was narrowed — describe the piece in the catalogue's own words.
  if (bits.length === 0) return product.shortDescription;
  return `${bits.join(', ')}.`;
}

function mentionedProduct(text: string): Product | undefined {
  const normalized = text.toLocaleLowerCase('he-IL');
  return [...products]
    .sort((a, b) => b.name.length - a.name.length)
    .find(
      (product) =>
        normalized.includes(product.name.toLocaleLowerCase('he-IL')) ||
        normalized.includes(product.slug.toLowerCase()),
    );
}

function availabilityReply(text: string): AgentMessage {
  const product = mentionedProduct(text);
  if (product) {
    return assistant(
      `${product.name}: ${AVAILABILITY_LABELS[product.availability]}. ${availabilityDetail(product.availability)}`,
    );
  }

  const count = (availability: Product['availability']) =>
    products.filter((item) => item.availability === availability).length;
  return assistant(
    `לפי נתוני הקטלוג כרגע: ${AVAILABILITY_LABELS.ready} - ${count('ready')}; ${AVAILABILITY_LABELS['made-to-order']} - ${count('made-to-order')}; ${AVAILABILITY_LABELS['out-of-stock']} - ${count('out-of-stock')}. אפשר לשאול גם בשם מוצר מלא.`,
  );
}

function deliveryReply(text: string): AgentMessage {
  const product = mentionedProduct(text);
  if (product) return assistant(`${product.name}: ${productDeliveryText(product)}`);

  return assistant(
    `משלוח עד הבית ${shippingCostText(SHIPPING.home)} ואורך ${DELIVERY_TIMES.home}. איסוף מהסטודיו ${shippingCostText(SHIPPING.collection)} ואפשרי בתוך ${DELIVERY_TIMES.collection}. לפריט שנוצר בהזמנה יש להוסיף ${DELIVERY_TIMES.madeToOrder}, ואז חל זמן המסירה שנבחר.`,
  );
}

function serviceReply(text: string): AgentMessage | null {
  if (RETURNS_PATTERN.test(text)) {
    return assistant(`${returnsPolicyText()} ${specialOrderReturnsText()}`, {
      actions: [{ kind: 'whatsapp', message: 'היי, אשמח לתאם החלפה או החזרה' }],
    });
  }
  if (RESIZING_PATTERN.test(text)) {
    return assistant(resizingPolicyText(), {
      actions: [{ kind: 'whatsapp', message: 'היי, אשמח לתאם התאמת מידה לטבעת' }],
    });
  }
  if (WARRANTY_PATTERN.test(text)) {
    return assistant(warrantyPolicyText(), {
      actions: [{ kind: 'whatsapp', message: 'היי, אשמח לבדוק תיקון לתכשיט' }],
    });
  }
  if (CARE_SERVICE_PATTERN.test(text)) {
    return assistant(careServiceText(), {
      actions: [{ kind: 'whatsapp', message: 'היי, אשמח לתאם ניקוי ובדיקת שיבוץ' }],
    });
  }
  return null;
}

/* ── the questions ───────────────────────────────────────────────────────── */

function audienceQuestion(): AgentMessage {
  return assistant('כמה שאלות קצרות ואצמצם לך את הקטלוג. למי התכשיט?', {
    choices: AUDIENCES.map((a) => ({ id: `audience:${a.id}`, label: a.label })),
  });
}

function budgetQuestion(state: WizardState): AgentMessage {
  const bands = availableBands({ category: state.category });
  const choices: AgentChoice[] = bands.map((id) => ({ id: `band:${id}`, label: bandLabel(id) }));
  choices.push({ id: `band:${ANY}`, label: 'אין לי טווח מוגדר' });
  return assistant('מה הטווח שנוח לך?', { choices });
}

function categoryQuestion(state: WizardState): AgentMessage {
  const base: CatalogFilters = { band: state.band };
  const choices: AgentChoice[] = availableCategories(base).map((category) => ({
    id: `category:${category}`,
    label: CATEGORY_LABELS[category],
  }));
  choices.push({ id: `category:${ANY}`, label: 'הכול פתוח' });
  return assistant('איזה סוג תכשיט?', { choices });
}

function metalQuestion(state: WizardState): AgentMessage {
  const base: CatalogFilters = { band: state.band, category: state.category };
  const metals = availableMetals(base);
  const choices: AgentChoice[] = metals.map((metal) => ({
    id: `metal:${metal}`,
    label: METAL_LABELS[metal],
  }));
  choices.push({ id: `metal:${ANY}`, label: 'אין העדפה' });
  return assistant('יש העדפה למתכת?', { choices });
}

/** The question belonging to the current step — used to re-offer the choices
 *  after a free-text detour, so the shopper is never left without a next move. */
function questionFor(state: WizardState): AgentMessage | null {
  switch (state.step) {
    case 'audience':
      return audienceQuestion();
    case 'budget':
      return budgetQuestion(state);
    case 'category':
      return categoryQuestion(state);
    case 'metal':
      return metalQuestion(state);
    case 'results':
      return null;
  }
}

/* ── results ─────────────────────────────────────────────────────────────── */

function resultsMessages(state: WizardState): AgentMessage[] {
  const filters = filtersOf(state);
  const prefer = state.audience ? audienceById(state.audience)?.prefer : undefined;
  const matches = findProducts(filters, { preferCategories: prefer });

  if (matches.length === 0) return emptyResultMessages(filters);

  const shown = matches.slice(0, MAX_RESULTS);
  const headline = HEBREW_COUNT[shown.length] ?? `${shown.length} הצעות`;
  const verb = shown.length === 1 ? 'שמתאימה' : 'שמתאימות';
  const remainder = matches.length - shown.length;

  const lead = assistant(`${headline} ${verb} למה שסימנת:`, {
    recommendations: shown.map((product) => ({
      slug: product.slug,
      reason: buildReason(product, filters),
    })),
  });

  const closing = assistant(
    remainder > 0
      ? `יש עוד ${matchCount(remainder)} בקטלוג בסינון הזה. אם משהו כאן מתאים, אפשר להוסיף לעגלה, ואם לא, נתחיל מחדש.`
      : 'אם משהו כאן מתאים, אפשר להוסיף לעגלה. אחרת נתחיל מחדש ונצמצם אחרת.',
    {
      actions: [
        { kind: 'size-guide' },
        { kind: 'whatsapp', message: WHATSAPP_GENERAL },
        { kind: 'restart' },
      ],
    },
  );

  return [lead, closing];
}

function emptyResultMessages(filters: CatalogFilters): AgentMessage[] {
  const options = relaxationOptions(filters);

  const relaxLabel: Record<RelaxableFilter, string> = {
    metal: 'בלי העדפת מתכת',
    band: 'בלי הגבלת טווח',
    category: 'בכל הקטגוריות',
  };

  const choices: AgentChoice[] = options.map((option) => ({
    id: `relax:${option.filter}`,
    label: `${relaxLabel[option.filter]} - ${matchCount(option.matches)}`,
  }));
  choices.push({ id: 'restart', label: 'להתחיל מחדש' });

  return [
    assistant(
      'אין לי התאמה מדויקת לכל מה שסימנת, ואני מעדיף לא להציע משהו שלא עונה על הבקשה. אפשר לוותר על תנאי אחד:',
      { choices, actions: [{ kind: 'whatsapp', message: WHATSAPP_GENERAL }] },
    ),
  ];
}

/* ── free text ───────────────────────────────────────────────────────────── */

function freeTextReply(text: string): AgentMessage[] {
  const unsupported = UNSUPPORTED_TOPICS.find((entry) => entry.pattern.test(text));

  if (unsupported) {
    return [
      assistant(
        `אין לי נתון אמיתי על ${unsupported.topic} באתר הדגמה הזה, ואני לא רוצה לנחש. בגרסה החיה החלק הזה מתחבר למערכת של החנות. אם זה דחוף, אפשר להמשיך בוואטסאפ.`,
        {
          actions: [
            { kind: 'whatsapp', message: `היי, יש לי שאלה על ${unsupported.topic}` },
          ],
        },
      ),
    ];
  }

  if (AVAILABILITY_PATTERN.test(text)) return [availabilityReply(text)];

  if (DELIVERY_TIME_PATTERN.test(text)) return [deliveryReply(text)];

  const service = serviceReply(text);
  if (service) return [service];

  if (SIZE_PATTERN.test(text)) {
    return [
      assistant('מדריך המידות פתוח כאן, עם דרך למדוד בבית.', {
        actions: [{ kind: 'size-guide' }],
      }),
    ];
  }

  return [
    assistant(
      'אני עובד לפי כמה שאלות קצרות ומצמצם מהקטלוג. אפשר לבחור מהאפשרויות, ולכל שאלה אחרת, וואטסאפ.',
      { actions: [{ kind: 'whatsapp', message: WHATSAPP_GENERAL }] },
    ),
  ];
}

/* ── the brain ───────────────────────────────────────────────────────────── */

/**
 * Deterministic wizard brain. Holds its own transcript and a snapshot stack so
 * `back()` restores both the state and the conversation exactly as they were.
 */
export function createWizardBrain(): AgentBrain {
  let history: Snapshot[] = [];

  const current = (): Snapshot => history[history.length - 1];

  const turn = (): AgentTurn => ({
    messages: current().messages,
    canGoBack: history.length > 1,
    // Always open: sizing, availability and delivery questions can land at
    // any point and are answered from their real sources of truth.
    acceptsText: true,
  });

  /** Commits a new step as its own undo point. */
  const push = (state: WizardState, appended: AgentMessage[]) => {
    history.push({ state, messages: [...current().messages, ...appended] });
  };

  /** Adds messages to the current step without creating an undo point — used
   *  for free-text detours, which are not part of the question flow. */
  const amend = (appended: AgentMessage[]) => {
    const snapshot = current();
    history[history.length - 1] = {
      state: snapshot.state,
      messages: [...snapshot.messages, ...appended],
    };
  };

  const reset = (): AgentTurn => {
    history = [{ state: INITIAL_STATE, messages: [audienceQuestion()] }];
    return turn();
  };

  /** Advances to `step`, appending its question (or the results). */
  const advance = (state: WizardState, chosenLabel: string) => {
    const messages: AgentMessage[] = [user(chosenLabel)];
    if (state.step === 'results') messages.push(...resultsMessages(state));
    else {
      const question = questionFor(state);
      if (question) messages.push(question);
    }
    push(state, messages);
  };

  const handleChoice = (choiceId: string): AgentTurn => {
    const { state } = current();
    const [kind, rawValue] = choiceId.split(':');
    const value = rawValue ?? '';

    if (kind === 'restart') return reset();

    switch (kind) {
      case 'audience': {
        const audience = audienceById(value as Audience);
        if (!audience) return turn();
        advance({ ...state, step: 'budget', audience: audience.id }, audience.label);
        return turn();
      }

      case 'band': {
        const band = value === ANY ? undefined : (value as PriceBand);
        const label = band ? bandLabel(band) : 'אין לי טווח מוגדר';
        advance({ ...state, step: 'category', band }, label);
        return turn();
      }

      case 'category': {
        const category = value === ANY ? undefined : (value as Category);
        const label = category ? CATEGORY_LABELS[category] : 'הכול פתוח';
        advance({ ...state, step: 'metal', category }, label);
        return turn();
      }

      case 'metal': {
        const metal = value === ANY ? undefined : (value as Metal);
        const label = metal ? METAL_LABELS[metal] : 'אין העדפה';
        advance({ ...state, step: 'results', metal }, label);
        return turn();
      }

      case 'relax': {
        const filter = value as RelaxableFilter;
        const relaxed = state.relaxed.includes(filter)
          ? state.relaxed
          : [...state.relaxed, filter];
        const next = { ...state, step: 'results' as const, relaxed };
        const label =
          filter === 'metal'
            ? 'בלי העדפת מתכת'
            : filter === 'band'
              ? 'בלי הגבלת טווח'
              : 'בכל הקטגוריות';
        advance(next, label);
        return turn();
      }

      default:
        return turn();
    }
  };

  return {
    id: 'wizard',

    async start() {
      return reset();
    },

    async send(input: AgentInput) {
      if (input.type === 'choice') return handleChoice(input.choiceId);

      const text = input.text.trim();
      if (!text) return turn();
      amend([user(text), ...freeTextReply(text)]);

      // Re-offer the current question so the shopper always has a next move.
      const question = questionFor(current().state);
      if (question) amend([question]);
      return turn();
    },

    async back() {
      if (history.length > 1) history.pop();
      return turn();
    },
  };
}
