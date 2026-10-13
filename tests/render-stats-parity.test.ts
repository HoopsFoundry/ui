// @vitest-environment node
// Vanilla-`renderStats`, `renderFormChips`, `renderEmptyState`, `renderTable` erzeugen dasselbe Markup wie Svelte und React (normalisiert).
import { describe, expect, it } from 'vitest';
import { renderEmptyState, mountEmptyState } from '../js/render/empty-state.js';
import { renderFormChips, renderStats } from '../js/render/stats.js';
import { renderTable } from '../js/render/table.js';
import { normalize, useParity } from './helpers/render-parity';

const p = useParity();
const vanilla = (fn: (props: any, options?: any) => string, props: Record<string, unknown>, options?: Record<string, unknown>) => normalize(fn(props, options));

describe('StatGrid: renderStats gegen Svelte und React', () => {
  const cases: Record<string, Record<string, unknown>> = {
    minimal: { items: [{ label: 'Siege', value: 12 }] },
    voll: { items: [{ label: 'Siege', value: 12 }, { label: 'Punkte pro Spiel', value: 41.3 }, { label: 'Bilanz', value: ' 12 : 3 ' }, { label: 'Quote', value: 'n. a.' }] },
    kompakt: { items: [{ label: 'Siege', value: 12 }, { label: 'Niederlagen', value: 3 }], compact: true },
    leer: { items: [] },
    'ungültige Zahlen': { items: [{ label: 'A', value: Number.NaN }, { label: 'B', value: Infinity }, { label: 'C', value: null }, { label: 'D' }, { label: 'E', value: {} }] },
    'lange Texte': { items: [{ label: 'Eine sehr lange Beschriftung '.repeat(8), value: 'Ein sehr langer Wert '.repeat(8) }] },
    'Sonderzeichen': { items: [{ label: 'A & B <i>', value: '"x" > \'y\'' }] },
    className: { items: [{ label: 'X', value: 1 }], className: 'meine-klasse' },
    'ungültige Einträge': { items: [null, 'x', { label: ' ' }, { value: 1 }, { label: 'Ok', value: 0 }] },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const [s, r] = [await p.svelte('StatGrid', props), await p.react('StatGrid', props)];
    expect(vanilla(renderStats, props)).toBe(s);
    expect(s).toBe(r);
  });
  it('keine Liste: leer', () => {
    for (const items of [undefined, null, 'x', {}, 3]) expect(renderStats({ items })).toBe('');
    expect(renderStats(undefined)).toBe('');
  });
});

describe('FormChips: renderFormChips gegen Svelte und React', () => {
  const cases: Record<string, Record<string, unknown>> = {
    minimal: { form: ['S'] },
    voll: { form: ['S', 'N', 'U', 'S', 'N'] },
    'mehr als fünf': { form: ['S', 'N', 'S', 'S', 'U', 'N', 'S'] },
    letters: { form: ['S', 'N', 'U'], variant: 'letters' },
    leer: { form: [] },
    'ungültige Einträge': { form: ['x', 1, null, 'S', 's'] },
    'keine Liste': { form: 'SSS' },
    className: { form: ['N'], className: 'meine' },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const [s, r] = [await p.svelte('FormChips', props), await p.react('FormChips', props)];
    expect(vanilla(renderFormChips, props)).toBe(s);
    expect(s).toBe(r);
  });
});

