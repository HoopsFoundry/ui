// Eingaben für die Render-Funktionen: vollständige Props je Komponente (alle Text- und Link-Felder gesetzt), dazu die Namen der Funktionen.
// Die Sicherheitstests ersetzen jeden Text durch Schadtext und jedes Link-Feld durch ein `javascript:`-Ziel.
import * as render from '../../js/render/index.js';
import { renderMap } from '../../js/map-vanilla.js';

export type Fn = (props: unknown, options?: unknown) => string;
// Die Karte liegt im eigenen Bündel (js/map-vanilla.js), nicht im Render-Sammelexport
const all = { ...render, renderMap } as unknown as Record<string, Fn>;
/** `renderX#Name` ist eine weitere Eingabe für dieselbe Funktion. */
export const fn = (name: string) => all[name.split('#')[0]];

const team = (name: string, extra: Record<string, unknown> = {}) => ({ name, short: `${name.slice(0, 3)}`, logo: '/logos/x.svg', href: '/teams/x', ...extra });
const game = (id: string, state: string, extra: Record<string, unknown> = {}) => ({
  id, state, at: 'heim', ownScore: 80, outcome: 'N', zone: 'up', nr: '#1', section: 'Spieltag 1', date: 'Sa, 17.10.2026', time: '17:30', venue: 'Halle', field: 'Feld 1', column: 'a', note: 'Hinweis',
  league: { name: 'Liga', href: '/ligen/x' }, heim: team('Heim', { score: 3 }), gast: team('Gast', { score: 2 }), ...extra,
});

export const FIXTURES: Record<string, Record<string, unknown>> = {
  renderStats: { items: [{ label: 'Siege', value: 'Zwölf' }, { label: 'Quote', value: null }], className: 'mein' },
  renderFormChips: { form: ['S', 'N', 'U'], variant: 'letters', className: 'mein' },
  renderEmptyState: { tone: 'action', title: 'Titel', body: 'Text', cta: 'Los', icon: 'i-x', actions: [{ label: 'Hilfe', href: '/hilfe' }], extra: 'Zusatz', className: 'mein' },
  renderTable: {
    title: 'Titel', meta: 'Meta', caption: 'Beschriftung', live: true, columns: [{ key: 'a', label: 'A', width: '80px', sort: 'asc', align: 'right' }], className: 'mein',
    rows: [[{ text: 'Zelle', href: '/x', className: 'num' }, 'Text']], head: [['K']], foot: [['Summe']], id: 'tab', collapsible: true, open: true,
  },
  renderLeagueCard: {
    title: 'Liga', teams: [{ rank: 1, name: 'Eins', short: 'E', logo: '/l.svg', href: '/t/1', own: true, played: 1, won: 1, lost: 0, diff: 5, points: 2, zone: 'up', form: ['S'] }, { rank: 2, name: 'Zwei', zone: 'down' }],
    teamCount: 2, played: 1, total: 2, columns: ['won', 'lost', 'diff', 'form'], href: '/liga', linkLabel: 'Alle', live: 1, logos: true, names: 'short', id: 'liga', collapsible: true, open: true, className: 'mein',
  },
  renderScheduleTable: { games: [game('a', 'finished'), game('b', 'live'), game('c', 'bye'), game('d', 'finished', { opponent: team('Gegner', { score: 70 }), provisional: true }), game('e', 'live', { opponent: team('Gegner', { score: 70 }) })], title: 'Plan', meta: 'Stand', caption: 'Beschriftung', logos: true, names: 'short', id: 'plan', collapsible: true, open: true, className: 'mein' },
  renderScheduleGrid: {
    games: [game('a', 'finished'), game('b', 'scheduled', { time: '19:00' })], columns: [{ id: 'a', label: 'Halle A' }], breaks: [{ time: '18:00', label: 'Pause' }],
    slots: ['17:30', '19:00'], emptyLabel: 'frei', title: 'Raster', meta: 'Stand', caption: 'Beschriftung', logos: true, id: 'raster', collapsible: true, open: true, className: 'mein',
  },
  renderMatchCard: { state: 'live', league: 'Liga', matchday: 'Spieltag', date: 'Datum', time: 'Zeit', venue: 'Halle', heim: team('Heim', { score: 1 }), gast: team('Gast', { score: 2 }), period: 2, periods: 4, clock: '03:00', quarter: 'Halbzeit', logos: true, href: '/spiel', className: 'mein' },
  'renderMatchCard#alias': { state: 'live', matchday: 'Spieltag', quarter: 'Halbzeit', clock: '03:00', heim: team('Heim', { score: 1 }), gast: team('Gast', { score: 2 }) },
  renderTeamCard: {
    name: 'Team', short: 'T', logo: '/l.svg', league: 'Liga', leagueHref: '/liga', season: '2026/27', record: { w: 1, d: 1, l: 1 }, rank: 2, rankOf: 5, points: 4,
    next: { opponent: team('Gegner'), at: 'heim', date: 'Datum', time: 'Zeit', venue: 'Halle' }, last: { opponent: team('Gegner'), at: 'gast', date: 'Datum', ownScore: 2, opponentScore: 1, outcome: 'S' },
    squad: { players: 12, staff: 2 }, stats: { twoPtPct: 40, threePtPct: 30, trb: 20, to: 10 }, logos: true, href: '/team', className: 'mein',
  },
  renderMap: {
    label: 'Karte', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: 'Halle A', href: '/hallen/a', number: 4, own: true, kind: 'place' }, { id: 'b', lat: 49.31, lng: 7.91, label: 'Sitz', kind: 'seat' }, { id: 'c', lat: 49.32, lng: 7.92, label: 'Halle C' }],
    appLinks: ['osm', 'geo', 'route'], load: 'click', darkTiles: 'invert', tileUrl: '/tiles/{z}/{x}/{y}.png', attribution: 'Kartendaten', privacyNote: 'Hinweis', seatLabel: 'Geschäftsstelle', height: 300, className: 'mein', showList: true,
  },
  renderVenueCard: {
    name: 'Halle', address: { street: 'Weg 1', zip: '12345', city: 'Ort' }, lat: 49.3, lng: 7.9, info: 'Info', contact: { name: 'Name', phone: '030 123456', email: 'a@example.org' },
    games: [game('a', 'scheduled'), game('b', 'live')], limit: 5, gamesLabel: 'Spiele', href: '/halle', linkLabel: 'Seite', logos: true, names: 'short', tileUrl: '/tiles/{z}/{x}/{y}.png', privacyNote: 'Hinweis', mapHeight: 300, className: 'mein',
  },
};

