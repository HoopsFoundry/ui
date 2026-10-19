#!/usr/bin/env node
/**
 * Erzeugt logo/social-preview.png (1280 × 640, das Format der GitHub-Repo-Vorschau) aus logo/logo-claim.svg auf weißem Grund.
 * Aufruf: node scripts/make-social-preview.mjs
 * Das Bild wird nicht automatisch hochgeladen; es lädt der Projektinhaber unter Settings → Social preview hoch.
 * Braucht Chromium über Playwright (wie die übrigen Prüfskripte); läuft nicht unter npm test.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const svg = await readFile(`${root}logo/logo-claim.svg`, 'utf8');
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 640 } });
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><body style="margin:0;width:1280px;height:640px;background:#fff;display:grid;place-items:center"><img alt="" src="${dataUrl}" style="width:1040px;height:auto;display:block"></body>`,
  );
  await page.waitForFunction(() => document.images[0].complete && document.images[0].naturalWidth > 0);
  await writeFile(`${root}logo/social-preview.png`, await page.screenshot({ type: 'png' }));
} finally {
  await browser.close();
}
console.log('logo/social-preview.png geschrieben (1280 × 640)');
