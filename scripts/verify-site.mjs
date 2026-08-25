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
  ['product-out-of-stock', '/product/floral-chain-necklace'],
  ['cart', '/cart'],
  ['checkout', '/checkout'],
  ['story', '/story'],
  ['visit', '/visit'],
  ['size-care', '/size-care'],
  ['returns-service', '/returns-service'],
  ['custom', '/custom'],
  ['accessibility', '/accessibility'],
];

const failures = [];
const fail = (route, msg) => failures.push(`${route}: ${msg}`);

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    if (!String(error).includes("Executable doesn't exist")) throw error;
    // Local fallback only: Codex desktop may have system Chrome without the
    // Playwright-managed Chromium bundle. CI keeps using the bundled browser.
    return chromium.launch({ channel: 'chrome' });
  }
}

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

/** Mobile assistant containment: long RTL turns must never push controls off-screen. */
async function checkAssistantMobile(browser) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 160));
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 160)}`));

  const longReply =
    'החלפה אפשרית בתוך 30 יום מקבלת הפריט, והחזר כספי מלא אפשרי בתוך 14 יום. ' +
    'הפריט צריך להיות ללא סימני ענידה ובאריזה המקורית. מתחילים בכתיבה בוואטסאפ, ' +
    'והאטלייה מתאמת את האיסוף. פריט שמיוצר לפי מידה או דרישה מיוחדת אינו ניתן ' +
    'להחלפה או להחזר לאחר תחילת הייצור, בכפוף לזכויות לפי חוק הגנת הצרכן.';

  await page.route('**/.netlify/functions/agent-chat', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'ok',
        sessionId: 'layout-verification',
        text: longReply,
        recommendationSlugs: [],
        eighteenKSlugs: [],
        actions: [],
      }),
    }),
  );

  await page.goto(BASE + '/catalog', { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: 'פתיחת עוזר בחירה' }).click();
  const input = page.getByLabel('הודעה לעוזר הבחירה', { exact: true });
  await input.fill(
    'שלום, אני מחפשת מתנה עדינה לאימא שלי ליום הולדת ורוצה לדעת איזו שרשרת יכולה להתאים לה לענידה יומיומית',
  );
  await page.getByRole('button', { name: 'שליחת ההודעה' }).click();
  await page.getByText(longReply, { exact: true }).waitFor({ state: 'visible', timeout: 10000 });

  const metrics = await page.evaluate(() => {
    const panel = document.querySelector('[role="dialog"][aria-label="עוזר בחירה"]');
    if (!panel) return null;
    const panelRect = panel.getBoundingClientRect();
    const contained = (element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= panelRect.left - 0.5 && rect.right <= panelRect.right + 0.5;
    };
    const bubbles = [...panel.querySelectorAll('[role="log"] p')];
    const controls = [
      panel.querySelector('header'),
      panel.querySelector('form'),
      panel.querySelector('[aria-label="סגירת עוזר הבחירה"]'),
      panel.querySelector('[aria-label="שליחת ההודעה"]'),
      panel.querySelector('#assistant-draft'),
    ].filter(Boolean);
    return {
      panelWidth: panelRect.width,
      panelOverflow: panel.scrollWidth - panel.clientWidth,
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      inputFontSize: parseFloat(getComputedStyle(panel.querySelector('#assistant-draft')).fontSize),
      controlsInside: controls.every(contained),
      bubblesInside: bubbles.every(
        (bubble) => contained(bubble) && bubble.scrollWidth <= bubble.clientWidth + 1,
      ),
    };
  });

  if (!metrics) {
    fail('assistant-mobile', 'assistant panel did not render');
  } else {
    if (Math.abs(metrics.panelWidth - 375) > 1) {
      fail('assistant-mobile', `panel width is ${metrics.panelWidth}px instead of 375px`);
    }
    if (metrics.panelOverflow > 1 || metrics.documentOverflow > 1) {
      fail(
        'assistant-mobile',
        `horizontal overflow: panel ${metrics.panelOverflow}px, document ${metrics.documentOverflow}px`,
      );
    }
    if (!metrics.controlsInside) fail('assistant-mobile', 'header, input or action buttons leave the panel');
    if (!metrics.bubblesInside) fail('assistant-mobile', 'a long RTL message bubble leaves the panel');
    if (metrics.inputFontSize < 16) {
      fail('assistant-mobile', `mobile input is ${metrics.inputFontSize}px and can trigger Safari zoom`);
    }
  }
  if (errors.length) fail('assistant-mobile', `console errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: join(SHOTS, 'assistant-mobile-375.png') });
  await ctx.close();
}

