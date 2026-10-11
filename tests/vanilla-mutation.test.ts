// @vitest-environment node
// Mutationstests des Vanilla-Pakets V1: Jede Regel aus tests/helpers/*-rules.ts muss kippen, wenn man den Quelltext gezielt verfälscht
// (Kennzahlen und Form; weitere Abschnitte folgen mit den jeweiligen Bausteinen). So fällt auf, wenn eine Aussage nichts mehr prüft.
import { describe, expect, it } from 'vitest';
import { loadModule, mutate, read, type Rules } from './helpers/mutation';
import { statsCssRules, statsLogicRules, statsSourceRules } from './helpers/stats-rules';

type Mutation = { name: string; rule: string; from: string; to: string };

// ── Kennzahlen und Form ──────────────────────────────────────
const statsJs = read('js/stats.js');
const css = read('css/components.css');
const sectionStart = css.indexOf('/* ── Kennzahlen-Gitter und Form');

const STATS_LOGIC: Mutation[] = [
  { name: 'Dezimalpunkt bleibt', rule: 'Kennzahlen: Zahl mit Dezimalkomma', from: ".replace('.', ',')", to: '' },
  { name: 'Text nicht getrimmt', rule: 'Kennzahlen: Text wird getrimmt', from: 'item.value.trim()', to: 'item.value' },
  { name: 'NaN gilt als Wert', rule: 'Kennzahlen: fehlender Wert ergibt Gedankenstrich und empty', from: 'Number.isFinite(item.value)', to: "typeof item.value === 'number'" },
  { name: 'Einträge ohne Beschriftung bleiben', rule: 'Kennzahlen: ohne Beschriftung entfällt der Eintrag', from: 'if (!label) continue;', to: '' },
  { name: 'Beschriftung nicht normalisiert', rule: 'Kennzahlen: Beschriftung wird normalisiert', from: ".replace(/\\s+/g, ' ').trim()", to: '' },
  { name: 'Eingabe ohne Liste wirft', rule: 'Kennzahlen: keine Liste ergibt []', from: 'if (!Array.isArray(items)) return [];', to: '' },
];
const STATS_CSS: Mutation[] = [
  { name: 'Gitter ohne min()', rule: 'Stats: Gitter mit auto-fit und Mindestbreite ohne Überlauf', from: 'minmax(min(8rem, 100%), 1fr)', to: 'minmax(8rem, 1fr)' },
  { name: 'Wert nicht oben', rule: 'Stats: Wert steht optisch über der Beschriftung', from: 'order: -1;', to: 'order: 0;' },
  { name: 'kompakte Schrift fest', rule: 'Stats: Schriftgrößen nur aus Tokens', from: '{ font-size: var(--fs-h3); }', to: '{ font-size: 18px; }' },
  { name: 'kompakt behält den Rand', rule: 'Stats: kompakt ohne Kachel', from: 'padding: 0; border: 0; border-radius: 0; background: none;', to: 'padding: 0; border-radius: 0; background: none;' },
  { name: 'kompakt ohne Umbruch', rule: 'Stats: kompakt in einer Zeile mit Umbruch', from: '.dss-stats--compact { display: flex; flex-wrap: wrap;', to: '.dss-stats--compact { display: flex;' },
  { name: 'lange Werte brechen nicht', rule: 'Stats: lange Werte brechen um', from: '.dss-stats .dss-stat-value { order: -1; margin: 0; overflow-wrap: anywhere; }', to: '.dss-stats .dss-stat-value { order: -1; margin: 0; }' },
  { name: 'Niederlage als Kreis', rule: 'Form: Zeichen unterscheiden sich in der Form (N Quadrat, U Ring)', from: 'border-radius: 2px; }', to: 'border-radius: 50%; }' },
  { name: 'Unentschieden gefüllt', rule: 'Form: Zeichen unterscheiden sich in der Form (N Quadrat, U Ring)', from: '.dss-form-item--u { border: 2px solid var(--dss-mute); }', to: '.dss-form-item--u { background: var(--dss-mute); }' },
  { name: 'Punkte brechen um', rule: 'Form: Punkte brechen nicht um (die Tabellenspalte bleibt breit), Buchstabenmarken dürfen', from: '.dss-form-list { display: inline-flex; flex-wrap: nowrap;', to: '.dss-form-list { display: inline-flex; flex-wrap: wrap;' },
  { name: 'Marken brechen nicht um', rule: 'Form: Punkte brechen nicht um (die Tabellenspalte bleibt breit), Buchstabenmarken dürfen', from: '.dss-form--letters .dss-form-list { flex-wrap: wrap;', to: '.dss-form--letters .dss-form-list { flex-wrap: nowrap;' },
  { name: 'Punkte 12 px', rule: 'Form: Punkte 10 px mit 5 px Abstand', from: 'width: 10px; height: 10px;', to: 'width: 12px; height: 12px;' },
  { name: 'Ring in der eigenen Zeile gleich', rule: 'Form: Ring in der eigenen Zeile heller', from: 'border-color: var(--dss-mute-on-selected)', to: 'border-color: var(--dss-mute)' },
  { name: 'Buchstabe S falsch', rule: 'Form: Buchstaben S, N, U kommen aus dem CSS', from: 'content: "S"', to: 'content: "X"' },
  { name: 'Marken Sieg in Rot', rule: 'Form: Buchstabenmarken in Chip-Tönen', from: 'background: var(--dss-chip-ok-bg); color: var(--dss-chip-ok-fg); }', to: 'background: var(--dss-chip-err-bg); color: var(--dss-chip-err-fg); }' },
  { name: 'Marken 18 px', rule: 'Form: Buchstabenmarken mindestens 24 px (WCAG 2.5.8)', from: 'min-width: 24px; height: 24px;', to: 'min-width: 18px; height: 18px;' },
  { name: 'Buchstaben in festem px', rule: 'Form: Schrift der Buchstaben aus Tokens', from: 'font-size: var(--fs-caption); font-weight: 700; line-height: 1;', to: 'font-size: 11px; font-weight: 700; line-height: 1;' },
  { name: 'kein Bezugsrahmen', rule: 'Form: Bezugsrahmen für den versteckten Text', from: '.dss-form { position: relative;', to: '.dss-form {' },
  { name: 'Kontrastmodus ohne Fläche', rule: 'Form: Kontrastmodus behält die Formen', from: '.dss-form-item--s, .dss-form-item--n { background: CanvasText;', to: '.dss-form-item--s, .dss-form-item--n { background: transparent;' },
  { name: 'festes Hex', rule: 'kein festes Hex', from: '.dss-form-item--s { background: var(--dss-chip-ok-fg); }', to: '.dss-form-item--s { background: #1a7f37; }' },
];
const STATS_SRC: { name: string; rule: string; file: keyof Parameters<typeof statsSourceRules>[0]; from: string; to: string }[] = [
  { name: 'Zeichen nicht versteckt (Svelte)', rule: 'FormChips: Zeichen sind aria-hidden', file: 'formSvelte', from: 'class="dss-form-list" aria-hidden="true"', to: 'class="dss-form-list"' },
  { name: 'Zeichen nicht versteckt (React)', rule: 'FormChips: Zeichen sind aria-hidden', file: 'formReact', from: 'className="dss-form-list" aria-hidden="true"', to: 'className="dss-form-list"' },
  { name: 'Text nicht aus formLabel (Svelte)', rule: 'FormChips: versteckter Text aus formLabel', file: 'formSvelte', from: 'formLabel(form)', to: "'Form'" },
  { name: 'leere Form zeigt Hülle (React)', rule: 'FormChips: ohne Eintrag nichts', file: 'formReact', from: 'if (!entries.length) return null;', to: '' },
  { name: 'LeagueCard mit eigenen Punkten (Svelte)', rule: 'LeagueCard nutzt FormChips', file: 'leagueSvelte', from: '<FormChips form={t.form ?? []} />', to: '<span class="dss-form"></span>' },
  { name: 'LeagueCard mit eigenen Punkten (React)', rule: 'LeagueCard nutzt FormChips', file: 'leagueReact', from: '<FormChips form={t.form ?? []} />', to: '<span className="dss-form" />' },
  { name: 'Kennzahlen als div (Svelte)', rule: 'StatGrid: Beschreibungsliste mit Beschriftung zuerst', file: 'statSvelte', from: '<dl class=', to: '<div class=' },
  { name: 'Wert vor Beschriftung (React)', rule: 'StatGrid: Beschreibungsliste mit Beschriftung zuerst', file: 'statReact', from: '<dt className="dss-stat-label">{s.label}</dt>', to: '' },
  { name: 'Leerwert ohne Text (Svelte)', rule: 'StatGrid: leerer Wert mit verstecktem Text', file: 'statSvelte', from: '<span aria-hidden="true">{s.value}</span>', to: '{s.value}' },
  { name: 'style in der Svelte-Datei', rule: 'kein style in der Svelte-Datei', file: 'formSvelte', from: '<script lang="ts">', to: '<style>.x{}</style>\n<script lang="ts">' },
];

