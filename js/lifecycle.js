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
 * nach `destroy()` des Handles ist der Schlüssel wieder frei.
 */
export function createRegistry() {
  const map = new WeakMap();
  return {
    /** Baut eine frühere Fassung für `key` ab (vor dem Aufbau der neuen aufrufen). */
    release(key) {
      map.get(key)?.destroy();
    },
    /** Merkt `handle` für `key` und gibt ein Handle zurück, das sich beim Abbau selbst austrägt. */
    claim(key, destroy) {
      const handle = createHandle(() => {
        destroy();
        if (map.get(key) === handle) map.delete(key);
      });
      map.set(key, handle);
      return handle;
    },
  };
}

/** Das Handle eines Bausteins, der nichts tun konnte (keine Wurzel, kein Browser). */
export function emptyHandle() {
  return createHandle(null);
}
