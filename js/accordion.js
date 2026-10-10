// Accordion: reine Funktionen (React, Svelte und Vanilla nutzen dieselben) und das Vanilla-Skript `initAccordion`.
// ESM ohne Abhängigkeiten. Beim Import wird nichts ausgeführt und weder `window` noch `document` gelesen (SSR-sicher).

// ── Reine Funktionen ─────────────────────────────────────────

const isDisabled = (header) => header === true || (header != null && typeof header === 'object' && Boolean(header.disabled));

/**
 * Index des Kopfes, auf den der Fokus bei einer Taste springt. Pfeil ab/auf: nächster/vorheriger nicht deaktivierter Kopf
 * (kein Umlauf an den Enden: dort bleibt der Index); Home/End: erster/letzter nicht deaktivierter Kopf; jede andere Taste,
 * eine ungültige Eingabe oder kein erreichbares Ziel ergibt den aktuellen Index.
 * `headers` sind Objekte mit `disabled` (oder `true` für deaktiviert).
 */
export function nextHeader(index, key, headers) {
  const current = Number.isInteger(index) ? index : -1;
  if (!Array.isArray(headers) || headers.length === 0 || !Number.isInteger(index) || index < 0 || index >= headers.length) return current;
  const free = (i) => !isDisabled(headers[i]);
  if (key === 'Home') {
    for (let i = 0; i < headers.length; i++) if (free(i)) return i;
    return current;
  }
  if (key === 'End') {
    for (let i = headers.length - 1; i >= 0; i--) if (free(i)) return i;
    return current;
  }
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    const step = key === 'ArrowDown' ? 1 : -1;
    for (let i = index + step; i >= 0 && i < headers.length; i += step) if (free(i)) return i;
  }
  return current;
}

/** Die id aus `ids`, die der URL-Anker `hash` meint (mit oder ohne `#`, URL-kodiert), sonst `null`. */
export function hashTarget(hash, ids) {
  if (typeof hash !== 'string' || !Array.isArray(ids)) return null;
  let raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return null;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // ungültige Kodierung: der Rohwert zählt
  }
  return ids.find((id) => typeof id === 'string' && id === raw) ?? null;
}

/**
 * Eltern-Bereiche von `id`, die zum Sichtbarmachen geöffnet werden müssen: die Wurzel zuerst, der direkte Elternbereich zuletzt.
 * `tree` ist eine Liste `{ id, parent }` (`parent` fehlt oder ist `null` bei einem Bereich der obersten Ebene).
 * Eine unbekannte id ergibt `[]`; Zyklen brechen ab.
 */
export function ancestorsOf(id, tree) {
  if (!Array.isArray(tree)) return [];
  const parentOf = new Map();
  for (const node of tree) if (node && typeof node.id === 'string') parentOf.set(node.id, node.parent ?? null);
  if (!parentOf.has(id)) return [];
  const chain = [];
  const seen = new Set([id]);
  let parent = parentOf.get(id);
  while (typeof parent === 'string' && parentOf.has(parent) && !seen.has(parent)) {
    chain.unshift(parent);
    seen.add(parent);
    parent = parentOf.get(parent);
  }
  return chain;
}

const clean = (value) => (value == null ? '' : String(value).replace(/\s+/g, ' ').trim());

/**
 * Zugänglicher Name eines Kopfes mit Zusatzinfo: `labelWithMeta('Kader', '14 Spieler')` ergibt `'Kader, 14 Spieler'`.
 * Ohne Zusatz bleibt der Titel; steht der Zusatz schon im Titel (gleich oder am Ende nach einem Komma), wird er nicht doppelt genannt.
 */
export function labelWithMeta(title, meta) {
  const t = clean(title);
  const m = clean(meta);
  if (!m) return t;
  if (!t) return m;
  const tl = t.toLowerCase();
  const ml = m.toLowerCase();
  if (tl === ml || tl.endsWith(`, ${ml}`)) return t;
  return `${t}, ${m}`;
}

/** Ansage nach „Alle öffnen/schließen“: „Alle Bereiche geöffnet“, „Alle Bereiche geschlossen“ oder „3 von 5 Bereichen geöffnet“; ohne Bereiche leer. */
export function summaryText(open, total) {
  if (!Number.isInteger(total) || total < 1) return '';
  const n = Math.min(total, Math.max(0, Number.isInteger(open) ? open : 0));
  if (n === total) return total === 1 ? 'Der Bereich ist geöffnet' : 'Alle Bereiche geöffnet';
  if (n === 0) return total === 1 ? 'Der Bereich ist geschlossen' : 'Alle Bereiche geschlossen';
  return `${n} von ${total} ${total === 1 ? 'Bereich' : 'Bereichen'} geöffnet`;
}

