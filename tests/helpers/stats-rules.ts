// Regeln für Kennzahlen-Gitter und Form als prüfbare Aussagen (tests/stats-form.test.ts prüft sie am echten Quelltext,
// tests/vanilla-mutation.test.ts verfälscht den Quelltext und prüft, dass jede Aussage kippt).
import { bodyOf, cssSection, rulesOf, type Rules } from './mutation';

type Stats = { statItems: (v: unknown) => { label: string; value: string; empty: boolean }[] };

const guarded = <T extends Record<string, unknown>>(m: T): T =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, typeof v === 'function' ? (...a: unknown[]) => { try { return (v as (...x: unknown[]) => unknown)(...a); } catch { return Symbol('wirft'); } } : v])) as T;

export function statsLogicRules(mod: Stats): Rules {
  const m = guarded(mod as Stats & Record<string, unknown>) as Stats;
  const one = (v: unknown) => m.statItems([{ label: 'X', value: v }])[0];
  return {
    'Kennzahlen: Zahl mit Dezimalkomma': one(41.3)?.value === '41,3' && one(12)?.value === '12' && one(0)?.value === '0',
    'Kennzahlen: Text wird getrimmt': one('  12 : 3 ')?.value === '12 : 3',
    'Kennzahlen: fehlender Wert ergibt Gedankenstrich und empty': [null, undefined, '', '  ', Number.NaN, Infinity, {}, [], true].every((v) => one(v)?.empty === true && one(v)?.value === '–'),
    'Kennzahlen: ohne Beschriftung entfällt der Eintrag': m.statItems([{ label: ' ', value: 1 }, { value: 2 }, { label: 3, value: 1 }, null, 'x', { label: 'A', value: 1 }]).length === 1,
    'Kennzahlen: Beschriftung wird normalisiert': m.statItems([{ label: '  Punkte \n pro  Spiel ', value: 1 }])[0]?.label === 'Punkte pro Spiel',
    'Kennzahlen: keine Liste ergibt []': Array.isArray(m.statItems(undefined)) && m.statItems('x').length === 0 && m.statItems({}).length === 0,
  };
}

export function statsCssRules(css: string): Rules {
  const text = cssSection(css, 'Kennzahlen-Gitter und Form');
  const rules = rulesOf(text);
  const body = (s: string) => bodyOf(rules, s);
  const media = text.slice(text.indexOf('@media (forced-colors: active)'));
  return {
    'Abschnitt vorhanden': text.length > 200,
    'Stats: Gitter mit auto-fit und Mindestbreite ohne Überlauf': /repeat\(auto-fit,\s*minmax\(min\(8rem,\s*100%\),\s*1fr\)\)/.test(body('.hoops-stats')),
    'Stats: Wert steht optisch über der Beschriftung': /order:\s*-1/.test(body('.hoops-stats .hoops-stat-value')) && /flex-direction:\s*column/.test(body('.hoops-stats > .hoops-stat')),
    'Stats: Schriftgrößen nur aus Tokens': !/font-size:\s*[\d.]+(px|rem|em)/.test(text) && /font-size:\s*var\(--hoops-fs-h3\)/.test(body('.hoops-stat--compact .hoops-stat-value, .hoops-stats--compact .hoops-stat-value')),
    'Stats: kompakt ohne Kachel': /padding:\s*0/.test(body('.hoops-stat--compact, .hoops-stats--compact > .hoops-stat')) && /border:\s*0/.test(body('.hoops-stat--compact, .hoops-stats--compact > .hoops-stat')) && /background:\s*none/.test(body('.hoops-stat--compact, .hoops-stats--compact > .hoops-stat')),
    'Stats: kompakt in einer Zeile mit Umbruch': /display:\s*flex/.test(body('.hoops-stats--compact')) && /flex-wrap:\s*wrap/.test(body('.hoops-stats--compact')),
    'Stats: lange Werte brechen um': /overflow-wrap:\s*anywhere/.test(body('.hoops-stats .hoops-stat-value')),
    'Form: Zeichen unterscheiden sich in der Form (N Quadrat, U Ring)': /border-radius:\s*2px/.test(body('.hoops-form-item--n')) && /border:\s*2px solid/.test(body('.hoops-form-item--u')) && /background:\s*var\(--hoops-chip-ok-fg\)/.test(body('.hoops-form-item--s')),
    'Form: Punkte 10 px mit 5 px Abstand': /width:\s*10px/.test(body('.hoops-form-item')) && /height:\s*10px/.test(body('.hoops-form-item')) && /gap:\s*5px/.test(body('.hoops-form-list')),
    'Form: Punkte brechen nicht um (die Tabellenspalte bleibt breit), Buchstabenmarken dürfen': /flex-wrap:\s*nowrap/.test(body('.hoops-form-list')) && /flex-wrap:\s*wrap/.test(body('.hoops-form--letters .hoops-form-list')),
    'Form: Ring in der eigenen Zeile heller': /border-color:\s*var\(--hoops-mute-on-selected\)/.test(body('.hoops-tbl tr.is-own .hoops-form-item--u')),
    'Form: Buchstaben S, N, U kommen aus dem CSS': /content:\s*"S"/.test(body('.hoops-form--letters .hoops-form-item--s::before')) && /content:\s*"N"/.test(body('.hoops-form--letters .hoops-form-item--n::before')) && /content:\s*"U"/.test(body('.hoops-form--letters .hoops-form-item--u::before')),
    'Form: Buchstabenmarken in Chip-Tönen': /background:\s*var\(--hoops-chip-ok-bg\);\s*color:\s*var\(--hoops-chip-ok-fg\)/.test(body('.hoops-form--letters .hoops-form-item--s')) && /background:\s*var\(--hoops-chip-err-bg\);\s*color:\s*var\(--hoops-chip-err-fg\)/.test(body('.hoops-form--letters .hoops-form-item--n')) && /background:\s*var\(--hoops-chip-neutral-bg\);\s*color:\s*var\(--hoops-chip-neutral-fg\)/.test(body('.hoops-form--letters .hoops-form-item--u')),
    'Form: Buchstabenmarken mindestens 24 px (WCAG 2.5.8)': /min-width:\s*24px/.test(body('.hoops-form--letters .hoops-form-item')) && /height:\s*24px/.test(body('.hoops-form--letters .hoops-form-item')),
    'Form: Schrift der Buchstaben aus Tokens': /font-size:\s*var\(--hoops-fs-caption\)/.test(body('.hoops-form--letters .hoops-form-item')),
    'Form: Bezugsrahmen für den versteckten Text': /position:\s*relative/.test(body('.hoops-form')),
    'Form: Kontrastmodus behält die Formen': /\.hoops-form-item--s, \.hoops-form-item--n \{[^}]*CanvasText/.test(media) && /\.hoops-form-item--u \{[^}]*CanvasText/.test(media),
    'kein festes Hex': !/#[0-9a-fA-F]{3,8}\b/.test(text),
  };
}

