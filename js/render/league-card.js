/**
 * HoopsFoundry UI Render · LeagueCard (Ligencard)
 * --------------------------------------------------------------
 * `renderLeagueCard(props, options?)`/`mountLeagueCard(el, props, options?)`: dasselbe Markup wie die Komponente LeagueCard (Svelte, React).
 * Props: `title`, `teams`, `teamCount`, `played`, `total`, `columns` (`won`, `lost`, `diff`, `form`), `limit` (Standard 3), `href`, `linkLabel`,
 * `live`, `names`, `logos`, `size`, `titleAs`, `collapsible`, `open`, `id`, `className`. Der Ausschnitt der Tabelle (`leagueWindow`),
 * Untertitel, Beschriftung, Zonen und Live-Hinweis kommen aus js/league.js. Typen: js/render/league-card.d.ts.
 */
import {
  cellNumber, diffSign, diffText, leagueSummary, leagueWindow, liveInfo, rankText, teamTotal, windowLabel, zoneInfo, zoneLegend,
} from '../league.js';
import { t as tr } from '../i18n/index.js';
import { attr, esc } from './escape.js';
import {
  collapsibleFrame, cls, formChips, headingOf, klass, list, logoBadge, nameText, num, obj, pick, str, teamOf, uidFor, url, withLang,
} from './core.js';
import { mount } from './mount.js';

/** Eine Zeile der Tabelle aus unvertrauten Daten: Name, Kurzname, Logo und Ziel geprüft; die Werte prüfen `cellNumber` und Verwandte selbst. */
function rowOf(raw) {
  const t = obj(raw);
  const { name, short, logo, href, own } = teamOf(t);
  return {
    name, short, logo, href, own, rank: num(t.rank),
    played: t.played, won: t.won, lost: t.lost, diff: t.diff, points: t.points,
    zone: typeof t.zone === 'string' ? t.zone : undefined,
    form: Array.isArray(t.form) ? t.form : [],
  };
}

const liveMeta = (tag, options) =>
  `<span class="hoops-league-live"><span class="hoops-live"><span class="hoops-live-dot" aria-hidden="true"></span>${esc(tr('common.live', undefined, options))}</span>${tag.text ? `<span class="hoops-league-live-n">${esc(tag.text)}</span>` : ''}</span>`;

