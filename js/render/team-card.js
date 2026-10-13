/**
 * DSS Render · TeamCard (Mannschaftskarte)
 * --------------------------------------------------------------
 * `renderTeamCard(props, options?)`/`mountTeamCard(el, props, options?)`: dasselbe Markup wie die Komponente TeamCard (Svelte, React).
 * Props: `name`, `short`, `logo`, `names`, `logos`, `league`, `leagueHref`, `season`, `record`, `rank`, `rankOf`, `points`, `next`, `last`, `squad`,
 * `stats`, `size` (`standard`, `compact`), `href`, `titleAs`, `className`. Mit `href` ist die Karte ein Link, mit `options.button`
 * (`mountTeamCard`: `options.onClick`) ein Button, sonst nicht klickbar; `leagueHref` zählt nur ohne Aktion. Bilanz, Platz, Kader, Statistik und
 * Ergebnis kommen aus js/team.js. Typen: js/render/team-card.d.ts.
 */
import { lastResult, opponentPrefix, rankInfo, recordInfo, squadText, statEntries } from '../team.js';
import { attr, esc } from './escape.js';
import { headingOf, klass, logoBadge, nameText, num, obj, pick, str, teamOf, url } from './core.js';
import { mount } from './mount.js';

const OUTCOMES = ['S', 'N', 'U'];
const OUTCOME_CHIP = { S: 'dss-chip--ok', N: 'dss-chip--err', U: '' };

const tile = (value, label, aria) =>
  `<div><div class="dss-pc-v" aria-hidden="true">${esc(value)}</div><div class="dss-pc-l" aria-hidden="true">${esc(label)}</div><span class="dss-sr-only">${esc(aria)}</span></div>`;

/** Ein Gegner in einer Spielzeile; `team` aus unvertrauten Daten (fehlt es, bleibt der Name leer). */
function opponent(raw, at, names, logos) {
  const o = teamOf(raw);
  const badge = at ? `<span class="dss-chip dss-chip--mono ${at === 'gast' ? 'dss-chip--amber' : 'dss-chip--sky'}" aria-hidden="true">${at === 'gast' ? '@' : 'vs.'}</span>` : '';
  return `${badge}<span class="dss-team-game-opp">${logos ? logoBadge(o, 'dss-team-logo--sm') : ''}<span><span class="dss-sr-only">${esc(opponentPrefix(at))}</span>${nameText(o, names)}</span></span>`;
}

