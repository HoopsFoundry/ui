/**
 * DSS PageNav · Seitennavigation „Auf dieser Seite“
 * --------------------------------------------------------------
 * `initPageNav(root, options)` baut aus den Überschriften in `root` eine Navigation (echtes `nav`, `ul`, Links) und beobachtet, ob später
 * Überschriften dazukommen (Inhalt, den die Seite im Browser nachlädt). Ein Sprung öffnet alle umgebenden Bereiche des Accordions, einklappbare
 * Rahmen und `<details>` (`revealAround` aus js/accordion.js), scrollt das Ziel in Sicht und setzt den Fokus darauf.
 * Rückgabe `{ destroy() }` (js/lifecycle.js). ES-Modul ohne Auto-Start, ohne Zugriff auf `window` oder `document` beim Import, kein `innerHTML`.
 * Typen: js/pagenav.d.ts.
 */
import { hashTarget, isAccordionItem, revealAround, scrollToElement } from './accordion.js';
import { createCleanups, createRegistry, emptyHandle, listen } from './lifecycle.js';
import { reducedMotion } from './motion.js';

/** Mindestzahl der Einträge, ab der die Navigation erscheint. */
export const MIN_HEADINGS = 3;
const DEFAULTS = { selector: 'h2, [data-pagenav]', skipAttribute: 'data-pagenav-skip', label: 'Auf dieser Seite', debounce: 150 };
const registry = createRegistry();
let uid = 0;

/** Id-Teil aus einem Text: Kleinbuchstaben, Umlaute aufgelöst (ä wird ae, ß wird ss), alles andere wird zu `-`; nie leer. */
export function slug(text) {
  return String(text).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'abschnitt';
}

/** Beschriftung eines Ziels: `data-pagenav`, falls gesetzt (für Blöcke ohne Überschrift), sonst der Text; Leerraum zusammengefasst. */
export function labelOf(el) {
  const custom = typeof el.getAttribute === 'function' ? el.getAttribute('data-pagenav') : null;
  return String(custom || el.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Einträge `{ id, text, el }` aus den Zielen. Fehlende ids werden aus dem Text vergeben (`abschnitt-<slug>`, bei Kollision mit `-2`, `-3` …);
 * bestehende bleiben. `taken` ist die Menge (`Set`) der schon benutzten ids und wird fortgeschrieben. Ziele ohne Text entfallen
 * (und bekommen keine id). `onNewId(el)` meldet jede neu vergebene id.
 */
export function entries(targets, taken = new Set(), onNewId = () => {}) {
  const out = [];
  for (const el of targets) {
    const text = labelOf(el);
    if (!text) continue;
    if (!el.id) {
      const base = `abschnitt-${slug(text)}`;
      let id = base;
      for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
      el.id = id;
      onNewId(el);
    }
    taken.add(el.id);
    out.push({ id: el.id, text, el });
  }
  return out;
}

/** Schlüssel zum Vergleich: gleiche Einträge ergeben dieselbe Zeichenkette (Navigation nur bei Änderung neu bauen). */
export function signature(list) {
  return list.map((e) => `${e.id}|${e.text}`).join('\n');
}

const asElement = (value, root, doc) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return root.querySelector(value) ?? doc.querySelector(value);
    } catch {
      return null;
    }
  }
  return typeof value.insertBefore === 'function' ? value : null;
};

/** Ist das Ziel ausgenommen? Das Attribut (`skipAttribute`) am Ziel oder an einem Vorfahren innerhalb von `root`. */
const isSkipped = (el, root, attr) => {
  for (let node = el; node && node !== root.parentElement; node = node.parentElement) if (node.hasAttribute(attr)) return true;
  return false;
};

/**
 * Seitennavigation für `root` (Standard-Auswahl: `h2` und `[data-pagenav]` darin).
 * Optionen: `selector` (CSS-Auswahl der Ziele), `container` (Element oder Auswahl, in das die Navigation vor den ersten Block mit einem Ziel
 * gesetzt wird; Standard `root`), `label` (sichtbarer Text und Name der Navigation, Standard „Auf dieser Seite“; bei mehreren Navigationen
 * auf einer Seite je einen eigenen Namen), `minHeadings` (Standard 3), `skipAttribute` (Ziele mit diesem Attribut fehlen, Standard
 * `data-pagenav-skip`), `observe` (Nachladen beobachten, Standard `true`), `syncHash` (ein Anker auf ein Ziel in einem geschlossenen Bereich
 * öffnet ihn, Standard `true`).
 */
