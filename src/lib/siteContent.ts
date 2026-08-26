import { SITE_CONTENT_INDEX } from '../generated/siteContentIndex.ts';
import { BRAND_STORY } from './brandStory.ts';
import { CUSTOM_DESIGN } from './customDesign.ts';
import { STUDIO } from './constants.ts';
import { DELIVERY_TIMES } from './fulfillment.ts';
import {
  careServiceText,
  resizingPolicyText,
  returnsPolicyText,
  specialOrderReturnsText,
  warrantyPolicyText,
} from './servicePolicies.ts';

const MAX_RESULTS = 6;
const MAX_GROUPED_RESULTS = 8;
const MAX_EXCERPTS_PER_RESULT = 16;
const MAX_EXCERPT_LENGTH = 1_800;
const HEBREW_PREFIXES = new Set(['ב', 'ה', 'ו', 'כ', 'ל', 'מ', 'ש']);
const STOP_WORDS = new Set([
  'אני', 'אנחנו', 'את', 'אתה', 'אתם', 'באתר', 'זה', 'זאת', 'יש', 'לי', 'מה',
  'מי', 'על', 'של', 'שלכם', 'איך', 'האם', 'אפשר', 'רוצה', 'רוצים', 'ספר', 'ספרי',
]);
const SEARCH_SYNONYM_GROUPS = [
  ['מעצבת', 'צורפת', 'יוצרת', 'מייסדת', 'אמנית', 'אמן', 'דנה'],
  ['סטודיו', 'אטלייה'],
  ['שעות', 'פתוח', 'פתיחה'],
  ['מדידה', 'מידה', 'התאמה'],
  ['החזרה', 'החלפה', 'החזר'],
  ['משלוח', 'מסירה'],
  ['ניקוי', 'טיפוח'],
] as const;

export type SiteContentSearchResult = {
  path: string;
  source: string;
  excerpts: string[];
};

export type SiteContentSearchSubject = {
  subjectIndex: number;
  results: SiteContentSearchResult[];
};

type SearchableSiteContentEntry = {
  id: string;
  path: string;
  source: string;
  text: readonly string[];
  keywords?: readonly string[];
};

const RUNTIME_SITE_CONTENT = [
  {
    id: 'runtime:studio',
    path: '/visit',
    source: 'site-data/studio',
    keywords: ['סטודיו', 'אטלייה', 'ביקור', 'כתובת', 'שעות', 'פתוח'],
    text: [
      `כתובת הסטודיו: ${STUDIO.address}.`,
      `שעות פתיחה: ${STUDIO.hours.map((row) => `${row.days}, ${row.hours}`).join('; ')}.`,
    ],
  },
  {
    id: 'runtime:fulfillment',
    path: '/product/:slug, /cart, /checkout',
    source: 'site-data/fulfillment',
    keywords: ['משלוח', 'מסירה', 'איסוף', 'ייצור'],
    text: [
      `משלוח עד הבית: ${DELIVERY_TIMES.home}.`,
      `איסוף מהסטודיו: ${DELIVERY_TIMES.collection}.`,
      `פריט שנוצר בהזמנה: ${DELIVERY_TIMES.madeToOrder}, ולאחר מכן זמן המשלוח או האיסוף שנבחר.`,
    ],
  },
  {
    id: 'runtime:services',
    path: '/returns-service, /size-care',
    source: 'site-data/services',
    keywords: ['החלפה', 'החזרה', 'החזר', 'מידה', 'אחריות', 'תיקון', 'ניקוי', 'שיבוץ'],
    text: [
      returnsPolicyText(),
      specialOrderReturnsText(),
      resizingPolicyText(),
      warrantyPolicyText(),
      careServiceText(),
    ].filter(Boolean),
  },
  {
    id: 'runtime:custom-design',
    path: '/custom',
    source: 'site-data/custom-design',
    keywords: ['עיצוב', 'אישי', 'הזמנה', 'שרטוט', 'הדמיה'],
    text: [
      `עיצוב אישי: ${CUSTOM_DESIGN.intro} ${CUSTOM_DESIGN.steps
        .map((step) => `${step.title}: ${step.text}`)
        .join(' ')}`,
    ],
  },
  {
    id: 'runtime:brand-story',
    path: '/story',
    source: 'site-data/brand-story',
    keywords: ['דנה', 'מעצבת', 'צורפת', 'מייסדת', 'סיפור', 'נוגה', 'שם', 'מקור'],
    text: [
      BRAND_STORY.founderTitle,
      BRAND_STORY.founderBackground,
      BRAND_STORY.nameOrigin,
    ],
  },
] as const;