/** Credit-card instalments: every count keeps the total exact and survives confirmation. */
async function checkInstallments(browser) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 160));
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 160)}`));

  await page.goto(BASE + '/product/single-diamond-necklace', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  const productText = await page.locator('main').innerText();
  if (!productText.includes('עד 12 תשלומים ללא תוספת תשלום')) {
    fail('installments', 'product page does not state the 12-payment option');
  }
  if (!productText.includes('מספר קטלוגי: NCK-001')) {
    fail('order-details', 'product page does not show the catalogue number');
  }
  const atelierLink = page.getByRole('link', { name: 'לראות את התכשיט באטלייה', exact: true });
  if ((await atelierLink.getAttribute('href')) !== '/visit') {
    fail('order-details', 'product page atelier link does not point to /visit');
  }

  await page.getByRole('button', { name: '40 ס״מ', exact: true }).click();
  await page.getByRole('button', { name: 'הוסף לעגלה', exact: true }).first().click();
  if (!/מק״ט\s*NCK-001/.test((await page.locator('body').textContent()) ?? '')) {
    fail('order-details', 'cart drawer does not show the catalogue number');
  }
  const cartDrawerText = await page.getByRole('dialog', { name: 'עגלת הקניות' }).innerText();
  if (!cartDrawerText.includes('איסוף מהסטודיו') || !cartDrawerText.includes('לבחירה בצ׳קאאוט')) {
    fail('fulfilment', 'cart drawer does not explain that studio collection is chosen at checkout');
  }
  await page.getByRole('link', { name: 'המשך לתשלום', exact: true }).click();
  await page.waitForURL('**/checkout');
  await page.locator('h1').filter({ hasText: 'תשלום' }).waitFor();
  if (!/מק״ט\s*NCK-001/.test((await page.locator('main').textContent()) ?? '')) {
    fail('order-details', 'checkout does not show the catalogue number');
  }

  const select = page.locator('#installments');
  const options = await select.locator('option').allTextContents();
  if (options.join(',') !== '1,2,3,4,5,6,7,8,9,10,11,12') {
    fail('installments', `unexpected dropdown options: ${options.join(',')}`);
  }

  const total = 3400;
  for (let count = 1; count <= 12; count += 1) {
    await select.selectOption(String(count));
    const summary = await page.locator('#installments + p').innerText();
    const amounts = [...summary.matchAll(/([\d,]+)[\s\u00a0\u200e\u200f]*₪/g)].map((match) =>
      Number(match[1].replace(/,/g, '')),
    );
    const regular = Math.floor(total / count);
    const first = regular + (total - regular * count);
    const expected = count === 1
      ? [total, total]
      : first === regular
        ? [regular, total]
        : [first, regular, total];
    if (amounts.join(',') !== expected.join(',')) {
      fail('installments', `${count} payments rendered ${amounts.join(',')} instead of ${expected.join(',')}`);
    }
    if (first + regular * (count - 1) !== total) {
      fail('installments', `${count} payments do not sum to ${total}`);
    }
    const orderTotal = await page.evaluate(() => {
      const term = [...document.querySelectorAll('dt')].find((item) => item.textContent?.includes('סה״כ לתשלום'));
      return term?.parentElement?.querySelector('dd')?.textContent ?? '';
    });
    if (!orderTotal.includes('3,400')) {
      fail('installments', `${count} payments changed the order total: ${orderTotal}`);
    }
  }

  if ((await page.locator('body').innerText()).includes('ריבית')) {
    fail('installments', 'checkout displays forbidden interest wording');
  }

  await select.selectOption('12');
  await page.getByLabel('שם מלא', { exact: true }).fill('בדיקת הדגמה');
  await page.getByLabel('טלפון', { exact: true }).fill('0500000000');
  await page.getByLabel('אימייל', { exact: true }).fill('demo@example.com');
  await page.getByRole('radio', { name: /איסוף מהסטודיו/ }).check();
  await page
    .getByLabel(/^הערות להזמנה או למשלוח/)
    .fill('למסור בשעות הערב');
  await page.getByLabel('מספר כרטיס', { exact: true }).fill('4111 1111 1111 1111');
  await page.getByLabel('שם בעל הכרטיס', { exact: true }).fill('DEMO USER');
  await page.getByLabel('תוקף', { exact: true }).fill('12/30');
  await page.getByLabel('CVV', { exact: true }).fill('123');
  await page.getByRole('button', { name: /לתשלום/ }).click();
  await page.waitForURL('**/order-confirmation', { timeout: 5000 });
  await page.getByRole('heading', { name: 'הזמנת ההדגמה נקלטה', exact: true }).waitFor();

  const confirmationText = await page.locator('main').innerText();
  const normalizedConfirmation = confirmationText
    .replace(/[\u200e\u200f]/g, '')
    .replace(/\s+/g, ' ');
  if (!normalizedConfirmation.includes('תשלום ראשון של') || !normalizedConfirmation.includes('11 תשלומים')) {
    fail('installments', '12-payment choice did not survive into confirmation');
  }
  if (!/מק״ט\s*NCK-001/.test(confirmationText)) {
    fail('order-details', 'catalogue number did not survive into confirmation');
  }
  if (!normalizedConfirmation.includes('הערות להזמנה') || !normalizedConfirmation.includes('למסור בשעות הערב')) {
    fail('order-details', 'order notes did not survive into confirmation');
  }
  if (
    !normalizedConfirmation.includes('לא בוצע חיוב') ||
    !normalizedConfirmation.includes('לא נשלח אישור') ||
    !normalizedConfirmation.includes('אינה מועברת לטיפול או למשלוח')
  ) {
    fail('demo-consistency', 'order confirmation does not state the demo limitations');
  }
  if (normalizedConfirmation.includes('שלחנו אישור') || normalizedConfirmation.includes('נעדכן אותך')) {
    fail('demo-consistency', 'order confirmation still promises email or follow-up');
  }
  if (confirmationText.includes('ריבית')) {
    fail('installments', 'confirmation displays forbidden interest wording');
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) fail('installments', 'horizontal overflow at 375px');
  const direction = await page.evaluate(() => document.documentElement.dir);
  if (direction !== 'rtl') fail('installments', 'document direction is not RTL');
  if (errors.length) fail('installments', `console errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: join(SHOTS, 'installments-375.png'), fullPage: true });
  await ctx.close();
}

