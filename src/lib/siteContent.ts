import { SITE_CONTENT_INDEX } from '../generated/siteContentIndex.ts';

const MAX_RESULTS = 6;
const MAX_EXCERPTS_PER_RESULT = 16;
const MAX_EXCERPT_LENGTH = 1_800;
const HEBREW_PREFIXES = new Set(['ב', 'ה', 'ו', 'כ', 'ל', 'מ', 'ש']);
const STOP_WORDS = new Set([
  'אני', 'אנחנו', 'את', 'אתה', 'אתם', 'באתר', 'זה', 'זאת', 'יש', 'לי', 'מה',
  'מי', 'על', 'של', 'שלכם', 'איך', 'האם', 'אפשר', 'רוצה', 'רוצים', 'ספר', 'ספרי',
]);

export type SiteContentSearchResult = {
  path: string;
  source: string;
  excerpts: string[];
};

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

function includesToken(text: string, token: string): boolean {
  const words = text.split(' ');
  const forms = [token];
  if (token.length > 3 && HEBREW_PREFIXES.has(token[0])) forms.push(token.slice(1));
  return forms.some((form) =>
    words.some((word) => word === form || (form.length >= 4 && word.startsWith(form))),
  );
}

function lineScore(line: string, tokens: string[]): number {
  const normalizedLine = normalize(line);
  return tokens.reduce((score, token) => score + (includesToken(normalizedLine, token) ? 1 : 0), 0);
}

export function searchSiteContent(query: string): SiteContentSearchResult[] {
  const normalizedQuery = normalize(query).slice(0, 160);
  const tokens = queryTokens(normalizedQuery);
  if (!normalizedQuery || tokens.length === 0) return [];

  return SITE_CONTENT_INDEX.map((entry) => {
    const normalizedMetadata = normalize(`${entry.path} ${entry.source}`);
    const normalizedText = normalize(entry.text.join(' '));
    const tokenMatches = tokens.filter(
      (token) => includesToken(normalizedText, token) || normalizedMetadata.includes(token),
    ).length;
    const score =
      tokenMatches * 10 +
      (tokenMatches === tokens.length ? 20 : 0) +
      (normalizedText.includes(normalizedQuery) ? 50 : 0) +
      (entry.source.startsWith('pages/') ? 3 : 0);
    const matchingIndexes = entry.text
      .map((line, index) => ({ index, score: lineScore(line, tokens) }))
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