export function statsSourceRules(files: { formSvelte: string; formReact: string; statSvelte: string; statReact: string; leagueSvelte: string; leagueReact: string }): Rules {
  const { formSvelte, formReact, statSvelte, statReact, leagueSvelte, leagueReact } = files;
  return {
    'FormChips: versteckter Text aus formLabel': formSvelte.includes('formLabel(form)') && formReact.includes('formLabel(form)') && /hoops-sr-only[^<]*>\{(label|formLabel\(form\))\}/.test(formSvelte) && /hoops-sr-only">\{formLabel\(form\)\}/.test(formReact),
    'FormChips: Zeichen sind aria-hidden': /hoops-form-list" aria-hidden="true"/.test(formSvelte) && /hoops-form-list" aria-hidden="true"/.test(formReact),
    'FormChips: ohne Eintrag nichts': /\{#if entries\.length\}/.test(formSvelte) && /if \(!entries\.length\) return null/.test(formReact),
    'FormChips: Buchstaben-Variante': formSvelte.includes('hoops-form--letters') && formReact.includes('hoops-form--letters'),
    'LeagueCard nutzt FormChips': leagueSvelte.includes('<FormChips form={t.form ?? []}') && leagueReact.includes('<FormChips form={t.form ?? []}'),
    'StatGrid: Beschreibungsliste mit Beschriftung zuerst': /<dl class=/.test(statSvelte) && statSvelte.indexOf('<dt') >= 0 && statSvelte.indexOf('<dt') < statSvelte.indexOf('<dd') && /<dl className=/.test(statReact) && statReact.indexOf('<dt') >= 0 && statReact.indexOf('<dt') < statReact.indexOf('<dd'),
    'StatGrid: leerer Wert mit verstecktem Text': statSvelte.includes('statEmptyText') && statReact.includes('statEmptyText') && /aria-hidden="true">\{s\.value\}/.test(statSvelte) && /aria-hidden="true">\{s\.value\}/.test(statReact),
    'kein style in der Svelte-Datei': !/<style[\s>]/.test(formSvelte) && !/<style[\s>]/.test(statSvelte),
  };
}
