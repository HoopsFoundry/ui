// Mutationstests der Sprachregeln der Render-Funktionen (I2): Wird der Quelltext verfälscht, muss die Regel kippen.
// Geladen wird aus Text (tests/helpers/render-rules.ts); die Module haben dort eine eigene Instanz des Sprachkerns mit Deutsch als globaler Sprache.
import { describe, expect, it } from 'vitest';
import { loadAll, sourceOf, type FileName } from './helpers/render-rules';
import { mutate } from './helpers/mutation';

type Mods = Awaited<ReturnType<typeof loadAll>>;
const league = { title: 'Liga', teams: [{ rank: 1, name: 'A', played: 1, points: 2 }], href: '/l', played: 1, total: 2 };
const venue = { name: 'Halle', lat: 49.4, lng: 8.4 };

const RULES: Record<string, (m: Mods) => boolean> = {
  // options.locale gilt für diesen Aufruf, die globale Sprache (de) bleibt
  'Ligencard: options.locale wählt die Sprache': (m) => {
    const en = m['league-card'].renderLeagueCard(league, { locale: 'en' }) as string;
    const de = m['league-card'].renderLeagueCard(league) as string;
    return en.includes('>Team<') && !en.includes('Mannschaft') && de.includes('Mannschaft');
  },
  'Ligencard: options.texts überschreibt den Katalog': (m) => (m['league-card'].renderLeagueCard(league, { texts: { 'league.col.team': 'Klub' } }) as string).includes('>Klub<'),
  'Ligencard: linkLabel hat Vorrang vor options.texts': (m) => {
    const html = m['league-card'].renderLeagueCard({ ...league, linkLabel: 'Eigen' }, { texts: { 'league.link': 'Aus texts' } }) as string;
    return html.includes('Eigen') && !html.includes('Aus texts');
  },
  'Hallenkarte: options.locale reicht bis in die Karte': (m) => {
    const html = m['venue-card'].renderVenueCard(venue, { locale: 'en' }) as string;
    return html.includes('Load map') && html.includes('49.4000° N, 8.4000° E');
  },
  'Hallenkarte: gamesLabel hat Vorrang vor options.texts': (m) => {
    const html = m['venue-card'].renderVenueCard({ ...venue, games: [{ id: 'g', heim: { name: 'A' } }], gamesLabel: 'Eigen' }, { texts: { 'venue.games-label': 'Aus texts' } }) as string;
    return html.includes('Eigen') && !html.includes('Aus texts');
  },
  'Kennzahlen: options.locale wählt Text und Dezimalzeichen': (m) => {
    const html = m.stats.renderStats({ items: [{ label: 'A', value: 41.3 }, { label: 'B', value: null }] }, { locale: 'en' }) as string;
    return html.includes('41.3') && html.includes('not available');
  },
  'lang: abweichende Sprache setzt lang an die Wurzel': (m) => (m.stats.renderStats({ items: [{ label: 'A', value: 1 }] }, { locale: 'en', documentLang: 'de' }) as string).startsWith('<dl lang="en"'),
};

const MUTATIONS: { name: string; file: FileName; rule: string; from: string; to: string }[] = [
  { name: 'Ligencard ignoriert options', file: 'league-card', rule: 'Ligencard: options.locale wählt die Sprache', from: "head(tr('league.col.team'", to: "head(tr('league.col.team'" },
  { name: 'Spaltenkopf ohne options', file: 'league-card', rule: 'Ligencard: options.locale wählt die Sprache', from: "`<th scope=\"col\">${esc(tr('league.col.team', undefined, options))}</th>`", to: "`<th scope=\"col\">${esc(tr('league.col.team'))}</th>`" },
  { name: 'Spaltenkopf ohne texts', file: 'league-card', rule: 'Ligencard: options.texts überschreibt den Katalog', from: "`<th scope=\"col\">${esc(tr('league.col.team', undefined, options))}</th>`", to: "`<th scope=\"col\">${esc(tr('league.col.team', undefined, { locale: options?.locale }))}</th>`" },
  { name: 'Vorrang vertauscht', file: 'league-card', rule: 'Ligencard: linkLabel hat Vorrang vor options.texts', from: "typeof p.linkLabel === 'string' ? p.linkLabel : tr('league.link', undefined, options)", to: "tr('league.link', undefined, options)" },
  { name: 'Karte ohne Sprache', file: 'venue-card', rule: 'Hallenkarte: options.locale reicht bis in die Karte', from: 'loadReady: obj(options).mapActive === true }, uid, options)', to: 'loadReady: obj(options).mapActive === true }, uid)' },
  { name: 'gamesLabel ohne Vorrang', file: 'venue-card', rule: 'Hallenkarte: gamesLabel hat Vorrang vor options.texts', from: "typeof p.gamesLabel === 'string' ? p.gamesLabel : venueString('gamesLabel', options)", to: "venueString('gamesLabel', options)" },
  { name: 'Kennzahlen ohne Sprache', file: 'stats', rule: 'Kennzahlen: options.locale wählt Text und Dezimalzeichen', from: 'const items = statItems(p.items, options);', to: 'const items = statItems(p.items);' },
  { name: 'leerer Wert ohne Sprache', file: 'stats', rule: 'Kennzahlen: options.locale wählt Text und Dezimalzeichen', from: '${esc(statEmptyLabel(options))}', to: '${esc(statEmptyLabel())}' },
  { name: 'lang entfällt', file: 'core', rule: 'lang: abweichende Sprache setzt lang an die Wurzel', from: 'return lang ? html.replace', to: 'return false ? html.replace' },
];
// die erste Mutation ist ein Platzhalter für „keine Änderung“ und wird übersprungen
const ACTIVE = MUTATIONS.filter((m) => m.from !== m.to);

describe('Sprachregeln der Render-Funktionen: Ausgangslage', () => {
  it('alle Regeln gelten am unveränderten Quelltext', async () => {
    const mods = await loadAll();
    expect(Object.entries(RULES).filter(([, rule]) => !rule(mods)).map(([name]) => name)).toEqual([]);
  });
  it('jede Regel ist durch mindestens eine Verfälschung abgesichert', () => {
    const covered = new Set(ACTIVE.map((m) => m.rule));
    expect(Object.keys(RULES).filter((name) => !covered.has(name))).toEqual([]);
  });
});

describe('Sprachregeln der Render-Funktionen: Mutationen', () => {
  it.each(ACTIVE)('$name', async ({ file, rule, from, to }) => {
    const mutated = await loadAll({ file, source: mutate(sourceOf(file), from, to) });
    expect(RULES[rule](mutated), `Regel kippt nicht: ${rule}`).toBe(false);
  });
});
