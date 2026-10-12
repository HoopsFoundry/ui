/** Rückgabe jedes `initX`: `destroy()` räumt alles auf, was der Baustein angelegt hat (mehrfach aufrufbar). */
export interface DssHandle {
  destroy(): void;
}

/** Ein Handle, dessen `destroy` die Funktion höchstens einmal ausführt. */
export function createHandle(destroy?: (() => void) | null): DssHandle;
/** Sammelt Aufräum-Funktionen; `run()` ruft sie in umgekehrter Reihenfolge einmalig auf. */
export function createCleanups(): { add(fn: unknown): void; run(): void };
/** Fügt einen Listener hinzu und gibt die Funktion zum Entfernen zurück. */
export function listen(target: EventTarget, type: string, handler: EventListener, options?: AddEventListenerOptions | boolean): () => void;
/** Register je Baustein (WeakMap): ein zweites `init` für dieselbe Wurzel ersetzt das erste. */
export function createRegistry<K extends object>(): {
  release(key: K): void;
  claim(key: K, destroy: () => void): DssHandle;
};
/** Das Handle eines Bausteins, der nichts tun konnte. */
export function emptyHandle(): DssHandle;
/** Merkt die Attribute `names` von `el`; die Rückgabe stellt sie wieder her (damals fehlende werden entfernt). */
export function snapshotAttributes(el: Element, names: readonly string[]): () => void;
