// @vitest-environment node
// Logo: Dateiform der SVG, Paketinhalt (Footer-Icons), Storybook-Marke und Favicon, Doku-Seite, README und Markenhinweis.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as code from '../stories/Foundation/Logo.code';

const root = new URL('../', import.meta.url);
const config = JSON.parse(readFileSync(new URL('project.config.json', root), 'utf8')) as { domain: string };
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

const ALLE = ['logo-claim.svg', 'logo-claim-hell.svg', 'logo-farbig.svg', 'logo-einfarbig.svg', 'logo-app-icon.svg', 'logo-icon.svg', 'logo-icon-farbig.svg'];
const ICONS = ['logo-icon.svg', 'logo-icon-farbig.svg'];
const ROT = 'rgb(189,0,13)';

/** Regeln für jede SVG-Datei; liefert die Verstöße (leer = in Ordnung). Wird auch gegen verfälschte Kopien ausgeführt (Mutationsprobe). */
function svgProbleme(name: string, src: string): string[] {
  const p: string[] = [];
  const root = src.match(/<svg\b[^>]*>/)?.[0] ?? '';
  if (!/\sviewBox="-?\d+ -?\d+ \d+ \d+"/.test(root)) p.push('viewBox fehlt oder ist nicht ganzzahlig');
  if (/\s(width|height)=/.test(root)) p.push('feste Breite oder Höhe am Wurzelelement');
  if (/<!DOCTYPE|<\?xml|serif:|xmlns:xlink/.test(src)) p.push('DOCTYPE, XML-Kopf oder Editor-Reste');
  if (/\sid="/.test(src)) p.push('id-Attribut (doppelte IDs, wenn die Datei inline steht)');
  if (!/fill-rule="evenodd"/.test(root)) p.push('fill-rule evenodd fehlt (das Zeichen hat Löcher)');
  const einfarbig = name === 'logo-einfarbig.svg' || name === 'logo-icon.svg';
  if (einfarbig && !/\sfill="currentColor"/.test(root)) p.push('currentColor fehlt');
  if (einfarbig && /fill:|rgb\(/.test(src)) p.push('feste Farbe in einer einfarbigen Fassung');
  if (!einfarbig && name !== 'logo-claim-hell.svg' && !src.replaceAll(' ', '').includes(ROT)) p.push('rotes F fehlt');
  if (name === 'logo-claim-hell.svg' && !/\sfill="#fff"/.test(root)) p.push('weiße Füllung fehlt');
  // Das Claim-Logo: "Foundry" und Claim sind rot (32 Pfade), Zeichen und "Hoops" erben die Grundfarbe
  if (name.startsWith('logo-claim') && (src.match(/fill:rgb\(189,0,13\)/g) ?? []).length !== 32) p.push('Foundry und Claim sind nicht rot (erwartet: 32 rote Pfade)');
  if (name.startsWith('logo-claim') && /<text/.test(src)) p.push('Text muss als Pfade vorliegen');
  return p;
}

describe('SVG-Dateien', () => {
  it.each(ALLE)('%s: saubere viewBox, keine feste Größe, keine Editor-Reste', (name) => {
    expect(existsSync(new URL(`logo/${name}`, root)), name).toBe(true);
    expect(svgProbleme(name, read(`logo/${name}`))).toEqual([]);
  });
  it('die alten Namen sind weg', () => {
    for (const alt of ['Logo-with-claim.svg', 'logo-monochrome.svg']) expect(existsSync(new URL(`logo/${alt}`, root)), alt).toBe(false);
  });
  it('das Seitenverhältnis stimmt mit der viewBox überein (Zeichen 661 × 944, Claim 4645 × 989, App-Icon quadratisch)', () => {
    const vb = (n: string) => read(`logo/${n}`).match(/viewBox="(-?\d+) (-?\d+) (\d+) (\d+)"/)!.slice(1).map(Number);
    expect(vb('logo-icon.svg').slice(2)).toEqual([661, 944]);
    expect(vb('logo-icon-farbig.svg').slice(2)).toEqual(vb('logo-farbig.svg').slice(2));
    expect(vb('logo-claim.svg').slice(2)).toEqual([4645, 989]);
    expect(vb('logo-claim-hell.svg')).toEqual(vb('logo-claim.svg'));
    const [, , w, h] = vb('logo-app-icon.svg');
    expect(Math.abs(w - h)).toBeLessThanOrEqual(1);
  });
  it('das Icon ist das Zeichen des farbigen Logos (gleiche Pfade, nur die Farbe ist anders)', () => {
    const paths = (s: string) => [...s.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
    expect(paths(read('logo/logo-icon.svg'))).toEqual(paths(read('logo/logo-farbig.svg')));
    expect(paths(read('logo/logo-icon-farbig.svg'))).toEqual(paths(read('logo/logo-farbig.svg')));
  });
  it('Mutationsprobe: verfälschte Kopien fallen durch', () => {
    const claim = read('logo/logo-claim.svg');
    expect(svgProbleme('logo-claim.svg', claim.replace('fill:rgb(189,0,13)', 'fill:rgb(0,0,0)'))).toContain('Foundry und Claim sind nicht rot (erwartet: 32 rote Pfade)');
    expect(svgProbleme('logo-claim.svg', claim.replace('</svg>', '<text>x</text></svg>'))).toContain('Text muss als Pfade vorliegen');
    expect(svgProbleme('logo-claim-hell.svg', read('logo/logo-claim-hell.svg').replace(' fill="#fff"', ''))).toContain('weiße Füllung fehlt');
    const farbig = read('logo/logo-farbig.svg');
    expect(svgProbleme('logo-farbig.svg', farbig.replace('<svg ', '<svg width="100%" '))).toContain('feste Breite oder Höhe am Wurzelelement');
    expect(svgProbleme('logo-farbig.svg', farbig.replace(/ viewBox="[^"]*"/, ''))).toContain('viewBox fehlt oder ist nicht ganzzahlig');
    expect(svgProbleme('logo-farbig.svg', '<!DOCTYPE svg>' + farbig)).toContain('DOCTYPE, XML-Kopf oder Editor-Reste');
    expect(svgProbleme('logo-farbig.svg', farbig.replace('rgb(189,0,13)', 'rgb(0,0,0)'))).toContain('rotes F fehlt');
    const icon = read('logo/logo-icon.svg');
    expect(svgProbleme('logo-icon.svg', icon.replace(' fill="currentColor"', ''))).toContain('currentColor fehlt');
    expect(svgProbleme('logo-icon.svg', icon.replace('<path d=', '<path style="fill:rgb(1,2,3)" d='))).toContain('feste Farbe in einer einfarbigen Fassung');
  });
});

describe('Social Preview', () => {
  it('ist ein PNG mit 1280 × 640 Pixeln', () => {
    const png = readFileSync(new URL('logo/social-preview.png', root));
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1280, 640]);
  });
});

describe('npm-Paket', () => {
  const pkg = JSON.parse(read('package.json')) as { files: string[]; exports: Record<string, string> };
  it('führt genau die zwei Footer-Icons als Dateien und Exports', () => {
    for (const n of ICONS) {
      expect(pkg.files).toContain(`logo/${n}`);
      expect(pkg.exports[`./logo/${n}`]).toBe(`./logo/${n}`);
    }
    expect(pkg.files.filter((f) => f.startsWith('logo'))).toHaveLength(2);
    expect(Object.keys(pkg.exports).filter((k) => k.startsWith('./logo'))).toHaveLength(2);
    expect(code.paketDateien).toEqual(ICONS.map((n) => `logo/${n}`));
  });
  it('npm pack enthält aus logo/ die Footer-Icons und die README.md (npm nimmt Readme-Dateien immer mit), sonst nichts', () => {
    const out = execFileSync('npm', ['pack', '--ignore-scripts', '--dry-run', '--json'], { cwd: new URL('.', root), encoding: 'utf8', timeout: 90000 });
    const files = (JSON.parse(out) as { files: { path: string }[] }[])[0].files.map((f) => f.path);
    expect(files.filter((f) => f.startsWith('logo/')).sort()).toEqual([...ICONS.map((n) => `logo/${n}`), 'logo/README.md'].sort());
    expect(files).toContain('LICENSE');
  }, 100000);
});

describe('Storybook', () => {
  it('die Marke nutzt das Logo mit Claim, hell und dunkel, über relative Pfade', () => {
    const m = read('.storybook/manager.ts');
    expect(m).toContain("from 'storybook/theming'");
    expect(m).toContain('./logo/logo-claim.svg');
    expect(m).toContain('./logo/logo-claim-hell.svg');
    expect(m).toMatch(/brandTitle: '[^']+'/);
    expect(m).toContain('prefers-color-scheme: dark');
    for (const n of ['logo-claim.svg', 'logo-claim-hell.svg']) expect(existsSync(new URL(`logo/${n}`, root))).toBe(true);
    expect(m).not.toMatch(/https?:\/\//);
  });
  it('staticDirs liefert logo/ unter logo/ aus', () => {
    expect(read('.storybook/main.ts')).toMatch(/staticDirs: \[\{ from: '\.\.\/logo', to: '\/logo' \}\]/);
  });
  it('das Favicon ist das App-Icon, relativ und ohne Fremdadresse (Manager und Vorschau)', () => {
    for (const f of ['.storybook/manager-head.html', '.storybook/preview-head.html']) {
      const html = read(f);
      expect(html, f).toContain('<link rel="icon" type="image/svg+xml" href="./logo/logo-app-icon.svg"');
      expect(html, f).not.toMatch(/https?:\/\//);
    }
  });
  it('die CSP der Doku lässt Bilder aus dem eigenen Ursprung zu', () => {
    expect(read('deploy/htaccess')).toMatch(/img-src 'self'/);
  });
});

describe('Doku-Seite Foundation/Logo', () => {
  const mdx = read('stories/Foundation/Logo.mdx');
  const stories = read('stories/Foundation/Logo.stories.ts');
  const demo = read('stories/Foundation/Logo.svelte');
  it('ist in Einführung und Sortierung eingetragen', () => {
    expect(read('stories/Introduction.mdx')).toContain('(?path=/docs/foundation-logo--docs)');
    expect(read('.storybook/preview.ts')).toMatch(/'Internationalisierung', 'Logo'\]/);
  });
  it("jede Story trägt das literale tags: ['!dev'] (Seite und Stories)", () => {
    expect(stories.match(/^export const \w+ = .*tags: \['!dev'\]/gm)).toHaveLength(4);
    expect(stories).toMatch(/title: 'Foundation\/Logo'/);
  });
  it('nennt Mindestgrößen, Schutzraum, Footer-Text, Link und die Erlaubnis für Anwender', () => {
    for (const s of ['16 px Höhe', '48 px Höhe', 'Schutzraum', 'Powered by HoopsFoundry UI', `https://${config.domain}`, 'alt=""', 'Marke']) expect(mdx, s).toContain(s);
    expect(mdx).toContain('nicht** von der MIT-Lizenz');
  });
  it('jedes Bild der Vorschau hat einen alt-Text; Dekoration ist leer, ein Icon allein hat einen Namen', () => {
    expect(demo).not.toMatch(/<img(?![^>]*\balt=)/);
    expect(demo).toMatch(/<img src="\.\/logo\/logo-icon-farbig\.svg" alt="" width="16" height="23"/);
    expect(demo).toContain('alt="HoopsFoundry UI" width="16" height="23"');
    expect(demo).toContain('aria-hidden="true"');
  });
  it('die Vorschauen nennen nur vorhandene Dateien, und das Seitenverhältnis (16 × 23) passt zum Icon', () => {
    for (const m of demo.matchAll(/logo\/([\w-]+\.svg)/g)) expect(ALLE, m[1]).toContain(m[1]);
    for (const m of demo.matchAll(/'(logo-[\w-]+\.svg)'/g)) expect(ALLE, m[1]).toContain(m[1]);
    expect(Math.round((16 * 944) / 661)).toBe(23);
  });
  it('Code-Beispiele: Text neben dem Icon, alt leer; Icon allein, alt benannt; Maske zeigt auf die einfarbige Datei', () => {
    expect(code.htmlNebenText).toContain(`href="https://${config.domain}"`);
    expect(code.htmlNebenText).toContain('alt=""');
    expect(code.htmlNebenText).toContain('Powered by HoopsFoundry UI');
    expect(code.htmlAllein).toMatch(/alt="[^"]+"/);
    expect(code.htmlAllein).not.toContain('alt=""');
    expect(code.cssMaske).toContain('logo-icon.svg');
    expect(code.cssMaske).toContain('background: currentColor');
    expect(code.htmlMaske).toContain('aria-hidden="true"');
    for (const c of [code.svelte, code.react]) expect(c).toContain('@hoopsfoundry/ui/logo/logo-icon-farbig.svg');
  });
  it('das Svelte-Beispiel ist gültiges Svelte', async () => {
    const { compile } = await import('svelte/compiler');
    const src = code.svelte.replace(/@hoopsfoundry\/ui\/logo\/logo-icon-farbig\.svg/, './x.svg');
    expect(() => compile(src, { generate: 'server', filename: 'Beispiel.svelte' })).not.toThrow();
  });
  it('der Mdx-Fließtext hat keine langen Code-Stücke (siehe docs-inline-code.test.ts)', () => {
    expect(read('tests/docs-inline-code.test.ts')).toContain('stories/Foundation/Logo.mdx');
  });
});

describe('README, LICENSE und Markenhinweis', () => {
  const readme = read('README.md');
  it('die README beginnt mit dem Logo (hell und dunkel) und einem alt-Text', () => {
    const kopf = readme.slice(0, readme.indexOf('# HoopsFoundry UI'));
    expect(kopf).toContain('<picture>');
    expect(kopf).toContain('prefers-color-scheme: dark');
    expect(kopf).toContain('srcset="logo/logo-claim-hell.svg"');
    expect(kopf).toContain('src="logo/logo-claim.svg"');
    expect(kopf).toMatch(/alt="HoopsFoundry UI[^"]+"/);
  });
  it('README, LICENSE und logo/README.md nehmen Logo und Namen von der MIT-Lizenz aus', () => {
    expect(readme).toContain('## Logo und Marke');
    expect(readme).toContain('von der MIT-Lizenz ausgenommen');
    expect(readme).toContain('keine Rechtsberatung');
    const lic = read('LICENSE');
    expect(lic.indexOf('MIT License')).toBe(0);
    expect(lic.indexOf('Logo und Name / Logo and name')).toBeGreaterThan(lic.indexOf('SOFTWARE.'));
    expect(lic).toContain('Deutsch:');
    expect(lic).toContain('English:');
    expect(lic).toContain('Powered by HoopsFoundry UI');
    const lr = read('logo/README.md');
    expect(lr).toContain('von der MIT-Lizenz des Codes ausgenommen');
    for (const n of ALLE) expect(lr, n).toContain(n);
  });
  it('CHANGELOG, arc42 (Kapitel 5, 8, 9) und das Erzeugungsskript sind nachgeführt', () => {
    expect(read('CHANGELOG.md')).toContain('**Logo HoopsFoundry:**');
    expect(read('docs/architecture/sections/09-architecture-decisions.adoc')).toContain('=== ADR-015: Logo');
    expect(read('docs/architecture/sections/05-building-block-view.adoc')).toContain('`logo/`');
    expect(read('docs/architecture/sections/08-crosscutting-concepts.adoc')).toContain('=== Marke und Logo');
    expect(read('scripts/make-social-preview.mjs')).toContain('logo/social-preview.png');
  });
});
