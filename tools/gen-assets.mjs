// App icon, splash mark and favicon in the "Room for more" visual language.
// Run: node tools/gen-assets.mjs
// Icon rules: 1024×1024, sRGB, fully opaque (no alpha), square (Apple applies the mask).
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('assets', { recursive: true });

const PAPER = '#F5F2E9';
const PRINT = '#FFFEF8';
const INK = '#242A25';
const LIME = '#D8ED91';
const TERRACOTTA = '#C04E31';

// A small landscape "memory" drawn in the palette (used inside the prints).
const landscape = (id, skyA, skyB, far, near, sun) => `
  <defs>
    <linearGradient id="sky-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${skyA}"/><stop offset="1" stop-color="${skyB}"/>
    </linearGradient>
    <clipPath id="clip-${id}"><rect x="0" y="0" width="100" height="120" rx="3"/></clipPath>
  </defs>
  <g clip-path="url(#clip-${id})">
    <rect width="100" height="120" fill="url(#sky-${id})"/>
    <circle cx="68" cy="34" r="11" fill="${sun}"/>
    <path d="M-5 92 L28 52 L48 78 L64 60 L105 95 L105 125 L-5 125Z" fill="${far}"/>
    <path d="M-5 104 L22 84 L44 100 L70 82 L105 106 L105 125 L-5 125Z" fill="${near}"/>
    <path d="M38 125 C44 108 60 104 70 90 C76 100 70 112 76 125Z" fill="#C9D6C2" opacity="0.9"/>
  </g>`;

// A print: paper border, photo area, thicker bottom lip. Drawn in a 100×127 box.
const print = (id, art) => `
  <g>
    <rect x="0" y="0" width="100" height="127" rx="5" fill="${PRINT}"/>
    <g transform="translate(5 5)">${art}</g>
  </g>`;

const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#35452B" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="${PAPER}"/>

  <!-- back print, peeking -->
  <g transform="translate(560 250) rotate(13) scale(4.1)" filter="url(#shadow)">
    ${print('b', landscape('b', '#CFD6E6', '#B8B4D6', '#7E88A6', '#5C6B8A', '#E8B98A'))}
  </g>
  <!-- front print -->
  <g transform="translate(192 262) rotate(-8) scale(4.6)" filter="url(#shadow)">
    ${print('f', landscape('f', '#DCE8EC', '#B7CBD1', '#7FA0A5', '#3F6367', '#E6B183'))}
  </g>

  <!-- terracotta mark -->
  <rect x="150" y="128" width="78" height="100" rx="18" fill="${TERRACOTTA}" transform="rotate(-12 189 178)"/>
  <!-- lime sticker -->
  <circle cx="820" cy="812" r="96" fill="${LIME}"/>
  <path d="M820 852 C780 818 764 794 782 772 C794 758 812 764 820 778 C828 764 846 758 858 772 C876 794 860 818 820 852Z" fill="${INK}"/>
</svg>`;

// Splash mark on transparent: one print + the terracotta mark (shown on paper / dark paper).
const splashSvg = `
<svg width="1024" height="1024" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(140 96) rotate(-8) scale(2.2)">
    ${print('s', landscape('s', '#DCE8EC', '#B7CBD1', '#7FA0A5', '#3F6367', '#E6B183'))}
  </g>
  <rect x="96" y="70" width="40" height="52" rx="10" fill="${TERRACOTTA}" transform="rotate(-12 116 96)"/>
</svg>`;

await sharp(Buffer.from(iconSvg)).flatten({ background: PAPER }).removeAlpha().png().toFile('assets/icon.png');
await sharp(Buffer.from(splashSvg)).png().toFile('assets/splash-icon.png');
await sharp(Buffer.from(iconSvg)).flatten({ background: PAPER }).removeAlpha().resize(96, 96).png().toFile('assets/favicon.png');

const meta = await sharp('assets/icon.png').metadata();
console.log('icon.png', meta.width, 'x', meta.height, 'channels', meta.channels, 'alpha', meta.hasAlpha);
console.log('Wrote assets/icon.png, assets/splash-icon.png, assets/favicon.png');
