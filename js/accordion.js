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

/**
 * Höhe des klebenden Kopfes, der ein verschachteltes Ziel verdecken würde: Steht `el` in einem Bereich einer klebenden Gruppe
 * (`dss-acc--sticky`), bleibt dessen Kopf oben stehen und liegt über dem Ziel. Ist `el` selbst der Bereich der obersten Ebene, ist es 0.
 */
export function stickyOffset(el) {
  if (!el || typeof el.closest !== 'function') return 0;
  let top = null;
  for (let item = el.parentElement?.closest(ITEM); item; item = item.parentElement?.closest(ITEM)) top = item;
  if (!top || !top.parentElement?.closest('.dss-acc')?.classList.contains('dss-acc--sticky')) return 0;
  const head = top.querySelector(':scope > .dss-acc-title, :scope > summary, :scope > .dss-frame-head, :scope > .dss-league-head');
  return head ? Math.ceil(head.getBoundingClientRect().height) : 0;
}

/**
 * Scrollt das Element in Sicht (nach dem nächsten Frame, damit ein gerade geöffneter Bereich schon im Layout steht). Der Abstand nach
 * oben (`scroll-margin-top`) enthält `--dss-acc-sticky-top`, 8 px und die Höhe des klebenden Kopfes eines umgebenden Bereichs
 * (`stickyOffset`), damit ein verschachteltes Ziel nicht unter dem Kopf der Eltern verschwindet.
 */
export function scrollToElement(el) {
  if (typeof window === 'undefined' || !el) return;
  const run = () => {
    if (typeof el.scrollIntoView !== 'function') return;
    const extra = stickyOffset(el);
    const before = el.style.scrollMarginTop;
    if (extra) el.style.scrollMarginTop = `calc(var(--dss-acc-sticky-top, 0px) + 8px + ${extra}px)`;
    el.scrollIntoView({ block: 'start', behavior: 'auto' });
    if (extra) el.style.scrollMarginTop = before;
  };
  if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
  else run();
}

/**
 * Tastatur in einer Gruppe: Pfeil ab/auf, Home, End bewegen den Fokus zwischen den Köpfen (`.dss-acc-trigger`), die direkt zu
 * `root` (`.dss-acc`) gehören; deaktivierte (`aria-disabled`) werden übersprungen. Gibt `true` zurück, wenn die Taste behandelt wurde
 * (der Aufrufer ruft dann `preventDefault` auf). Mit Strg, Alt, Meta oder Umschalt passiert nichts.
 */
export function moveFocus(root, trigger, key, modifiers = {}) {
  if (!root || !trigger || modifiers.altKey || modifiers.ctrlKey || modifiers.metaKey || modifiers.shiftKey) return false;
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return false;
  // Köpfe in einem Panel (ein einzelner einklappbarer Rahmen im Inhalt eines Bereichs) gehören nicht zur Gruppe
  const triggers = [...root.querySelectorAll('.dss-acc-trigger')].filter(
    (el) => el.closest('.dss-acc') === root && el.closest('.dss-acc-panel')?.closest('.dss-acc') !== root,
  );
  const index = triggers.indexOf(trigger);
  if (index < 0) return false;
  const target = nextHeader(index, key, triggers.map((el) => ({ disabled: el.getAttribute('aria-disabled') === 'true' })));
  if (target !== index) triggers[target]?.focus();
  return true;
}

// ── Gemeinsamer Baustein für Bereiche und einklappbare Rahmen (Svelte und React) ──

/**
 * Das Verhalten eines einklappbaren Bereichs, ohne Oberfläche: Öffnen und Schließen (mit `exclusive` der Gruppe, Fokus-Rettung,
 * Anker), Öffnen samt Eltern (`reveal`), Eintrag für die Gruppe (Sprungleiste, „Alle öffnen“) und die Prüfung des URL-Ankers.
 * `host` liefert den aktuellen Stand über Funktionen (kein Schnappschuss): `id`, `title`, `open`, `disabled`, `anchor` (hat der
 * Bereich einen öffentlichen Anker?), `group` (Gruppe, bei der er angemeldet ist, sonst `undefined`), `parent` (`{ reveal }` des
 * Eltern-Bereichs), `el`, `trigger`, `panel` und `commit(next)` (setzt den Zustand, in der Oberfläche).
 */
export function createCollapsible(host) {
  function setOpen(next, user = false) {
    const group = host.group();
    const open = host.open();
    if (host.disabled() && next !== open) return;
    // Auch ein schon offener Bereich schließt bei exclusive die anderen (Anker auf einen beim Start offenen Bereich)
    if (next && group?.exclusive) group.closeOthers(host.id());
    if (next === open) return;
    // Der Fokus liegt im Bereich, der gleich inert wird: er geht auf den Kopf (sonst fiele er auf <body>)
    const panel = host.panel();
    const trigger = host.trigger();
    if (!next && panel && trigger && panel.contains(document.activeElement)) trigger.focus();
    host.commit(next);
    if (user && host.anchor() && (group?.syncHash ?? true)) writeHash(host.id(), next);
  }
  /** Öffnet diesen Bereich und alle Eltern-Bereiche (Deep-Link, Sprungleiste). */
  function reveal() {
    setOpen(true);
    host.parent()?.reveal();
  }
  /** Passt der URL-Anker zu diesem Bereich, wird er samt Eltern geöffnet und in Sicht gescrollt. */
  function checkHash() {
    if (typeof window === 'undefined' || !host.anchor()) return;
    if (hashTarget(window.location.hash, [host.id()]) !== host.id()) return;
    reveal();
    scrollToElement(host.el());
  }
  const entry = {
    get id() { return host.id(); },
    get title() { return host.title(); },
    get open() { return host.open(); },
    get disabled() { return host.disabled(); },
    get anchor() { return host.anchor(); },
    get el() { return host.el(); },
    get trigger() { return host.trigger(); },
    reveal,
    setOpen: (next) => setOpen(next),
  };
  return { setOpen, reveal, checkHash, entry };
}

