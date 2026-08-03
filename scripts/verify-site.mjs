/**
 * Visual + structural verification harness.
 *
 * Exists because the assistant's embedded browser does not composite frames,
 * so IntersectionObserver never fires there and screenshots are impossible —
 * which is exactly how a fail-closed reveal bug (catalogue images never
 * loading) shipped unnoticed. This runs a REAL Chromium, scrolls each route,
 * asserts what a human would actually see, and writes screenshots.
 *
 * Run:  npm run verify            (against the local production preview)
 *       npm run verify -- <url>   (against a deployed URL)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const SHOTS = join(process.cwd(), 'verify-screenshots');

const ROUTES = [
  ['home', '/'],
  ['catalog', '/catalog'],
  ['gift-guide', '/gift-guide'],
  ['product-solitaire', '/product/solitaire-classic'],
  ['product-pearl', '/product/pearl-drop-necklace'],
  ['cart', '/cart'],
  ['checkout', '/checkout'],
  ['story', '/story'],
  ['size-care', '/size-care'],
  ['custom', '/custom'],
  ['accessibility', '/accessibility'],
];

const failures = [];
const fail = (route, msg) => failures.push(`${route}: ${msg}`);

/** Scroll the whole page so lazy images load and every reveal is triggered. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 200));
  });
  // Let the reveal safety timer (2.5s) elapse in the worst case.
  await page.waitForTimeout(2800);
}

async function checkRoute(page, name, path, consoleErrors, badResponses) {
  consoleErrors.length = 0;
  badResponses.length = 0;

  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 30000 });
  await scrollThrough(page);

  // ── Images actually rendered ────────────────────────────────────────────
  const images = await page.evaluate(() =>
    [...document.querySelectorAll('img')].map((img) => ({
      src: (img.getAttribute('src') || '').split('/').pop(),
      loaded: img.complete && img.naturalWidth > 0,
      alt: img.getAttribute('alt'),
    })),
  );
  const broken = images.filter((i) => !i.loaded);
  if (broken.length) fail(name, `${broken.length} image(s) never loaded: ${broken.map((b) => b.src).join(', ')}`);
  const noAlt = images.filter((i) => i.alt === null);
  if (noAlt.length) fail(name, `${noAlt.length} image(s) missing alt`);

  // ── Nothing left hidden after scrolling ─────────────────────────────────
  const hidden = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('main *, header *, footer *')) {
      if (!el.textContent?.trim() && el.tagName !== 'IMG') continue;
      const cs = getComputedStyle(el);
      const clipped = cs.clipPath && cs.clipPath !== 'none' && /inset\([^)]*100%/.test(cs.clipPath);
      if (parseFloat(cs.opacity) < 0.05 || clipped) {
        out.push(`${el.tagName}.${String(el.className).slice(0, 30)} opacity=${cs.opacity} clip=${cs.clipPath}`);
      }
    }
    return out.slice(0, 6);
  });
  if (hidden.length) fail(name, `content still hidden after scroll: ${hidden.join(' | ')}`);

  // ── No horizontal overflow at three widths ──────────────────────────────
  for (const [w, h] of [[375, 812], [768, 1024], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    if (over) fail(name, `horizontal overflow at ${w}px`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);

  // ── Errors and failed requests ──────────────────────────────────────────
  if (consoleErrors.length) fail(name, `console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
  if (badResponses.length) fail(name, `failed requests: ${badResponses.slice(0, 3).join(', ')}`);

  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
  return { images: images.length, broken: broken.length };
}

/** The 3D ring is the centrepiece — assert it survives, loads and rotates. */
async function checkHero3D(page) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3500); // deferred mount + model fetch

  const canvas = await page.evaluate(() => {
    const c = document.querySelector('section[aria-label="מסך פתיחה"] canvas');
    if (!c) return null;
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return { w: c.width, h: c.height, ctx: gl ? 'ok' : 'none', lost: gl ? gl.isContextLost() : true };
  });
  if (!canvas) { fail('hero-3d', 'no <canvas> in the hero — the R3F ring did not mount'); return; }
  if (canvas.ctx !== 'ok' || canvas.lost) fail('hero-3d', `WebGL context problem: ${JSON.stringify(canvas)}`);
  if (canvas.w < 2 || canvas.h < 2) fail('hero-3d', `canvas has no size: ${canvas.w}x${canvas.h}`);

  const modelOk = await page.evaluate(() =>
    performance.getEntriesByType('resource').some((r) => r.name.includes('ring.glb')),
  );
  if (!modelOk) fail('hero-3d', 'ring.glb was never requested');

  // Rotation: the rendered pixels must differ between two frames.
  const frames = [];
  for (let i = 0; i < 2; i++) {
    frames.push((await page.locator('section[aria-label="מסך פתיחה"] canvas').screenshot()).toString('base64'));
    await page.waitForTimeout(900);
  }
  if (frames[0] === frames[1]) fail('hero-3d', 'canvas is static — the ring is not rotating');

  await page.screenshot({ path: join(SHOTS, 'hero-3d.png') });
}

