// @vitest-environment node
// Logo: Dateiform der SVG, Paketinhalt (Footer-Icons), Storybook-Marke und Favicon, Doku-Seite, README und Markenhinweis.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as code from '../stories/Foundation/Logo.code';

const root = new URL('../', import.meta.url);
const config = JSON.parse(readFileSync(new URL('project.config.json', root), 'utf8')) as { domain: string };
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

const ALLE = ['logo-claim.svg', 'logo-claim-hell.svg', 'logo-farbig.svg', 'logo-farbig-dunkel.svg', 'logo-einfarbig.svg', 'logo-app-icon.svg', 'logo-app-icon-dunkel.svg', 'favicon.svg', 'logo-icon.svg', 'logo-icon-farbig.svg', 'logo-icon-farbig-dunkel.svg'];
const ICONS = ['logo-icon.svg', 'logo-icon-farbig.svg', 'logo-icon-farbig-dunkel.svg']; // im npm-Paket
const DUNKEL_ZEICHEN = ['logo-farbig-dunkel.svg', 'logo-icon-farbig-dunkel.svg']; // Zeichen weiß, nie Ash
const S2 = '#f2561d'; // die eine Signalfarbe (hell und dunkel)
const ASH = '#24292f'; // Ash: ersetzt das Schwarz (Zeichen, "Hoops", Claim hell, Kachel des App-Icons)
const CLAIM_DUNKEL = '#c9d1d9'; // Claim auf dunklem Grund

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
  if (!einfarbig && !src.replaceAll(' ', '').includes(`fill:${S2}`)) p.push('F in der Signalfarbe #f2561d fehlt');
  if (/rgb\(189,\s*0,\s*13\)/.test(src)) p.push('altes Rot rgb(189,0,13) kommt noch vor');
  if (!einfarbig && !name.includes('app-icon') && name !== 'favicon.svg' && /fill:(black|#000(000)?|#fff|white)\b/.test(src)) p.push('reines Schwarz oder Weiß statt Ash');
  if (name === 'logo-app-icon.svg' && !src.includes(`style="fill:${ASH};"`)) p.push('Kachel nicht in Ash');
  if (name === 'logo-app-icon.svg' && !/fill:white/.test(src)) p.push('weißes Zeichen fehlt');
  // Dunkle Fassungen: invertiert, Ash kommt nie als Zeichen auf dunklem Grund vor
  if (DUNKEL_ZEICHEN.includes(name) && !/\sfill="#fff"/.test(root)) p.push('dunkle Fassung: Zeichen nicht weiß');
  if (DUNKEL_ZEICHEN.includes(name) && src.includes(ASH)) p.push('dunkle Fassung enthält Ash (Ash nie auf dunkler Fläche)');
  if (name === 'logo-app-icon-dunkel.svg') {
    if (!src.includes('style="fill:#fff;"')) p.push('dunkles App-Icon: Kachel nicht weiß');
    if (!src.includes(`style="fill:${ASH};"`)) p.push('dunkles App-Icon: Zeichen nicht in Ash');
  }
  if (name === 'favicon.svg') {
    if (!/@media \(prefers-color-scheme:\s*dark\)/.test(src)) p.push('Favicon: Umschaltung per prefers-color-scheme fehlt');
    if (!src.includes(`.k{fill:${ASH}}`) || !src.includes('.z{fill:#fff}')) p.push('Favicon: helle Fassung (Kachel Ash, Zeichen weiß) fehlt');
    if (!src.includes(`dark){.k{fill:#fff}.z{fill:${ASH}}`)) p.push('Favicon: dunkle Fassung nicht invertiert');
  }
  if (['logo-farbig.svg', 'logo-icon-farbig.svg', 'logo-claim.svg'].includes(name) && !new RegExp(`\\sfill="${ASH}"`).test(root)) p.push('Zeichen nicht in Ash (Grundfüllung fehlt)');
  if (name === 'logo-claim-hell.svg' && !/\sfill="#fff"/.test(root)) p.push('weiße Füllung fehlt');
  // Logo mit Claim: "Foundry" und F in der Signalfarbe (8 Pfade), der Claim (24 Pfade) neutral: Ash auf hellem, hellgrau auf dunklem Grund
  if (name.startsWith('logo-claim')) {
    const i = src.indexOf('matrix(1.29129');
    const farben = (t: string) => [...t.matchAll(/fill:(#[0-9a-f]{6})/g)].map((m) => m[1]);
    const vorn = farben(src.slice(0, i));
    const claim = farben(src.slice(i));
    if (vorn.length !== 8 || !vorn.every((c) => c === S2)) p.push('Foundry und F sind nicht in der Signalfarbe (erwartet: 8 Pfade in #f2561d)');
    const soll = name === 'logo-claim.svg' ? ASH : CLAIM_DUNKEL;
    if (claim.length !== 24 || !claim.every((c) => c === soll)) p.push(`Claim ist nicht neutral (erwartet: 24 Pfade in ${soll})`);
  }
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
    expect(vb('logo-icon-farbig-dunkel.svg')).toEqual(vb('logo-icon-farbig.svg'));
    expect(vb('logo-farbig-dunkel.svg')).toEqual(vb('logo-farbig.svg'));
    expect(vb('logo-app-icon-dunkel.svg')).toEqual(vb('logo-app-icon.svg'));
    expect(vb('favicon.svg')).toEqual(vb('logo-app-icon.svg'));
    expect(vb('logo-claim.svg').slice(2)).toEqual([4645, 989]);
    expect(vb('logo-claim-hell.svg')).toEqual(vb('logo-claim.svg'));
    const [, , w, h] = vb('logo-app-icon.svg');
    expect(Math.abs(w - h)).toBeLessThanOrEqual(1);
  });
  it('das Icon ist das Zeichen des farbigen Logos (gleiche Pfade, nur die Farbe ist anders)', () => {
    const paths = (s: string) => [...s.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
    expect(paths(read('logo/logo-icon.svg'))).toEqual(paths(read('logo/logo-farbig.svg')));
    expect(paths(read('logo/logo-icon-farbig.svg'))).toEqual(paths(read('logo/logo-farbig.svg')));
    for (const n of DUNKEL_ZEICHEN) expect(paths(read(`logo/${n}`)), n).toEqual(paths(read('logo/logo-farbig.svg')));
    for (const n of ['logo-app-icon-dunkel.svg', 'favicon.svg']) expect(paths(read(`logo/${n}`)), n).toEqual(paths(read('logo/logo-app-icon.svg')));
  });
  it('Mutationsprobe: verfälschte Kopien fallen durch', () => {
    const claim = read('logo/logo-claim.svg');
    expect(svgProbleme('logo-claim.svg', claim.replace('fill:#f2561d', 'fill:#000000'))).toContain('Foundry und F sind nicht in der Signalfarbe (erwartet: 8 Pfade in #f2561d)');
    expect(svgProbleme('logo-claim.svg', claim.replace('fill:#24292f', 'fill:#f2561d'))).toContain('Claim ist nicht neutral (erwartet: 24 Pfade in #24292f)');
    expect(svgProbleme('logo-claim.svg', claim.replace('fill:#f2561d', 'fill:rgb(189,0,13)'))).toContain('altes Rot rgb(189,0,13) kommt noch vor');
    expect(svgProbleme('logo-claim-hell.svg', read('logo/logo-claim-hell.svg').replace('fill:#c9d1d9', 'fill:#f2561d'))).toContain('Claim ist nicht neutral (erwartet: 24 Pfade in #c9d1d9)');
    expect(svgProbleme('logo-app-icon.svg', read('logo/logo-app-icon.svg').replace('fill:#24292f', 'fill:black'))).toContain('Kachel nicht in Ash');
    expect(svgProbleme('logo-claim.svg', claim.replace('</svg>', '<text>x</text></svg>'))).toContain('Text muss als Pfade vorliegen');
    expect(svgProbleme('logo-claim-hell.svg', read('logo/logo-claim-hell.svg').replace(' fill="#fff"', ''))).toContain('weiße Füllung fehlt');
    const farbig = read('logo/logo-farbig.svg');
    expect(svgProbleme('logo-farbig.svg', farbig.replace('<svg ', '<svg width="100%" '))).toContain('feste Breite oder Höhe am Wurzelelement');
    expect(svgProbleme('logo-farbig.svg', farbig.replace(/ viewBox="[^"]*"/, ''))).toContain('viewBox fehlt oder ist nicht ganzzahlig');
    expect(svgProbleme('logo-farbig.svg', '<!DOCTYPE svg>' + farbig)).toContain('DOCTYPE, XML-Kopf oder Editor-Reste');
    expect(svgProbleme('logo-farbig.svg', farbig.replace('fill:#f2561d', 'fill:rgb(0,0,0)'))).toContain('F in der Signalfarbe #f2561d fehlt');
    expect(svgProbleme('logo-farbig.svg', farbig.replace('fill="#24292f"', ''))).toContain('Zeichen nicht in Ash (Grundfüllung fehlt)');
    // dunkle Fassungen und Favicon: Invertierung und Regel "kein Ash auf dunkler Fläche"
    const dunkel = read('logo/logo-farbig-dunkel.svg');
    expect(svgProbleme('logo-farbig-dunkel.svg', dunkel.replace('fill="#fff"', 'fill="#24292f"'))).toEqual(expect.arrayContaining(['dunkle Fassung: Zeichen nicht weiß', 'dunkle Fassung enthält Ash (Ash nie auf dunkler Fläche)']));
    expect(svgProbleme('logo-farbig-dunkel.svg', dunkel.replace('fill:#f2561d', 'fill:#24292f'))).toContain('dunkle Fassung enthält Ash (Ash nie auf dunkler Fläche)');
    expect(svgProbleme('logo-icon-farbig-dunkel.svg', read('logo/logo-icon-farbig-dunkel.svg').replace('fill="#fff"', 'fill="#24292f"'))).toContain('dunkle Fassung: Zeichen nicht weiß');
    const appDunkel = read('logo/logo-app-icon-dunkel.svg');
    expect(svgProbleme('logo-app-icon-dunkel.svg', appDunkel.replace('style="fill:#fff;"', 'style="fill:#24292f;"'))).toContain('dunkles App-Icon: Kachel nicht weiß');
    expect(svgProbleme('logo-app-icon-dunkel.svg', read('logo/logo-app-icon.svg'))).toContain('dunkles App-Icon: Kachel nicht weiß');
    const fav = read('logo/favicon.svg');
    expect(svgProbleme('favicon.svg', fav.replace('prefers-color-scheme', 'prefers-reduced-motion'))).toContain('Favicon: Umschaltung per prefers-color-scheme fehlt');
    expect(svgProbleme('favicon.svg', fav.replace('dark){.k{fill:#fff}.z{fill:#24292f}}', 'dark){.k{fill:#24292f}.z{fill:#fff}}'))).toContain('Favicon: dunkle Fassung nicht invertiert');
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
  it('führt genau die Footer-Icons (einfarbig, farbig hell, farbig dunkel) als Dateien und Exports', () => {
    for (const n of ICONS) {
      expect(pkg.files).toContain(`logo/${n}`);
      expect(pkg.exports[`./logo/${n}`]).toBe(`./logo/${n}`);
    }
    expect(pkg.files.filter((f) => f.startsWith('logo'))).toHaveLength(ICONS.length);
    expect(Object.keys(pkg.exports).filter((k) => k.startsWith('./logo'))).toHaveLength(ICONS.length);
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
  it('das Favicon ist eine eigene SVG (schaltet per prefers-color-scheme um), relativ und ohne Fremdadresse (Manager und Vorschau)', () => {
    for (const f of ['.storybook/manager-head.html', '.storybook/preview-head.html']) {
      const html = read(f);
      expect(html, f).toContain('<link rel="icon" type="image/svg+xml" href="./logo/favicon.svg"');
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
