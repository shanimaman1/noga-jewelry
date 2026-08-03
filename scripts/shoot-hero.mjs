/**
 * Fast single-shot of the hero, for iterating on the 3D look without paying
 * for the full verify sweep. Writes verify-screenshots/_hero-iter.png.
 *
 * Run: node scripts/shoot-hero.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = join(process.cwd(), 'verify-screenshots');
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(4000); // deferred canvas mount + model load
await page.screenshot({ path: join(OUT, '_hero-iter.png') });
await browser.close();
console.log('wrote verify-screenshots/_hero-iter.png');
