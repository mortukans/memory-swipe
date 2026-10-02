// Generates placeholder app assets (icon, splash mark, favicon) from inline SVG.
// Run: node tools/gen-assets.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

mkdirSync('assets', { recursive: true });

// App icon: gradient squircle with a photo card + heart motif.
const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5B6EF0"/>
      <stop offset="1" stop-color="#2FB68C"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="26" flood-color="#000" flood-opacity="0.22"/>
    </filter>
  </defs>
  <rect width="1024" height="1024" rx="230" fill="url(#bg)"/>
  <g transform="rotate(-9 512 512)" filter="url(#s)">
    <rect x="300" y="250" width="424" height="524" rx="54" fill="#FFFFFF"/>
    <rect x="300" y="250" width="424" height="524" rx="54" fill="none" stroke="#E7EAF2" stroke-width="2"/>
  </g>
  <path transform="translate(512 540) scale(1.0)"
    d="M0 150 C -150 10 -210 -90 -120 -160 C -70 -200 -10 -180 0 -120 C 10 -180 70 -200 120 -160 C 210 -90 150 10 0 150 Z"
    fill="#F0564B"/>
</svg>`;

// Splash mark: light card + heart on transparent (shown on the dark splash bg).
const splashSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-9 256 256)">
    <rect x="150" y="120" width="212" height="262" rx="30" fill="#F3F4F7"/>
  </g>
  <path transform="translate(256 272) scale(0.5)"
    d="M0 150 C -150 10 -210 -90 -120 -160 C -70 -200 -10 -180 0 -120 C 10 -180 70 -200 120 -160 C 210 -90 150 10 0 150 Z"
    fill="#F0564B"/>
</svg>`;

await sharp(Buffer.from(iconSvg)).png().toFile('assets/icon.png');
await sharp(Buffer.from(splashSvg)).png().toFile('assets/splash-icon.png');
await sharp(Buffer.from(iconSvg)).resize(96, 96).png().toFile('assets/favicon.png');

console.log('Wrote assets/icon.png, assets/splash-icon.png, assets/favicon.png');
