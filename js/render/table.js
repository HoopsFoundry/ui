/**
 * HoopsFoundry UI Render · Table
 * --------------------------------------------------------------
 * `renderTable(props)`/`mountTable(el, props)`: dasselbe Markup wie die Komponente Table (Svelte, React). Die Zellen kommen nicht als Markup,
 * sondern als Daten: `rows` (und `head`, `foot`) sind Listen von Zeilen; eine Zeile ist eine Liste von Zellen oder `{ cells, className }`,
 * eine Zelle ein Text, eine Zahl oder `{ text, className, href, header, colSpan }` (`header: true` ergibt `th scope="row"`, `href` einen
 * Link über `safeHref`). Props wie die Komponente: `title`, `titleAs`, `meta`, `live`, `density`, `dark`, `striped`, `columns`, `caption`,
 * `collapsible`, `open`, `id`, `className`. Typen: js/render/table.d.ts.
 */
import { t as tr } from '../i18n/index.js';
import { attr, esc } from './escape.js';
import { collapsibleFrame, cls, headingOf, klass, list, obj, pick, str, uidFor, url, withLang } from './core.js';
import { mount } from './mount.js';

const DENSITIES = ['touch', 'default', 'compact', 'dense'];
const ALIGNS = ['left', 'right', 'center'];
const SORTS = ['asc', 'desc'];
const ARIA_SORT = { asc: 'ascending', desc: 'descending' };
// Breite einer Spalte: Zahl (Pixel) oder Länge mit Einheit; alles andere entfällt (kein freies CSS aus Daten)
const WIDTH = /^\d{1,4}(\.\d{1,3})?(px|%|rem|em|ch|vw)$/;

const cell = (raw, tag = 'td') => {
  const c = typeof raw === 'string' || typeof raw === 'number' ? { text: raw } : obj(raw);
  const href = url(c.href);
  const inner = href ? `<a class="hoops-link" href="${attr(href)}">${esc(c.text)}</a>` : esc(c.text);
  const name = c.header === true ? 'th' : tag;
  // Kopfzellen gelten für Spalten; eine Kopfzelle im Rumpf (`header: true`) für die Zeile
  const scope = name === 'th' ? ` scope="${tag === 'th' ? 'col' : 'row'}"` : '';
  const klassName = str(c.className);
  const span = Number.isInteger(c.colSpan) && c.colSpan > 1 && c.colSpan <= 100 ? ` colspan="${c.colSpan}"` : '';
  return `<${name}${scope}${klassName ? ` class="${attr(klassName)}"` : ''}${span}>${inner}</${name}>`;
};

const rowsOf = (value, tag) =>
  list(value)
    .map((raw) => {
      const row = Array.isArray(raw) ? { cells: raw } : obj(raw);
      const klassName = str(row.className);
      return `<tr${klassName ? ` class="${attr(klassName)}"` : ''}>${list(row.cells).map((c) => cell(c, tag)).join('')}</tr>`;
    })
    .join('');

/** Datentabelle im HoopsFoundry-UI-Rahmen (Titelzeile optional). */
export function renderTable(props, options) {
  const p = obj(props);
  const title = str(p.title);
  const meta = str(p.meta);
  const live = p.live === true;
  const density = pick(p.density, DENSITIES, 'default');
  const caption = str(p.caption);
  const id = str(p.id);
  const columns = Array.isArray(p.columns) ? p.columns : undefined;
  const open = p.open === true;

  const head = columns
    ? `<thead><tr>${columns
        .map((raw) => {
          const col = obj(raw);
          const sort = pick(col.sort, SORTS, undefined);
          const width = typeof col.width === 'number' && Number.isFinite(col.width) && col.width >= 0 ? `${col.width}px` : str(col.width);
          return `<th scope="col" class="${klass(pick(col.align, ALIGNS, 'left'), col.sortable === true && 'sortable', sort && `sort-${sort}`)}"${WIDTH.test(width) ? ` style="width: ${attr(width)};"` : ''}${sort ? ` aria-sort="${ARIA_SORT[sort]}"` : ''}>${esc(col.label)}</th>`;
        })
        .join('')}</tr></thead>`
    : list(p.head).length ? `<thead>${rowsOf(p.head, 'th')}</thead>` : '';
  const foot = list(p.foot).length ? `<tfoot>${rowsOf(p.foot, 'td')}</tfoot>` : '';
  const region =
    `<div class="hoops-table-scroll" role="region" tabindex="0" aria-label="${attr(caption || title || tr('table.label', undefined, options))}">` +
    `<table class="${klass('hoops-tbl', `hoops-tbl--${density}`, p.striped === true && 'hoops-tbl--striped')}">` +
    (caption ? `<caption class="hoops-sr-only">${esc(caption)}</caption>` : '') +
    `${head}<tbody>${rowsOf(p.rows, 'td')}</tbody>${foot}</table></div>`;

  const rootClass = cls('hoops-frame', p.dark === true && 'hoops-frame--dark', str(p.className));
  const metaInner = `${meta ? `<span>${esc(meta)}</span>` : ''}${live ? `<span class="hoops-crumb"><span class="hoops-crumb-dot" aria-hidden="true"></span> ${esc(tr('common.live', undefined, options))}</span>` : ''}`;

  if (p.collapsible === true && title) {
    return withLang(
      collapsibleFrame({
        kind: 'frame', rootClass, id, title, titleAs: p.titleAs, open,
        meta: meta || live ? `<span class="hoops-frame-meta">${metaInner}</span>` : undefined,
        content: region, uid: uidFor(p, options),
      }),
      options,
    );
  }
  const tag = headingOf(p.titleAs);
  const header =
    title || meta || live
      ? `<div class="hoops-frame-head">${title ? `<${tag} class="hoops-frame-title">${esc(title)}</${tag}>` : '<span></span>'}<div class="hoops-frame-meta">${metaInner}</div></div>`
      : '';
  return withLang(`<div class="${klass(rootClass)}">${header}${region}</div>`, options);
}

/** Setzt `renderTable` in `el` ein. Gibt `{ update(props), destroy() }` zurück; `collapsible` startet das Accordion-Verhalten. */
export const mountTable = (el, props, options) => mount(el, renderTable, props, options);
