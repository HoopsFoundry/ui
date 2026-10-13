/**
 * DSS Lifecycle · das gemeinsame Muster der Vanilla-Bausteine
 * --------------------------------------------------------------
 * Jeder Baustein hat die Form `initX(root, options) → { destroy() }`:
 *  - nur `root` und seine Nachfahren (und was der Baustein selbst anlegt), kein globaler Zustand;
 *  - idempotent: ein zweiter Aufruf für dieselbe Wurzel baut die erste Fassung ab und ersetzt sie (keine doppelten Listener);
 *  - `destroy()` entfernt Listener, Beobachter, Zeitgeber und alles, was der Baustein erzeugt hat; mehrfach aufrufbar.
 * Die Hilfen hier setzen das um. Ohne Abhängigkeiten, SSR-sicher. Typen: js/lifecycle.d.ts.
 */

/** Ein Handle `{ destroy }`; `destroy` läuft höchstens einmal. */
export function createHandle(destroy) {
  let done = false;
  return {
    destroy() {
      if (done) return;
      done = true;
      destroy?.();
    },
  };
}

/** Sammelt Aufräum-Funktionen; `run()` ruft sie in umgekehrter Reihenfolge einmalig auf. */
export function createCleanups() {
  const list = [];
  return {
    add(fn) {
      if (typeof fn === 'function') list.push(fn);
    },
    run() {
      for (const fn of list.splice(0).reverse()) {
        try {
          fn();
        } catch {
          // Aufräumen darf nie das Aufräumen der anderen verhindern
        }
      }
    },
  };
}

/** Fügt einen Listener hinzu und gibt die Funktion zum Entfernen zurück. */
export function listen(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/**
 * Register je Baustein: `claim(key, handle)` baut eine frühere Fassung für denselben Schlüssel (Wurzel) ab und merkt sich die neue;
 * nach `destroy()` des Handles ist der Schlüssel wieder frei. Mit einem `name` teilen sich alle Kopien dieses Moduls auf der Seite
 * (zwei gebündelte `dss.js`, ein Bündel plus Einzelmodul) ein Register unter `Symbol.for('dss.registry')`; so ersetzt ein zweites `init`
 * auch dann das erste, wenn es aus einer anderen Kopie kommt. Ohne `name` ist das Register privat.
 */
const GLOBAL_KEY = Symbol.for('dss.registry');
export function createRegistry(name) {
  let map = null;
  // lazy: beim Import wird nichts auf globalThis geschrieben (sideEffects: false)
  const weak = () => {
    if (map) return map;
    if (typeof name === 'string' && name) {
      const store = (globalThis[GLOBAL_KEY] ??= new Map());
      map = store.get(name);
      if (!map) store.set(name, (map = new WeakMap()));
    } else {
      map = new WeakMap();
    }
    return map;
  };
  return {
    /** Baut eine frühere Fassung für `key` ab (vor dem Aufbau der neuen aufrufen). */
    release(key) {
      weak().get(key)?.destroy();
    },
    /** Merkt `handle` für `key` und gibt ein Handle zurück, das sich beim Abbau selbst austrägt. */
    claim(key, destroy) {
      const handle = createHandle(() => {
        destroy();
        if (weak().get(key) === handle) weak().delete(key);
      });
      weak().set(key, handle);
      return handle;
    },
  };
}

/** Das Handle eines Bausteins, der nichts tun konnte (keine Wurzel, kein Browser). */
export function emptyHandle() {
  return createHandle(null);
}

/**
 * Merkt die Attribute `names` von `el` und gibt die Funktion zurück, die sie wiederherstellt: gesetzte Werte kommen zurück,
 * damals fehlende Attribute werden wieder entfernt. So räumt `destroy()` Markup auf, das ein Baustein verändert hat.
 */
export function snapshotAttributes(el, names) {
  const before = names.map((name) => [name, el.hasAttribute(name) ? el.getAttribute(name) : null]);
  return () => {
    for (const [name, value] of before) {
      if (value === null) el.removeAttribute(name);
      else if (el.getAttribute(name) !== value) el.setAttribute(name, value);
    }
  };
}