/** Ligencard: Mini-Tabelle mit Ausschnitt um die eigene Mannschaft (sonst die ersten Plätze) und Link zur kompletten Tabelle. */
export function renderLeagueCard(props, options) {
  const p = obj(props);
  const title = str(p.title);
  const names = pick(p.names, ['full', 'short'], 'full');
  const size = pick(p.size, ['standard', 'compact'], 'standard');
  const logos = Boolean(p.logos);
  const columns = Array.isArray(p.columns) ? p.columns : [];
  // Ausschnitt über die gemeinsame Regel; die Zeilen sind danach geprüfte Kopien
  const teams = list(p.teams);
  const rows = leagueWindow(teams.filter((t) => t && typeof t === 'object').map(rowOf), { limit: p.limit });
  const count = teamTotal(p.teamCount, teams);
  const summary = size === 'compact' ? '' : leagueSummary({ teamCount: count, played: p.played, total: p.total }, options);
  const caption = [title, windowLabel(rows, count, options)].filter(Boolean).join(', ');
  const legend = zoneLegend(rows, options);
  const liveTag = liveInfo(p.live, options);
  const [wantsWon, wantsLost, wantsDiff, wantsForm] = ['won', 'lost', 'diff', 'form'].map((name) => columns.includes(name));
  const target = url(p.href);
  const linkLabel = typeof p.linkLabel === 'string' ? p.linkLabel : tr('league.link', undefined, options);
  const id = str(p.id);

  const head = (shown, hidden, extra) => `<th scope="col"${extra ? ` class="${extra}"` : ''}><span aria-hidden="true">${esc(shown)}</span><span class="hoops-sr-only">${esc(hidden)}</span></th>`;
  const header =
    '<thead><tr>' +
    `<th scope="col" class="hoops-league-rank"><span aria-hidden="true">#</span><span class="hoops-sr-only">${esc(tr('league.col.rank', undefined, options))}</span></th>` +
    `<th scope="col">${esc(tr('league.col.team', undefined, options))}</th>` +
    head(tr('league.col.played-short', undefined, options), tr('league.col.played', undefined, options), 'num') +
    (wantsWon ? head(tr('league.col.won-short', undefined, options), tr('league.col.won', undefined, options), 'num hoops-league-opt') : '') +
    (wantsLost ? head(tr('league.col.lost-short', undefined, options), tr('league.col.lost', undefined, options), 'num hoops-league-opt') : '') +
    (wantsDiff ? head(tr('league.col.diff-short', undefined, options), tr('league.col.diff', undefined, options), 'num hoops-league-opt') : '') +
    head(tr('league.col.points-short', undefined, options), tr('league.col.points', undefined, options), 'num hoops-league-pts') +
    (wantsForm ? `<th scope="col" class="hoops-league-opt">${esc(tr('league.col.form', undefined, options))}</th>` : '') +
    '</tr></thead>';

  const body = rows
    .map((t) => {
      const zone = zoneInfo(t.zone, options);
      const sign = diffSign(t.diff);
      const name = nameText(t, names);
      const who =
        (logos ? logoBadge(t) : '') +
        (t.href ? `<a class="hoops-link hoops-league-link" href="${attr(t.href)}">${name}</a>` : name) +
        (t.own ? `<span class="hoops-sr-only">, ${esc(tr('league.own-team', undefined, options))}</span>` : '') +
        (zone ? `<span class="hoops-sr-only">, ${esc(zone.row)}</span>` : '');
      const rowClass = cls(t.own && 'is-own', zone && 'hoops-league-zone', zone && `hoops-league-zone--${zone.zone}`);
      return (
        `<tr${rowClass ? ` class="${klass(rowClass)}"` : ''}>` +
        `<td class="hoops-league-rank">${esc(rankText(t.rank))}</td>` +
        `<td class="hoops-league-team"><span class="hoops-league-who">${who}</span></td>` +
        `<td class="num">${esc(cellNumber(t.played, options))}</td>` +
        (wantsWon ? `<td class="num hoops-league-opt">${esc(cellNumber(t.won, options))}</td>` : '') +
        (wantsLost ? `<td class="num hoops-league-opt">${esc(cellNumber(t.lost, options))}</td>` : '') +
        (wantsDiff ? `<td class="${klass('num', 'hoops-league-opt', sign)}">${esc(diffText(t.diff, options))}</td>` : '') +
        `<td class="num lead hoops-league-pts">${esc(cellNumber(t.points, options))}</td>` +
        (wantsForm ? `<td class="hoops-league-opt">${formChips(t.form, undefined, undefined, options)}</td>` : '') +
        '</tr>'
      );
    })
    .join('');

  const panel =
    `<div class="hoops-table-scroll hoops-league-scroll" role="region" tabindex="0" aria-label="${attr(title ? tr('league.table-titled', { title }, options) : tr('league.table', undefined, options))}">` +
    `<table class="${klass('hoops-tbl', `hoops-tbl--${size === 'compact' ? 'compact' : 'touch'}`, 'hoops-league-tbl')}">` +
    (caption ? `<caption class="hoops-sr-only">${esc(caption)}</caption>` : '') +
    `${header}<tbody>${body}</tbody></table></div>` +
    (legend.length
      ? `<ul class="hoops-league-legend" aria-label="${attr(tr('league.legend', undefined, options))}">${legend.map((z) => `<li><span class="hoops-league-key hoops-league-key--${z.zone}" aria-hidden="true"></span>${esc(z.legend)}</li>`).join('')}</ul>`
      : '') +
    (target ? `<div class="hoops-league-foot"><a class="hoops-link hoops-league-more" href="${attr(target)}">${esc(linkLabel)}<span class="hoops-sr-only">, ${esc(title)}</span></a></div>` : '');

  const rootClass = cls('hoops-league', size === 'compact' && 'hoops-league--compact', str(p.className));
  if (p.collapsible === true && title) {
    return withLang(
      collapsibleFrame({
        kind: 'league', rootClass, id, title, sub: summary, titleAs: p.titleAs, open: p.open === true,
        meta: liveTag ? liveMeta(liveTag, options) : undefined, content: panel, uid: uidFor(p, options),
      }),
      options,
    );
  }
  const tag = headingOf(p.titleAs);
  return withLang(
    `<div class="${klass(rootClass)}"><div class="hoops-league-head"><div class="hoops-league-heading"><${tag} class="hoops-league-title">${esc(title)}</${tag}>` +
      `${summary ? `<p class="hoops-league-sub">${esc(summary)}</p>` : ''}</div>${liveTag ? liveMeta(liveTag, options) : ''}</div>${panel}</div>`,
    options,
  );
}

/** Setzt `renderLeagueCard` in `el` ein. Gibt `{ update(props), destroy() }` zurück; `collapsible` startet das Accordion-Verhalten. */
export const mountLeagueCard = (el, props, options) => mount(el, renderLeagueCard, props, options);
