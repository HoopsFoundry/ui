/**
 * DSS Render · MatchCard (Spielkarte)
 * --------------------------------------------------------------
 * `renderMatchCard(props, options?)`/`mountMatchCard(el, props, options?)`: dasselbe Markup wie die Komponente MatchCard (Svelte, React).
 * Props: `state` (`scheduled`, `live`, `finished`), `league`, `matchday`, `date`, `time`, `venue`, `heim`, `gast` (`{ name, short, logo, score }`),
 * `names`, `logos`, `period`, `periods`, `quarter`, `clock`, `href`, `className`. Mit `href` (nur sichere Ziele) ist die Karte ein Link, mit
 * `options.button` (`mountMatchCard`: `options.onClick`) ein Button, sonst ein `div`. Spielabschnitt und Namen aus js/periods.js und
 * js/schedule.js. Typen: js/render/match-card.d.ts.
 */
import { resolvePeriod } from '../periods.js';
import { attr, esc } from './escape.js';
import { klass, logoBadge, nameText, num, obj, pick, str, teamOf, url } from './core.js';
import { mount } from './mount.js';

/** Eine Mannschaft der Karte: Logo bzw. Initialen, Name mit Kurzform. */
function teamBlock(team, names, logos) {
  const name = nameText(team, names, 'dss-match-name');
  // ohne Kurzform steht der Name in einem eigenen span (`dss-match-name`), mit Kurzform trägt der Wrapper die Klasse
  const inner = name.startsWith('<span') ? name : `<span class="dss-match-name">${name}</span>`;
  return `${logos ? logoBadge(team) : ''}${inner}`;
}

/** Spielkarte in drei Zuständen: angesetzt, live, beendet (Sieger/Verlierer). */
export function renderMatchCard(props, options) {
  const p = obj(props);
  const state = pick(p.state, ['scheduled', 'live', 'finished'], 'scheduled');
  const names = pick(p.names, ['full', 'short'], 'full');
  const logos = Boolean(p.logos);
  const heim = teamOf(p.heim);
  const gast = teamOf(p.gast);
  const href = url(p.href);
  const [league, matchday, date, time, venue, clock] = ['league', 'matchday', 'date', 'time', 'venue', 'clock'].map((key) => str(p[key]));
  const heimWin = state === 'finished' && (heim.score ?? 0) > (gast.score ?? 0);
  const gastWin = state === 'finished' && (gast.score ?? 0) > (heim.score ?? 0);
  const showScore = state !== 'scheduled';
  const label = resolvePeriod({ period: num(p.period), periods: p.periods, quarter: str(p.quarter) }).label;
  const liveText = [label, clock].filter(Boolean).join(' ');

  let status = '';
  if (state === 'live') status = `<span class="dss-match-live"><span class="dss-match-pulse" aria-hidden="true"></span> Live · ${esc(liveText)}</span>`;
  else if (state === 'finished') status = '<span class="dss-match-final">Endstand</span>';
  else if (date) status = `<span class="dss-match-when">${esc(date)}${time ? ` · ${esc(time)}` : ''}</span>`;

  const side = (team, loser, gastSide) =>
    `<span class="${klass('dss-match-team', gastSide && 'dss-match-team--gast', loser && 'is-loser')}"><span class="dss-match-dot" aria-hidden="true"></span>` +
    `${teamBlock(team, names, logos)}${showScore && team.score !== undefined ? `<span class="dss-match-score">${esc(team.score)}</span>` : ''}</span>`;

  const body =
    `<span class="dss-match-head"><span class="dss-match-league">${league ? `<span>${esc(league)}</span>` : ''}${matchday ? `<span class="dss-match-muted">· ${esc(matchday)}</span>` : ''}</span>${status}</span>` +
    `<span class="dss-match-body">${side(heim, gastWin, false)}${side(gast, heimWin, true)}</span>` +
    (venue ? `<span class="dss-match-foot"><span>${esc(venue)}</span></span>` : '');

  const cls = klass('dss-match', `dss-match--${state}`, logos && 'dss-match--logos', str(p.className));
  if (href) return `<a class="${cls}" href="${attr(href)}">${body}</a>`;
  if (obj(options).button === true) return `<button type="button" class="${cls}">${body}</button>`;
  return `<div class="${cls}">${body}</div>`;
}

/** Setzt `renderMatchCard` in `el` ein; `options.onClick(event)` macht die Karte zum Button (mit `href`: zusätzlicher Handler am Link). */
export function mountMatchCard(el, props, options = {}) {
  const { onClick, ...rest } = obj(options);
  const handler = typeof onClick === 'function';
  const on = handler ? [{ type: 'click', selector: '.dss-match', handler: (event) => onClick(event) }] : [];
  return mount(el, renderMatchCard, props, { ...rest, button: handler, on: [...(Array.isArray(rest.on) ? rest.on : []), ...on] });
}
