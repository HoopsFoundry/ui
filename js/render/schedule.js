/**
 * HoopsFoundry UI Render · Spielplan (ScheduleTable, ScheduleGrid)
 * --------------------------------------------------------------
 * `renderScheduleTable`/`renderScheduleGrid` und `mountScheduleTable`/`mountScheduleGrid`: dasselbe Markup wie die Komponenten ScheduleTable
 * und ScheduleGrid (Svelte, React). Props: `games`, `layout`, `density`, `names`, `logos`, `title`, `titleAs`, `meta`, `caption`, `collapsible`,
 * `open`, `id`, `className` (Grid zusätzlich `columns`, `slots`, `breaks`, `emptyLabel`). Statt der Snippets/`renderTime`/`renderNotice` gibt
 * es `options.time(game)` und `options.notice(game)`: sie liefern Text (kein Markup), der maskiert wird. Spiele und Teams werden vor der
 * Verwendung geprüft (Texte als Text, Zahlen endlich, Ziele über `safeHref`), die Entscheidungen kommen aus js/schedule.js.
 * Typen: js/render/schedule.d.ts.
 */
import {
  ariaForResult, buildGrid, columnsFor, densityFor, groupBySection, hasScore, initials, layoutFor, resolveOutcome, stateLabel, winnerSide,
} from '../schedule.js';
import { attr, esc } from './escape.js';
import {
  collapsibleFrame, cls, headingOf, klass, list, liveTag, logoBadge, nameText, num, obj, pick, str, teamOf, uidFor, url,
} from './core.js';
import { mount } from './mount.js';

const STATES = ['scheduled', 'live', 'finished', 'cancelled', 'postponed', 'bye'];
const OUTCOMES = ['S', 'N', 'U'];
const OUTCOME_CHIP = { S: 'hoops-chip--ok', N: 'hoops-chip--err', U: '' };

/** Ein Spiel aus unvertrauten Daten: Texte als Text, Punkte nur endlich, Teams und Ziele geprüft. */
function gameOf(raw, index) {
  const g = obj(raw);
  const team = (value) => (value === undefined || value === null ? undefined : teamOf(value));
  const league = g.league && typeof g.league === 'object' ? { name: str(obj(g.league).name), href: url(obj(g.league).href) } : undefined;
  return {
    id: str(g.id) || `spiel-${index}`,
    nr: str(g.nr), section: str(g.section) || undefined, date: str(g.date), time: str(g.time), venue: str(g.venue), field: str(g.field),
    column: str(g.column), note: str(g.note),
    state: pick(g.state, STATES, 'scheduled'),
    heim: team(g.heim), gast: team(g.gast), opponent: team(g.opponent),
    at: g.at === 'gast' ? 'gast' : g.at === 'heim' ? 'heim' : undefined,
    ownScore: num(g.ownScore),
    outcome: OUTCOMES.includes(g.outcome) ? g.outcome : undefined,
    league,
    provisional: g.provisional === true,
  };
}
const gamesOf = (value) => list(value).filter((g) => g && typeof g === 'object').map(gameOf);

/** Ein Teamname im Spielplan: Platzhalter kursiv, mit Ziel als Link, Verlierer abgeblendet, optional mit Logo. */
function teamName(team, { loser = false, names, logo = false }) {
  const current = team ?? { name: '?' };
  const text = nameText(current, names);
  const label = current.placeholder ? `<span class="hoops-sch-ph">${text}</span>` : text;
  const node = current.href && !current.placeholder ? `<a class="hoops-link" href="${attr(current.href)}">${label}</a>` : label;
  const withLogo = logo && team !== undefined && !current.placeholder;
  return `<span class="${klass('hoops-sch-team', loser && 'is-loser', withLogo && 'hoops-sch-team--logo')}">${withLogo ? logoBadge(current) : ''}${node}</span>`;
}

/** Sichtbares Ergebnis (für Screenreader versteckt) plus gesprochener Text; „vorläufig“ steht klein unter der Zahl. */
const resultText = (visible, spoken, provisional, chip = '') =>
  `<span class="hoops-sch-resbox">${chip}<span class="hoops-sch-score" aria-hidden="true">${esc(visible)}</span><span class="hoops-sr-only">${esc(spoken)}</span>` +
  `${provisional ? '<small class="hoops-sch-prov" aria-hidden="true">vorläufig</small>' : ''}</span>`;

const extraOf = (fn, game) => {
  if (typeof fn !== 'function') return '';
  try {
    return esc(fn(game));
  } catch {
    return '';
  }
};