/** Reduced motion: no 3D canvas anywhere, and all content still visible. */
async function checkReducedMotion(browser) {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
  await scrollThrough(page);

  const canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);
  if (canvases > 0) fail('reduced-motion', `${canvases} canvas(es) mounted — 3D must be disabled`);

  const hidden = await page.evaluate(
    () =>
      [...document.querySelectorAll('main *')].filter((el) => {
        if (!el.textContent?.trim()) return false;
        return parseFloat(getComputedStyle(el).opacity) < 0.05;
      }).length,
  );
  if (hidden > 0) fail('reduced-motion', `${hidden} element(s) hidden under reduced motion`);

  await page.screenshot({ path: join(SHOTS, 'reduced-motion.png'), fullPage: true });
  await ctx.close();
}

/** The fail-open guarantee: with JS disabled, images and text must still show. */
async function checkNoJs(browser) {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/catalog', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  // The app is a client-rendered SPA, so with JS off there is no content to
  // assert — what matters is that the STYLESHEET alone never hides anything.
  const cssHides = await page.evaluate(() =>
    [...document.styleSheets].some((sheet) => {
      try {
        return [...sheet.cssRules].some(
          (r) => r.selectorText === '[data-reveal]' && /opacity:\s*0/.test(r.style?.cssText || ''),
        );
      } catch {
        return false;
      }
    }),
  );
  if (cssHides) fail('no-js', 'a bare [data-reveal] rule hides content in CSS — must be armed-only');
  await ctx.close();
}

async function main() {
  await mkdir(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const badResponses = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 120)}`));
  page.on('response', (r) => { if (r.status() >= 400) badResponses.push(`${r.status()} ${r.url().split('/').pop()}`); });

  const summary = [];
  for (const [name, path] of ROUTES) {
    process.stdout.write(`  checking ${name} … `);
    try {
      const r = await checkRoute(page, name, path, consoleErrors, badResponses);
      console.log(`${r.images} images, ${r.broken} broken`);
      summary.push({ route: name, ...r });
    } catch (err) {
      fail(name, `threw: ${String(err).slice(0, 160)}`);
      console.log('ERROR');
    }
  }

  process.stdout.write('  checking hero-3d … ');
  try { await checkHero3D(page); console.log('done'); } catch (e) { fail('hero-3d', String(e).slice(0, 160)); console.log('ERROR'); }

  process.stdout.write('  checking reduced-motion … ');
  try { await checkReducedMotion(browser); console.log('done'); } catch (e) { fail('reduced-motion', String(e).slice(0, 160)); console.log('ERROR'); }

  process.stdout.write('  checking fail-open css … ');
  try { await checkNoJs(browser); console.log('done'); } catch (e) { fail('no-js', String(e).slice(0, 160)); console.log('ERROR'); }

  await browser.close();

  await writeFile(join(SHOTS, 'report.json'), JSON.stringify({ base: BASE, summary, failures }, null, 2));

  console.log('\n' + '='.repeat(60));
  if (failures.length === 0) {
    console.log(`PASS — ${ROUTES.length} routes, 3D hero, reduced-motion, fail-open CSS.`);
    console.log(`Screenshots: ${SHOTS}`);
  } else {
    console.log(`FAIL — ${failures.length} problem(s):\n`);
    for (const f of failures) console.log('  • ' + f);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
