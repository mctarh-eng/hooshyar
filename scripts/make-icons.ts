/**
 * هوش‌یار — brand icon generator
 * Builds every icon/splash the web app + Android (adaptive) need,
 * from one SVG source so the identity stays pixel-consistent.
 *
 *   bun scripts/make-icons.ts
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const ASSETS = path.join(ROOT, 'assets');
const WEB_ICONS = path.join(ROOT, 'public', 'icons');

// 4-point "AI sparkle" path
function sparkle(cx: number, cy: number, r: number): string {
  const k = r * 0.12; // concave control factor
  return [
    `M ${cx} ${cy - r}`,
    `C ${cx + k} ${cy - k} ${cx + r - k} ${cy - k} ${cx + r} ${cy}`,
    `C ${cx + r - k} ${cy + k} ${cx + k} ${cy + k} ${cx} ${cy + r}`,
    `C ${cx - k} ${cy + k} ${cx - r + k} ${cy + k} ${cx - r} ${cy}`,
    `C ${cx - r + k} ${cy - k} ${cx - k} ${cy - k} ${cx} ${cy - r} Z`,
  ].join(' ');
}

const GRADIENT = /* xml */ `
  <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"  stop-color="#FBBF24"/>
    <stop offset="45%" stop-color="#F97316"/>
    <stop offset="100%" stop-color="#EC4899"/>
  </linearGradient>`;

/** full-bleed brand tile (square icon / web / legacy) */
function tileSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>${GRADIENT}</defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <path d="${sparkle(512, 512, 330)}" fill="#FFFFFF"/>
  <path d="${sparkle(740, 284, 110)}" fill="#FFFFFF" opacity="0.95"/>
  <circle cx="292" cy="736" r="34" fill="#FFFFFF" opacity="0.9"/>
</svg>`;
}

/** adaptive foreground: white marks on TRANSPARENT, everything inside safe zone (r<=338) */
function fgSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <path d="${sparkle(512, 512, 272)}" fill="#FFFFFF"/>
  <path d="${sparkle(676, 348, 78)}" fill="#FFFFFF" opacity="0.95"/>
  <circle cx="352" cy="668" r="24" fill="#FFFFFF" opacity="0.9"/>
</svg>`;
}

/** adaptive background: pure gradient */
function bgSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>${GRADIENT}</defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
</svg>`;
}

/** splash source: rounded brand tile on warm/dark background */
async function splash(dark: boolean): Promise<Buffer> {
  const bg = dark ? '#1C1917' : '#FFF7ED';
  const size = 2732;
  const mark = Math.round(size * 0.21); // ~574px
  const tile = await sharp(Buffer.from(tileSvg()))
    .resize(mark, mark)
    .png()
    .toBuffer();
  const radius = Math.round(mark * 0.225);
  const mask = Buffer.from(
    `<svg width="${mark}" height="${mark}"><rect width="${mark}" height="${mark}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
  );
  const rounded = await sharp(tile)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const top = Math.round((size - mark) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: rounded, top, left: top }])
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(ASSETS, { recursive: true });
  fs.mkdirSync(WEB_ICONS, { recursive: true });

  // --- capacitor-assets sources ---
  await sharp(Buffer.from(tileSvg())).png().toFile(path.join(ASSETS, 'icon-only.png'));
  await sharp(Buffer.from(fgSvg())).png().toFile(path.join(ASSETS, 'icon-foreground.png'));
  await sharp(Buffer.from(bgSvg())).png().toFile(path.join(ASSETS, 'icon-background.png'));
  fs.writeFileSync(path.join(ASSETS, 'splash.png'), await splash(false));
  fs.writeFileSync(path.join(ASSETS, 'splash-dark.png'), await splash(true));

  // --- web / PWA icons ---
  const tile = Buffer.from(tileSvg());
  await sharp(tile).resize(1024, 1024).png().toFile(path.join(WEB_ICONS, 'icon-1024.png'));
  await sharp(tile).resize(512, 512).png().toFile(path.join(WEB_ICONS, 'icon-512.png'));
  await sharp(tile).resize(192, 192).png().toFile(path.join(WEB_ICONS, 'icon-192.png'));
  await sharp(tile).resize(32, 32).png().toFile(path.join(WEB_ICONS, 'favicon-32.png'));

  // --- vector logo for docs/README ---
  fs.writeFileSync(path.join(ROOT, 'public', 'logo.svg'), tileSvg());

  console.log('✅ brand assets generated');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
