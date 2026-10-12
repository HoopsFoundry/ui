/**
 * DSS Tabs · Tab-Leiste und Panels auf vorhandenem Markup
 * --------------------------------------------------------------
 * `initTabs(root, options)` macht eine `dss-tabs`-Leiste (`role="tablist"`) bedienbar. Es gelten dieselben Regeln wie in svelte/Tabs.svelte und
 * react/Tabs.tsx: Pfeiltasten in Richtung der Leiste (waagerecht links/rechts, bei `vertical` auf/ab) wählen den Nachbarn sofort und
 * fokussieren ihn, gesperrte Tabs werden übersprungen, am Rand geht es von vorn weiter; nur der gewählte Tab ist per Tab-Taste erreichbar
 * (roving tabindex, `aria-selected`). Dazu kommen Pos1/Ende (in den Frameworks nicht belegt), eine Leiste mit `role="group"` und
 * `aria-pressed` (Mehrfachauswahl, Pills als Filter) und optional manuelle Aktivierung, Deep-Link über den URL-Anker und RTL.
 * Panels hängen über `aria-controls` am Tab; das nicht gewählte Panel bekommt `hidden` und `inert`. Wechsel melden `dss:tabchange`.
 * Rückgabe `{ destroy(), select(), getValue() }` (js/lifecycle.js); `destroy` stellt das Markup wieder her. Kein `innerHTML`,
 * kein Zugriff auf `window` oder `document` beim Import. Typen: js/tabs.d.ts.
 */
import { currentHash, hashTarget, scrollToElement, writeHash } from './accordion.js';
import { createCleanups, createHandle, createRegistry, listen, snapshotAttributes } from './lifecycle.js';

export const TAB_EVENT = 'dss:tabchange';
const registry = createRegistry();
let uid = 0;

const HORIZONTAL_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
const VERTICAL_KEYS = ['ArrowUp', 'ArrowDown', 'Home', 'End'];
const isOff = (tab) => (typeof tab === 'boolean' ? tab : Boolean(tab && tab.disabled));

/**
 * Index des Tabs, auf den eine Taste springt: Pfeil in Richtung der Leiste, Pos1 (erster) und Ende (letzter). Gesperrte Tabs (`{ disabled: true }`
 * oder `true`) werden übersprungen. Pfeile laufen am Rand um (`wrap`, Standard `true`), Pos1/Ende nicht. `vertical` wechselt die Pfeile auf auf/ab,
 * `rtl` kehrt links/rechts um. Andere Tasten, eine leere Liste oder kein Ziel ergeben den aktuellen Index.
 */
export function nextTab(index, key, tabs, { vertical = false, rtl = false, wrap = true } = {}) {
  if (!Array.isArray(tabs) || !tabs.length || !Number.isInteger(index) || index < 0 || index >= tabs.length) return index;
  const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
  const backward = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
  if (key === 'Home') {
    const first = tabs.findIndex((tab) => !isOff(tab));
    return first < 0 ? index : first;
  }
  if (key === 'End') {
    for (let i = tabs.length - 1; i >= 0; i--) if (!isOff(tabs[i])) return i;
    return index;
  }
  if (key !== forward && key !== backward) return index;
  const step = key === forward ? 1 : -1;
  let next = index;
  for (let i = 0; i < tabs.length; i++) {
    next += step;
    if (next < 0 || next >= tabs.length) {
      if (!wrap) return index;
      next = (next + tabs.length) % tabs.length;
    }
    if (!isOff(tabs[next])) return next;
  }
  return index;
}

/** Anfangsauswahl: gewünschter Index (falls nicht gesperrt), sonst der markierte, sonst der erste nicht gesperrte; ohne Tabs `-1`. */
export function initialTab(tabs, wanted, marked) {
  for (const candidate of [wanted, marked]) {
    if (Number.isInteger(candidate) && candidate >= 0 && candidate < tabs.length && !isOff(tabs[candidate])) return candidate;
  }
  return tabs.findIndex((tab) => !isOff(tab));
}

const disabledOf = (el) => el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true' || el.classList.contains('is-disabled');
const valueOf = (tab) => tab.getAttribute('data-tab') || tab.id || '';

