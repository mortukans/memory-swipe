/**
 * Captures only the swipe screenshot (raw-02-swipe.png) with the card mid-drag so the
 * KEEP stamp and tilt are visible. Kept separate from capture.mjs because the pan
 * gesture only follows Playwright's mouse in this exact context/timing.
 */
import path from 'node:path';
import { chromium } from 'playwright';

const OUT = path.resolve(import.meta.dirname, 'out');
const BASE = process.env.APP_URL ?? 'http://localhost:8081';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: false, hasTouch: false, locale: 'en-US' });
const page = await context.newPage();
page.setDefaultTimeout(60_000);
const btn = (name) => page.getByRole('button', { name, exact: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await btn('Choose photo access').waitFor({ timeout: 120_000 });
await btn('Choose photo access').click();
await btn('Surprise me').waitFor();
await btn('Surprise me').click();
await btn('Keep').waitFor();
await sleep(2500);
await page
  .waitForFunction(() => [...document.images].filter((i) => i.offsetParent !== null).every((i) => i.complete && i.naturalWidth > 0), undefined, { timeout: 30_000 })
  .catch(() => {});
// A loaded <img> starts a native HTML5 drag on mouse-move, which cancels the pointer gesture. Web only.
await page.evaluate(() => document.querySelectorAll('img').forEach((i) => { i.draggable = false; i.style.userSelect = 'none'; i.style.webkitUserDrag = 'none'; }));
const card = page.getByRole('img', { name: /^(Photo|Video), / }).first();
const box = await card.boundingBox();
const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;
const transformOf = () => card.evaluate((el) => getComputedStyle(el).transform);
console.log('  before', await transformOf());
await page.mouse.move(cx, cy);
await page.mouse.down();
await sleep(50);
for (let i = 1; i <= 22; i++) {
  await page.mouse.move(cx + i * 3.5, cy - i * 0.3, { steps: 2 });
  await sleep(16);
}
await sleep(300);
console.log('  during', await transformOf());
await page.screenshot({ path: path.join(OUT, 'raw-02-swipe.png'), fullPage: false });
console.log('  captured raw-02-swipe.png');
await page.mouse.up();
await browser.close();
