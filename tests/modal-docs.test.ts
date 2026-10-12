// @vitest-environment node
// Doku-Seite „Modal“: das Vanilla-Markup stimmt mit der Ausgabe der Svelte-Komponente überein (Kopf, Inhalt, Fuß), jede Story und jedes Beispiel
// existiert, Beispiel-Stories sind versteckt, Handy-Vorschauen, Dos und Don'ts, Einbindung in Einführung und Sortierung.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as code from '../stories/Modal.code';
import { cleanup, normalize, read, renderSvelteSource, rootDir, startServer, type Render } from './helpers/docs-code';
import type { ViteDevServer } from 'vite';

const tmpDir = `${rootDir}tests/.code-tmp-modal/`;
let vite: ViteDevServer;
let render: Render;
let JSDOMClass: typeof import('jsdom').JSDOM;
beforeAll(async () => {
  ({ vite, render } = await startServer());
  JSDOMClass = (await import('jsdom')).JSDOM;
}, 60000);
afterAll(async () => {
  await vite?.close();
  cleanup(tmpDir);
});

const mdx = read('stories/Modal.mdx');
const stories = read('stories/Modal.stories.ts');
const examples = read('stories/components/ModalExamples.svelte');

/** Kopf, Inhalt und Fuß der Fläche, ohne das, was nur die Fassungen unterscheidet (ids, Rollen, tabindex, data-Attribute, type, aria-hidden an Symbolen). */
function parts(html: string) {
  const doc = new JSDOMClass(`<body>${html.replace(/<!--[\s\S]*?-->/g, '')}</body>`).window.document;
  const surface = doc.querySelector('.dss-modal')!;
  const clean = (el: Element | null) => normalize((el?.outerHTML ?? '')
    .replace(/ (id|role|aria-modal|aria-labelledby|tabindex|type|focusable)="[^"]*"/g, '').replace(/ data-dss[\w-]*(="[^"]*")?/g, '')
    .replace(/ aria-hidden="true"/g, '').replace(/ disabled(="")?/g, ''));
  return { head: clean(surface.querySelector('.dss-m-head')), body: clean(surface.querySelector('.dss-m-body')), footer: clean(surface.querySelector('.dss-m-footer')), classes: surface.className.split(/\s+/).filter((c) => c !== 'dss-modal--md').sort() };
}
const sv = (name: string, body: string) =>
  renderSvelteSource(vite, render, tmpDir, name, `<script>\nimport Modal from '@bbv/dss-design-system/svelte/Modal';\nimport Button from '@bbv/dss-design-system/svelte/Button';\n</script>\n${body}`);

describe('Vanilla-Markup gegen die Svelte-Komponente', () => {
  it('natives Dialog: Kopf, Inhalt und Fuß wie Modal mit Untertitel (md)', async () => {
    const html = await sv('dialog', `<Modal open title="Spielbericht freigeben?" subtitle="BBL · 17. Spieltag · Heim 87 : 74">Nach Freigabe ist eine Korrektur nur noch über den Verband möglich.
  {#snippet footer()}<Button variant="secondary">Abbrechen</Button><Button variant="primary">Freigeben</Button>{/snippet}</Modal>`);
    const expected = parts(html);
    const actual = parts(code.dialogMarkup);
    expect(actual.head).toBe(expected.head);
    expect(actual.body).toBe(expected.body);
    expect(actual.footer).toBe(expected.footer);
    expect(actual.classes).toEqual(expected.classes);
  });
  it('Markup ohne dialog: Kopf mit Symbol (danger), kleine Breite, Fuß mit Danger-Button', async () => {
    const html = await sv('div', `<Modal open title="Spielbericht verwerfen?" subtitle="Nicht wiederherstellbar" severity="danger" size="sm">Alle erfassten Aktionen werden gelöscht. Das lässt sich nicht rückgängig machen.
  {#snippet footer()}<Button variant="secondary">Behalten</Button><Button variant="danger">Verwerfen</Button>{/snippet}</Modal>`);
    const expected = parts(html);
    const actual = parts(code.divMarkup);
    expect(actual.body).toBe(expected.body);
    expect(actual.footer).toBe(expected.footer);
    expect(actual.classes).toEqual(expected.classes);
    // das Symbol der Svelte-Fassung hat stroke-linejoin und andere Pfade: Klassen und Aufbau stimmen
    expect(actual.head).toContain('dss-m-head-icon dss-m-head-icon--danger');
    expect(expected.head).toContain('dss-m-head-icon dss-m-head-icon--danger');
    expect(actual.head.replace(/<svg.*?<\/svg>/g, '<svg/>')).toBe(expected.head.replace(/<svg.*?<\/svg>/g, '<svg/>'));
  });
});