/**
 * Macht die Leiste `root` bedienbar. Optionen: `activation` (`auto`: Pfeiltasten wählen sofort, wie in den Frameworks, Standard; `manual`: Pfeiltasten
 * bewegen nur den Fokus, Enter/Leertaste wählt), `vertical` (sonst aus `aria-orientation` oder `dss-tabs--vertical`), `multi` (sonst `role="group"`),
 * `value` (Anfangstab: `data-tab`, `id` oder Index), `hash` (Deep-Link: `#id` eines Tabs oder Panels, oder eines Elements in einem Panel, wählt den Tab;
 * eine Wahl schreibt den Anker; Standard `false`), `onChange(detail)`.
 */
export function initTabs(root, options = {}) {
  const none = { ...createHandle(null), select() {}, getValue: () => null };
  if (typeof document === 'undefined' || !root || typeof root.querySelectorAll !== 'function') return none;
  registry.release(root);

  const doc = root.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  const opts = options && typeof options === 'object' ? options : {};
  // Tabs dieser Leiste: Nachfahren, deren nächste Leiste `root` ist (eine verschachtelte Leiste im Panel gehört nicht dazu)
  const barOf = (el) => el.parentElement?.closest('[role="tablist"], [role="group"], .dss-tabs') ?? null;
  const tabs = [...root.querySelectorAll('[role="tab"], .dss-tab')].filter((tab) => barOf(tab) === root);
  if (!tabs.length) return none;

  const multi = typeof opts.multi === 'boolean' ? opts.multi : root.getAttribute('role') === 'group';
  const vertical = typeof opts.vertical === 'boolean' ? opts.vertical : root.getAttribute('aria-orientation') === 'vertical' || root.classList.contains('dss-tabs--vertical');
  const manual = opts.activation === 'manual';
  const withHash = opts.hash === true && !multi;
  const rtl = () => win.getComputedStyle(root).direction === 'rtl';

  const cleanups = createCleanups();
  cleanups.add(snapshotAttributes(root, ['role', 'aria-orientation']));
  if (!multi) {
    if (!root.hasAttribute('role')) root.setAttribute('role', 'tablist');
    if (vertical) root.setAttribute('aria-orientation', 'vertical');
  }

  const rootNode = typeof root.getRootNode === 'function' ? root.getRootNode() : doc;
  const lookup = (id) => (id && typeof rootNode.getElementById === 'function' ? rootNode.getElementById(id) : null) ?? (id ? doc.getElementById(id) : null);
  const panels = tabs.map((tab) => {
    cleanups.add(snapshotAttributes(tab, ['role', 'aria-selected', 'aria-pressed', 'tabindex', 'id', 'class']));
    if (multi) return null;
    tab.setAttribute('role', 'tab');
    if (!tab.id) tab.id = `dss-tab-${++uid}`;
    const panel = lookup(tab.getAttribute('aria-controls'));
    if (!panel || panel === root || tabs.includes(panel)) return null;
    cleanups.add(snapshotAttributes(panel, ['role', 'aria-labelledby', 'hidden', 'inert']));
    if (!panel.hasAttribute('role')) panel.setAttribute('role', 'tabpanel');
    if (!panel.hasAttribute('aria-labelledby')) panel.setAttribute('aria-labelledby', tab.id);
    return panel;
  });
  const keys = tabs.map((tab) => valueOf(tab));
  const states = () => tabs.map((tab) => ({ disabled: disabledOf(tab) }));
  const pressed = (tab) => (tab.hasAttribute('aria-pressed') ? tab.getAttribute('aria-pressed') === 'true' : tab.classList.contains('is-active'));

  let current = -1;
  const paint = () => {
    tabs.forEach((tab, i) => {
      const on = multi ? pressed(tab) : i === current;
      tab.classList.toggle('is-active', on);
      if (multi) {
        tab.setAttribute('aria-pressed', String(on));
        return;
      }
      tab.setAttribute('aria-selected', String(on));
      tab.setAttribute('tabindex', on ? '0' : '-1');
      const panel = panels[i];
      if (panel) {
        panel.hidden = !on;
        if (on) panel.removeAttribute('inert');
        else panel.setAttribute('inert', '');
      }
    });
  };

  const emit = (index, source) => {
    const detail = { index, id: keys[index], tab: tabs[index], panel: panels[index] ?? null, source };
    if (multi) {
      detail.pressed = pressed(tabs[index]);
      detail.ids = tabs.filter(pressed).map(valueOf);
    }
    root.dispatchEvent(new CustomEvent(TAB_EVENT, { bubbles: true, detail }));
    if (typeof opts.onChange === 'function') opts.onChange(detail);
  };

  const select = (index, source = 'api', { focus = false, write = false } = {}) => {
    if (!Number.isInteger(index) || index < 0 || index >= tabs.length || disabledOf(tabs[index])) return;
    if (multi) {
      tabs[index].setAttribute('aria-pressed', String(!pressed(tabs[index])));
      paint();
      emit(index, source);
      return;
    }
    const changed = index !== current;
    current = index;
    paint();
    if (focus) tabs[index].focus();
    if (!changed) return;
    if (write) {
      const target = panels[index]?.id || tabs[index].id;
      if (withHash && target) writeHash(target, true);
    }
    emit(index, source);
  };

  // Anfangszustand
  const index = (key) => {
    if (typeof key === 'number') return key;
    const found = keys.indexOf(String(key));
    return found < 0 ? -1 : found;
  };
  const fromHash = () => {
    if (!withHash) return -1;
    const hash = currentHash();
    if (!hash) return -1;
    const ids = [...tabs.map((tab) => tab.id), ...panels.map((panel) => panel?.id)];
    const hit = hashTarget(hash, ids);
    if (hit) return tabs.findIndex((tab, i) => tab.id === hit || panels[i]?.id === hit);
    const el = doc.getElementById(hash);
    return el ? panels.findIndex((panel) => panel && panel.contains(el)) : -1;
  };
  if (multi) {
    paint();
  } else {
    const marked = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true' || tab.classList.contains('is-active'));
    const hashed = fromHash();
    current = initialTab(states(), hashed >= 0 ? hashed : index(opts.value), marked);
    paint();
    if (hashed >= 0 && hashed === current) {
      const hash = currentHash();
      const el = doc.getElementById(hash);
      scrollToElement(el && el !== tabs[current] ? el : panels[current] ?? tabs[current]);
    }
  }

  cleanups.add(listen(root, 'click', (event) => {
    const tab = event.target instanceof win.Element ? event.target.closest('[role="tab"], .dss-tab') : null;
    const i = tab ? tabs.indexOf(tab) : -1;
    if (i >= 0) select(i, 'user', { write: true });
  }));
  cleanups.add(listen(root, 'keydown', (event) => {
    const tab = event.target instanceof win.Element ? event.target.closest('[role="tab"], .dss-tab') : null;
    const i = tab ? tabs.indexOf(tab) : -1;
    if (i < 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if ((event.key === 'Enter' || event.key === ' ') && tab.localName !== 'button') {
      event.preventDefault();
      select(i, 'user', { write: true });
      return;
    }
    if (multi) return; // jeder Schalter ist per Tab-Taste erreichbar, keine Pfeiltasten
    if (!(vertical ? VERTICAL_KEYS : HORIZONTAL_KEYS).includes(event.key)) return;
    event.preventDefault();
    const next = nextTab(i, event.key, states(), { vertical, rtl: rtl() });
    if (next === i) return;
    if (manual) tabs[next].focus();
    else select(next, 'user', { focus: true, write: true });
  }));
  if (withHash) {
    cleanups.add(listen(win, 'hashchange', () => {
      const hashed = fromHash();
      if (hashed >= 0) {
        select(hashed, 'hash');
        const el = doc.getElementById(currentHash());
        scrollToElement(el && el !== tabs[hashed] ? el : panels[hashed] ?? tabs[hashed]);
      }
    }));
  }

  const handle = registry.claim(root, () => cleanups.run());
  return {
    destroy: handle.destroy,
    /** Wählt einen Tab (Index, `data-tab`/`id` oder Element); ein gesperrter oder unbekannter Tab wird ignoriert. */
    select(target) {
      const i = typeof target === 'object' && target ? tabs.indexOf(target) : index(target);
      select(i, 'api');
    },
    /** `data-tab`/`id` des gewählten Tabs (bei `multi` die Liste der gedrückten); sonst `null`. */
    getValue() {
      if (multi) return tabs.filter(pressed).map(valueOf);
      return current >= 0 ? keys[current] : null;
    },
  };
}
