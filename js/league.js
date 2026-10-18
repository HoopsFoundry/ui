/**
 * HoopsFoundry UI League · Hilfsfunktionen für die Ligencard (LeagueCard)
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM und ohne Intl (feste Formatierung, SSR-stabil). Svelte und React nutzen dieselbe Logik.
 * Typen: js/league.d.ts.
 */
import { formatPlain } from './i18n/format.js';
import { t } from './i18n/index.js';

const isNum = (value) => typeof value === 'number' && Number.isFinite(value);
/** Anzahl (Teams, Spiele): ganze Zahl ab 0; negative, gebrochene und nicht-numerische Werte gelten als ungültig. */
const isCount = (value) => Number.isInteger(value) && value >= 0;
/** Ganze Zahl ab 1, sonst `fallback`. */
const positive = (value, fallback) => (Number.isInteger(value) && value >= 1 ? value : fallback);
/** Ganze Zahl ab 0, sonst `fallback`. */
const nonNegative = (value, fallback) => (Number.isInteger(value) && value >= 0 ? value : fallback);

/**
 * Ausschnitt der Tabelle für die Karte. Sortiert nach `rank` (gleiche Plätze bleiben in der Eingabereihenfolge).
 * Mit eigener Mannschaft (erstes Team mit `own: true` in der sortierten Liste): `before` Teams davor, die eigene, `after` dahinter;
 * an den Rändern verschoben, sodass immer `before + 1 + after` Zeilen erscheinen, wenn genug Teams da sind.
 * Ohne eigene Mannschaft die ersten `limit`. Gibt es weniger Teams als Zeilen, erscheinen alle. Eine leere oder ungültige Liste ergibt `[]`.
 * Ungültige Optionen (keine ganze Zahl, `limit` unter 1, `before`/`after` unter 0) fallen auf 3, 2 und 1 zurück.
 */
export function leagueWindow(teams, options = {}) {
  if (!Array.isArray(teams)) return [];
  const limit = positive(options?.limit, 3);
  const before = nonNegative(options?.before, 2);
  const after = nonNegative(options?.after, 1);
  const sorted = teams
    .map((team, index) => ({ team, index }))
    .filter(({ team }) => team && typeof team === 'object')
    .sort((a, b) => {
      const ra = isNum(a.team.rank) ? a.team.rank : Infinity;
      const rb = isNum(b.team.rank) ? b.team.rank : Infinity;
      return ra === rb ? a.index - b.index : ra - rb;
    })
    .map(({ team }) => team);
  const ownIndex = sorted.findIndex((team) => team.own === true);
  if (ownIndex < 0) return sorted.slice(0, limit);
  const size = before + 1 + after;
  if (sorted.length <= size) return sorted;
  const start = Math.min(Math.max(ownIndex - before, 0), sorted.length - size);
  return sorted.slice(start, start + size);
}

/**
 * "12 Teams · 15 von 132 Spielen gespielt" (deutsch). Fehlende oder ungültige Teile entfallen; Einzahl und Mehrzahl wählt die Sprache; keine
 * Tausenderpunkte; leer ohne gültige Angabe. `options`: `locale`, `texts`.
 */
export function leagueSummary({ teamCount, played, total } = {}, options) {
  const parts = [];
  if (isCount(teamCount)) parts.push(t('league.summary.teams', { count: teamCount }, options));
  // `count` ist die Gesamtzahl der Spiele: sie bestimmt die Mehrzahlform
  if (isCount(played) && isCount(total)) parts.push(t('league.summary.played-of', { played, count: total }, options));
  else if (isCount(played)) parts.push(t('league.summary.played', { count: played }, options));
  else if (isCount(total)) parts.push(t('league.summary.total', { count: total }, options));
  return parts.join(' · ');
}

const FORM_WORD = { S: 'common.outcome.win', N: 'common.outcome.loss', U: 'common.outcome.draw' };

const OUTCOME_LETTER = { S: 'common.outcome-letter.win', N: 'common.outcome-letter.loss', U: 'common.outcome-letter.draw' };

/**
 * Kennbuchstabe eines Ergebnisses für Chips und Formleiste: aus den Daten `S`, `N`, `U` (Sieg, Niederlage, Unentschieden) wird der Buchstabe der
 * Sprache (deutsch `S`, `N`, `U`, englisch `W`, `L`, `D`); unbekannte Werte ergeben eine leere Zeichenkette. Die Daten selbst bleiben `S`, `N`, `U`.
 */
export function outcomeLetter(entry, options) {
  return typeof entry === 'string' && Object.hasOwn(OUTCOME_LETTER, entry) ? t(OUTCOME_LETTER[entry], undefined, options) : '';
}

/** Die gültigen Einträge der Form (S, N, U), höchstens die letzten fünf, neueste zuletzt. Alles andere wird ignoriert. */
export function formEntries(form) {
  if (!Array.isArray(form)) return [];
  return form.filter((entry) => entry === 'S' || entry === 'N' || entry === 'U').slice(-5);
}

