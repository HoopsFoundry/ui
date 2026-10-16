/**
 * HoopsFoundry UI Team · Hilfsfunktionen für die TeamCard
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM und ohne Intl (feste Formatierung, SSR-stabil). Svelte und React nutzen dieselbe Logik.
 * Typen: js/team.d.ts. Ergebnis-Logik (S/N/U, Screenreader-Text) kommt aus js/schedule.js.
 */
import { ariaForResult, resolveOutcome } from './schedule.js';

const isNum = (value) => typeof value === 'number' && Number.isFinite(value);
/** Anzahl (Siege, Spieler, …): ganze Zahl ab 0; negative und gebrochene Werte gelten als ungültig. */
const isCount = (value) => Number.isInteger(value) && value >= 0;

/** Zahl deutsch mit Komma (12.5 -> "12,5"); leer, wenn kein Zahlenwert. */
export function formatNumber(value) {
  return isNum(value) ? String(value).replace('.', ',') : '';
}

/** Bilanz: Kurztext "12–3" bzw. "12–1–3" (mit Unentschieden), Beschriftung "S–N" bzw. "S–U–N", Screenreader-Text; undefined ohne gültige Siege und Niederlagen (ganze Zahlen ab 0); ein ungültiges `d` wird ignoriert. */
export function recordInfo(record) {
  if (!record || !isCount(record.w) || !isCount(record.l)) return undefined;
  const draws = isCount(record.d);
  const wins = `${record.w} ${record.w === 1 ? 'Sieg' : 'Siege'}`;
  const losses = `${record.l} ${record.l === 1 ? 'Niederlage' : 'Niederlagen'}`;
  const parts = draws ? [wins, `${record.d} Unentschieden`, losses] : [wins, losses];
  return {
    text: draws ? `${record.w}–${record.d}–${record.l}` : `${record.w}–${record.l}`,
    label: draws ? 'S–U–N' : 'S–N',
    aria: `Bilanz: ${parts.join(', ')}`,
  };
}

/** Tabellenplatz: Wert, Beschriftung ("Platz" bzw. "Platz von 12") und Screenreader-Text; undefined ohne gültigen Platz (ganze Zahl ab 1). */
export function rankInfo(rank, rankOf) {
  if (!Number.isInteger(rank) || rank < 1) return undefined;
  const of = Number.isInteger(rankOf) && rankOf >= rank ? rankOf : undefined;
  return {
    text: String(rank),
    label: of ? `Platz von ${of}` : 'Platz',
    aria: of ? `Tabellenplatz ${rank} von ${of}` : `Tabellenplatz ${rank}`,
  };
}

/** "14 Spieler · 3 Trainer"; ohne Trainer nur die Spieler; leer ohne gültige Spielerzahl (ganze Zahl ab 0); eine ungültige Trainerzahl entfällt. */
export function squadText(squad) {
  if (!squad || !isCount(squad.players)) return '';
  const parts = [`${squad.players} Spieler`];
  if (isCount(squad.staff)) parts.push(`${squad.staff} Trainer`);
  return parts.join(' · ');
}

const STAT_FIELDS = [
  ['twoPtPct', '2PP %'],
  ['threePtPct', '3PP %'],
  ['trb', 'TRB'],
  ['to', 'TO'],
];

/** Nur die übergebenen Saison-Statistiken, in fester Reihenfolge (2PP %, 3PP %, TRB, TO), Werte deutsch formatiert. */
export function statEntries(stats) {
  if (!stats) return [];
  return STAT_FIELDS.filter(([key]) => isNum(stats[key])).map(([key, label]) => ({ key, label, value: formatNumber(stats[key]) }));
}

/** Ergebnis des letzten Spiels: Chip (S/N/U) und Screenreader-Text wie im Spielplan ("Eigene 92, Gegner 79, Sieg"); ein gesetztes `outcome` (Forfait, Wertung) gewinnt gegen die Zahlen. */
export function lastResult(last) {
  if (!last || !isNum(last.ownScore) || !isNum(last.opponentScore)) return undefined;
  const game = { id: 'last', state: 'finished', ownScore: last.ownScore, outcome: last.outcome, opponent: { name: last.opponent?.name ?? '', score: last.opponentScore } };
  return { outcome: resolveOutcome(game), score: `${last.ownScore} : ${last.opponentScore}`, aria: ariaForResult(game, 'opponent') };
}

/** Zusatztext vor dem Gegner für Screenreader: Heimspiel gegen, Auswärtsspiel bei, sonst "gegen". */
export function opponentPrefix(at) {
  if (at === 'heim') return 'Heimspiel gegen ';
  if (at === 'gast') return 'Auswärtsspiel bei ';
  return 'gegen ';
}
