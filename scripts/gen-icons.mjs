// Generates PWA icons from an inline SVG mark (flame glyph on warm paper).
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const flame = (pad, bg) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${bg}" rx="${pad ? 0 : 96}"/>
  <g transform="translate(${pad ? 128 : 112}, ${pad ? 128 : 112}) scale(${pad ? 10.6 : 12})">
    <path d="M12 2.5c.6 2.4-.5 3.9-1.8 5.4-1.6 1.8-3.4 3.7-3.4 6.6 0 3.6 2.8 6.5 6.4 6.5s6.4-2.9 6.4-6.5c0-2.5-1-4.1-2.2-5.6.1 2-1 3-2.1 3-1 0-1.7-.7-1.7-1.8 0-2.7.7-5.5-1.6-7.6z" fill="#1f1b16"/>
  </g>
</svg>`;

mkdirSync('public/icons', { recursive: true });

const jobs = [
  ['public/icons/icon-192.png', 192, flame(false, '#f4f0e8')],
  ['public/icons/icon-512.png', 512, flame(false, '#f4f0e8')],
  ['public/icons/icon-512-maskable.png', 512, flame(true, '#f4f0e8')],
  ['public/icons/apple-touch-icon.png', 180, flame(true, '#f4f0e8')],
];

for (const [out, size, svg] of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log('wrote', out);
}