/** Screenreader-Text der Form: "Form: Sieg, Sieg, Niederlage"; leer ohne gültigen Eintrag. */
export function formLabel(form, options) {
  const entries = formEntries(form);
  return entries.length ? t('league.form', { entries: entries.map((entry) => t(FORM_WORD[entry], undefined, options)).join(', ') }, options) : '';
}

/**
 * Beschriftung für die `caption`: "Plätze 5 bis 8 von 12" bzw. "Platz 1 von 12" bei einer Zeile; ohne gültige Gesamtzahl
 * (`teamCount`, ganze Zahl ab 1) ohne "von …"; leer ohne Zeilen oder ohne gültige Plätze. Maßgeblich sind die Plätze (`rank`) der ersten und letzten Zeile.
 */
export function windowLabel(window, teamCount, options) {
  if (!Array.isArray(window) || window.length === 0) return '';
  const first = window[0]?.rank;
  const last = window[window.length - 1]?.rank;
  if (!(Number.isInteger(first) && first >= 1 && Number.isInteger(last) && last >= first)) return '';
  const total = Number.isInteger(teamCount) && teamCount >= last ? teamCount : undefined;
  if (first === last) return total === undefined ? t('league.window.single', { rank: first }, options) : t('league.window.single-of', { rank: first, total }, options);
  return total === undefined ? t('league.window.range', { first, last }, options) : t('league.window.range-of', { first, last, total }, options);
}

/** Korbdifferenz mit Vorzeichen als Text: "+12", "−5" (Minuszeichen U+2212), "0"; leer, wenn keine endliche Zahl. Dezimaltrennzeichen der Sprache. */
export function diffText(value, options) {
  if (!isNum(value)) return '';
  const text = formatPlain(Math.abs(value), options);
  if (value > 0) return `+${text}`;
  if (value < 0) return `−${text}`;
  return '0';
}

/** Vorzeichen der Korbdifferenz: `plus`, `minus` oder `undefined` (null oder ungültig). */
export function diffSign(value) {
  if (!isNum(value) || value === 0) return undefined;
  return value > 0 ? 'plus' : 'minus';
}

/** Zahl für eine Tabellenzelle: endliche Zahl mit dem Dezimaltrennzeichen der Sprache, sonst leer. */
export function cellNumber(value, options) {
  return isNum(value) ? formatPlain(value, options) : '';
}

/** Platz für die Spalte `#`: ganze Zahl ab 1, sonst leer. */
export function rankText(rank) {
  return Number.isInteger(rank) && rank >= 1 ? String(rank) : '';
}

// Schlüssel der Zonentexte (ausgeschrieben, damit die Verwendungsprüfung sie erkennt)
const ZONES = {
  up: { row: 'league.zone.up.row', legend: 'league.zone.up.legend' },
  playoff: { row: 'league.zone.playoff.row', legend: 'league.zone.playoff.legend' },
  down: { row: 'league.zone.down.row', legend: 'league.zone.down.legend' },
};
const ZONE_ORDER = ['up', 'playoff', 'down'];
const zoneOf = (zone, options) => ({ zone, row: t(ZONES[zone].row, undefined, options), legend: t(ZONES[zone].legend, undefined, options) });

/** Texte einer Zone: `row` (versteckter Text in der Zeile) und `legend` (Legende); `undefined` bei unbekannter Zone. */
export function zoneInfo(zone, options) {
  return typeof zone === 'string' && Object.hasOwn(ZONES, zone) ? zoneOf(zone, options) : undefined;
}

/** Legende für die angezeigten Zeilen: die vorkommenden Zonen in fester Reihenfolge (Aufstieg, Relegation, Abstieg); leer ohne Zone. */
export function zoneLegend(rows, options) {
  if (!Array.isArray(rows)) return [];
  const used = new Set(rows.map((row) => row?.zone));
  return ZONE_ORDER.filter((zone) => used.has(zone)).map((zone) => zoneOf(zone, options));
}

/**
 * Live-Hinweis im Kopf: `undefined`, wenn nichts läuft (`false`, `0`, ungültig). `true` ergibt `{ text: '' }` (nur das Wort "Live"),
 * eine Zahl ab 1 ergibt `{ count, text }` mit "1 Spiel läuft" bzw. "3 Spiele laufen".
 */
export function liveInfo(live, options) {
  if (live === true) return { text: '' };
  if (Number.isInteger(live) && live >= 1) return { count: live, text: t('league.live', { count: live }, options) };
  return undefined;
}

/** Zahl der Teams für den Untertitel: `teamCount`, wenn gültig (ganze Zahl ab 0), sonst die Länge der Liste; `undefined` bei leerer Liste ohne gültiges `teamCount`. */
export function teamTotal(teamCount, teams) {
  if (isCount(teamCount)) return teamCount;
  return Array.isArray(teams) && teams.length > 0 ? teams.length : undefined;
}