/** Felder, deren Wert ein Link ist (bekommen in den Sicherheitstests ein `javascript:`-Ziel). */
export const URL_KEYS = new Set(['href', 'logo', 'leagueHref', 'tileUrl']);

/**
 * Aufzählungsfelder (nur bekannte Werte): `poison` lässt sie unverändert, damit Zweige wie Live, Endstand und Ergebnis mit Schadtext in den
 * Freitextfeldern laufen; ihre Schadwerte prüft `poisonEnums` getrennt.
 */
export const ENUM_KEYS = new Set([
  'state', 'at', 'outcome', 'tone', 'layout', 'density', 'size', 'names', 'load', 'variant', 'titleAs', 'zone', 'sort', 'align', 'kind', 'columns', 'form', 'periods', 'live', 'darkTiles', 'appLinks',
]);

/** Ersetzt jede Zeichenkette in `value` (tief): Linkfelder durch `link`, Aufzählungsfelder bleiben, alle anderen durch `text`. */
export function poison(value: unknown, text: string, link: string, key = ''): unknown {
  if (typeof value === 'string') return URL_KEYS.has(key) ? link : ENUM_KEYS.has(key) ? value : text;
  if (Array.isArray(value)) return ENUM_KEYS.has(key) ? value : value.map((item) => poison(item, text, link, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, poison(v, text, link, k)]));
  return value;
}

/** Ersetzt jedes Aufzählungsfeld (Zeichenkette oder Liste von Zeichenketten) durch `bad`; alles andere bleibt. */
export function poisonEnums(value: unknown, bad: string, key = ''): unknown {
  if (typeof value === 'string') return ENUM_KEYS.has(key) ? bad : value;
  if (Array.isArray(value)) return ENUM_KEYS.has(key) ? value.map(() => bad) : value.map((item) => poisonEnums(item, bad, key));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, poisonEnums(v, bad, k)]));
  return value;
}
