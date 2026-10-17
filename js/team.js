/**
 * HoopsFoundry UI Team · Hilfsfunktionen für die TeamCard
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM und ohne Intl (feste Formatierung, SSR-stabil). Svelte und React nutzen dieselbe Logik.
 * Typen: js/team.d.ts. Ergebnis-Logik (S/N/U, Screenreader-Text) kommt aus js/schedule.js.
 */
import { formatPlain } from './i18n/format.js';
import { t } from './i18n/index.js';
import { ariaForResult, resolveOutcome } from './schedule.js';

const isNum = (value) => typeof value === 'number' && Number.isFinite(value);
/** Anzahl (Siege, Spieler, …): ganze Zahl ab 0; negative und gebrochene Werte gelten als ungültig. */
const isCount = (value) => Number.isInteger(value) && value >= 0;

/** Zahl mit dem Dezimaltrennzeichen der Sprache (deutsch 12.5 -> "12,5"); leer, wenn kein Zahlenwert. `options`: `locale`. */
export function formatNumber(value, options) {
  return isNum(value) ? formatPlain(value, options) : '';
}

/** Bilanz: Kurztext "12–3" bzw. "12–1–3" (mit Unentschieden), Beschriftung "S–N" bzw. "S–U–N", Screenreader-Text; undefined ohne gültige Siege und Niederlagen (ganze Zahlen ab 0); ein ungültiges `d` wird ignoriert. */
export function recordInfo(record, options) {
  if (!record || !isCount(record.w) || !isCount(record.l)) return undefined;
  const draws = isCount(record.d);
  const wins = t('team.record.wins', { count: record.w }, options);
  const losses = t('team.record.losses', { count: record.l }, options);
  const parts = draws ? [wins, t('team.record.draws', { count: record.d }, options), losses] : [wins, losses];
  return {
    text: draws ? `${record.w}–${record.d}–${record.l}` : `${record.w}–${record.l}`,
    label: draws ? t('team.record.label-draws', undefined, options) : t('team.record.label', undefined, options),
    aria: t('team.record.aria', { parts: parts.join(', ') }, options),
  };
}

/** Tabellenplatz: Wert, Beschriftung ("Platz" bzw. "Platz von 12") und Screenreader-Text; undefined ohne gültigen Platz (ganze Zahl ab 1). */
export function rankInfo(rank, rankOf, options) {
  if (!Number.isInteger(rank) || rank < 1) return undefined;
  const of = Number.isInteger(rankOf) && rankOf >= rank ? rankOf : undefined;
  return {
    text: String(rank),
    label: of ? t('team.rank.label-of', { total: of }, options) : t('team.rank.label', undefined, options),
    aria: of ? t('team.rank.aria-of', { rank, total: of }, options) : t('team.rank.aria', { rank }, options),
  };
}

/** "14 Spieler · 3 Trainer"; ohne Trainer nur die Spieler; leer ohne gültige Spielerzahl (ganze Zahl ab 0); eine ungültige Trainerzahl entfällt. */
export function squadText(squad, options) {
  if (!squad || !isCount(squad.players)) return '';
  const parts = [t('team.squad.players', { count: squad.players }, options)];
  if (isCount(squad.staff)) parts.push(t('team.squad.staff', { count: squad.staff }, options));
  return parts.join(' · ');
}

// Schlüssel der Beschriftungen (ausgeschrieben, damit die Verwendungsprüfung sie erkennt)
const STAT_FIELDS = [
  ['twoPtPct', 'team.stat.two-pt'],
  ['threePtPct', 'team.stat.three-pt'],
  ['trb', 'team.stat.rebounds'],
  ['to', 'team.stat.turnovers'],
];

/** Nur die übergebenen Saison-Statistiken, in fester Reihenfolge (2PP %, 3PP %, TRB, TO), Werte deutsch formatiert. */
export function statEntries(stats, options) {
  if (!stats) return [];
  return STAT_FIELDS.filter(([key]) => isNum(stats[key])).map(([key, label]) => ({ key, label: t(label, undefined, options), value: formatNumber(stats[key], options) }));
}

/** Ergebnis des letzten Spiels: Chip (S/N/U) und Screenreader-Text wie im Spielplan ("Eigene 92, Gegner 79, Sieg"); ein gesetztes `outcome` (Forfait, Wertung) gewinnt gegen die Zahlen. */
export function lastResult(last, options) {
  if (!last || !isNum(last.ownScore) || !isNum(last.opponentScore)) return undefined;
  const game = { id: 'last', state: 'finished', ownScore: last.ownScore, outcome: last.outcome, opponent: { name: last.opponent?.name ?? '', score: last.opponentScore } };
  return { outcome: resolveOutcome(game), score: `${last.ownScore} : ${last.opponentScore}`, aria: ariaForResult(game, 'opponent', options) };
}

/** Zusatztext vor dem Gegner für Screenreader: Heimspiel gegen, Auswärtsspiel bei, sonst "gegen". */
export function opponentPrefix(at, options) {
  if (at === 'heim') return `${t('team.opponent.home', undefined, options)} `;
  if (at === 'gast') return `${t('team.opponent.away', undefined, options)} `;
  return `${t('team.opponent.neutral', undefined, options)} `;
}
