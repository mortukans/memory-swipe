/**
 * Captures raw App Store screenshots from the web build (npx expo start --web --port 8081).
 * Output: tools/screenshots/out/raw-NN-*.png at 1320x2868 (440x956 @3x, iPhone 6.9").
 *
 * The web build uses the mock media adapter (picsum photos), so no real library is needed.
 * Storage is in-memory on web: the whole flow runs in one page session.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const OUT = path.resolve(import.meta.dirname, 'out');
const BASE = process.env.APP_URL ?? 'http://localhost:8081';
const LANG = process.env.LANG_TAG ?? 'en';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 440, height: 956 },
  deviceScaleFactor: 3,
  // Mouse (not touch) emulation: Playwright's mouse drag drives the deck's pan gesture only this way.
  isMobile: false,
  hasTouch: false,
  locale: LANG === 'lv' ? 'lv-LV' : 'en-US',
  timezoneId: 'Europe/Riga',
  colorScheme: 'light',
});
const page = await context.newPage();
page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('  [console.error]', m.text().slice(0, 200)); });
page.setDefaultTimeout(60_000);

const btn = (name) => page.getByRole('button', { name, exact: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wait until every visible <img> has finished loading (picsum is remote). */
async function imagesSettled(timeout = 30_000) {
  await page
    .waitForFunction(
      () => [...document.images].filter((i) => i.offsetParent !== null).every((i) => i.complete && i.naturalWidth > 0),
      undefined,
      { timeout },
    )
    .catch(() => {});
}

async function shot(name) {
  await imagesSettled();
  await sleep(700); // let entry animations settle
  const file = path.join(OUT, `raw-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('  captured', path.basename(file));
}

const L = LANG === 'lv'
  ? { choose: 'Izvēlies piekļuvi bildēm', surprise: 'Pārsteidz mani', keep: 'Paturēt', remove: 'Atlikt', library: 'Bibliotēka', review: /Pārskatīt/, settings: 'Iestatījumi', dark: 'Tumšs', reviewChoices: 'Pārskatīt izvēles', back: 'Atpakaļ' }
  : { choose: 'Choose photo access', surprise: 'Surprise me', keep: 'Keep', remove: 'Remove', library: 'Library', review: /Review/, settings: 'Settings', dark: 'Dark', reviewChoices: 'Review your choices', back: 'Back' };

// 0. Welcome → access → Discover
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await btn(L.choose).waitFor({ timeout: 120_000 });
if (LANG === 'lv') {
  // Switch the app language first so every screen is Latvian.
  await btn(L.choose).click();
  await btn(L.surprise).or(btn('Surprise me')).first().waitFor();
}
if (LANG !== 'lv') await btn(L.choose).click();
await btn(L.surprise).or(btn('Surprise me')).first().waitFor();
if (LANG === 'lv' && (await btn('Surprise me').isVisible().catch(() => false))) {
  await btn('Settings').click();
  await btn('Latviešu').click();
  await btn('Aizvērt').click();
  await btn(L.surprise).waitFor();
}
await shot('01-discover');

// 1. Swipe: start a session, let the first print load, then hold a drag so the Keep stamp shows.
await btn(L.surprise).click();
await btn(L.keep).waitFor();
await imagesSettled();
await sleep(900);
{
  const card = page.getByRole('img', { name: /^(Photo|Video|Bilde), / }).first();
  const box = await card.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await sleep(120);
  await page.mouse.down();
  await sleep(80); // RNGH needs a frame to arm the pan before the first move
  // ~77pt: stamp ≈ 85% opaque, tilt ≈ 4°, still under the 85pt commit threshold.
  for (let i = 1; i <= 22; i++) {
    await page.mouse.move(cx + i * 3.5, cy - i * 0.3, { steps: 2 });
    await sleep(16);
  }
  await sleep(350);
  console.log('  drag transform:', await card.evaluate((el) => getComputedStyle(el).transform), 'box', JSON.stringify(box));
  const file = path.join(OUT, 'raw-02-swipe.png');
  await page.screenshot({ path: file, fullPage: false });
  console.log('  captured', path.basename(file));
  // Return the card gently.
  for (let i = 22; i >= 0; i -= 2) {
    await page.mouse.move(cx + i * 3.5, cy - i * 0.3);
    await sleep(16);
  }
  await page.mouse.up();
  await sleep(500);
  if (process.env.STOP_AFTER_SWIPE) { await browser.close(); process.exit(0); }
}

// Decide the session: a few removes so Review has content, the rest kept.
for (let i = 0; i < 20; i++) {
  const which = [1, 4, 7, 12, 15].includes(i) ? L.remove : L.keep;
  const b = btn(which);
  if (!(await b.isVisible().catch(() => false))) break;
  await b.click();
  await sleep(520);
}

// 2. Session end
await btn(L.reviewChoices).waitFor({ timeout: 30_000 });
await shot('05-session-end');

// 3. Review
await btn(L.reviewChoices).click();
await page.getByRole('button', { name: /^(Keep|Paturēt), / }).first().waitFor();
// The web mock has no video posters; restore any video tiles so the grid is all prints.
for (let i = 0; i < 3; i++) {
  const v = page.getByRole('button', { name: /^(Keep|Paturēt), Video, / }).first();
  if (!(await v.isVisible().catch(() => false))) break;
  await v.click();
  await sleep(400);
}
await shot('03-review');

// 4. Library
await page.getByRole('tab', { name: L.library }).first().click();
await page.getByText(LANG === 'lv' ? 'Atgriezies' : 'Find your').first().waitFor();
await shot('04-library');

// 5. Settings in dark
await page.getByRole('button', { name: L.settings }).first().click();
await btn(L.dark).click();
await sleep(400);
await shot('06-settings-dark');

await browser.close();
console.log('done');
