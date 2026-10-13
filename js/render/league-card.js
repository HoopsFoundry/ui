/**
 * DSS Render · LeagueCard (Ligencard)
 * --------------------------------------------------------------
 * `renderLeagueCard(props, options?)`/`mountLeagueCard(el, props, options?)`: dasselbe Markup wie die Komponente LeagueCard (Svelte, React).
 * Props: `title`, `teams`, `teamCount`, `played`, `total`, `columns` (`won`, `lost`, `diff`, `form`), `limit` (Standard 3), `href`, `linkLabel`,
 * `live`, `names`, `logos`, `size`, `titleAs`, `collapsible`, `open`, `id`, `className`. Der Ausschnitt der Tabelle (`leagueWindow`),
 * Untertitel, Beschriftung, Zonen und Live-Hinweis kommen aus js/league.js. Typen: js/render/league-card.d.ts.
 */
import {
  cellNumber, diffSign, diffText, leagueSummary, leagueWindow, liveInfo, rankText, teamTotal, windowLabel, zoneInfo, zoneLegend,
} from '../league.js';
import { attr, esc } from './escape.js';
import {
  collapsibleFrame, cls, formChips, headingOf, klass, list, logoBadge, nameText, num, obj, pick, str, teamOf, uidFor, url,
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

const liveMeta = (tag) =>
  `<span class="dss-league-live"><span class="dss-live"><span class="dss-live-dot" aria-hidden="true"></span>Live</span>${tag.text ? `<span class="dss-league-live-n">${esc(tag.text)}</span>` : ''}</span>`;

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
  const summary = size === 'compact' ? '' : leagueSummary({ teamCount: count, played: p.played, total: p.total });
  const caption = [title, windowLabel(rows, count)].filter(Boolean).join(', ');
  const legend = zoneLegend(rows);
  const liveTag = liveInfo(p.live);
  const [wantsWon, wantsLost, wantsDiff, wantsForm] = ['won', 'lost', 'diff', 'form'].map((name) => columns.includes(name));
  const target = url(p.href);
  const linkLabel = typeof p.linkLabel === 'string' ? p.linkLabel : 'Komplette Tabelle und Spielplan';
  const id = str(p.id);

  const head = (shown, hidden, extra) => `<th scope="col"${extra ? ` class="${extra}"` : ''}><span aria-hidden="true">${shown}</span><span class="dss-sr-only">${hidden}</span></th>`;
  const header =
    '<thead><tr>' +
    '<th scope="col" class="dss-league-rank"><span aria-hidden="true">#</span><span class="dss-sr-only">Platz</span></th>' +
    '<th scope="col">Mannschaft</th>' +
    head('SP', 'Spiele', 'num') +
    (wantsWon ? head('S', 'Siege', 'num dss-league-opt') : '') +
    (wantsLost ? head('N', 'Niederlagen', 'num dss-league-opt') : '') +
    (wantsDiff ? head('Diff', 'Korbdifferenz', 'num dss-league-opt') : '') +
    head('PKT', 'Punkte', 'num dss-league-pts') +
    (wantsForm ? '<th scope="col" class="dss-league-opt">Form</th>' : '') +
    '</tr></thead>';

  const body = rows
    .map((t) => {
      const zone = zoneInfo(t.zone);
      const sign = diffSign(t.diff);
      const name = nameText(t, names);
      const who =
        (logos ? logoBadge(t) : '') +
        (t.href ? `<a class="dss-link dss-league-link" href="${attr(t.href)}">${name}</a>` : name) +
        (t.own ? '<span class="dss-sr-only">, eigene Mannschaft</span>' : '') +
        (zone ? `<span class="dss-sr-only">, ${esc(zone.row)}</span>` : '');
      const rowClass = cls(t.own && 'is-own', zone && 'dss-league-zone', zone && `dss-league-zone--${zone.zone}`);
      return (
        `<tr${rowClass ? ` class="${klass(rowClass)}"` : ''}>` +
        `<td class="dss-league-rank">${esc(rankText(t.rank))}</td>` +
        `<td class="dss-league-team"><span class="dss-league-who">${who}</span></td>` +
        `<td class="num">${esc(cellNumber(t.played))}</td>` +
        (wantsWon ? `<td class="num dss-league-opt">${esc(cellNumber(t.won))}</td>` : '') +
        (wantsLost ? `<td class="num dss-league-opt">${esc(cellNumber(t.lost))}</td>` : '') +
        (wantsDiff ? `<td class="${klass('num', 'dss-league-opt', sign)}">${esc(diffText(t.diff))}</td>` : '') +
        `<td class="num lead dss-league-pts">${esc(cellNumber(t.points))}</td>` +
        (wantsForm ? `<td class="dss-league-opt">${formChips(t.form)}</td>` : '') +
        '</tr>'
      );
    })
    .join('');

  const panel =
    `<div class="dss-table-scroll dss-league-scroll" role="region" tabindex="0" aria-label="${attr(title ? `Tabelle: ${title}` : 'Tabelle')}">` +
    `<table class="${klass('dss-tbl', `dss-tbl--${size === 'compact' ? 'compact' : 'touch'}`, 'dss-league-tbl')}">` +
    (caption ? `<caption class="dss-sr-only">${esc(caption)}</caption>` : '') +
    `${header}<tbody>${body}</tbody></table></div>` +
    (legend.length
      ? `<ul class="dss-league-legend" aria-label="Legende">${legend.map((z) => `<li><span class="dss-league-key dss-league-key--${z.zone}" aria-hidden="true"></span>${esc(z.legend)}</li>`).join('')}</ul>`
      : '') +
    (target ? `<div class="dss-league-foot"><a class="dss-link dss-league-more" href="${attr(target)}">${esc(linkLabel)}<span class="dss-sr-only">, ${esc(title)}</span></a></div>` : '');

  const rootClass = cls('dss-league', size === 'compact' && 'dss-league--compact', str(p.className));
  if (p.collapsible === true && title) {
    return collapsibleFrame({
      kind: 'league', rootClass, id, title, sub: summary, titleAs: p.titleAs, open: p.open === true,
      meta: liveTag ? liveMeta(liveTag) : undefined, content: panel, uid: uidFor(p, options),
    });
  }
  const tag = headingOf(p.titleAs);
  return (
    `<div class="${klass(rootClass)}"><div class="dss-league-head"><div class="dss-league-heading"><${tag} class="dss-league-title">${esc(title)}</${tag}>` +
    `${summary ? `<p class="dss-league-sub">${esc(summary)}</p>` : ''}</div>${liveTag ? liveMeta(liveTag) : ''}</div>${panel}</div>`
  );
}

/** Setzt `renderLeagueCard` in `el` ein. Gibt `{ update(props), destroy() }` zurück; `collapsible` startet das Accordion-Verhalten. */
export const mountLeagueCard = (el, props, options) => mount(el, renderLeagueCard, props, options);