// ── Hilfen für Deep-Link und Scrollen (SSR-sicher: ohne Browser tun sie nichts) ──

/** Aktueller URL-Anker (ohne `#`, dekodiert); ohne Browser leer. */
export function currentHash() {
  if (typeof window === 'undefined' || !window.location) return '';
  const hash = window.location.hash;
  return hashTarget(hash, [decodeSafe(hash.slice(1))]) ?? '';
}

function decodeSafe(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Setzt beim Öffnen per Klick `#id` in die Adresse (`history.replaceState`, kein neuer Verlaufseintrag); beim Schließen wird
 * der Anker nur entfernt, wenn er der des geschlossenen Bereichs ist.
 */
export function writeHash(id, open) {
  if (typeof window === 'undefined' || !window.history || !window.location || typeof id !== 'string' || !id) return;
  const { pathname, search } = window.location;
  try {
    if (open) {
      window.history.replaceState(window.history.state, '', `${pathname}${search}#${encodeURIComponent(id)}`);
    } else if (currentHash() === id) {
      window.history.replaceState(window.history.state, '', `${pathname}${search}`);
    }
  } catch {
    // replaceState kann in sandboxed Frames fehlschlagen; der Anker ist nur eine Zugabe
  }
}

/** Scrollt das Element in Sicht (nach dem nächsten Frame, damit ein gerade geöffneter Bereich schon im Layout steht). */
export function scrollToElement(el) {
  if (typeof window === 'undefined' || !el) return;
  const run = () => {
    if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'start', behavior: 'auto' });
  };
  if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
  else run();
}

// ── Vanilla-Skript ───────────────────────────────────────────

const ITEM = '.dss-acc-item';
const instances = new WeakMap();
let uid = 0;

const TEXT = { all: 'Alle öffnen', none: 'Alle schließen', nav: 'Bereiche' };

function triggerOf(item) {
  return item.querySelector(':scope > summary, :scope > .dss-acc-title > .dss-acc-trigger');
}
function panelOf(item) {
  return item.querySelector(':scope > .dss-acc-panel');
}
const isDetails = (item) => item.tagName === 'DETAILS';
const isOpen = (item) => (isDetails(item) ? item.open : triggerOf(item)?.getAttribute('aria-expanded') === 'true');
const isLocked = (item) => triggerOf(item)?.getAttribute('aria-disabled') === 'true';

function labelOf(item) {
  const trigger = triggerOf(item);
  const label = trigger?.querySelector('.dss-acc-label');
  return clean((label ?? trigger)?.textContent);
}

/** Alle Bereiche, die direkt zu `root` gehören (verschachtelte Gruppen zählen nicht mit). */
function itemsOf(root) {
  return [...root.querySelectorAll(ITEM)].filter((el) => el.parentElement?.closest('.dss-acc') === root);
}

/** Baum aller Bereiche mit id unterhalb von `scope` (über alle Gruppen): jeder Bereich kennt den Bereich, in dem er liegt. */
function treeOf(scope) {
  return [...scope.querySelectorAll(ITEM)]
    .filter((el) => el.id)
    .map((el) => ({ id: el.id, parent: el.parentElement?.closest(ITEM)?.id || null }));
}

function make(tag, className, attrs = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
  return el;
}

/**
 * Macht ein Accordion im Vanilla-Markup bedienbar. Zwei Wege mit demselben Aussehen:
 * (1) `div.dss-acc-item` mit `h3.dss-acc-title > button.dss-acc-trigger[aria-expanded][aria-controls]` und `div.dss-acc-panel[hidden]`;
 * (2) natives `details.dss-acc-item` mit `summary.dss-acc-trigger` (zeigt auch ohne Skript; das Skript ergänzt die Funktionen).
 * Optionen: `exclusive` (nur ein Bereich offen), `syncHash` (Deep-Link, Standard `true`), `expandAll` („Alle öffnen/schließen“ mit Ansage),
 * `nav` (Sprungleiste), `sticky` (Kopf des offenen Bereichs klebt). Gibt `destroy()` zurück; mehrfaches Aufrufen für dieselbe Wurzel ersetzt die frühere Fassung.
 */
