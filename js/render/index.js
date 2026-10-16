/**
 * HoopsFoundry UI Render · Sammelexport
 * --------------------------------------------------------------
 * Alle `renderX(props, options?) → string` und `mountX(el, props, options?) → { update, destroy }` des Vanilla-Pakets, dazu die
 * Bausteine `esc`, `attr` und `mount`. Beim Import passiert nichts (kein Zugriff auf `window`/`document`); alles läuft auch in Node (Crawler).
 * Typen: js/render/index.d.ts.
 */
export { esc, attr } from './escape.js';
export { mount } from './mount.js';
export { renderStats, mountStats, renderFormChips, mountFormChips } from './stats.js';
export { renderEmptyState, mountEmptyState } from './empty-state.js';
export { renderTable, mountTable } from './table.js';
export { renderLeagueCard, mountLeagueCard } from './league-card.js';
export { renderScheduleTable, renderScheduleGrid, mountScheduleTable, mountScheduleGrid } from './schedule.js';
export { renderMatchCard, mountMatchCard } from './match-card.js';
export { renderTeamCard, mountTeamCard } from './team-card.js';
export { renderVenueCard, mountVenueCard } from './venue-card.js';

/** Version des Pakets, aus dem dieses Bündel gebaut wurde (ohne Build `dev`); sie muss zu `VERSION` von hoops.js und zu hoops.css passen. */
// eslint-disable-next-line no-undef
export const VERSION = typeof __HOOPS_VERSION__ === 'string' ? __HOOPS_VERSION__ : 'dev';
