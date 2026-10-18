// Frischer Node-Prozess ohne das Vitest-Setup: gibt Sprache und Markup der Render-Funktionen als JSON aus (tests/i18n-default.test.ts).
import { getLocale } from '../../js/i18n/index.js';
import { renderStats, renderLeagueCard, renderVenueCard } from '../../js/render/index.js';

const map = await import('../../js/map-vanilla.js');
const out = {
  locale: getLocale(),
  venue: renderVenueCard({ name: 'Sporthalle Nordhain', lat: 49.4875, lng: 8.466 }),
  map: map.renderMap({ label: 'Hallen', markers: [{ id: 'a', lat: 49.4875, lng: 8.466, label: 'Halle A' }] }),
  stats: renderStats({ items: [{ label: 'Punkte', value: null }] }),
  league: renderLeagueCard({ title: 'Liga', teams: [{ rank: 1, name: 'A', played: 1, points: 2 }], played: 1, total: 2 }),
};
process.stdout.write(JSON.stringify(out));