export function initAccordion(root, options = {}) {
  const noop = () => {};
  if (typeof document === 'undefined' || !root || typeof root.querySelectorAll !== 'function') return noop;
  instances.get(root)?.();

  const { exclusive = false, syncHash = true, expandAll = false, nav = false, sticky = false } = options;
  const cleanups = [];
  const created = [];
  const expected = new Set(); // Bereiche, die das Skript selbst umgeschaltet hat (kein Anker-Schreiben beim späteren toggle-Ereignis)
  const known = new WeakMap(); // zuletzt bekannter Zustand je details: toggle-Ereignisse ohne Änderung (z. B. beim Parsen) zählen nicht
  let current = null;
  let announce = null;
  let navLinks = new Map();

  const items = () => itemsOf(root);
  const apply = (item, open) => {
    if (isDetails(item)) {
      if (item.open !== open) {
        expected.add(item);
        item.open = open;
      }
      known.set(item, open);
    } else {
      const trigger = triggerOf(item);
      const panel = panelOf(item);
      trigger?.setAttribute('aria-expanded', String(open));
      if (panel) {
        panel.hidden = !open;
        panel.toggleAttribute('inert', !open);
      }
    }
    item.classList.toggle('is-open', open);
  };
  const refreshCurrent = () => {
    for (const [id, link] of navLinks) {
      if (id === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };
  const setOpen = (item, open, { user = false } = {}) => {
    if (isLocked(item) && open !== isOpen(item)) return;
    if (open && exclusive) for (const other of items()) if (other !== item && isOpen(other)) apply(other, false);
    apply(item, open);
    if (open) current = item.id || current;
    else if (current === item.id) current = null;
    refreshCurrent();
    if (user && syncHash && item.id) writeHash(item.id, open);
  };
  /** Öffnet den Bereich samt allen Eltern-Bereichen (auch in äußeren Gruppen). */
  const reveal = (item) => {
    for (const id of ancestorsOf(item.id, treeOf(document))) {
      const parent = document.getElementById(id);
      if (parent) apply(parent, true);
    }
    setOpen(item, true);
  };

  const onClick = (event) => {
    const trigger = event.target instanceof Element ? event.target.closest('.dss-acc-trigger') : null;
    if (!trigger || trigger.closest('.dss-acc') !== root) return;
    const item = trigger.closest(ITEM);
    if (!item || item.parentElement?.closest('.dss-acc') !== root) return;
    if (isDetails(item)) {
      if (isLocked(item)) event.preventDefault();
      return; // das native Umschalten übernimmt der Browser; toggle-Ereignis siehe unten
    }
    setOpen(item, !isOpen(item), { user: true });
  };
  const onToggle = (event) => {
    const item = event.target;
    if (!(item instanceof Element) || !item.matches('details' + ITEM) || item.parentElement?.closest('.dss-acc') !== root) return;
    if (known.get(item) === item.open) return;
    known.set(item, item.open);
    const programmatic = expected.delete(item);
    item.classList.toggle('is-open', item.open);
    if (item.open) {
      if (exclusive) for (const other of items()) if (other !== item && isOpen(other)) apply(other, false);
      current = item.id || current;
    } else if (current === item.id) current = null;
    refreshCurrent();
    if (!programmatic && syncHash && item.id) writeHash(item.id, item.open);
  };
  const onKeyDown = (event) => {
    const trigger = event.target instanceof Element ? event.target.closest('.dss-acc-trigger') : null;
    if (!trigger || trigger.closest('.dss-acc') !== root) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const triggers = items().map(triggerOf).filter(Boolean);
    const index = triggers.indexOf(trigger);
    const target = nextHeader(index, event.key, triggers.map((t) => ({ disabled: t.getAttribute('aria-disabled') === 'true' })));
    event.preventDefault();
    if (target !== index) triggers[target]?.focus();
  };
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('toggle', onToggle, true);
  cleanups.push(() => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('toggle', onToggle, true);
  });

  if (sticky && !root.classList.contains('dss-acc--sticky')) {
    root.classList.add('dss-acc--sticky');
    cleanups.push(() => root.classList.remove('dss-acc--sticky'));
  }
  if (exclusive) {
    // Natives Verhalten wo vorhanden: gleiches `name` an allen details dieser Gruppe
    const name = `dss-acc-${++uid}`;
    for (const item of items()) if (isDetails(item) && !item.getAttribute('name')) item.setAttribute('name', name);
  }
  // Ausgangszustand: Klasse und inert zum Markup passend machen; bei exklusiv höchstens ein offener Bereich (der erste)
  let seen = false;
  for (const item of items()) {
    let open = isOpen(item);
    if (exclusive && open && seen) open = false;
    if (open) seen = true;
    apply(item, open);
    if (open) current = item.id || current;
  }

  const tools = make('div', 'dss-acc-tools');
  root.insertBefore(tools, root.firstChild);
  created.push(tools);

  if (expandAll && !exclusive) {
    const wrap = make('div', 'dss-acc-bar');
    const open = make('button', 'dss-btn dss-btn--secondary dss-btn--sm', { type: 'button' });
    const close = make('button', 'dss-btn dss-btn--secondary dss-btn--sm', { type: 'button' });
    open.textContent = TEXT.all;
    close.textContent = TEXT.none;
    announce = make('span', 'dss-sr-only', { 'aria-live': 'polite', 'aria-atomic': 'true' });
    wrap.append(open, close, announce);
    tools.append(wrap);
    const controls = () => items().map((el) => panelOf(el)?.id || el.id).filter(Boolean).join(' ');
    open.setAttribute('aria-controls', controls());
    close.setAttribute('aria-controls', controls());
    const all = (flag) => () => {
      const list = items();
      for (const item of list) if (!isLocked(item)) apply(item, flag);
      const count = list.filter((item) => isOpen(item)).length;
      announce.textContent = summaryText(count, list.length);
      if (!flag) current = null;
      refreshCurrent();
    };
    open.addEventListener('click', all(true));
    close.addEventListener('click', all(false));
  }

  if (nav) {
    const navEl = make('nav', 'dss-acc-nav', { 'aria-label': TEXT.nav });
    const listId = `dss-acc-nav-${++uid}`;
    const toggle = make('button', 'dss-acc-nav-toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': listId });
    toggle.textContent = TEXT.nav;
    const list = make('ul', 'dss-acc-nav-list', { id: listId });
    navLinks = new Map();
    for (const item of items()) {
      if (!item.id) continue;
      const li = make('li', 'dss-acc-nav-item');
      const link = make('a', 'dss-acc-nav-link', { href: `#${encodeURIComponent(item.id)}` });
      link.textContent = labelOf(item);
      li.append(link);
      list.append(li);
      navLinks.set(item.id, link);
    }
    navEl.append(toggle, list);
    tools.append(navEl);
    toggle.addEventListener('click', () => {
      const next = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(next));
      navEl.classList.toggle('is-open', next);
    });
    navEl.addEventListener('click', (event) => {
      const link = event.target instanceof Element ? event.target.closest('a.dss-acc-nav-link') : null;
      if (!link) return;
      const id = hashTarget(link.getAttribute('href'), [...navLinks.keys()]);
      const item = id ? document.getElementById(id) : null;
      if (!item) return;
      event.preventDefault();
      reveal(item);
      if (syncHash) writeHash(id, true);
      scrollToElement(item);
      triggerOf(item)?.focus({ preventScroll: true });
    });
    refreshCurrent();
  }
  if (!tools.firstChild) {
    tools.remove();
    created.pop();
  }

  const fromHash = () => {
    if (!syncHash) return;
    const ids = items().map((el) => el.id).filter(Boolean);
    const id = hashTarget(window.location.hash, ids);
    const item = id ? document.getElementById(id) : null;
    if (!item || !items().includes(item)) return;
    reveal(item);
    scrollToElement(item);
  };
  window.addEventListener('hashchange', fromHash);
  cleanups.push(() => window.removeEventListener('hashchange', fromHash));
  fromHash();

  const destroy = () => {
    for (const fn of cleanups.splice(0)) fn();
    for (const el of created.splice(0)) el.remove();
    if (instances.get(root) === destroy) instances.delete(root);
  };
  instances.set(root, destroy);
  return destroy;
}

/** Startet alle `[data-dss-acc]`-Gruppen unterhalb von `scope` (Standard: das Dokument) mit denselben Optionen; gibt eine Funktion zum Aufräumen aller zurück. */
export function initAccordions(scope, options = {}) {
  if (typeof document === 'undefined') return () => {};
  const host = scope ?? document;
  const roots = [...host.querySelectorAll('[data-dss-acc]')];
  const destroys = roots.map((root) => initAccordion(root, options));
  return () => destroys.forEach((fn) => fn());
}
