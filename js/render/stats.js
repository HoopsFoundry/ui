/**
 * HoopsFoundry UI Render · Kennzahlen (StatGrid) und Form (FormChips)
 * --------------------------------------------------------------
 * `renderStats(props)`/`mountStats(el, props)` und `renderFormChips(props)`/`mountFormChips(el, props)`: dasselbe Markup wie die Komponenten
 * StatGrid und FormChips (Svelte, React). Logik aus js/stats.js und js/league.js. Typen: js/render/stats.d.ts.
 */
import { statEmptyText, statItems } from '../stats.js';
import { esc } from './escape.js';
import { formChips, klass, obj, pick, str } from './core.js';
import { mount } from './mount.js';

/** Kennzahlen als Beschreibungsliste (`hoops-stats`); ohne gültigen Eintrag leer. Props: `items`, `compact`, `className`. */
export function renderStats(props) {
  const p = obj(props);
  const items = statItems(p.items);
  if (!items.length) return '';
  const cells = items
    .map((item) => {
      const value = item.empty ? `<span aria-hidden="true">${esc(item.value)}</span><span class="hoops-sr-only">${esc(statEmptyText)}</span>` : esc(item.value);
      return `<div class="hoops-stat"><dt class="hoops-stat-label">${esc(item.label)}</dt><dd class="hoops-stat-value">${value}</dd></div>`;
    })
    .join('');
  return `<dl class="${klass('hoops-stats', p.compact === true && 'hoops-stats--compact', str(p.className))}">${cells}</dl>`;
}

/** Form (letzte Spiele) als Zeichenreihe mit versteckter Beschreibung. Props: `form`, `variant` (`dots` oder `letters`), `className`. */
export function renderFormChips(props) {
  const p = obj(props);
  return formChips(p.form, pick(p.variant, ['dots', 'letters'], 'dots'), str(p.className));
}

/** Setzt `renderStats` in `el` ein. Gibt `{ update(props), destroy() }` zurück. */
export const mountStats = (el, props, options) => mount(el, renderStats, props, options);
/** Setzt `renderFormChips` in `el` ein. Gibt `{ update(props), destroy() }` zurück. */
export const mountFormChips = (el, props, options) => mount(el, renderFormChips, props, options);
