// @vitest-environment node
// Vanilla-`renderVenueCard` erzeugt dasselbe Markup wie Svelte und React, einschließlich des Platzhalters der Karte (normalisiert).
import { describe, expect, it } from 'vitest';
import { renderVenueCard } from '../js/render/venue-card.js';
import { normalize, useParity } from './helpers/render-parity';

const p = useParity();
const ADDRESS = { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' };
const CONTACT = { name: 'Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' };
const TEAMS: [string, string | undefined, string | undefined][] = [
  ['TSV Nordhain 1920', 'Nordhain', '/logos/nordhain.svg'], ['Lindenberg Hawks', 'Hawks', undefined], ['BG Seeberg', undefined, undefined],
  ['SV Kiefernau & Co', 'Kiefernau', '/logos/k.svg'], ['Elbach Eagles', 'Eagles', undefined], ['TuS Waldmark', undefined, undefined],
];
const GAMES = [0, 1, 2, 3, 4, 5].map((i) => ({
  id: `g${i}`, state: (['scheduled', 'live', 'cancelled', 'postponed', 'finished', 'scheduled'] as const)[i], date: i % 2 ? undefined : `Sa, ${17 + i}.10.2026`,
  time: i % 3 ? '17:30' : undefined, league: i % 2 ? undefined : { name: 'Oberliga Nordhain Männer' }, field: i === 2 ? 'Feld 2' : undefined,
  heim: { name: TEAMS[i][0], short: TEAMS[i][1], logo: TEAMS[i][2] },
  gast: i === 5 ? undefined : { name: TEAMS[(i + 1) % 6][0], short: TEAMS[(i + 1) % 6][1], logo: TEAMS[(i + 1) % 6][2] },
}));
const BASE = { name: 'Sporthalle Nordhain' };
const FULL = { ...BASE, address: ADDRESS, lat: 49.3, lng: 7.9, info: 'Zwei Spielfelder & Zugang über den Hof.', contact: CONTACT, games: GAMES, href: '/hallen/nordhain' };

describe('VenueCard: renderVenueCard gegen Svelte und React', () => {
  const cases: Record<string, Record<string, unknown>> = {
    minimal: BASE,
    voll: FULL,
    'voll, Kurznamen und Logos': { ...FULL, limit: 5, names: 'short', logos: true },
    kompakt: { ...FULL, size: 'compact' },
    'ohne Karte': { ...FULL, lat: undefined, lng: undefined },
    'ungültige Koordinaten': { ...FULL, lat: 95 },
    'ungültige Zahlen': { ...FULL, lat: Number.NaN, limit: 0, games: GAMES },
    'Karte automatisch': { ...BASE, lat: 49.3, lng: 7.9, load: 'auto', tileUrl: '/tiles/{z}/{x}/{y}.png' },
    'Karte mit ungültiger Kachel-Adresse': { ...BASE, lat: 49.3, lng: 7.9, tileUrl: 'http://example.org/{z}/{x}/{y}.png' },
    'Karte mit Hinweis und Höhe': { ...BASE, lat: 49.3, lng: 7.9, privacyNote: 'Über unseren Server.', mapHeight: 300 },
    'Karte Pole': { ...BASE, lat: -90, lng: 180 },
    'lange Texte': { name: 'Sporthalle '.repeat(40), info: 'Info '.repeat(200), address: { street: 'Straße '.repeat(30), zip: '1', city: 'Ort '.repeat(30) }, contact: { name: 'Name '.repeat(30) } },
    titleAs: { ...BASE, titleAs: 'h2', address: ADDRESS },
    'Sonderzeichen': { name: 'Halle "Süd" & <West>', info: "it's <b>", address: { street: '<x>', city: '&' }, href: '/h?a=1&b=2', lat: 49.3, lng: 7.9 },
    'Beschriftungen': { ...BASE, games: GAMES, gamesLabel: 'Belegung', href: '/x', linkLabel: 'Mehr' },
    'Kontakt ungültig': { ...BASE, contact: { name: 'A', phone: 'nur vormittags', email: 'a (at) b.de' } },
    'Name leer': { name: '  ', address: ADDRESS, lat: 49.3, lng: 7.9 },
    className: { ...BASE, className: 'meine' },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    // mapActive: die Schaltfläche der Karte ist bedienbar wie bei MapView (ohne initMap ist sie gesperrt)
    const v = normalize(renderVenueCard(props as never, { mapActive: true }));
    const r = await p.react('VenueCard', props);
    expect(v).toBe(r);
    expect(await p.svelte('VenueCard', props)).toBe(r);
  });
  it('ohne mapActive ist „Karte laden“ gesperrt, sonst unverändert', () => {
    const off = renderVenueCard({ name: 'H', lat: 49.3, lng: 7.9 } as never);
    const on = renderVenueCard({ name: 'H', lat: 49.3, lng: 7.9 } as never, { mapActive: true });
    expect(off).toContain('dss-map-load" disabled aria-disabled="true">Karte laden');
    expect(on).toContain('dss-map-load">Karte laden');
    expect(off.replace(' disabled aria-disabled="true"', '')).toBe(on);
  });
  it('limit: höchstens 5, ohne beendete und Spielfrei', () => {
    const many = Array.from({ length: 9 }, (_v, i) => ({ id: `s${i}`, state: i === 0 ? 'finished' : i === 1 ? 'bye' : 'scheduled', heim: { name: `Heim ${i}` }, gast: { name: `Gast ${i}` } }));
    const count = (html: string) => (html.match(/class="dss-venue-game"/g) ?? []).length;
    expect(count(renderVenueCard({ name: 'H', games: many } as never))).toBe(2);
    expect(count(renderVenueCard({ name: 'H', games: many, limit: 99 } as never))).toBe(5);
    expect(renderVenueCard({ name: 'H', games: many, limit: 5 } as never)).not.toContain('Heim 0');
  });
});
