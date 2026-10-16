/**
 * HoopsFoundry UI League · Hilfsfunktionen für die Ligencard (LeagueCard)
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM und ohne Intl (feste Formatierung, SSR-stabil). Svelte und React nutzen dieselbe Logik.
 * Typen: js/league.d.ts.
 */

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

/** "12 Teams · 15 von 132 Spielen gespielt". Fehlende oder ungültige Teile entfallen; "1 Team", "1 Spiel"; keine Tausenderpunkte; leer ohne gültige Angabe. */
export function leagueSummary({ teamCount, played, total } = {}) {
  const parts = [];
  if (isCount(teamCount)) parts.push(`${teamCount} ${teamCount === 1 ? 'Team' : 'Teams'}`);
  if (isCount(played) && isCount(total)) parts.push(`${played} von ${total} ${total === 1 ? 'Spiel' : 'Spielen'} gespielt`);
  else if (isCount(played)) parts.push(`${played} ${played === 1 ? 'Spiel' : 'Spiele'} gespielt`);
  else if (isCount(total)) parts.push(`${total} ${total === 1 ? 'Spiel' : 'Spiele'} insgesamt`);
  return parts.join(' · ');
}

const FORM_WORD = { S: 'Sieg', N: 'Niederlage', U: 'Unentschieden' };

/** Die gültigen Einträge der Form (S, N, U), höchstens die letzten fünf, neueste zuletzt. Alles andere wird ignoriert. */
export function formEntries(form) {
  if (!Array.isArray(form)) return [];
  return form.filter((entry) => entry === 'S' || entry === 'N' || entry === 'U').slice(-5);
}

/** Screenreader-Text der Form: "Form: Sieg, Sieg, Niederlage"; leer ohne gültigen Eintrag. */
export function formLabel(form) {
  const entries = formEntries(form);
  return entries.length ? `Form: ${entries.map((entry) => FORM_WORD[entry]).join(', ')}` : '';
}

/**
 * Beschriftung für die `caption`: "Plätze 5 bis 8 von 12" bzw. "Platz 1 von 12" bei einer Zeile; ohne gültige Gesamtzahl
 * (`teamCount`, ganze Zahl ab 1) ohne "von …"; leer ohne Zeilen oder ohne gültige Plätze. Maßgeblich sind die Plätze (`rank`) der ersten und letzten Zeile.
 */
export function windowLabel(window, teamCount) {
  if (!Array.isArray(window) || window.length === 0) return '';
  const first = window[0]?.rank;
  const last = window[window.length - 1]?.rank;
  if (!(Number.isInteger(first) && first >= 1 && Number.isInteger(last) && last >= first)) return '';
  const of = Number.isInteger(teamCount) && teamCount >= last ? ` von ${teamCount}` : '';
  return first === last ? `Platz ${first}${of}` : `Plätze ${first} bis ${last}${of}`;
}

/** Korbdifferenz mit Vorzeichen als Text: "+12", "−5" (Minuszeichen U+2212), "0"; leer, wenn keine endliche Zahl. Dezimalkomma. */
export function diffText(value) {
  if (!isNum(value)) return '';
  const text = String(Math.abs(value)).replace('.', ',');
  if (value > 0) return `+${text}`;
  if (value < 0) return `−${text}`;
  return '0';
}

/** Vorzeichen der Korbdifferenz: `plus`, `minus` oder `undefined` (null oder ungültig). */
export function diffSign(value) {
  if (!isNum(value) || value === 0) return undefined;
  return value > 0 ? 'plus' : 'minus';
}

/** Zahl für eine Tabellenzelle: endliche Zahl mit Dezimalkomma, sonst leer. */
export function cellNumber(value) {
  return isNum(value) ? String(value).replace('.', ',') : '';
}

/** Platz für die Spalte `#`: ganze Zahl ab 1, sonst leer. */
export function rankText(rank) {
  return Number.isInteger(rank) && rank >= 1 ? String(rank) : '';
}

const ZONES = {
  up: { zone: 'up', row: 'Aufstiegsplatz', legend: 'Aufstieg' },
  playoff: { zone: 'playoff', row: 'Relegation', legend: 'Relegation' },
  down: { zone: 'down', row: 'Abstiegsplatz', legend: 'Abstieg' },
};
const ZONE_ORDER = ['up', 'playoff', 'down'];

/** Texte einer Zone: `row` (versteckter Text in der Zeile) und `legend` (Legende); `undefined` bei unbekannter Zone. */
export function zoneInfo(zone) {
  return typeof zone === 'string' && Object.hasOwn(ZONES, zone) ? ZONES[zone] : undefined;
}

/** Legende für die angezeigten Zeilen: die vorkommenden Zonen in fester Reihenfolge (Aufstieg, Relegation, Abstieg); leer ohne Zone. */
export function zoneLegend(rows) {
  if (!Array.isArray(rows)) return [];
  const used = new Set(rows.map((row) => row?.zone));
  return ZONE_ORDER.filter((zone) => used.has(zone)).map((zone) => ZONES[zone]);
}

/**
 * Live-Hinweis im Kopf: `undefined`, wenn nichts läuft (`false`, `0`, ungültig). `true` ergibt `{ text: '' }` (nur das Wort "Live"),
 * eine Zahl ab 1 ergibt `{ count, text }` mit "1 Spiel läuft" bzw. "3 Spiele laufen".
 */
export function liveInfo(live) {
  if (live === true) return { text: '' };
  if (Number.isInteger(live) && live >= 1) return { count: live, text: live === 1 ? '1 Spiel läuft' : `${live} Spiele laufen` };
  return undefined;
}

/** Zahl der Teams für den Untertitel: `teamCount`, wenn gültig (ganze Zahl ab 0), sonst die Länge der Liste; `undefined` bei leerer Liste ohne gültiges `teamCount`. */
export function teamTotal(teamCount, teams) {
  if (isCount(teamCount)) return teamCount;
  return Array.isArray(teams) && teams.length > 0 ? teams.length : undefined;
}
