/**
 * HoopsFoundry UI Render · TeamCard (Mannschaftskarte)
 * --------------------------------------------------------------
 * `renderTeamCard(props, options?)`/`mountTeamCard(el, props, options?)`: dasselbe Markup wie die Komponente TeamCard (Svelte, React).
 * Props: `name`, `short`, `logo`, `names`, `logos`, `league`, `leagueHref`, `season`, `record`, `rank`, `rankOf`, `points`, `next`, `last`, `squad`,
 * `stats`, `size` (`standard`, `compact`), `href`, `titleAs`, `className`. Mit `href` ist die Karte ein Link, mit `options.button`
 * (`mountTeamCard`: `options.onClick`) ein Button, sonst nicht klickbar; `leagueHref` zählt nur ohne Aktion. Bilanz, Platz, Kader, Statistik und
 * Ergebnis kommen aus js/team.js. Typen: js/render/team-card.d.ts.
 */
import { t as tr } from '../i18n/index.js';
import { lastResult, opponentPrefix, rankInfo, recordInfo, squadText, statEntries } from '../team.js';
import { attr, esc } from './escape.js';
import { headingOf, klass, logoBadge, nameText, num, obj, pick, str, teamOf, url, withLang } from './core.js';
import { mount } from './mount.js';

const OUTCOMES = ['S', 'N', 'U'];
const OUTCOME_CHIP = { S: 'hoops-chip--ok', N: 'hoops-chip--err', U: '' };
// Kennbuchstabe im Chip (die Daten `S`, `N`, `U` bleiben, die Anzeige geht über den Katalog) und Kennzeichen „Heimspiel“/„Auswärtsspiel“
const OUTCOME_LETTER = { S: 'common.outcome-letter.win', N: 'common.outcome-letter.loss', U: 'common.outcome-letter.draw' };
const AT_KEY = { heim: 'schedule.chip.home', gast: 'schedule.chip.away' };

const tile = (value, label, aria) =>
  `<div><div class="hoops-pc-v" aria-hidden="true">${esc(value)}</div><div class="hoops-pc-l" aria-hidden="true">${esc(label)}</div><span class="hoops-sr-only">${esc(aria)}</span></div>`;

