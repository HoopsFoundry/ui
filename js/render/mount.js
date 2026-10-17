/**
 * HoopsFoundry UI Render · einsetzen und aktualisieren
 * --------------------------------------------------------------
 * `mount(el, render, props, options)` setzt das Markup einer Render-Funktion in `el` ein (über `Range.createContextualFragment`, nie über
 * eine HTML-Eigenschaft), startet bei einklappbaren Rahmen das Accordion-Verhalten (`initAccordion`) und gibt `{ update(props), destroy() }`
 * zurück. Muster wie die `initX`-Bausteine (js/lifecycle.js): idempotent je Element (ein zweiter Aufruf ersetzt den ersten), `destroy()`
 * entfernt Listener und Markup und stellt den früheren Inhalt von `el` wieder her. `update` ersetzt den Inhalt (bei gleichem Markup passiert
 * nichts) und hält den Fokus (über `id` oder die Lage im Baum, auch im Shadow DOM), die Scrollposition der Tabellenbereiche und den Zustand
 * offen/zu eines einklappbaren Rahmens, solange `props.open` sich nicht ändert.
 * Sprache: Ändern sich Sprache, Katalog oder Überschreibungen (Ereignis `hoops:localechange`, js/i18n-events.js), rendert `mount` mit demselben Zustand
 * neu (Fokus, Scrollposition und offen/zu bleiben wie bei `update`); `options.followLocale: false` schaltet das ab (`mountVenueCard` mit Karte macht es selbst).
 * Styles: Die Render-Funktionen schreiben wenige `style`-Attribute (Pins, Kartenhöhe, Spaltenbreite). `mount` setzt sie nach dem Einsetzen
 * über das CSSOM (`style.setProperty`), sodass eine Seite mit `style-src 'self'` sie nicht blockiert; wer das Markup einer Render-Funktion selbst
 * einsetzt, braucht `style-src-attr 'unsafe-inline'` (oder `mountX`).
 * Typen: js/render/mount.d.ts.
 */
import { initAccordion } from '../accordion.js';
import { onLocaleChange } from '../i18n-events.js';
import { createRegistry } from '../lifecycle.js';
import { insertMarkup, nextUid } from './dom.js';

const registry = createRegistry('render-mount');
const GROUP = 'hoops-acc';
const noop = { update() {}, destroy() {} };

/** Lage eines Knotens als Liste von Indizes unterhalb von `root`. */
function pathOf(root, node) {
  const path = [];
  for (let current = node; current && current !== root; current = current.parentNode) {
    path.unshift(Array.prototype.indexOf.call(current.parentNode.childNodes, current));
  }
  return path;
}

/** Das fokussierte Element im Baum von `host` (im Shadow DOM das des Shadow-Wurzel), sonst `null`. */
function activeIn(host) {
  const root = typeof host.getRootNode === 'function' ? host.getRootNode() : host.ownerDocument;
  const active = (root && root.activeElement) || host.ownerDocument.activeElement;
  return active || null;
}

/** Merkt den fokussierten Knoten unterhalb von `host`: seine `id` und seine Lage im Baum. */
function rememberFocus(host) {
  const active = activeIn(host);
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
  // Ist der Knoten verschwunden, bekommt der Kopf des Rahmens (oder der Scrollbereich, sonst das erste bedienbare Element) den Fokus, nicht <body>
  if (!target) target = host.querySelector('.hoops-acc-trigger') ?? host.querySelector('.hoops-table-scroll') ?? host.querySelector('a[href], button:not([disabled])');
  if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
}

/** Scrollpositionen der Tabellenbereiche (in Dokumentreihenfolge) merken und zurückgeben. */
const scrollsOf = (host) => [...host.querySelectorAll('.hoops-table-scroll')].map((el) => el.scrollLeft);
function restoreScrolls(host, list) {
  const areas = host.querySelectorAll('.hoops-table-scroll');
  list.forEach((left, index) => {
    if (left && areas[index]) areas[index].scrollLeft = left;
  });
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

  const { on = [], followLocale = true, ...renderOptions } = options && typeof options === 'object' ? options : {};
  const doc = el.ownerDocument;
  const uid = typeof renderOptions.uid === 'string' && renderOptions.uid ? renderOptions.uid : nextUid();
  const original = [...el.childNodes];
  const cleanups = [];
  let current = props && typeof props === 'object' ? props : {};
  let wrapper = null;
  let accordion = null;
  let done = false;
  let lastHtml = null;

  const openState = () => {
    const trigger = (wrapper ?? el).querySelector('.hoops-acc-trigger[aria-expanded]');
    return trigger ? trigger.getAttribute('aria-expanded') === 'true' : undefined;
  };
  // Gibt es schon eine Gruppe (el oder ein Vorfahr), bedient sie den Rahmen; sonst legt mount eine an. Steht el im Panel eines Bereichs dieser
  // Gruppe, zählt ein einzelner Rahmen dort nicht zur Gruppe (initAccordion): dann bekommt er eine eigene.
  const needsGroup = (next) => {
    if (!next.collapsible) return false;
    const group = el.closest(`.${GROUP}`);
    if (!group) return true;
    const panel = el.closest('.hoops-acc-panel');
    return Boolean(panel) && panel.closest(`.${GROUP}`) === group && group !== el;
  };

  const paint = (next, previous) => {
    // `current` bleibt, was die Aufrufer übergeben haben: „open geändert“ heißt, die Eingabe hat sich geändert, nicht der Zustand im Dokument
    let props = next;
    if (previous) {
      const live = openState();
      if (live !== undefined && next.open === previous.open) props = { ...next, open: live };
    }
    const host = wrapper ?? el;
    const wantsGroup = needsGroup(props);
    const html = render(props, { ...renderOptions, uid });
    // gleiches Markup, gleiche Gruppe: nichts zu tun (kein Flackern, kein Fokusverlust)
    if (previous && html === lastHtml && wantsGroup === Boolean(wrapper)) {
      current = next;
      return;
    }
    const memo = previous ? rememberFocus(host) : null;
    const scrolls = previous ? scrollsOf(host) : [];
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
    insertMarkup(wrapper ?? el, html);
    lastHtml = html;
    if (wantsGroup && !accordion) accordion = initAccordion(wrapper);
    restoreScrolls(wrapper ?? el, scrolls);
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
  // Sprachwechsel: gleicher Zustand, neue Texte (bei gleichem Markup passiert nichts)
  if (followLocale !== false) cleanups.push(onLocaleChange(() => { if (!done) paint(current, current); }));

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
