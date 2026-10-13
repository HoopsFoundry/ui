// @vitest-environment node
// Die Vanilla-Beispiele „Markup aus Daten erzeugen“ (stories/Render.code.ts) laufen in jsdom: Der Behälter enthält danach dasselbe Markup wie die
// Svelte- und die React-Komponente zu denselben Daten, und die Zeichenkette von renderX ist dieselbe wie das eingesetzte Markup.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement } from 'react';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCS } from '../stories/Render.code';
import { renderEscape, renderNode, renderPage } from '../stories/Foundation/Vanilla.code';
import { bundleDir } from './helpers/bundle-dir';
import { normalize, useParity } from './helpers/render-parity';

const p = useParity();
const indexUrl = pathToFileURL(resolve(process.cwd(), 'js/render/index.js')).href;

// Die Beispiele laufen gegen ein jsdom-Fenster, das als globales window und document gesetzt ist (die Datei läuft in Node, weil Vite unter jsdom nicht startet)
let dom: JSDOM;
beforeEach(() => {
  dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost/' });
  const w = dom.window as unknown as Record<string, unknown>;
  for (const name of ['window', 'document', 'Element', 'HTMLElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'DocumentFragment', 'history', 'location']) {
    vi.stubGlobal(name, name === 'window' ? dom.window : w[name]);
  }
});
afterEach(() => {
  dom.window.close();
  vi.unstubAllGlobals();
});

let runs = 0;
async function run(code: string, names: string[]) {
  const script = code.match(/<script type="module">([\s\S]*)<\/script>/)![1];
  const markup = code.replace(/<script type="module">[\s\S]*<\/script>/, '');
  document.body.replaceChildren(document.createRange().createContextualFragment(markup));
  // Die Seitenpfade (/dss/…) zeigen im Test auf die Quellmodule; Leaflet kommt aus dem gespielten Modul (der Lader wird erst nach dem Klick gerufen)
  const mapUrl = pathToFileURL(resolve(process.cwd(), 'js/map-bundle.js')).href;
  const source = `${script.replace('@bbv/dss-design-system/render.js', indexUrl).replace('/dss/dss-render.min.js', indexUrl).replace('/dss/dss-map.min.js', mapUrl)}\nexport { ${names.join(', ')} };\n// Lauf ${++runs}`; // jeder Lauf ein eigenes Modul (gleicher Text wäre zwischengespeichert)
  return (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)) as Record<string, unknown>;
}

type Row = string | number | { text: string | number; className?: string; href?: string; header?: boolean } | { cells: Row[]; className?: string };
const cellHtml = (cell: Row): string => {
  const c = typeof cell === 'object' && cell ? (cell as { text: string | number; className?: string; href?: string }) : { text: cell as string | number };
  const inner = c.href ? `<a class="dss-link" href="${c.href}">${c.text}</a>` : String(c.text);
  return `<td${c.className ? ` class="${c.className}"` : ''}>${inner}</td>`;
};
const rowOf = (row: Row) => (Array.isArray(row) ? { cells: row } : (row as { cells: Row[]; className?: string }));

/** Die Ausgabe der beiden Komponenten (Svelte, React) zu den Eigenschaften `props`. */
async function components(name: string, props: Record<string, unknown>) {
  if (name !== 'Table') return { svelte: await p.svelte(name, props), react: await p.react(name, props) };
  const rows = (props.rows as Row[]).map(rowOf);
  const { rows: _rows, ...rest } = props;
  const svelte = await p.svelte('Table', { ...rest, rows: p.snippet(rows.map((r) => `<tr${r.className ? ` class="${r.className}"` : ''}>${r.cells.map(cellHtml).join('')}</tr>`).join('')) });
  const react = await p.react('Table', rest, rows.map((r, k) => createElement('tr', { key: k, className: r.className }, r.cells.map((c, i) => {
    const x = typeof c === 'object' ? (c as { text: string | number; className?: string; href?: string }) : { text: c as string | number };
    return createElement('td', { key: i, className: x.className }, x.href ? createElement('a', { className: 'dss-link', href: x.href }, x.text) : x.text);
  }))));
  return { svelte, react };
}

describe.each(Object.entries(DOCS))('Beispiel %s', (_name, doc) => {
  it('das Beispiel läuft und erzeugt dasselbe Markup wie die Komponenten', async () => {
    const names = [...doc.mounts.map((m) => m.variable), ...doc.strings.map((s) => s.variable)];
    const out = await run(doc.code, names);
    for (const { variable, id } of doc.mounts) {
      const props = out[variable] as Record<string, unknown>;
      const expected = await components(doc.component, props);
      const shown = document.getElementById(id)!.innerHTML;
      // einklappbar: mountX legt für das Accordion-Verhalten eine Gruppe an
      const grouped = props.collapsible === true;
      // die Hallenkarte sperrt „Karte laden“, solange initMap fehlt (die Komponente ist bedienbar), mit initMap ist sie bedienbar: sonst gleiches Markup
      if (doc.component === 'VenueCard') {
        const load = document.querySelector<HTMLButtonElement>('.dss-map-load')!;
        const live = 'live' in doc && doc.live === true;
        expect(load.disabled).toBe(!live);
        expect(load.hasAttribute('aria-disabled')).toBe(!live);
      }
      const actual = normalize((grouped ? shown.replace(/^<div class="dss-acc">([\s\S]*)<\/div>$/, '$1') : shown).replace(' disabled=""', '').replace(' aria-disabled="true"', ''));
      expect(actual.length, `${id} ist nicht leer`).toBeGreaterThan(50);
      expect(actual).toBe(expected.react);
      expect(actual).toBe(expected.svelte);
      if (grouped) expect(shown.startsWith('<div class="dss-acc">')).toBe(true);
      for (const { variable: htmlVariable, of } of doc.strings) {
        if (of !== variable) continue;
        expect(normalize((out[htmlVariable] as string).replace(' disabled aria-disabled="true"', ''))).toBe(expected.react);
      }
    }
  });
  it('das Beispiel nutzt die Pfade des Pakets und kein innerHTML', () => {
    expect(doc.code).toMatch(/from '(@bbv\/dss-design-system\/render\.js|\/dss\/dss-render\.min\.js)'/);
    expect(doc.code).not.toMatch(/innerHTML\s*=/);
    expect(doc.code).toContain('document.querySelector(');
  });
});