const sourceFiles = () => ({
  formSvelte: read('svelte/FormChips.svelte'), formReact: read('react/FormChips.tsx'),
  statSvelte: read('svelte/StatGrid.svelte'), statReact: read('react/StatGrid.tsx'),
  leagueSvelte: read('svelte/LeagueCard.svelte'), leagueReact: read('react/LeagueCard.tsx'),
});

describe('Mutationstests: Kennzahlen und Form', () => {
  it('Ausgangslage: alle Aussagen gelten', async () => {
    const logic = statsLogicRules((await loadModule(statsJs)) as never);
    const all: Rules = { ...logic, ...statsCssRules(css), ...statsSourceRules(sourceFiles()) };
    expect(Object.entries(all).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(STATS_LOGIC)('Logik: $name', async ({ rule, from, to }) => {
    expect(statsLogicRules((await loadModule(statsJs)) as never)[rule], `Regel fehlt: ${rule}`).toBe(true);
    const mutated = statsLogicRules((await loadModule(mutate(statsJs, from, to))) as never);
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
  it.each(STATS_CSS)('CSS: $name', ({ rule, from, to }) => {
    expect(statsCssRules(css)[rule], `Regel fehlt: ${rule}`).toBe(true);
    expect(statsCssRules(mutate(css, from, to, sectionStart))[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
  it.each(STATS_SRC)('Quelltext: $name', ({ rule, file, from, to }) => {
    const files = sourceFiles();
    expect(statsSourceRules(files)[rule], `Regel fehlt: ${rule}`).toBe(true);
    expect(statsSourceRules({ ...files, [file]: mutate(files[file], from, to) })[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});
