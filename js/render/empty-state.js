/**
 * HoopsFoundry UI Render · EmptyState
 * --------------------------------------------------------------
 * `renderEmptyState(props)`/`mountEmptyState(el, props, options)`: dasselbe Markup wie die Komponente EmptyState (Svelte, React).
 * Props: `tone` (`neutral`, `action`, `error`), `title`, `body`, `icon` (Sprite-ID mit `i-`, z. B. `i-calendar`), `cta` (Text des Buttons),
 * `actions` (weitere Links als `{ label, href, variant? }`), `extra` (Zusatztext unter den Aktionen), `titleAs`, `className`.
 * Der Klick auf `cta` kommt bei `mountEmptyState` über `options.onCta`. Typen: js/render/empty-state.d.ts.
 */
import { attr, esc } from './escape.js';
import { cls, headingOf, klass, list, obj, pick, str, url } from './core.js';
import { mount } from './mount.js';

const TONES = ['neutral', 'action', 'error'];
const CTA_VARIANT = { neutral: 'primary', action: 'amber', error: 'danger' };
const VARIANTS = ['primary', 'amber', 'secondary', 'danger', 'ghost'];

const SVG = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
const TONE_ICON = {
  error: `${SVG}<path d="m12 4 10 17H2L12 4Z"></path><path d="M12 10v5"></path><circle cx="12" cy="18.2" r=".7" fill="currentColor"></circle></svg>`,
  action: `${SVG}<circle cx="12" cy="12" r="9"></circle><path d="M12 8v5"></path><circle cx="12" cy="16.5" r=".7" fill="currentColor"></circle></svg>`,
  neutral: `${SVG}<rect x="4" y="5" width="16" height="14" rx="2"></rect><path d="M4 10h16"></path></svg>`,
};

/** Leer-, Hinweis- oder Fehlerzustand mit klarem nächsten Schritt. */
export function renderEmptyState(props) {
  const p = obj(props);
  const tone = pick(p.tone, TONES, 'neutral');
  const title = str(p.title);
  const body = str(p.body);
  const icon = str(p.icon);
  const cta = str(p.cta);
  const extra = str(p.extra);
  const tag = headingOf(p.titleAs);
  const symbol = /^[A-Za-z0-9_-]+$/.test(icon) ? `${SVG}<use href="#${icon}"></use></svg>` : TONE_ICON[tone];
  const actions = list(p.actions)
    .map((raw) => {
      const item = obj(raw);
      const href = url(item.href);
      const label = str(item.label);
      if (!href || !label) return '';
      return `<a class="hoops-btn hoops-btn--${pick(item.variant, VARIANTS, 'ghost')} hoops-btn--md" href="${attr(href)}">${esc(label)}</a>`;
    })
    .join('');
  const button = cta ? `<button type="button" class="${cls('hoops-btn', 'hoops-btn--md', `hoops-btn--${CTA_VARIANT[tone]}`)}">${esc(cta)}</button>` : '';
  return (
    `<div class="${klass('hoops-empty', `hoops-empty--${tone}`, str(p.className))}">` +
    `<div class="hoops-empty-icon">${symbol}</div>` +
    `<${tag} class="hoops-empty-title">${esc(title)}</${tag}>` +
    (body ? `<p class="hoops-empty-body">${esc(body)}</p>` : '') +
    (button || actions ? `<div class="hoops-empty-actions">${button}${actions}</div>` : '') +
    (extra ? `<div class="hoops-empty-extra">${esc(extra)}</div>` : '') +
    '</div>'
  );
}

/** Setzt `renderEmptyState` in `el` ein; `options.onCta(event)` hört auf den Klick des Buttons von `cta`. */
export function mountEmptyState(el, props, options = {}) {
  const { onCta, ...rest } = options && typeof options === 'object' ? options : {};
  const on = typeof onCta === 'function' ? [{ type: 'click', selector: '.hoops-empty-actions > button', handler: (event) => onCta(event) }] : [];
  return mount(el, renderEmptyState, props, { ...rest, on: [...(Array.isArray(rest.on) ? rest.on : []), ...on] });
}