export function initPageNav(root, options = {}) {
  if (typeof document === 'undefined' || !root || typeof root.querySelectorAll !== 'function') return emptyHandle();
  registry.release(root);

  const doc = root.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  const opts = options && typeof options === 'object' ? options : {};
  const selector = typeof opts.selector === 'string' && opts.selector.trim() ? opts.selector : DEFAULTS.selector;
  const skipAttribute = typeof opts.skipAttribute === 'string' && /^[A-Za-z_:][-\w:.]*$/.test(opts.skipAttribute) ? opts.skipAttribute : DEFAULTS.skipAttribute;
  const label = typeof opts.label === 'string' && opts.label.trim() ? opts.label.trim() : DEFAULTS.label;
  const minHeadings = Number.isInteger(opts.minHeadings) && opts.minHeadings >= 1 ? opts.minHeadings : MIN_HEADINGS;
  const observe = opts.observe !== false;
  const syncHash = opts.syncHash !== false;

  const cleanups = createCleanups();
  const ownIds = new Set(); // Elemente, denen wir eine id gegeben haben
  const marked = new Set(); // Ziele mit unserer Klasse
  const focused = new Set(); // Ziele, denen wir tabindex gegeben haben
  let nav = null;
  let sig = '';
  let timer = null;

  const targets = () => {
    let found;
    try {
      found = [...root.querySelectorAll(selector)];
    } catch {
      found = [...root.querySelectorAll(DEFAULTS.selector)]; // ungültige Auswahl: Standard
    }
    return found.filter((el) => !el.closest('.dss-pagenav') && !isSkipped(el, root, skipAttribute));
  };

  const taken = () => new Set([...doc.querySelectorAll('[id]')].map((el) => el.id));

  const goTo = (target) => {
    const opened = revealAround(target);
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      focused.add(target);
    }
    scrollToElement(target, { behavior: opened || reducedMotion() ? 'auto' : 'smooth' });
    target.focus({ preventScroll: true });
    try {
      win.history.replaceState(win.history.state, '', `${win.location.pathname}${win.location.search}#${encodeURIComponent(target.id)}`);
    } catch {
      // replaceState kann in sandboxed Frames fehlschlagen; der Anker ist nur eine Zugabe
    }
  };

  const build = (list) => {
    const id = `dss-pagenav-${++uid}`;
    const el = doc.createElement('nav');
    el.className = 'dss-pagenav';
    el.setAttribute('aria-labelledby', `${id}-label`);
    const eyebrow = doc.createElement('p');
    eyebrow.className = 'dss-eyebrow';
    eyebrow.id = `${id}-label`;
    eyebrow.textContent = label;
    const ul = doc.createElement('ul');
    ul.className = 'dss-pagenav-list';
    // mit Seitenadresse: <base href> würde ein bloßes #id auf die Startseite lenken
    const page = win.location.href.split('#')[0];
    for (const entry of list) {
      const li = doc.createElement('li');
      const a = doc.createElement('a');
      a.className = 'dss-pagenav-link';
      a.href = `${page}#${encodeURIComponent(entry.id)}`;
      a.textContent = entry.text;
      li.append(a);
      ul.append(li);
    }
    el.append(eyebrow, ul);
    el.addEventListener('click', (event) => {
      const link = event.target instanceof Element ? event.target.closest('a.dss-pagenav-link') : null;
      if (!link || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const wanted = hashTarget(link.getAttribute('href').split('#')[1] ?? '', list.map((e) => e.id));
      const target = wanted ? doc.getElementById(wanted) : null;
      if (!target) return;
      event.preventDefault();
      goTo(target);
    });
    return el;
  };

  const unmark = (el) => {
    el.classList.remove('dss-pagenav-target');
    if (!el.classList.length) el.removeAttribute('class');
    marked.delete(el);
  };

  const removeNav = () => {
    nav?.remove();
    nav = null;
  };

  const refresh = () => {
    const found = targets();
    // ids nur vergeben, wenn die Navigation überhaupt erscheint
    const list = found.filter((el) => labelOf(el)).length >= minHeadings
      ? entries(found, taken(), (el) => ownIds.add(el))
      : [];
    const next = list.length >= minHeadings ? signature(list) : '';
    if (next === sig && (nav?.isConnected || !next)) return;
    sig = next;
    removeNav();
    for (const el of [...marked]) if (!list.some((e) => e.el === el)) unmark(el);
    if (!next) return;
    for (const entry of list) {
      entry.el.classList.add('dss-pagenav-target');
      marked.add(entry.el);
    }
    nav = build(list);
    const host = asElement(opts.container, root, doc) ?? root;
    let anchor = list[0].el;
    while (anchor.parentElement && anchor.parentElement !== host) anchor = anchor.parentElement;
    if (anchor.parentElement === host) host.insertBefore(nav, anchor);
    else host.prepend(nav);
  };

  const reveal = () => {
    if (!syncHash) return;
    const raw = win.location.hash;
    const wanted = hashTarget(raw, [...root.querySelectorAll('[id]')].map((el) => el.id));
    const target = wanted ? doc.getElementById(wanted) : null;
    // Bereiche selbst öffnet das Accordion (Deep-Link); hier geht es um Ziele in geschlossenen Bereichen
    if (!target || isAccordionItem(target)) return;
    if (revealAround(target)) scrollToElement(target);
  };

  refresh();
  reveal();
  cleanups.add(listen(win, 'hashchange', reveal));

  if (observe && typeof win.MutationObserver === 'function') {
    const observer = new win.MutationObserver((records) => {
      // Änderungen an der eigenen Navigation lösen keinen Neuaufbau aus
      const own = (node) => node === nav || (nav && nav.contains(node));
      if (records.every((r) => own(r.target) || [...r.addedNodes, ...r.removedNodes].every((n) => n.nodeType === 1 && n.classList?.contains('dss-pagenav')))) return;
      win.clearTimeout(timer);
      timer = win.setTimeout(refresh, DEFAULTS.debounce);
    });
    observer.observe(root, { childList: true, subtree: true });
    cleanups.add(() => {
      observer.disconnect();
      win.clearTimeout(timer);
    });
  }

  return registry.claim(root, () => {
    cleanups.run();
    removeNav();
    for (const el of [...marked]) unmark(el);
    for (const el of focused) el.removeAttribute('tabindex');
    for (const el of ownIds) if (el.id.startsWith('abschnitt-')) el.removeAttribute('id');
    marked.clear();
    focused.clear();
    ownIds.clear();
  });
}