/** Policy and service connections at the shopper-facing decision points. */
async function checkPolicies(browser) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 160));
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 160)}`));

  await page.goto(BASE + '/returns-service', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const policyText = await page.locator('main').innerText();
  for (const expected of [
    'החלפה אפשרית בתוך 30 יום',
    'החזר כספי מלא אפשרי בתוך 14 יום',
    'עלות השילוח חזרה',
    '12 חודשים',
    '7–10 ימי עסקים',
    'ניקוי ובדיקת שיבוץ',
  ]) {
    if (!policyText.includes(expected)) fail('policies', `returns page is missing: ${expected}`);
  }
  const footerText = await page.locator('footer').innerText();
  if (
    !footerText.includes('שבזי 45, נווה צדק, תל אביב') ||
    !footerText.includes('ראשון–חמישי') ||
    !footerText.includes('10:00–19:00')
  ) {
    fail('policies', 'footer is missing the studio address or opening hours');
  }
  const footerReturnsLink = page.getByRole('link', {
    name: 'החלפות, החזרות ושירות',
    exact: true,
  });
  if ((await footerReturnsLink.getAttribute('href')) !== '/returns-service') {
    fail('policies', 'footer does not link to the returns and service page');
  }

  await page.goto(BASE + '/catalog', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const productPaths = await page.locator('main a[href^="/product/"]').evaluateAll((links) =>
    [...new Set(links.map((link) => link.getAttribute('href')).filter(Boolean))],
  );
  if (productPaths.length !== 16) {
    fail('policies', `catalog exposed ${productPaths.length} product routes instead of 16`);
  }
  for (const productPath of productPaths) {
    await page.goto(BASE + productPath, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const policyLink = page.getByRole('link', { name: 'החלפה תוך 30 יום', exact: true });
    if (
      (await policyLink.count()) !== 1 ||
      (await policyLink.first().getAttribute('href')) !== '/returns-service'
    ) {
      fail('policies', `${productPath} does not link its exchange promise to the policy page`);
    }
  }

  await page.goto(BASE + '/product/solitaire-classic', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const ringText = await page.locator('main').innerText();
  if (!ringText.includes('התאמת המידה הראשונה לטבעת היא ללא עלות')) {
    fail('policies', 'ring product page is missing first-resize service');
  }
  if (!ringText.includes('לאחר תחילת הייצור אין אפשרות להחלפה או להחזר')) {
    fail('policies', 'made-to-order product lacks the pre-purchase return notice');
  }
  const returnsLink = page.getByRole('link', { name: 'החלפה תוך 30 יום', exact: true });
  if ((await returnsLink.getAttribute('href')) !== '/returns-service') {
    fail('policies', 'product trust item does not link to the policy page');
  }

  await page.goto(BASE + '/product/single-diamond-necklace', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const readyText = await page.locator('main').innerText();
  if (readyText.includes('לאחר תחילת הייצור אין אפשרות להחלפה או להחזר')) {
    fail('policies', 'ready 14k product incorrectly shows the special-order restriction');
  }
  await page.getByRole('button', { name: '18 קראט', exact: true }).click();
  const eighteenKText = await page.locator('main').innerText();
  if (
    !eighteenKText.includes('נוצר בהזמנה') ||
    !eighteenKText.includes('לאחר תחילת הייצור אין אפשרות להחלפה או להחזר')
  ) {
    fail('policies', '18k selection does not expose made-to-order return terms');
  }

  await page.goto(BASE + '/product/floral-chain-necklace', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const outOfStockText = await page.locator('main').innerText();
  if (outOfStockText.includes('מסירה ואיסוף') || outOfStockText.includes('משלוח חינם')) {
    fail('policies', 'out-of-stock product still displays fulfilment information');
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) fail('policies', 'horizontal overflow at 375px');
  if ((await page.evaluate(() => document.documentElement.dir)) !== 'rtl') {
    fail('policies', 'document direction is not RTL');
  }
  if (errors.length) fail('policies', `console errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: join(SHOTS, 'policies-375.png'), fullPage: true });
  await ctx.close();
}