/** Rahmen um den Scrollbereich: einklappbar (Kopf als Bereichskopf) oder mit einfachem Kopf. */
function framed(p, region, options) {
  const title = str(p.title);
  const meta = str(p.meta);
  const rootClass = cls('hoops-frame', str(p.className));
  if (p.collapsible === true && title) {
    return collapsibleFrame({
      kind: 'frame', rootClass, id: str(p.id), title, titleAs: p.titleAs, open: p.open === true,
      meta: meta ? `<span class="hoops-frame-meta"><span>${esc(meta)}</span></span>` : undefined,
      content: region, uid: uidFor(p, options),
    });
  }
  const tag = headingOf(p.titleAs);
  const head =
    title || meta
      ? `<div class="hoops-frame-head">${title ? `<${tag} class="hoops-frame-title">${esc(title)}</${tag}>` : '<span></span>'}<div class="hoops-frame-meta">${meta ? `<span>${esc(meta)}</span>` : ''}</div></div>`
      : '';
  return `<div class="${klass(rootClass)}">${head}${region}</div>`;
}

/** Spielplan als Tabelle: Gegenüberstellung, Perspektive einer Mannschaft oder Turnier-Spalten. `options.time`/`options.notice`: Text je Spiel. */
export function renderScheduleTable(props, options) {
  const p = obj(props);
  const opts = obj(options);
  const games = gamesOf(p.games);
  const mode = pick(p.layout, ['versus', 'opponent', 'columns'], undefined) ?? layoutFor(games);
  const dens = pick(p.density, ['touch', 'default', 'compact'], undefined) ?? densityFor(games, mode);
  const hasNotice = typeof opts.notice === 'function';
  const cols = columnsFor(mode, games, hasNotice);
  const names = pick(p.names, ['full', 'short'], 'full');
  const logos = p.logos;
  const title = str(p.title);
  const caption = str(p.caption);

  const league = (game) => {
    if (!game.league) return '';
    const inner = game.league.href ? `<a class="hoops-link" href="${attr(game.league.href)}">${esc(game.league.name)}</a>` : esc(game.league.name);
    return `<span class="hoops-sch-sub">${inner}</span>`;
  };
  const note = (game) => (game.note ? `<span class="hoops-sch-note">${esc(game.note)}</span>` : '');
  const tn = (team, loser, logo) => teamName(team, { loser, names, logo });

  const cell = (key, game) => {
    const winner = winnerSide(game);
    switch (key) {
      case 'nr':
        return `<td role="cell" class="hoops-sch-nr">${esc(game.nr)}</td>`;
      case 'when': {
        const timeText = typeof opts.time === 'function' ? extraOf(opts.time, game) : esc(game.time);
        const hasTime = typeof opts.time === 'function' || game.time;
        return (
          '<td role="cell" class="hoops-sch-when">' +
          (game.date ? `<span class="hoops-sch-date">${esc(game.date)}</span>` : '') +
          (hasTime ? `<span class="hoops-sch-time">${timeText}</span>` : '') +
          (stateLabel(game.state) ? `<span class="hoops-sr-only"> ${esc(stateLabel(game.state))}</span>` : '') +
          (game.state === 'live' ? liveTag() : '') +
          (mode !== 'columns' && game.venue ? `<span class="hoops-sch-venue">${esc(game.venue)}</span>` : '') +
          '</td>'
        );
      }
      case 'ha':
        return `<td role="cell" class="hoops-sch-ha"><span class="hoops-chip hoops-chip--mono ${game.at === 'gast' ? 'hoops-chip--amber' : 'hoops-chip--sky'}">${game.at === 'gast' ? '@' : 'vs.'}</span></td>`;
      case 'match': {
        let inner;
        if (mode === 'opponent' && game.opponent) {
          const logo = logos !== false ? `<span class="hoops-sch-logo" aria-hidden="true">${game.opponent.logo ? `<img src="${attr(game.opponent.logo)}" alt="" loading="lazy">` : esc(initials(game.opponent.name))}</span>` : '';
          inner = `<span class="hoops-sch-opp">${logo}${tn(game.opponent, false, false)}</span>`;
        } else {
          inner =
            tn(game.heim, winner === 'gast', logos === true) + '<span class="hoops-sch-sep" aria-hidden="true"> – </span><span class="hoops-sr-only"> gegen </span>' +
            tn(game.gast, winner === 'heim', logos === true);
        }
        return `<td role="cell" class="hoops-sch-match">${inner}${league(game)}${note(game)}</td>`;
      }
      case 'heim':
        return `<td role="cell" class="hoops-sch-heim">${tn(game.heim, winner === 'gast', logos === true)}</td>`;
      case 'gast':
        return `<td role="cell" class="hoops-sch-gast">${tn(game.gast, winner === 'heim', logos === true)}${note(game)}</td>`;
      case 'field':
        return `<td role="cell" class="hoops-sch-field-cell">${game.field ? `<span class="hoops-chip hoops-chip--mono hoops-sch-field" title="${attr(game.field)}">${esc(game.field)}</span>` : ''}</td>`;
      case 'venue':
        return `<td role="cell" class="hoops-sch-venue-cell">${esc(game.venue)}</td>`;
      case 'res': {
        const scored = (game.state === 'finished' || game.state === 'live') && hasScore(game, mode);
        if (!scored) return '<td role="cell" class="hoops-sch-res"><span class="hoops-sch-none">–</span></td>';
        const result = mode === 'opponent' ? resolveOutcome(game) : undefined;
        const visible = mode === 'opponent' && game.opponent ? `${game.ownScore} : ${game.opponent.score}` : `${game.heim?.score} : ${game.gast?.score}`;
        const chip = OUTCOMES.includes(result) ? `<span class="hoops-chip hoops-chip--mono${OUTCOME_CHIP[result] ? ` ${OUTCOME_CHIP[result]}` : ''}" aria-hidden="true">${esc(result)}</span>` : '';
        return `<td role="cell" class="hoops-sch-res">${resultText(visible, ariaForResult(game, mode), game.provisional, chip)}</td>`;
      }
      case 'notice':
        return `<td role="cell" class="hoops-sch-notice">${extraOf(opts.notice, game)}</td>`;
      default:
        return '';
    }
  };

  const row = (game) => {
    const own = game.heim?.own || game.gast?.own;
    const classes = klass('hoops-sch-row', own && mode !== 'opponent' && 'is-own', game.state === 'live' && 'is-live', game.state === 'cancelled' && 'is-cancelled', game.state === 'postponed' && 'is-postponed', game.state === 'bye' && 'is-bye');
    if (game.state === 'bye') {
      const who = game.heim ? `${tn(game.heim, false, logos === true)} hat Freilos` : esc(game.note || 'Spielfrei');
      return `<tr role="row" class="${classes}"><td role="cell" class="hoops-sch-bye" colspan="${cols.length}">${game.time ? `<span class="hoops-sch-time">${esc(game.time)} · </span>` : ''}${who}</td></tr>`;
    }
    return `<tr role="row" class="${classes}">${cols.map((col) => cell(col.key, game)).join('')}</tr>`;
  };

  const body = groupBySection(games)
    .map((group) => (group.section ? `<tr role="row" class="hoops-sch-group"><th scope="colgroup" colspan="${cols.length}">${esc(group.section)}</th></tr>` : '') + group.games.map(row).join(''))
    .join('');
  const region =
    `<div class="hoops-table-scroll" role="region" tabindex="0" aria-label="${attr(caption || title || 'Spielplan')}">` +
    `<table role="table" class="${klass('hoops-tbl hoops-tbl--schedule', `hoops-tbl--${dens}`, `hoops-sch--${mode}`)}">` +
    (caption ? `<caption class="hoops-sr-only">${esc(caption)}</caption>` : '') +
    `<thead role="rowgroup"${mode === 'columns' ? '' : ' class="hoops-sr-only"'}><tr role="row">${cols.map((col) => `<th scope="col" role="columnheader">${esc(col.label)}</th>`).join('')}</tr></thead>` +
    `<tbody role="rowgroup">${body}</tbody></table></div>`;
  return framed(p, region, options);
}

