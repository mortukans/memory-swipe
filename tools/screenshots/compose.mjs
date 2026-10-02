/**
 * Composes final App Store screenshots (1320x2868, iPhone 6.9") from out/raw-*.png:
 * paper background, an eyebrow + headline in the app's editorial voice, and the
 * device screenshot as a tilted "print" with a soft shadow bleeding off the bottom.
 * Also writes preview-contact-sheet.png.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve(import.meta.dirname, 'out');
const LANG = process.env.LANG_TAG ?? 'en';
const W = 1320;
const H = 2868;

const SLIDES_EN = [
  { raw: '01-discover', out: 'final-01', eyebrow: 'Your camera roll, rediscovered', title: 'Room for\nmore.' },
  { raw: '02-swipe', out: 'final-02', eyebrow: 'One print at a time', title: 'Swipe right\nto keep.' },
  { raw: '03-review', out: 'final-03', eyebrow: 'You stay in control', title: 'Nothing is deleted\nuntil you review.' },
  { raw: '04-library', out: 'final-04', eyebrow: 'By month, by album', title: 'Revisit one\nchapter at a time.' },
  { raw: '05-session-end', out: 'final-05', eyebrow: 'Twenty memories a session', title: 'Small sessions.\nReal progress.' },
  { raw: '06-settings-dark', out: 'final-06', eyebrow: 'No account · no uploads · no ads', title: 'Private\nby design.' },
];
const SLIDES_LV = [
  { raw: '01-discover', out: 'final-01', eyebrow: 'Tava galerija, atklāta no jauna', title: 'Vieta\njaunajam.' },
  { raw: '02-swipe', out: 'final-02', eyebrow: 'Viena bilde vienā reizē', title: 'Velc pa labi,\nlai paturētu.' },
  { raw: '03-review', out: 'final-03', eyebrow: 'Tu kontrolē visu', title: 'Nekas netiek dzēsts\nbez pārskatīšanas.' },
  { raw: '04-library', out: 'final-04', eyebrow: 'Pa mēnešiem, pa albumiem', title: 'Atgriezies pie\nvienas nodaļas.' },
  { raw: '05-session-end', out: 'final-05', eyebrow: 'Divdesmit atmiņas sesijā', title: 'Mazas sesijas.\nĪsts progress.' },
  { raw: '06-settings-dark', out: 'final-06', eyebrow: 'Bez konta · bez augšupielādes · bez reklāmām', title: 'Privāti\npēc būtības.' },
];
const SLIDES = LANG === 'lv' ? SLIDES_LV : SLIDES_EN;

const PAPER = '#F5F2E9';
const INK = '#242A25';
const SECONDARY = '#5F675E';
const SURFACE = '#FFFEF8';
const LIME = '#D8ED91';
const TERRACOTTA = '#C04E31';
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';

const SHOT_W = 1092; // device width inside the print
const SHOT_H = Math.round(SHOT_W * (H / W));
const FRAME = 26; // print border
const RADIUS = 70;
const SHOT_TOP = 640;
const ROTATE = -2; // degrees, the house tilt

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function backgroundSvg() {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="${W - 300}" y="-120" width="520" height="520" rx="260" fill="${LIME}" opacity="0.55"/>
</svg>`);
}

function textSvg(eyebrow, title) {
  const lines = title.split('\n');
  const size = 118;
  const lineH = 122;
  const y0 = 300;
  const tspans = lines.map((l, i) => `<tspan x="80" y="${y0 + i * lineH}">${esc(l)}</tspan>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${SHOT_TOP}">
  <rect x="80" y="112" width="34" height="44" rx="8" fill="${TERRACOTTA}" transform="rotate(-12 97 134)"/>
  <text x="138" y="146" font-family="${FONT}" font-size="30" letter-spacing="5" font-weight="600" fill="${SECONDARY}">${esc(eyebrow.toUpperCase())}</text>
  <text font-family="${FONT}" font-size="${size}" font-weight="400" letter-spacing="-3" fill="${INK}">${tspans}</text>
</svg>`);
}

const roundedMask = () => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SHOT_W}" height="${SHOT_H}">
  <rect width="${SHOT_W}" height="${SHOT_H}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/></svg>`);

async function compose(slide) {
  const rawPath = path.join(OUT, `raw-${slide.raw}.png`);
  if (!fs.existsSync(rawPath)) throw new Error(`missing ${rawPath} — run capture.mjs first`);

  const shot = await sharp(rawPath)
    .resize(SHOT_W, SHOT_H, { fit: 'cover' })
    .composite([{ input: roundedMask(), blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Print frame: surface card with the shot inset, then a soft shadow and a tiny tilt.
  const PW = SHOT_W + FRAME * 2;
  const PH = SHOT_H + FRAME * 2;
  const frame = await sharp({ create: { width: PW, height: PH, channels: 4, background: SURFACE } })
    .composite([
      { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}"><rect width="${PW}" height="${PH}" rx="${RADIUS + FRAME}" fill="${SURFACE}"/></svg>`), blend: 'dest-in' },
      { input: shot, left: FRAME, top: FRAME },
    ])
    .png()
    .toBuffer();
  const tilted = await sharp(frame).rotate(ROTATE, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const tMeta = await sharp(tilted).metadata();
  const shadow = await sharp(tilted)
    .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tMeta.width}" height="${tMeta.height}"><rect width="100%" height="100%" fill="${INK}"/></svg>`), blend: 'in' }])
    .blur(28)
    .ensureAlpha(0.18)
    .png()
    .toBuffer();

  const left = Math.round((W - tMeta.width) / 2);
  const outPath = path.join(OUT, `${slide.out}.png`);
  await sharp(backgroundSvg())
    .composite([
      { input: textSvg(slide.eyebrow, slide.title), top: 0, left: 0 },
      { input: shadow, top: SHOT_TOP + 36, left },
      { input: tilted, top: SHOT_TOP, left },
    ])
    .flatten({ background: PAPER })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  const meta = await sharp(outPath).metadata();
  if (meta.width !== W || meta.height !== H || meta.format !== 'png' || meta.hasAlpha) {
    throw new Error(`${outPath}: expected opaque ${W}x${H} png, got ${meta.width}x${meta.height} ${meta.format} alpha=${meta.hasAlpha}`);
  }
  console.log(`  ${slide.out}.png  ${meta.width}x${meta.height}`);
  return outPath;
}

const finals = [];
for (const s of SLIDES) finals.push(await compose(s));

const TW = Math.round(W / 5);
const TH = Math.round(H / 5);
const GAP = 24;
const thumbs = await Promise.all(finals.map((f) => sharp(f).resize(TW, TH).png().toBuffer()));
await sharp({ create: { width: TW * finals.length + GAP * (finals.length + 1), height: TH + GAP * 2, channels: 4, background: '#202720' } })
  .composite(thumbs.map((input, i) => ({ input, left: GAP + i * (TW + GAP), top: GAP })))
  .png()
  .toFile(path.join(OUT, 'preview-contact-sheet.png'));
console.log('  preview-contact-sheet.png');
console.log('done');
