/**
 * HoopsFoundry UI Schedule · Hilfsfunktionen für ScheduleTable und ScheduleGrid
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM. Svelte und React nutzen dieselbe Logik,
 * damit beide Fassungen gleich entscheiden. Typen: js/schedule.d.ts.
 */
import { t } from './i18n/index.js';

const START = /(\d{1,2}):(\d{2})/;
// Schlüssel der Ergebnisworte; die Daten (`S`, `N`, `U`) bleiben Teil der Schnittstelle, nur die Anzeige geht über den Katalog
const OUTCOME_KEY = { S: 'common.outcome.win', N: 'common.outcome.loss', U: 'common.outcome.draw' };

const isNum = (value) => typeof value === 'number' && Number.isFinite(value);

/** Text für Zustände, die sonst nur Farbe und Durchstreichung zeigen (WCAG 1.4.1); sonst undefined. `options`: `locale`, `texts`. */
export function stateLabel(state, options) {
  if (state === 'cancelled') return t('schedule.state.cancelled', undefined, options);
  if (state === 'postponed') return t('schedule.state.postponed', undefined, options);
  return undefined;
}

/** Sieg, Niederlage oder Unentschieden aus Sicht der eigenen Mannschaft. */
export function outcome(own, opp) {
  if (!isNum(own) || !isNum(opp)) return undefined;
  if (own > opp) return 'S';
  if (own < opp) return 'N';
  return 'U';
}

/** Bewertung eines Perspektive-Spiels; nur bei beendeten Spielen, ein gesetzter outcome gewinnt. */
export function resolveOutcome(game) {
  if (!game.opponent || game.state !== 'finished') return undefined;
  return game.outcome ?? outcome(game.ownScore, game.opponent.score);
}

/** Sieger einer beendeten Gegenüberstellung, sonst null. */
export function winnerSide(game) {
  if (game.state !== 'finished' || !isNum(game.heim?.score) || !isNum(game.gast?.score)) return null;
  if (game.heim.score > game.gast.score) return 'heim';
  if (game.gast.score > game.heim.score) return 'gast';
  return null;
}

/**
 * Gibt es einen vollständigen Stand (beide Seiten)?
 * Mit `layout` zählt die Perspektive (ownScore, opponent.score) nur bei `opponent`; sonst heim/gast.
 * Ohne `layout` gilt die Perspektive, sobald `game.opponent` existiert.
 */
export function hasScore(game, layout) {
  const perspective = layout === undefined ? Boolean(game.opponent) : layout === 'opponent' && Boolean(game.opponent);
  if (perspective) return isNum(game.ownScore) && isNum(game.opponent.score);
  return isNum(game.heim?.score) && isNum(game.gast?.score);
}

export function layoutFor(games) {
  return games.some((game) => game.opponent) ? 'opponent' : 'versus';
}

export function densityFor(games, layout) {
  return layout === 'opponent' || games.some((game) => game.league) ? 'touch' : 'default';
}

/** Spalten der Tabelle (Variante A) je Layout; bei `columns` nur Spalten, für die Daten vorliegen. `options`: `locale`, `texts`. */
export function columnsFor(layout, games, hasNotice = false, options) {
  if (layout === 'versus') {
    return [
      { key: 'when', label: t('schedule.col.time', undefined, options) },
      { key: 'match', label: t('schedule.col.game', undefined, options) },
      { key: 'res', label: t('schedule.col.result', undefined, options) },
    ];
  }
  if (layout === 'opponent') {
    return [
      { key: 'when', label: t('schedule.col.time', undefined, options) },
      { key: 'ha', label: t('schedule.col.home-away', undefined, options) },
      { key: 'match', label: t('schedule.col.opponent', undefined, options) },
      { key: 'res', label: t('schedule.col.result', undefined, options) },
    ];
  }
  const cols = [];
  if (games.some((game) => game.nr)) cols.push({ key: 'nr', label: t('schedule.col.number', undefined, options) });
  cols.push({ key: 'when', label: t('schedule.col.time', undefined, options) });
  if (games.some((game) => game.field)) cols.push({ key: 'field', label: t('schedule.col.field', undefined, options) });
  if (games.some((game) => game.venue)) cols.push({ key: 'venue', label: t('schedule.col.venue', undefined, options) });
  cols.push({ key: 'heim', label: t('common.home', undefined, options) }, { key: 'res', label: t('schedule.col.result', undefined, options) }, { key: 'gast', label: t('common.away', undefined, options) });
  if (hasNotice) cols.push({ key: 'notice', label: t('schedule.col.notice', undefined, options) });
  return cols;
}