describe('EmptyState: renderEmptyState gegen Svelte und React', () => {
  const cases: Record<string, Record<string, unknown>> = {
    minimal: { title: 'Nichts da' },
    voll: { title: 'Noch keine Spiele', body: 'Sobald Spiele angesetzt sind, erscheinen sie hier.', cta: 'Spielplan öffnen' },
    action: { tone: 'action', title: 'Lizenz fehlt', body: 'Bitte hinzufügen.', cta: 'Hinzufügen' },
    error: { tone: 'error', title: 'Verbindung fehlgeschlagen', cta: 'Erneut versuchen' },
    titleAs: { title: 'Ebene', titleAs: 'h2' },
    'titleAs ungültig': { title: 'Ebene', titleAs: 'h1' },
    'Sonderzeichen': { title: '<b>"Halle" & Co.</b>', body: "It's > 5" },
    'lange Texte': { title: 'Titel '.repeat(60), body: 'Text '.repeat(200), cta: 'Los '.repeat(20) },
    className: { title: 'X', className: 'ich' },
    'ungültiger Ton': { tone: 'bogus', title: 'X' },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    // Ungültige Werte (Ton, Ebene) fallen in Vanilla auf den Standard zurück; die Komponenten bekommen den Standard ausdrücklich
    const given = { ...props, tone: ['neutral', 'action', 'error'].includes(props.tone as string) ? props.tone : 'neutral', titleAs: ['h2', 'h3', 'h4', 'h5', 'h6'].includes(props.titleAs as string) ? props.titleAs : undefined };
    const { className, ...forSvelte } = given; // die Svelte-Fassung kennt keine eigene Klasse
    const s = await p.svelte('EmptyState', forSvelte);
    const r = await p.react('EmptyState', given);
    expect(vanilla(renderEmptyState, props)).toBe(await p.react('EmptyState', given));
    if (className === undefined) expect(s).toBe(r);
  });
  it('actions als Links und extra als Text', async () => {
    const html = renderEmptyState({ title: 'T', cta: 'Los', actions: [{ label: 'Hilfe', href: '/hilfe' }, { label: 'Böse', href: 'javascript:alert(1)' }], extra: 'Fragen?' });
    const reactHtml = await p.react('EmptyState', { title: 'T', cta: 'Los' }, 'Fragen?');
    expect(html).toContain('<a class="dss-btn dss-btn--ghost dss-btn--md" href="/hilfe">Hilfe</a>');
    expect(html).not.toContain('javascript');
    expect(normalize(html)).toContain('<div class="dss-empty-extra">Fragen?</div>');
    expect(reactHtml).toContain('dss-empty-extra');
  });
  it('mit icon wie Svelte (Sprite-ID mit i-)', async () => {
    const props = { title: 'X', icon: 'i-calendar' };
    expect(vanilla(renderEmptyState, props)).toBe(await p.svelte('EmptyState', props));
    expect(renderEmptyState({ title: 'X', icon: '"><img src=x onerror=alert(1)>' })).not.toContain('onerror');
  });
  it('mountEmptyState ist exportiert', () => expect(typeof mountEmptyState).toBe('function'));
});

const bodyRows = [['Lindenberg Hawks', '11', '20'], ['BG Seeberg', '11', '18']];

describe('Table: renderTable gegen Svelte und React', () => {
  const html = (rows: string[][], classes: string[] = []) => rows.map((cells) => `<tr>${cells.map((c, i) => `<td${classes[i] ? ` class="${classes[i]}"` : ''}>${c}</td>`).join('')}</tr>`).join('');
  const vRows = (rows: string[][], classes: string[] = []) => rows.map((cells) => cells.map((c, i) => (classes[i] ? { text: c, className: classes[i] } : c)));
  const both = async (props: Record<string, unknown>, rows: string[][], classes: string[] = []) => {
    const svelte = await p.svelte('Table', { ...props, rows: p.snippet(html(rows, classes)) });
    const { createElement } = await import('react');
    const react = await p.react('Table', props, rows.map((cells, k) => createElement('tr', { key: k }, cells.map((c, i) => createElement('td', { key: i, className: classes[i] || undefined }, c)))));
    return { svelte, react, vanilla: vanilla(renderTable, { ...props, rows: vRows(rows, classes) }) };
  };
  const columns = [{ key: 'name', label: 'Mannschaft' }, { key: 'sp', label: 'SP', align: 'right', sortable: true, sort: 'desc' }, { key: 'pkt', label: 'PKT', align: 'right', width: '80px' }];
  const cases: Record<string, Record<string, unknown>> = {
    minimal: {},
    'mit Titel': { title: 'Tabelle' },
    voll: { title: 'Tabelle', meta: 'Stand 12.10.', live: true, columns, caption: 'Beschriftung', striped: true, density: 'compact', dark: true, className: 'x' },
    kompakt: { title: 'T', density: 'dense', columns },
    'titleAs': { title: 'T', titleAs: 'h2' },
    'nur meta': { meta: 'Saison 2026/27' },
    'Sonderzeichen': { title: 'A & "B" <c>', meta: "it's" },
    'lange Texte': { title: 'Titel '.repeat(80), caption: 'Beschriftung '.repeat(40) },
    'einklappbar offen': { title: 'Tabelle', collapsible: true, open: true, id: 'tab-1', meta: 'Stand' },
    'einklappbar zu': { title: 'Tabelle', collapsible: true, id: 'tab-2', live: true },
    'einklappbar ohne id': { title: 'Tabelle', collapsible: true, open: true },
    'einklappbar ohne Titel': { collapsible: true, meta: 'Stand' },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const r = await both(props, bodyRows, ['', 'num']);
    expect(r.vanilla).toBe(r.svelte);
    expect(r.svelte).toBe(r.react);
  });
});
