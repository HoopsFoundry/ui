/**
 * DSS Render · einsetzen und aktualisieren
 * --------------------------------------------------------------
 * `mount(el, render, props, options)` setzt das Markup einer Render-Funktion in `el` ein (über `Range.createContextualFragment`, nie über
 * eine HTML-Eigenschaft), startet bei einklappbaren Rahmen das Accordion-Verhalten (`initAccordion`) und gibt `{ update(props), destroy() }`
 * zurück. Muster wie die `initX`-Bausteine (js/lifecycle.js): idempotent je Element (ein zweiter Aufruf ersetzt den ersten), `destroy()`
 * entfernt Listener und Markup und stellt den früheren Inhalt von `el` wieder her. `update` ersetzt den Inhalt und hält den Fokus (über
 * `id` oder die Lage im Baum) und den Zustand offen/zu eines einklappbaren Rahmens, solange `props.open` sich nicht ändert.
 * Typen: js/render/mount.d.ts.
 */
import { initAccordion } from '../accordion.js';
import { createRegistry } from '../lifecycle.js';

const registry = createRegistry('render-mount');
let counter = 0;

const GROUP = 'dss-acc';
const noop = { update() {}, destroy() {} };

/** Lage eines Knotens als Liste von Indizes unterhalb von `root`. */
function pathOf(root, node) {
  const path = [];
  for (let current = node; current && current !== root; current = current.parentNode) {
    path.unshift(Array.prototype.indexOf.call(current.parentNode.childNodes, current));
  }
  return path;
}

/** Merkt den fokussierten Knoten unterhalb von `host`: seine `id` und seine Lage im Baum. */
function rememberFocus(host) {
  const active = host.ownerDocument.activeElement;
  if (!active || active === host || !host.contains(active)) return null;
  return { id: active.id || '', path: pathOf(host, active), tag: active.tagName, className: active.className };
}

/** Fokus zurückgeben: erst über die `id`, dann über die Lage (gleiches Element, gleiche Klasse), sonst bleibt er, wo der Browser ihn hinlegt. */
function restoreFocus(host, memo) {
  if (!memo) return;
  let target = null;
  if (memo.id) target = [...host.querySelectorAll('[id]')].find((el) => el.id === memo.id) ?? null;
  if (!target) {
    let node = host;
    for (const index of memo.path) node = node?.childNodes?.[index];
    if (node && node.nodeType === 1 && node.tagName === memo.tag && node.className === memo.className) target = node;
  }
  if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
}

/**
 * @param {Element} el Container
 * @param {(props: object, options: object) => string} render Render-Funktion (liefert Markup)
 * @param {object} props Eigenschaften der Komponente
 * @param {{ on?: Array<{ type: string, selector: string, handler: (event: Event, target: Element) => void }>, uid?: string, [key: string]: unknown }} [options]
 *   `on`: Ereignisse (delegiert an `el`), z. B. der Klick einer Karte; weitere Optionen gehen an `render`.
 */
export function mount(el, render, props, options = {}) {
  if (typeof document === 'undefined' || !el || typeof el.replaceChildren !== 'function' || typeof render !== 'function') return { ...noop };
  registry.release(el);

  const { on = [], ...renderOptions } = options && typeof options === 'object' ? options : {};
  const doc = el.ownerDocument;
  const uid = typeof renderOptions.uid === 'string' && renderOptions.uid ? renderOptions.uid : `m${++counter}`;
  const original = [...el.childNodes];
  const cleanups = [];
  let current = props && typeof props === 'object' ? props : {};
  let wrapper = null;
  let accordion = null;
  let done = false;

  const insert = (host, html) => {
    const range = doc.createRange();
    range.selectNodeContents(host);
    host.replaceChildren(range.createContextualFragment(html));
  };
  const openState = () => {
    const trigger = (wrapper ?? el).querySelector('.dss-acc-trigger[aria-expanded]');
    return trigger ? trigger.getAttribute('aria-expanded') === 'true' : undefined;
  };
  // Gibt es schon eine Gruppe (el oder ein Vorfahr), bedient sie den Rahmen; sonst legt mount eine eigene an
  const needsGroup = (next) => Boolean(next.collapsible) && !el.closest(`.${GROUP}`);

  const paint = (next, previous) => {
    // `current` bleibt, was die Aufrufer übergeben haben: „open geändert“ heißt, die Eingabe hat sich geändert, nicht der Zustand im Dokument
    let props = next;
    if (previous) {
      const live = openState();
      if (live !== undefined && next.open === previous.open) props = { ...next, open: live };
    }
    const host = wrapper ?? el;
    const memo = previous ? rememberFocus(host) : null;
    const wantsGroup = needsGroup(props);
    if (!wantsGroup && wrapper) {
      accordion?.destroy();
      accordion = null;
      wrapper = null;
      el.replaceChildren();
    }
    if (wantsGroup && !wrapper) {
      wrapper = doc.createElement('div');
      wrapper.className = GROUP;
      el.replaceChildren(wrapper);
    }
    insert(wrapper ?? el, render(props, { ...renderOptions, uid }));
    if (wantsGroup && !accordion) accordion = initAccordion(wrapper);
    restoreFocus(wrapper ?? el, memo);
    current = next;
  };

  for (const rule of on) {
    if (!rule || typeof rule.handler !== 'function') continue;
    const listener = (event) => {
      const target = event.target instanceof Element ? event.target.closest(rule.selector) : null;
      if (target && el.contains(target)) rule.handler(event, target);
    };
    el.addEventListener(rule.type, listener);
    cleanups.push(() => el.removeEventListener(rule.type, listener));
  }

  paint(current, null);

  const handle = registry.claim(el, () => {
    done = true;
    accordion?.destroy();
    accordion = null;
    for (const fn of cleanups.splice(0)) fn();
    wrapper = null;
    el.replaceChildren(...original);
  });
  return {
    update(next) {
      if (done) return;
      paint(next && typeof next === 'object' ? next : {}, current);
    },
    destroy: handle.destroy,
  };
}