// ── Vanilla-Skript ───────────────────────────────────────────

// Bereiche: Karten (`.dss-acc-item`) und einklappbare Rahmen der Tabellen und Ligencards (`.is-collapsible`)
const ITEM = '.dss-acc-item, .dss-frame.is-collapsible, .dss-league.is-collapsible';
const DETAILS = 'details.dss-acc-item';
const instances = new WeakMap();
let uid = 0;

const TEXT = { all: 'Alle öffnen', none: 'Alle schließen', nav: 'Bereiche' };

function triggerOf(item) {
  return item.querySelector(
    ':scope > summary, :scope > .dss-acc-title > .dss-acc-trigger, :scope > .dss-frame-head > .dss-frame-title > .dss-acc-trigger, :scope > .dss-league-head > .dss-league-title > .dss-acc-trigger',
  );
}
function panelOf(item) {
  return item.querySelector(':scope > .dss-acc-panel');
}
const isDetails = (item) => item.tagName === 'DETAILS';
const isOpen = (item) => (isDetails(item) ? item.open : triggerOf(item)?.getAttribute('aria-expanded') === 'true');
const isLocked = (item) => triggerOf(item)?.getAttribute('aria-disabled') === 'true';

/** Liegt der Fokus im Bereich, der sich schließt (und damit nicht mehr erreichbar ist), geht er auf den Kopf dieses Bereichs. */
function keepFocus(item) {
  const active = item.ownerDocument.activeElement;
  const trigger = triggerOf(item);
  if (trigger && active && active !== trigger && item.contains(active) && !trigger.contains(active)) trigger.focus();
}

function labelOf(item) {
  const trigger = triggerOf(item);
  const source = trigger?.querySelector('.dss-acc-label') ?? trigger;
  if (!source) return '';
  // Das unsichtbare Komma (.dss-acc-sep, früher .dss-sr-only) gehört zum Namen des Kopfes, nicht zum Titel der Sprungleiste
  const copy = source.cloneNode(true);
  for (const hidden of copy.querySelectorAll('.dss-sr-only, .dss-acc-sep, .dss-acc-sub')) hidden.remove();
  return clean(copy.textContent);
}

/** Alle Bereiche, die direkt zu `root` gehören (verschachtelte Gruppen zählen nicht mit). */
function itemsOf(root) {
  return [...root.querySelectorAll(ITEM)].filter((el) => inGroup(el, root));
}

/** Gehört der Bereich direkt zu `root`? Nicht, wenn er in einer verschachtelten Gruppe oder (als einzelner Rahmen) im Panel eines Bereichs steht. */
function inGroup(item, root) {
  const parent = item.parentElement;
  return parent?.closest('.dss-acc') === root && parent.closest('.dss-acc-panel')?.closest('.dss-acc') !== root;
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
 * `nav` (Sprungleiste, Name über `navLabel`, Standard „Bereiche“), `sticky` (Kopf des offenen Bereichs klebt). Gibt `destroy()` zurück; mehrfaches Aufrufen für dieselbe Wurzel ersetzt die frühere Fassung.
 */
export function initAccordion(root, options = {}) {
  const noop = () => {};
  if (typeof document === 'undefined' || !root || typeof root.querySelectorAll !== 'function') return noop;
  instances.get(root)?.();

  const { exclusive = false, syncHash = true, expandAll = false, nav = false, sticky = false, navLabel = TEXT.nav } = options;
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
      if (!open && item.open) keepFocus(item);
      if (item.open !== open) {
        expected.add(item);
        item.open = open;
      }
      known.set(item, open);
    } else {
      const trigger = triggerOf(item);
      const panel = panelOf(item);
      if (!open) keepFocus(item);
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
    if (!item || !inGroup(item, root)) return;
    if (isDetails(item)) {
      if (isLocked(item)) event.preventDefault();
      return; // das native Umschalten übernimmt der Browser; toggle-Ereignis siehe unten
    }
    setOpen(item, !isOpen(item), { user: true });
  };
  const onToggle = (event) => {
    const item = event.target;
    if (!(item instanceof Element) || !item.matches(DETAILS) || !inGroup(item, root)) return;
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
    if (!trigger) return;
    if (moveFocus(root, trigger, event.key, event)) event.preventDefault();
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
    const navEl = make('nav', 'dss-acc-nav', { 'aria-label': navLabel });
    const listId = `dss-acc-nav-${++uid}`;
    const toggle = make('button', 'dss-acc-nav-toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': listId });
    toggle.textContent = navLabel;
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
