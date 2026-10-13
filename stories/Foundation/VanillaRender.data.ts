// Erfundene Daten für die Beispiele „Markup erzeugen“ auf der Seite Foundation/Vanilla (VanillaDemo.svelte, Story Markup, Handy).
import type { LeagueCardProps } from '../../js/render/league-card.js';
import type { MatchCardProps } from '../../js/render/match-card.js';
import type { ScheduleTableProps } from '../../js/render/schedule.js';
import type { TeamCardProps } from '../../js/render/team-card.js';
import type { VenueCardProps } from '../../js/render/venue-card.js';

export const liga: LeagueCardProps = {
  title: 'Oberliga Nordhain Männer',
  teams: [
    { rank: 1, name: 'Lindenberg Hawks', short: 'Hawks', played: 11, won: 10, lost: 1, diff: 85, points: 20, zone: 'up', form: ['S', 'S', 'S', 'N', 'S'] },
    { rank: 2, name: 'BG Seeberg', played: 11, won: 9, lost: 2, diff: 40, points: 18, zone: 'up', form: ['S', 'U', 'S'] },
    { rank: 3, name: 'TSV Nordhain 1920', short: 'Nordhain', played: 11, won: 7, lost: 4, diff: 12, points: 14, own: true, form: ['N', 'S', 'S'] },
    { rank: 4, name: 'SV Kiefernau', played: 10, won: 6, lost: 4, diff: 0, points: 12, form: ['U', 'N'] },
    { rank: 5, name: 'Elbach Eagles', short: 'Eagles', played: 11, won: 5, lost: 6, diff: -8, points: 10, zone: 'playoff' },
  ],
  teamCount: 12, played: 66, total: 132, columns: ['diff', 'form'], href: '#tabelle', live: 2,
};

export const ligaKompakt: LeagueCardProps = { ...liga, title: 'Kreisliga Süd', size: 'compact', columns: [], live: false };

export const plan: ScheduleTableProps = {
  title: 'Spielplan Oberliga', meta: 'Stand 12.10.2026', names: 'short',
  games: [
    { id: 'a', state: 'finished', date: 'Sa, 10.10.2026', time: '17:00', venue: 'Sporthalle Nordhain', heim: { name: 'TSV Nordhain 1920', short: 'Nordhain', own: true, score: 78 }, gast: { name: 'Lindenberg Hawks', short: 'Hawks', score: 71 } },
    { id: 'b', state: 'live', time: '19:00', heim: { name: 'BG Seeberg', score: 12 }, gast: { name: 'Elbach Eagles', short: 'Eagles', score: 9 }, provisional: true },
    { id: 'c', state: 'scheduled', date: 'So, 18.10.2026', time: '11:00', heim: { name: 'TSV Nordhain 1920', short: 'Nordhain', own: true }, gast: { name: 'SV Kiefernau' } },
  ],
};

export const halle: VenueCardProps = {
  name: 'Sporthalle Nordhain',
  address: { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' },
  lat: 49.3, lng: 7.9, info: 'Zwei Spielfelder, Zugang über den Haupteingang.',
  contact: { name: 'Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' },
  games: [
    { id: 'a', state: 'scheduled', date: 'Sa, 17.10.2026', time: '17:30', league: { name: 'Oberliga Nordhain Männer' }, heim: { name: 'TSV Nordhain 1920', short: 'Nordhain' }, gast: { name: 'BG Seeberg' } },
    { id: 'b', state: 'live', date: 'Sa, 17.10.2026', time: '19:30', heim: { name: 'Lindenberg Hawks', short: 'Hawks' }, gast: { name: 'Elbach Eagles', short: 'Eagles' } },
  ],
  href: '#halle',
};

export const spiel: MatchCardProps = {
  state: 'live', league: 'Oberliga', matchday: 'Spieltag 5', period: 3, clock: '04:12',
  heim: { name: 'Lindenberg Hawks', short: 'Hawks', score: 41 }, gast: { name: 'TSV Nordhain 1920', short: 'Nordhain', score: 39 }, venue: 'Sporthalle Lindenberg',
};
export const spielEnde: MatchCardProps = {
  state: 'finished', league: 'Pokal', matchday: 'Viertelfinale',
  heim: { name: 'BG Seeberg', score: 64 }, gast: { name: 'SV Kiefernau', score: 71 },
};

export const team: TeamCardProps = {
  name: 'TSV Nordhain 1920', short: 'Nordhain', league: 'Oberliga Nordhain Männer', season: '2026/27',
  record: { w: 8, l: 3 }, rank: 3, rankOf: 12, points: 16,
  next: { opponent: { name: 'BG Seeberg' }, at: 'heim', date: 'Sa, 17.10.', time: '17:30' },
  last: { opponent: { name: 'Elbach Eagles', short: 'Eagles' }, at: 'gast', ownScore: 92, opponentScore: 79 },
};

export const kennzahlen = { items: [{ label: 'Siege', value: 8 }, { label: 'Punkte pro Spiel', value: 74.2 }, { label: 'Zuschauer', value: null }] };
export const leer = { tone: 'neutral' as const, title: 'Noch keine Spiele angesetzt', body: 'Sobald Spiele eingetragen sind, erscheinen sie hier.', cta: 'Spielplan öffnen' };