describe('Beispiele: Aktualisieren und Aufräumen', () => {
  it('stand(played) aktualisiert die Karte; destroy räumt den Behälter auf', async () => {
    const code = DOCS.liga.code.replace('  // In Node (Crawler', '  stand(67);\n  window.__karte = karte;\n\n  // In Node (Crawler');
    await run(code, ['liga']);
    const el = document.getElementById('liga')!;
    expect(el.textContent).toContain('67 von 132 Spielen gespielt');
    expect(el.querySelector('.dss-league-link')?.getAttribute('href')).toBe('/teams/nordhain');
    (window as unknown as { __karte: { destroy(): void } }).__karte.destroy();
    expect(el.childNodes).toHaveLength(0);
  });
  it('die einklappbare Karte öffnet sich per Klick (Accordion-Verhalten aus mountLeagueCard)', async () => {
    await run(DOCS.ligaEinklappbar.code, ['ligaZu']);
    const trigger = document.getElementById('kreisliga-sued-trigger')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    trigger.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('kreisliga-sued-panel')!.hasAttribute('hidden')).toBe(false);
  });
});

describe('Beispiele der Seite Foundation/Vanilla (Markup erzeugen)', () => {
  const load = async (source: string) => import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(`${source}\n// Lauf ${++runs}`).toString('base64')}`) as Promise<Record<string, unknown>>;

  it('Seite aus Daten: mountX füllt die Container, initAll folgt', async () => {
    const vanillaUrl = pathToFileURL(resolve(process.cwd(), 'js/vanilla.js')).href;
    const code = renderPage.replace('/dss/dss.min.js', vanillaUrl).replace('/dss/dss-render.min.js', indexUrl);
    const script = code.match(/<script type="module">([\s\S]*)<\/script>/)![1];
    document.body.replaceChildren(document.createRange().createContextualFragment(code.replace(/<script type="module">[\s\S]*<\/script>/, '')));
    await load(script);
    expect(document.querySelector('#tabelle .dss-league-title')?.textContent).toBe('Oberliga Nordhain Männer');
    expect(document.querySelectorAll('#spielplan .dss-sch-row')).toHaveLength(2);
    expect(document.querySelector('#halle .dss-venue-title')?.textContent).toBe('Sporthalle Nordhain');
    expect(document.querySelector('#halle .dss-map-load')?.textContent).toBe('Karte laden');
  });
  it('Node: die Seite entsteht ohne DOM aus dem gebauten Render-Bündel, der Titel ist maskiert', async () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('document', undefined);
    const code = renderNode.replace('@bbv/dss-design-system/vanilla/dss-render.js', pathToFileURL(`${bundleDir}dss-render.js`).href);
    const out = await load(`${code}\nexport { seite };`);
    const seite = out.seite as string;
    expect(seite).toContain('<title>TSV Nordhain &lt;1920&gt;</title>');
    expect(seite).toContain('<h3 class="dss-league-title">Oberliga</h3>');
    expect(seite).toContain('dss-team--standard');
    expect(seite).not.toContain('<1920>');
  });
  it('esc, attr und safeHref liefern, was die Kommentare sagen; die Render-Funktion enthält nur Text', async () => {
    const lines = renderEscape.split('\n').filter((line) => /^(esc|attr|safeHref)\(.*\);\s+\/\/ → /.test(line));
    expect(lines).toHaveLength(5);
    const rows = lines.map((line) => {
      const [, expr, expected] = line.match(/^(.*?);\s+\/\/ → ('(?:[^'\\]|\\.)*'|undefined)/)!;
      return `[${expr}, ${expected}]`;
    });
    const imports = renderEscape.split('\n').filter((line) => line.startsWith('import ')).join('\n')
      .replace('@bbv/dss-design-system/vanilla/dss-render.js', pathToFileURL(`${bundleDir}dss-render.js`).href)
      .replace("'@bbv/dss-design-system/vanilla'", `'${pathToFileURL(`${bundleDir}dss.js`).href}'`);
    const tail = renderEscape.slice(renderEscape.indexOf('// Eine Render-Funktion maskiert alles selbst'));
    const out = await load(`${imports}\nexport const rows = [${rows.join(', ')}];\nexport const html = ${tail.split('\n').filter((l) => !l.startsWith('//')).join('\n').replace(/;\s*$/, '')};`);
    for (const [actual, expected] of out.rows as [unknown, unknown][]) expect(actual).toBe(expected);
    expect(out.html as string).not.toContain('<script');
    expect(out.html as string).not.toContain('javascript');
    expect(out.html as string).toContain('&lt;script&gt;');
  });
});
