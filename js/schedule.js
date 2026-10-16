/**
 * HoopsFoundry UI Schedule · Hilfsfunktionen für ScheduleTable und ScheduleGrid
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM. Svelte und React nutzen dieselbe Logik,
 * damit beide Fassungen gleich entscheiden. Typen: js/schedule.d.ts.
 */
const START = /(\d{1,2}):(\d{2})/;
const OUTCOME_TEXT = { S: 'Sieg', N: 'Niederlage', U: 'Unentschieden' };

const isNum = (value) => typeof value === 'number' && Number.isFinite(value);

/** Text für Zustände, die sonst nur Farbe und Durchstreichung zeigen (WCAG 1.4.1); sonst undefined. */
export function stateLabel(state) {
  if (state === 'cancelled') return 'abgesagt';
  if (state === 'postponed') return 'verschoben';
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

/** Spalten der Tabelle (Variante A) je Layout; bei `columns` nur Spalten, für die Daten vorliegen. */
export function columnsFor(layout, games, hasNotice = false) {
  if (layout === 'versus') {
    return [
      { key: 'when', label: 'Zeit' },
      { key: 'match', label: 'Spiel' },
      { key: 'res', label: 'Ergebnis' },
    ];
  }
  if (layout === 'opponent') {
    return [
      { key: 'when', label: 'Zeit' },
      { key: 'ha', label: 'Heim oder Auswärts' },
      { key: 'match', label: 'Gegner' },
      { key: 'res', label: 'Ergebnis' },
    ];
  }
  const cols = [];
  if (games.some((game) => game.nr)) cols.push({ key: 'nr', label: 'Nr' });
  cols.push({ key: 'when', label: 'Zeit' });
  if (games.some((game) => game.field)) cols.push({ key: 'field', label: 'Feld' });
  if (games.some((game) => game.venue)) cols.push({ key: 'venue', label: 'Halle' });
  cols.push({ key: 'heim', label: 'Heim' }, { key: 'res', label: 'Ergebnis' }, { key: 'gast', label: 'Gast' });
  if (hasNotice) cols.push({ key: 'notice', label: 'Hinweis' });
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

/** Text des Ergebnisses für Screenreader; nur sinnvoll, wenn hasScore(game, layout) gilt. */
export function ariaForResult(game, layout) {
  const parts = [];
  if (layout === 'opponent' && game.opponent) {
    parts.push(`Eigene ${game.ownScore}`, `Gegner ${game.opponent.score}`);
    const result = resolveOutcome(game);
    if (result) parts.push(OUTCOME_TEXT[result]);
  } else {
    parts.push(`Heim ${game.heim?.score}`, `Gast ${game.gast?.score}`);
  }
  if (game.provisional) parts.push('vorläufig');
  if (game.state === 'live') parts.push('läuft');
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