/** Mannschaftskarte: Kopf, Bilanz und Tabellenplatz, nächstes und letztes Spiel, Kader, optionale Saison-Statistik; compact als Listenzeile. */
export function renderTeamCard(props, options) {
  const p = obj(props);
  const own = teamOf({ name: p.name, short: p.short, logo: p.logo });
  const names = pick(p.names, ['full', 'short'], 'full');
  const size = pick(p.size, ['standard', 'compact'], 'standard');
  const logos = Boolean(p.logos);
  const league = str(p.league);
  const season = str(p.season);
  const href = url(p.href);
  const asButton = !href && obj(options).button === true;
  const clickable = Boolean(href) || asButton;
  const leagueHref = url(p.leagueHref);

  const rec = recordInfo(obj(p.record));
  const pos = rankInfo(num(p.rank), num(p.rankOf));
  const points = num(p.points);
  const squadLine = squadText(obj(p.squad));
  const statList = statEntries(obj(p.stats));
  const next = p.next && typeof p.next === 'object' ? obj(p.next) : undefined;
  const last = p.last && typeof p.last === 'object' ? obj(p.last) : undefined;
  const at = (value) => (value === 'gast' ? 'gast' : value === 'heim' ? 'heim' : undefined);
  // `outcome` (Forfait, Wertung) nur als S, N oder U: der Wert fließt in Klasse und Text
  const res = last
    ? lastResult({ ...last, ownScore: num(last.ownScore), opponentScore: num(last.opponentScore), opponent: obj(last.opponent), outcome: OUTCOMES.includes(last.outcome) ? last.outcome : undefined })
    : undefined;

  const name = nameText(own, names);
  const nameBlock = href
    ? `<a class="dss-team-link" href="${attr(href)}">${name}</a>`
    : asButton
      ? `<button class="dss-team-link" type="button">${name}</button>`
      : name;
  const leagueLine =
    league || season
      ? `<div class="dss-team-sub">${league ? (leagueHref && !clickable ? `<a class="dss-link" href="${attr(leagueHref)}">${esc(league)}</a>` : `<span>${esc(league)}</span>`) : ''}${season ? `<span>${esc(season)}</span>` : ''}</div>`
      : '';

  if (size === 'compact') {
    return (
      `<div class="${klass('dss-team', 'dss-team--compact', clickable && 'dss-team--link', str(p.className))}">` +
      `${logoBadge(own)}<div class="dss-team-who"><span class="dss-team-nm">${nameBlock}</span>${leagueLine}</div>` +
      '<span class="dss-team-end">' +
      (rec ? `<span class="dss-team-rec" aria-hidden="true">${esc(rec.text)}</span><span class="dss-sr-only">${esc(rec.aria)}</span>` : '') +
      (pos ? `<span class="dss-team-rank" aria-hidden="true">Platz ${esc(pos.text)}</span><span class="dss-sr-only">${esc(pos.aria)}</span>` : '') +
      '</span></div>'
    );
  }

  const tag = headingOf(p.titleAs);
  const vitals =
    rec || pos || points !== undefined
      ? `<div class="dss-team-vitals">${rec ? tile(rec.text, rec.label, rec.aria) : ''}${pos ? tile(pos.text, pos.label, pos.aria) : ''}${points !== undefined ? tile(String(points), 'Punkte', `Punkte: ${points}`) : ''}</div>`
      : '';
  let games = '';
  if (next || last) {
    const when = next ? [str(next.date), str(next.time)].filter(Boolean).join(' · ') : '';
    const lastDate = last ? str(last.date) : '';
    games =
      '<div class="dss-team-games">' +
      (next
        ? `<div class="dss-team-game"><div class="dss-team-game-l">Nächstes Spiel</div><div class="dss-team-game-row">${opponent(next.opponent, at(next.at), names, logos)}${when ? `<span class="dss-team-game-end">${esc(when)}</span>` : ''}</div>${str(next.venue) ? `<div class="dss-team-game-venue">${esc(next.venue)}</div>` : ''}</div>`
        : '') +
      (last
        ? `<div class="dss-team-game"><div class="dss-team-game-l">${lastDate ? `Letztes Spiel · ${esc(lastDate)}` : 'Letztes Spiel'}</div><div class="dss-team-game-row">${opponent(last.opponent, at(last.at), names, logos)}` +
          (res
            ? `<span class="dss-team-game-end">${OUTCOMES.includes(res.outcome) ? `<span class="dss-chip dss-chip--mono${OUTCOME_CHIP[res.outcome] ? ` ${OUTCOME_CHIP[res.outcome]}` : ''}" aria-hidden="true">${esc(res.outcome)}</span>` : ''}<span class="dss-team-game-score" aria-hidden="true">${esc(res.score)}</span><span class="dss-sr-only">${esc(res.aria)}</span></span>`
            : '') +
          '</div></div>'
        : '') +
      '</div>';
  }
  const stats = statList.length
    ? `<div class="dss-team-stats" role="group" aria-label="Saison-Statistik"><div class="dss-team-sec" aria-hidden="true">Saison-Statistik</div><div class="dss-team-vitals">${statList.map((s) => `<div><div class="dss-pc-v">${esc(s.value)}</div><div class="dss-pc-l">${esc(s.label)}</div></div>`).join('')}</div></div>`
    : '';
  return (
    `<div class="${klass('dss-team', 'dss-team--standard', clickable && 'dss-team--link', str(p.className))}">` +
    `<div class="dss-team-head">${logoBadge(own, 'dss-team-logo--lg')}<div class="dss-team-who"><${tag} class="dss-team-nm">${nameBlock}</${tag}>${leagueLine}</div></div>` +
    `${vitals}${games}${squadLine ? `<div class="dss-team-squad">${esc(squadLine)}</div>` : ''}${stats}</div>`
  );
}

/** Setzt `renderTeamCard` in `el` ein; `options.onClick(event)` macht den Namen zum Button (mit `href`: zusätzlicher Handler am Link). */
export function mountTeamCard(el, props, options = {}) {
  const { onClick, ...rest } = obj(options);
  const handler = typeof onClick === 'function';
  const on = handler ? [{ type: 'click', selector: '.dss-team-link', handler: (event) => onClick(event) }] : [];
  return mount(el, renderTeamCard, props, { ...rest, button: handler, on: [...(Array.isArray(rest.on) ? rest.on : []), ...on] });
}