/** Startzeit in Minuten aus "09:30" oder "09:30–09:50"; ohne erkennbare Zeit Infinity. */
export function startMinutes(time) {
  const found = (time ?? '').match(START);
  return found ? Number(found[1]) * 60 + Number(found[2]) : Infinity;
}

const byStart = (a, b) => {
  const sa = startMinutes(a);
  const sb = startMinutes(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
};

/** Eindeutige, nach Startzeit sortierte Zeitzeilen; Freilose zählen nicht. */
export function slotsFromGames(games) {
  const times = [];
  for (const game of games) {
    if (game.state !== 'bye' && game.time && !times.includes(game.time)) times.push(game.time);
  }
  return times.sort(byStart);
}

/** Aufeinanderfolgende Spiele mit gleichem `section` bilden eine Gruppe. */
export function groupBySection(games) {
  const groups = [];
  for (const game of games) {
    const last = groups[groups.length - 1];
    if (last && last.section === game.section) last.games.push(game);
    else groups.push({ section: game.section, games: [game] });
  }
  return groups;
}

/** Bis zu drei Anfangsbuchstaben in Großbuchstaben (Platzhalter für fehlende Logos). */
export function initials(name, max = 3) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((word) => word[0].toUpperCase())
    .join('');
}

/** Kurzname eines Teams; leer, wenn keiner angegeben ist oder er dem Namen gleicht (dann gibt es nichts zu kürzen). */
export function shortName(team) {
  const short = team?.short?.trim();
  return short && short !== team.name ? short : undefined;
}

/** Text des Ergebnisses für Screenreader; nur sinnvoll, wenn hasScore(game, layout) gilt. `options`: `locale`, `texts`. */
export function ariaForResult(game, layout, options) {
  const parts = [];
  if (layout === 'opponent' && game.opponent) {
    parts.push(t('schedule.aria.own', { score: game.ownScore }, options), t('schedule.aria.opponent', { score: game.opponent.score }, options));
    const result = resolveOutcome(game);
    if (result) parts.push(t(OUTCOME_KEY[result], undefined, options));
  } else {
    parts.push(t('schedule.aria.home', { score: game.heim?.score }, options), t('schedule.aria.away', { score: game.gast?.score }, options));
  }
  if (game.provisional) parts.push(t('schedule.provisional', undefined, options));
  if (game.state === 'live') parts.push(t('schedule.live-spoken', undefined, options));
  return parts.join(', ');
}

/** Zeilen des Zeitrasters: Zeitzeilen mit Zellen je Spalte, Pausen und Freilose in Zeitreihenfolge. */
export function buildGrid({ games, columns, slots, breaks = [] }) {
  const times = slots ?? slotsFromGames(games);
  const rows = [];
  for (const time of times) {
    rows.push({
      kind: 'slot',
      time,
      cells: columns.map((column) =>
        games.filter((game) => game.state !== 'bye' && game.time === time && game.column === column.id),
      ),
    });
  }
  for (const item of breaks) rows.push({ kind: 'break', time: item.time, label: item.label });
  for (const game of games) {
    if (game.state === 'bye') rows.push({ kind: 'bye', time: game.time, game });
  }
  // Array.prototype.sort ist stabil: gleiche Startzeit behält die Reihenfolge Zeitzeile, Pause, Freilos.
  return rows.sort((a, b) => byStart(a.time, b.time));
}
