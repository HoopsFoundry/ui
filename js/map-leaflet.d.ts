import type { MapAppLink, MapItem, MapMarker } from './map.js';

export interface MapControllerOptions {
  markers: ReadonlyArray<MapMarker>;
  appLinks?: ReadonlyArray<MapAppLink>;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
  tileUrl?: string;
  /** Text für den Sitzmarker (Standard „Vereinssitz“). */
  seatLabel?: string;
}

export interface MapControllerHooks {
  /** Die Karte steht; Argument ist die Leaflet-Karte. */
  onReady?: (map: unknown) => void;
  /** Gründe: `tile-url`, `import`, `init`, `tiles`. */
  onError?: (reason: string) => void;
  onZoom?: (state: { zoom: number; min: number; max: number }) => void;
  onMarkerClick?: (item: MapItem) => void;
}

export interface MapController {
  /** Auflösung, sobald der Start durch ist (Leaflet geladen und Karte gebaut, oder Fehler gemeldet). */
  started: Promise<void>;
  update(options: MapControllerOptions): void;
  zoomIn(): void;
  zoomOut(): void;
  /** Ruft `map.remove()`; auch während des Ladens sicher. */
  destroy(): void;
}

export function createMapController(el: HTMLElement, options: MapControllerOptions, hooks?: MapControllerHooks): MapController;
export function pinElement(item: Pick<MapItem, 'number'> & { kind?: MapItem['kind'] }): SVGElement;
/** Wie `reducedMotion` aus js/motion.js (dort definiert, hier abwärtskompatibel erneut exportiert). */
export { reducedMotion } from './motion.js';
export function devWarn(message: string, detail?: unknown): void;