/** Zeitraster: Anwurfzeiten als Zeilen, Hallen oder Felder als Spalten. `options.notice(game)`: zusätzlicher Text in der Spielzelle. */
export function renderScheduleGrid(props, options) {
  const p = obj(props);
  const opts = obj(options);
  const games = gamesOf(p.games);
  const columns = list(p.columns).map((raw) => ({ id: str(obj(raw).id), label: str(obj(raw).label) }));
  const slots = Array.isArray(p.slots) ? p.slots.map(str) : undefined;
  const breaks = list(p.breaks).map((raw) => ({ time: str(obj(raw).time), label: str(obj(raw).label) }));
  const emptyLabel = typeof p.emptyLabel === 'string' ? p.emptyLabel : 'frei';
  const density = pick(p.density, ['touch', 'default', 'compact'], 'default');
  const names = pick(p.names, ['full', 'short'], 'full');
  const logos = Boolean(p.logos);
  const title = str(p.title);
  const caption = str(p.caption);
  const rows = buildGrid({ games, columns, slots, breaks });
  const tn = (team, loser, logo) => teamName(team, { loser, names, logo });

  const gameBlock = (game) => {
    const winner = winnerSide(game);
    const own = game.heim?.own || game.gast?.own;
    const meta = [game.nr, game.section].filter(Boolean).join(' · ');
    const scored = hasScore(game, 'versus');
    return (
      `<div class="${klass('hoops-sg-game', own && 'is-own', game.state === 'live' && 'is-live', game.state === 'cancelled' && 'is-cancelled', game.state === 'postponed' && 'is-postponed')}">` +
      '<div class="hoops-sg-teams">' +
      (stateLabel(game.state) ? `<span class="hoops-sr-only">${esc(stateLabel(game.state))} </span>` : '') +
      tn(game.heim, winner === 'gast', logos) + '<span class="hoops-sch-sep" aria-hidden="true"> – </span><span class="hoops-sr-only"> gegen </span>' + tn(game.gast, winner === 'heim', logos) +
      (game.state === 'live' && !scored ? liveTag() : '') +
      '</div>' +
      ((game.state === 'finished' || game.state === 'live') && scored
        ? `<div class="hoops-sg-result">${resultText(`${game.heim?.score} : ${game.gast?.score}`, ariaForResult(game, 'versus'), game.provisional)}${game.state === 'live' ? liveTag() : ''}</div>`
        : '') +
      (meta ? `<div class="hoops-sg-meta">${esc(meta)}</div>` : '') +
      (game.note ? `<div class="hoops-sch-note">${esc(game.note)}</div>` : '') +
      extraOf(opts.notice, game) +
      '</div>'
    );
  };

  const body = rows
    .map((row) => {
      if (row.kind === 'break') {
        return `<tr role="row" class="hoops-sg-break"><th scope="row" role="rowheader" class="hoops-sg-time">${esc(row.time)}</th><td role="cell" colspan="${columns.length}">${esc(row.label)}</td></tr>`;
      }
      if (row.kind === 'bye') {
        const who = row.game.heim ? `${tn(row.game.heim, false, logos)} hat Freilos` : esc(row.game.note || 'Spielfrei');
        return `<tr role="row" class="hoops-sg-bye"><th scope="row" role="rowheader" class="hoops-sg-time">${row.time ? esc(row.time) : '<span class="hoops-sr-only">Zeit offen</span>'}</th><td role="cell" colspan="${columns.length}">${who}</td></tr>`;
      }
      const cells = row.cells
        .map((games, index) =>
          `<td role="cell" class="${klass('hoops-sg-cell', games.length === 0 && 'is-empty')}" data-label="${attr(columns[index].label)}">` +
          `${games.length === 0 ? `<span class="hoops-sg-empty">${esc(emptyLabel)}</span>` : games.map(gameBlock).join('')}</td>`,
        )
        .join('');
      return `<tr role="row"><th scope="row" role="rowheader" class="hoops-sg-time">${esc(row.time)}</th>${cells}</tr>`;
    })
    .join('');
  const region =
    `<div class="hoops-table-scroll" role="region" tabindex="0" aria-label="${attr(caption || title || 'Zeitraster')}">` +
    `<table role="table" class="${klass('hoops-tbl hoops-sgrid', `hoops-tbl--${density}`)}">` +
    (caption ? `<caption class="hoops-sr-only">${esc(caption)}</caption>` : '') +
    `<thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader" class="hoops-sg-time">Zeit</th>${columns.map((c) => `<th scope="col" role="columnheader">${esc(c.label)}</th>`).join('')}</tr></thead>` +
    `<tbody role="rowgroup">${body}</tbody></table></div>`;
  return framed(p, region, options);
}

/** Setzt `renderScheduleTable` in `el` ein (`options.time`, `options.notice` wie bei der Render-Funktion). */
export const mountScheduleTable = (el, props, options) => mount(el, renderScheduleTable, props, options);
/** Setzt `renderScheduleGrid` in `el` ein. */
export const mountScheduleGrid = (el, props, options) => mount(el, renderScheduleGrid, props, options);
