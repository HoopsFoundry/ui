// @vitest-environment node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const root = new URL('../', import.meta.url);
const css = readFileSync(new URL('fonts/fonts.css', root), 'utf8');
const files = [...css.matchAll(/url\('\.\/([^']+)'\)/g)].map((m) => m[1]);

describe('Selbst gehostete Schriften', () => {
  it.each(['Sora', 'Manrope', 'JetBrains Mono', 'Rubik', 'Barlow Condensed'])('definiert %s', (family) => {
    expect(css).toContain(`font-family: '${family}'`);
  });

  it('jede referenzierte Schriftdatei existiert', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((f) => !existsSync(new URL(`fonts/${f}`, root)))).toEqual([]);
  });

  it('jede Schriftfamilie hat einen Lizenztext (OFL)', () => {
    const licenses = readdirSync(new URL('fonts/licenses/', root)).join(' ');
    for (const slug of ['sora', 'manrope', 'jetbrains-mono', 'rubik', 'barlow-condensed']) {
      expect(licenses).toContain(slug);
    }
  });

  it('wird als Paket-Export angeboten', () => {
    const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
    expect(pkg.exports['./fonts.css']).toBe('./fonts/fonts.css');
    expect(pkg.files).toContain('fonts/');
  });

  it('Storybook lädt nichts von Google', () => {
    const preview = readFileSync(new URL('.storybook/preview.ts', root), 'utf8');
    expect(preview).toContain("../fonts/fonts.css");
    // preview-head.html darf es geben (Favicon), aber nichts von außen laden
    const head = new URL('.storybook/preview-head.html', root);
    if (existsSync(head)) expect(readFileSync(head, 'utf8')).not.toMatch(/https?:\/\/|googleapis|gstatic/);
  });
});
