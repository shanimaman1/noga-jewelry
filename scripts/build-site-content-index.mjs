import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const sourceRoot = path.join(projectRoot, 'src');
const outputPath = path.join(sourceRoot, 'generated', 'siteContentIndex.ts');

const contentRoots = [
  'pages',
  'components',
  'data/collections.ts',
  'data/sizes.ts',
  'data/testimonials.ts',
  'lib/constants.ts',
  'lib/brandStory.ts',
  'lib/customDesign.ts',
  'lib/format.ts',
  'lib/fulfillment.ts',
  'lib/servicePolicies.ts',
];

const excludedSegments = new Set(['motion', 'three']);
const ignoredJsxAttributes = new Set(['className', 'id', 'name', 'path', 'to', 'href', 'src']);
const hebrewPattern = /[\u0590-\u05ff]/;
const visibleNonHebrewPattern = /(?:\d{1,2}:\d{2}|WhatsApp|Instagram|Apple Pay|Bit|WCAG|AA|₪)/i;

async function collectFiles(relativePath) {
  const absolutePath = path.join(sourceRoot, relativePath);
  const metadata = await stat(absolutePath);
  if (metadata.isFile()) return [absolutePath];

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const child = path.join(absolutePath, entry.name);
      if (entry.isDirectory()) {
        if (excludedSegments.has(entry.name)) return [];
        return collectFiles(path.relative(sourceRoot, child));
      }
      return /\.(?:ts|tsx)$/.test(entry.name) ? [child] : [];
    }),
  );
  return nested.flat();
}

function routeFor(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  const page = normalized.match(/^pages\/([^/]+)\.tsx$/)?.[1];
  const pageRoutes = {
    Home: '/',
    Catalog: '/catalog',
    Product: '/product/:slug',
    GiftGuide: '/gift-guide',
    CustomDesign: '/custom',
    Story: '/story',
    Visit: '/visit',
    SizeCare: '/size-care',
    ReturnsService: '/returns-service',
    Cart: '/cart',
    Checkout: '/checkout',
    OrderConfirmation: '/order-confirmation',
    Accessibility: '/accessibility',
    Lab: '/lab',
    Styleguide: '/styleguide',
    NotFound: '*',
  };
  if (page && pageRoutes[page]) return pageRoutes[page];
  if (normalized.startsWith('components/home/')) return '/';
  if (normalized.startsWith('components/product/')) return '/product/:slug';
  if (normalized.startsWith('components/cart/')) return '/cart';
  if (normalized.startsWith('components/checkout/')) return '/checkout';
  if (normalized.includes('customDesign')) return '/custom';
  if (normalized.includes('servicePolicies')) return '/returns-service';
  if (normalized.includes('fulfillment')) return '/product/:slug, /cart, /checkout';
  return '*';
}

function normalizeText(value) {
  return value.replace(/\{\s*'\s*'\s*\}/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractVisibleStrings(source) {
  const values = [];

  function add(value) {
    const text = normalizeText(value);
    if (!text) return;
    if (text.startsWith('@/') || /^https?:\/\//.test(text)) return;
    if (/(?:errors\.|=>|;\s*(?:else|const|return)|\bclassName=)/.test(text)) return;
    if (!hebrewPattern.test(text) && !visibleNonHebrewPattern.test(text)) return;
    values.push(text);
  }

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '/' && source[index + 1] === '/') {
      index = source.indexOf('\n', index + 2);
      if (index === -1) break;
      continue;
    }
    if (source[index] === '/' && source[index + 1] === '*') {
      const commentEnd = source.indexOf('*/', index + 2);
      index = commentEnd === -1 ? source.length : commentEnd + 1;
      continue;
    }
    const quote = source[index];
    if (quote !== "'" && quote !== '"' && quote !== '`') continue;

    let end = index + 1;
    let escaped = false;
    for (; end < source.length; end += 1) {
      const character = source[end];
      if (character === quote && !escaped) break;
      escaped = character === '\\' && !escaped;
      if (character !== '\\') escaped = false;
    }
    if (end >= source.length) break;

    const before = source.slice(Math.max(0, index - 40), index);
    const jsxAttribute = before.match(/([A-Za-z][\w-]*)\s*=\s*$/)?.[1];
    if (!jsxAttribute || !ignoredJsxAttributes.has(jsxAttribute)) {
      add(source.slice(index + 1, end).replace(/\$\{[^}]+\}/g, ' '));
    }
    index = end;
  }

  const jsxTextPattern = />([^<>{}]+)</g;
  for (const match of source.matchAll(jsxTextPattern)) add(match[1]);

  return [...new Set(values)];
}

const files = (await Promise.all(contentRoots.map(collectFiles)))
  .flat()
  .sort((a, b) => a.localeCompare(b));
const entries = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const strings = extractVisibleStrings(source);
  if (strings.length === 0) continue;
  const relativePath = path.relative(sourceRoot, file).replaceAll('\\', '/');
  entries.push({
    id: relativePath.replace(/\.(?:ts|tsx)$/, '').replaceAll('/', ':'),
    path: routeFor(relativePath),
    source: relativePath,
    text: strings,
  });
}

const banner = '// Generated by scripts/build-site-content-index.mjs. Do not edit by hand.\n';
const moduleText = `${banner}export const SITE_CONTENT_INDEX = ${JSON.stringify(entries, null, 2)} as const;\n`;
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, moduleText, 'utf8');
console.log(`Indexed ${entries.length} site-content sources.`);