describe('Code-Beispiel', () => {
  it('enthält beide Markup-Wege, beide Aufrufarten, Optionen und Ereignisse', () => {
    expect(code.vanilla).toContain(code.dialogMarkup);
    expect(code.vanilla).toContain(code.divMarkup);
    expect(code.vanilla).toContain("import { initAll } from '@bbv/dss-design-system/vanilla-core.js'");
    expect(code.vanilla).toContain("import { initModal, openModal, closeModal } from '@bbv/dss-design-system/modal.js'");
    for (const part of ['dismissOnBackdrop', 'closable', 'initialFocus', 'returnFocus', 'dss:modalopen', 'dss:modalclose', 'data-dss-modal-open', 'data-dss-modal-close', 'data-dss-modal-focus', 'destroy']) expect(code.vanilla, part).toContain(part);
  });
  it('die Importpfade gibt es als Exporte; jede Klasse im Markup gibt es im CSS', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.exports['./modal.js']).toBeTruthy();
    const css = read('css/components.css');
    for (const cls of new Set([...code.dialogMarkup.matchAll(/class="([^"]+)"/g), ...code.divMarkup.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)))) expect(css, cls).toContain(`.${cls}`);
  });
  it('jede id kommt einmal vor, aria-labelledby zeigt auf den Titel', () => {
    for (const markup of [code.dialogMarkup, code.divMarkup]) {
      const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size).toBe(ids.length);
      for (const m of markup.matchAll(/aria-labelledby="([^"]+)"/g)) expect(ids).toContain(m[1]);
    }
    expect(`${code.dialogMarkup}${code.divMarkup}`.match(/<h2 class="dss-m-title"/g)).toHaveLength(2);
  });
  it('das zweite Beispiel startet geschlossen (hidden), der Fokus startet auf der sicheren Wahl', () => {
    expect(code.divMarkup).toMatch(/<div id="verwerfen" data-dss="modal" hidden>/);
    expect(code.divMarkup).toMatch(/data-dss-modal-focus>Behalten</);
  });
});

describe('Doku-Seite', () => {
  it('vor dem ersten Beispiel steht eine ##-Überschrift', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
  });
  it('jede im MDX genutzte Story gibt es, jedes Beispiel gibt es in der Beispielkomponente', () => {
    for (const m of mdx.matchAll(/ModalStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const m of stories.matchAll(/example\('([\w-]+)'/g)) expect(examples, m[1]).toContain(`example === '${m[1]}'`);
  });
  it('Beispiel-Stories sind versteckt (literales Tag)', () => {
    for (const m of stories.matchAll(/export const (\w+)\s*= \{ \.\.\.example/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\s*= .*tags: \\['!dev'\\]`));
    for (const name of ['VanillaDialog', 'VanillaDiv', 'Handy', 'HandyDunkel', 'DoFokus', 'DontFokus']) expect(stories).toMatch(new RegExp(`export const ${name}\\s*= .*tags: \\['!dev'\\]`));
  });
  it('Handy-Vorschauen: zwei Iframes mit verschiedenen Beispielen (hell Warnung, dunkel Verwerfen)', () => {
    expect(mdx.match(/<iframe /g)).toHaveLength(2);
    expect(mdx).toContain('id=components-modal--handy"');
    expect(mdx).toContain('theme:Dark&id=components-modal--handy-dunkel');
  });
  it('fünf Dos und Don\'ts, das neue zeigt die Fokus-Reihenfolge; die Don\'t-Bühne ist inert', () => {
    expect([...mdx.matchAll(/doText:/g)]).toHaveLength(5);
    expect(mdx).toContain('ModalStories.DontFokus');
    expect(read('stories/docs/blocks/DosDonts.tsx')).toContain('{...INERT}');
  });
  it('die Tabelle „Verhalten je Fassung“ hat die Vanilla-Spalte; die Lücken von Svelte und React sind benannt', () => {
    for (const part of ['Vanilla (initModal)', 'Fokus beim Schließen', 'Ja, an den Auslöser', 'Scrollen der Seite', 'bekannte Lücken', 'Gesperrt, beim Schließen zurückgebaut']) expect(mdx, part).toContain(part);
  });
  it('die Überschriftenebene im Markup ist beschrieben (Rangfolge, h2 bis h6, Inhalt eine Ebene tiefer)', () => {
    for (const part of ['Überschriftenebene im Markup', 'HeadingLevel', 'Die Rangfolge', 'h2` bis `h6', 'Titel `h2`, darin `h3`']) expect(mdx, part).toContain(part);
  });
  it('die Beispielseite im Code verwendet kein innerHTML', () => {
    const script = examples.slice(0, examples.indexOf('<!-- Statisches Modal'));
    expect(script).not.toContain('innerHTML');
    expect(script).toContain('createContextualFragment');
  });
  it('Einführung, README und CHANGELOG nennen initModal', () => {
    expect(read('stories/Introduction.mdx')).toContain('components-modal--docs');
    expect(read('README.md')).toContain('initModal');
    expect(read('CHANGELOG.md')).toContain('initModal');
  });
});