const SEARCHABLE_SITE_CONTENT: readonly SearchableSiteContentEntry[] = [
  ...SITE_CONTENT_INDEX,
  ...RUNTIME_SITE_CONTENT,
];

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('he')
    .replace(/[״׳'"`~!@#$%^&*()_+=[\]{}|\\:;,.?<>/\-–—]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function queryTokens(query: string): string[] {
  return [...new Set(
    normalize(query)
      .split(' ')
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
  )];
}

function tokenForms(token: string): string[] {
  const forms = [token];
  if (token.length > 3 && HEBREW_PREFIXES.has(token[0])) forms.push(token.slice(1));
  return forms;
}

function queryAlternatives(token: string): string[] {
  const forms = tokenForms(token);
  const synonymGroup = SEARCH_SYNONYM_GROUPS.find((group) =>
    group.some((synonym) => forms.includes(synonym)),
  );
  return [...new Set([...forms, ...(synonymGroup ?? [])])];
}

function includesToken(text: string, token: string): boolean {
  const words = text.split(' ');
  const forms = tokenForms(token);
  return forms.some((form) =>
    words.some((word) => {
      const wordForms = [word];
      if (word.length > 3 && HEBREW_PREFIXES.has(word[0])) wordForms.push(word.slice(1));
      return wordForms.some(
        (wordForm) => wordForm === form || (form.length >= 4 && wordForm.startsWith(form)),
      );
    }),
  );
}

function lineScore(line: string, tokenGroups: string[][]): number {
  const normalizedLine = normalize(line);
  return tokenGroups.reduce(
    (score, alternatives) =>
      score + (alternatives.some((token) => includesToken(normalizedLine, token)) ? 1 : 0),
    0,
  );
}

export function searchSiteContent(query: string): SiteContentSearchResult[] {
  const normalizedQuery = normalize(query).slice(0, 160);
  const tokens = queryTokens(normalizedQuery);
  if (!normalizedQuery || tokens.length === 0) return [];
  const tokenGroups = tokens.map(queryAlternatives);

  return SEARCHABLE_SITE_CONTENT.map((entry) => {
    const normalizedMetadata = normalize(`${entry.path} ${entry.source}`);
    const normalizedText = normalize(entry.text.join(' '));
    const normalizedKeywords = normalize(entry.keywords?.join(' ') ?? '');
    const tokenMatches = tokenGroups.filter(
      (alternatives) => alternatives.some(
        (token) => includesToken(normalizedText, token) || normalizedMetadata.includes(token),
      ),
    ).length;
    const score =
      tokenMatches * 10 +
      (tokenMatches === tokens.length ? 20 : 0) +
      (normalizedText.includes(normalizedQuery) ? 50 : 0) +
      tokenGroups.filter((alternatives) =>
        alternatives.some((token) => includesToken(normalizedKeywords, token)),
      ).length * 50 +
      (entry.source.startsWith('pages/') ? 3 : 0);
    const matchingIndexes = entry.text
      .map((line, index) => ({ index, score: lineScore(line, tokenGroups) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, 3)
      .map((item) => item.index);
    const excerpts: string[] = [];
    matchingIndexes.forEach((index) => excerpts.push(entry.text[index]));
    matchingIndexes.forEach((index) => {
      for (let offset = -3; offset <= 3; offset += 1) {
        const line = entry.text[index + offset];
        if (line && !excerpts.includes(line) && excerpts.length < MAX_EXCERPTS_PER_RESULT) {
          excerpts.push(line);
        }
      }
    });
    if (excerpts.length === 0 && tokenMatches > 0) {
      excerpts.push(...entry.text.slice(0, MAX_EXCERPTS_PER_RESULT));
    }
    return { entry, score, excerpts };
  })
    .filter((match) => match.score > 0 && match.excerpts.length > 0)
    .sort((a, b) => b.score - a.score || a.entry.source.localeCompare(b.entry.source))
    .slice(0, MAX_RESULTS)
    .map(({ entry, excerpts }) => {
      let remaining = MAX_EXCERPT_LENGTH;
      const bounded = excerpts.filter((excerpt) => {
        if (remaining <= 0) return false;
        remaining -= excerpt.length;
        return true;
      });
      return { path: entry.path, source: entry.source, excerpts: bounded };
    });
}

export function searchSiteContentSubjects(subjectTerms: string[][]): SiteContentSearchSubject[] {
  const subjects = subjectTerms
    .map((terms) => terms.map((term) => term.trim().slice(0, 80)).filter(Boolean).slice(0, 4))
    .filter((terms) => terms.length > 0)
    .slice(0, 4);
  if (subjects.length === 0) return [];

  const resultsPerSubject = Math.max(
    2,
    Math.min(MAX_RESULTS, Math.floor(MAX_GROUPED_RESULTS / subjects.length)),
  );
  return subjects.map((terms, subjectIndex) => {
    const resultGroups = terms.map(searchSiteContent);
    const results: SiteContentSearchResult[] = [];

    for (let resultIndex = 0; results.length < resultsPerSubject; resultIndex += 1) {
      let hadCandidate = false;

      for (const group of resultGroups) {
        const candidate = group[resultIndex];
        if (!candidate) continue;
        hadCandidate = true;

        const existing = results.find((result) => result.source === candidate.source);
        if (existing) {
          for (const excerpt of candidate.excerpts) {
            if (!existing.excerpts.includes(excerpt) && existing.excerpts.length < MAX_EXCERPTS_PER_RESULT) {
              existing.excerpts.push(excerpt);
            }
          }
        } else {
          results.push(candidate);
        }
        if (results.length === resultsPerSubject) break;
      }

      if (!hadCandidate) break;
    }

    return { subjectIndex, results };
  });
}
