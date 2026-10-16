import type { HoopsHandle } from '../lifecycle.js';
import type { RenderOptions } from './core.js';

/** Ein delegiertes Ereignis am Container (z. B. der Klick einer Karte). */
export interface MountEvent {
  type: string;
  selector: string;
  handler: (event: Event, target: Element) => void;
}

/** Optionen von `mountX`: die Optionen der Render-Funktion plus delegierte Ereignisse. */
export interface MountOptions extends RenderOptions {
  on?: MountEvent[];
  [key: string]: unknown;
}

/** Rückgabe von `mountX`. */
export interface MountHandle<P = Record<string, unknown>> extends HoopsHandle {
  /**
   * Ersetzt den Inhalt durch das Markup zu den neuen Eigenschaften; der Fokus und der Zustand eines einklappbaren Rahmens bleiben erhalten.
   * `props` sind die **vollständigen** Eigenschaften (wie ein erneutes Rendern), keine Änderungen: Fehlendes gilt als nicht angegeben.
   * (Anders die Karte: `mountMap(...).update` nimmt Teile an.)
   */
  update(props: P): void;
}

/** Setzt das Markup einer Render-Funktion in `el` ein und liefert `{ update, destroy }`. */
export function mount<P extends object>(
  el: Element,
  render: (props: P, options: Record<string, unknown>) => string,
  props: P,
  options?: MountOptions,
): MountHandle<P>;
