#!/usr/bin/env node
// Generates app icons, Android adaptive icon layers, favicon and splash image from the 2014 artwork
// in assets/legacy/. Run: node scripts/generate-brand-assets.mjs  (uses Playwright's Chromium for canvas).
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const icon = `data:image/png;base64,${readFileSync('assets/legacy/ic_launcher-web.png').toString('base64')}`;
const logo = `data:image/jpeg;base64,${readFileSync('assets/legacy/ym_logo.jpg').toString('base64')}`;

const browser = await chromium.launch();
const page = await browser.newPage();
const files = await page.evaluate(
  async ([iconSrc, logoSrc]) => {
    const load = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    const [iconImg, logoImg] = await Promise.all([load(iconSrc), load(logoSrc)]);
    // The legacy launcher icon is a 448px black square (x/y 32..479) with transparent corners.
    const SRC = { x: 32, y: 32, size: 448 };

    const canvas = (size, fill) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(0, 0, size, size);
      }
      return [c, ctx];
    };
    // Draws the stall artwork centred, scaled to `scale` of the canvas.
    const drawStall = (ctx, size, scale) => {
      const d = size * scale;
      ctx.drawImage(
        iconImg,
        SRC.x,
        SRC.y,
        SRC.size,
        SRC.size,
        (size - d) / 2,
        (size - d) / 2,
        d,
        d,
      );
    };
    // Makes near-black pixels transparent (keeps the coloured artwork only).
    const knockOutBlack = (ctx, size, toWhite = false) => {
      const data = ctx.getImageData(0, 0, size, size);
      for (let i = 0; i < data.data.length; i += 4) {
        const max = Math.max(data.data[i], data.data[i + 1], data.data[i + 2]);
        if (max < 40) data.data[i + 3] = 0;
        else if (toWhite) {
          data.data[i] = data.data[i + 1] = data.data[i + 2] = 255;
          data.data[i + 3] = Math.min(255, max * 2);
        }
      }
      ctx.putImageData(data, 0, 0);
    };
    const png = (c) => c.toDataURL('image/png').split(',')[1];
    const out = {};

    // iOS / generic icon: full-bleed black, artwork at 82%.
    let [c, ctx] = canvas(1024, '#000000');
    drawStall(ctx, 1024, 0.82);
    out['icon.png'] = png(c);

    // Android adaptive icon: artwork inside the 66% safe zone, on a black background layer.
    [c, ctx] = canvas(1024);
    drawStall(ctx, 1024, 0.62);
    knockOutBlack(ctx, 1024);
    out['android-icon-foreground.png'] = png(c);
    [c] = canvas(1024, '#000000');
    out['android-icon-background.png'] = png(c);
    [c, ctx] = canvas(1024);
    drawStall(ctx, 1024, 0.62);
    knockOutBlack(ctx, 1024, true);
    out['android-icon-monochrome.png'] = png(c);

    // Favicon.
    [c, ctx] = canvas(64, '#000000');
    drawStall(ctx, 64, 0.9);
    out['favicon.png'] = png(c);

    // Splash: the full "Ymarq" logo on transparent (the splash background colour is black).
    [c, ctx] = canvas(1024);
    ctx.drawImage(logoImg, 0, 0, 1024, 1024);
    knockOutBlack(ctx, 1024);
    out['splash-icon.png'] = png(c);
    return out;
  },
  [icon, logo],
);
await browser.close();

for (const [name, base64] of Object.entries(files)) {
  writeFileSync(`assets/${name}`, Buffer.from(base64, 'base64'));
  console.log(`assets/${name}`);
}