/** Ein Gegner in einer Spielzeile; `team` aus unvertrauten Daten (fehlt es, bleibt der Name leer). */
function opponent(raw, at, names, logos, options) {
  const o = teamOf(raw);
  const badge = at ? `<span class="hoops-chip hoops-chip--mono ${at === 'gast' ? 'hoops-chip--amber' : 'hoops-chip--sky'}" aria-hidden="true">${esc(tr(AT_KEY[at], undefined, options))}</span>` : '';
  return `${badge}<span class="hoops-team-game-opp">${logos ? logoBadge(o, 'hoops-team-logo--sm') : ''}<span><span class="hoops-sr-only">${esc(opponentPrefix(at, options))}</span>${nameText(o, names)}</span></span>`;
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

  const rec = recordInfo(obj(p.record), options);
  const pos = rankInfo(num(p.rank), num(p.rankOf), options);
  const points = num(p.points);
  const squadLine = squadText(obj(p.squad), options);
  const statList = statEntries(obj(p.stats), options);
  const next = p.next && typeof p.next === 'object' ? obj(p.next) : undefined;
  const last = p.last && typeof p.last === 'object' ? obj(p.last) : undefined;
  const at = (value) => (value === 'gast' ? 'gast' : value === 'heim' ? 'heim' : undefined);
  // `outcome` (Forfait, Wertung) nur als S, N oder U: der Wert fließt in Klasse und Text
  const res = last
    ? lastResult({ ...last, ownScore: num(last.ownScore), opponentScore: num(last.opponentScore), opponent: obj(last.opponent), outcome: OUTCOMES.includes(last.outcome) ? last.outcome : undefined }, options)
    : undefined;

  const name = nameText(own, names);
  const nameBlock = href
    ? `<a class="hoops-team-link" href="${attr(href)}">${name}</a>`
    : asButton
      ? `<button class="hoops-team-link" type="button">${name}</button>`
      : name;
  const leagueLine =
    league || season
      ? `<div class="hoops-team-sub">${league ? (leagueHref && !clickable ? `<a class="hoops-link" href="${attr(leagueHref)}">${esc(league)}</a>` : `<span>${esc(league)}</span>`) : ''}${season ? `<span>${esc(season)}</span>` : ''}</div>`
      : '';

  if (size === 'compact') {
    return withLang(
      `<div class="${klass('hoops-team', 'hoops-team--compact', clickable && 'hoops-team--link', str(p.className))}">` +
      `${logoBadge(own)}<div class="hoops-team-who"><span class="hoops-team-nm">${nameBlock}</span>${leagueLine}</div>` +
      '<span class="hoops-team-end">' +
      (rec ? `<span class="hoops-team-rec" aria-hidden="true">${esc(rec.text)}</span><span class="hoops-sr-only">${esc(rec.aria)}</span>` : '') +
      (pos ? `<span class="hoops-team-rank" aria-hidden="true">${esc(tr('team.rank.compact', { rank: pos.text }, options))}</span><span class="hoops-sr-only">${esc(pos.aria)}</span>` : '') +
      '</span></div>',
      options,
    );
  }

  const tag = headingOf(p.titleAs);
  const vitals =
    rec || pos || points !== undefined
      ? `<div class="hoops-team-vitals">${rec ? tile(rec.text, rec.label, rec.aria) : ''}${pos ? tile(pos.text, pos.label, pos.aria) : ''}${points !== undefined ? tile(String(points), tr('team.points', undefined, options), tr('team.points-aria', { points }, options)) : ''}</div>`
      : '';
  let games = '';
  if (next || last) {
    const when = next ? [str(next.date), str(next.time)].filter(Boolean).join(' · ') : '';
    const lastDate = last ? str(last.date) : '';
    games =
      '<div class="hoops-team-games">' +
      (next
        ? `<div class="hoops-team-game"><div class="hoops-team-game-l">${esc(tr('team.next', undefined, options))}</div><div class="hoops-team-game-row">${opponent(next.opponent, at(next.at), names, logos, options)}${when ? `<span class="hoops-team-game-end">${esc(when)}</span>` : ''}</div>${str(next.venue) ? `<div class="hoops-team-game-venue">${esc(next.venue)}</div>` : ''}</div>`
        : '') +
      (last
        ? `<div class="hoops-team-game"><div class="hoops-team-game-l">${lastDate ? `${esc(tr('team.last', undefined, options))} · ${esc(lastDate)}` : esc(tr('team.last', undefined, options))}</div><div class="hoops-team-game-row">${opponent(last.opponent, at(last.at), names, logos, options)}` +
          (res
            ? `<span class="hoops-team-game-end">${OUTCOMES.includes(res.outcome) ? `<span class="hoops-chip hoops-chip--mono${OUTCOME_CHIP[res.outcome] ? ` ${OUTCOME_CHIP[res.outcome]}` : ''}" aria-hidden="true">${esc(tr(OUTCOME_LETTER[res.outcome], undefined, options))}</span>` : ''}<span class="hoops-team-game-score" aria-hidden="true">${esc(res.score)}</span><span class="hoops-sr-only">${esc(res.aria)}</span></span>`
            : '') +
          '</div></div>'
        : '') +
      '</div>';
  }
  const stats = statList.length
    ? `<div class="hoops-team-stats" role="group" aria-label="${attr(tr('team.season-stats', undefined, options))}"><div class="hoops-team-sec" aria-hidden="true">${esc(tr('team.season-stats', undefined, options))}</div><div class="hoops-team-vitals">${statList.map((s) => `<div><div class="hoops-pc-v">${esc(s.value)}</div><div class="hoops-pc-l">${esc(s.label)}</div></div>`).join('')}</div></div>`
    : '';
  return withLang(
    `<div class="${klass('hoops-team', 'hoops-team--standard', clickable && 'hoops-team--link', str(p.className))}">` +
      `<div class="hoops-team-head">${logoBadge(own, 'hoops-team-logo--lg')}<div class="hoops-team-who"><${tag} class="hoops-team-nm">${nameBlock}</${tag}>${leagueLine}</div></div>` +
      `${vitals}${games}${squadLine ? `<div class="hoops-team-squad">${esc(squadLine)}</div>` : ''}${stats}</div>`,
    options,
  );
}

/** Setzt `renderTeamCard` in `el` ein; `options.onClick(event)` macht den Namen zum Button (mit `href`: zusätzlicher Handler am Link). */
export function mountTeamCard(el, props, options = {}) {
  const { onClick, ...rest } = obj(options);
  const handler = typeof onClick === 'function';
  const on = handler ? [{ type: 'click', selector: '.hoops-team-link', handler: (event) => onClick(event) }] : [];
  return mount(el, renderTeamCard, props, { ...rest, button: handler, on: [...(Array.isArray(rest.on) ? rest.on : []), ...on] });
}