/** Real WhatsApp route and truthful demo-only contact/forms at mobile width. */
async function checkDemoContacts(browser) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text().slice(0, 160));
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 160)}`));

  for (const path of ['/', '/gift-guide', '/product/single-diamond-necklace', '/visit', '/accessibility']) {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const whatsappLinks = await page.locator('a[href^="https://wa.me/"]').all();
    if (whatsappLinks.length === 0) {
      fail('demo-contacts', `${path} has no WhatsApp link`);
      continue;
    }
    for (const link of whatsappLinks) {
      const href = (await link.getAttribute('href')) ?? '';
      if (!href.startsWith('https://wa.me/972509054826?text=')) {
        fail('demo-contacts', `${path} uses the wrong WhatsApp target: ${href}`);
      }
    }
  }

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const homeText = await page.locator('main').innerText();
  if (!homeText.includes('@noga.jewelry · פרט הדגמה')) {
    fail('demo-contacts', 'homepage Instagram handle is not marked as a demo detail');
  }
  if (!homeText.includes('מצב הדגמה - הכתובת אינה נשלחת ולא נשמרת')) {
    fail('demo-contacts', 'newsletter lacks its pre-submit demo disclosure');
  }
  await page.getByPlaceholder('your@email.com', { exact: true }).fill('demo@example.com');
  await page.getByRole('button', { name: 'בדיקת כתובת', exact: true }).click();
  const newsletterStatus = await page.getByRole('status').innerText();
  if (!newsletterStatus.includes('אינה נשלחת ולא נשמרת')) {
    fail('demo-contacts', 'newsletter success message implies a real subscription');
  }

  await page.goto(BASE + '/custom', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const customText = await page.locator('main').innerText();
  if (!customText.includes('נבדקים בדפדפן בלבד ואינם נשלחים או נשמרים')) {
    fail('demo-contacts', 'custom form lacks its pre-submit demo disclosure');
  }
  await page.getByLabel('שם מלא', { exact: true }).fill('בדיקת הדגמה');
  await page.getByLabel('טלפון', { exact: true }).fill('0500000000');
  await page.getByLabel('אימייל', { exact: true }).fill('demo@example.com');
  await page.getByLabel('מה את מדמיינת?', { exact: true }).fill('טבעת עדינה');
  await page.getByRole('button', { name: 'בדיקת הפרטים', exact: true }).click();
  const customStatus = await page.getByRole('status').innerText();
  if (!customStatus.includes('הפנייה אינה נשלחת ואינה נשמרת')) {
    fail('demo-contacts', 'custom-form success message implies a real follow-up');
  }

  await page.goto(BASE + '/visit', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const visitText = await page.locator('main').innerText();
  if (
    !visitText.includes('050-9054826') ||
    !visitText.includes('hello@noga-demo.co.il') ||
    !visitText.includes('@noga.jewelry') ||
    (visitText.match(/פרט הדגמה/g) ?? []).length < 2
  ) {
    fail('demo-contacts', 'visit page contact details are incomplete or not labelled');
  }

  await page.goto(BASE + '/accessibility', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const accessibilityText = await page.locator('main').innerText();
  if (
    !accessibilityText.includes('050-9054826') ||
    !accessibilityText.includes('פרט הדגמה') ||
    !accessibilityText.includes('מספר הוואטסאפ פעיל')
  ) {
    fail('demo-contacts', 'accessibility contact details are not distinguished correctly');
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  if (overflow) fail('demo-contacts', 'horizontal overflow at 375px');
  const direction = await page.evaluate(() => document.documentElement.dir);
  if (direction !== 'rtl') fail('demo-contacts', 'document direction is not RTL');
  if (errors.length) fail('demo-contacts', `console errors: ${errors.join(' | ')}`);

  await page.screenshot({ path: join(SHOTS, 'demo-contacts-375.png'), fullPage: true });
  await ctx.close();
}

async function main() {
  await mkdir(SHOTS, { recursive: true });
  const browser = await launchBrowser();
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

  process.stdout.write('  checking installments 1–12 … ');
  try { await checkInstallments(browser); console.log('done'); } catch (e) { fail('installments', String(e).slice(0, 160)); console.log('ERROR'); }

  process.stdout.write('  checking contact and demo consistency … ');
  try { await checkDemoContacts(browser); console.log('done'); } catch (e) { fail('demo-contacts', String(e).slice(0, 160)); console.log('ERROR'); }

  process.stdout.write('  checking policies and service connections … ');
  try { await checkPolicies(browser); console.log('done'); } catch (e) { fail('policies', String(e).slice(0, 160)); console.log('ERROR'); }

  process.stdout.write('  checking assistant containment at 375px … ');
  try { await checkAssistantMobile(browser); console.log('done'); } catch (e) { fail('assistant-mobile', String(e).slice(0, 160)); console.log('ERROR'); }

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
    console.log(`PASS — ${ROUTES.length} routes, instalments 1–12, policies, assistant mobile layout, contact/demo consistency, 3D hero, reduced-motion, fail-open CSS.`);
    console.log(`Screenshots: ${SHOTS}`);
  } else {
    console.log(`FAIL — ${failures.length} problem(s):\n`);
    for (const f of failures) console.log('  • ' + f);
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
