import type { MapAppLink, MapDarkTiles, MapItem, MapMarker } from './map.js';
import type { HoopsHandle } from './lifecycle.js';

export type { MapAppLink, MapDarkTiles, MapMarker };
export type MapLoad = 'click' | 'auto';
/** Gründe eines Fehlers: ungültige Adresse, Leaflet nicht ladbar, Aufbau, Aktualisierung, alle ersten Kacheln fehlgeschlagen. */
export type MapErrorReason = 'tile-url' | 'import' | 'init' | 'update' | 'tiles';

/** Eigenschaften der Karte (dieselben wie bei `Map` in Svelte und `MapView` in React, ohne die Ereignisse). */
export interface MapProps {
  /** Orte auf der Karte: `{ id, lat, lng, label, href?, number?, own?, kind? }`. Ungültige Koordinaten werden ignoriert. */
  markers: MapMarker[];
  /** Name der Karte für Hilfstechnik (Region). Mehrere Karten auf einer Seite brauchen verschiedene Namen. */
  label: string;
  /** Mittelpunkt `[Breite, Länge]`. Ohne `center` und `zoom` passt sich der Ausschnitt allen Markern an. */
  center?: [number, number];
  /** Zoomstufe 3 bis 19 (Standard 15 bei Mittelpunkt oder einem Marker). */
  zoom?: number;
  /** Höhe in Pixeln (Standard 320, 200 bis 2000). */
  height?: number;
  /** `false`: kein Ziehen, Scrollzoom und Doppelklick, keine Zoom-Schaltflächen; der Tastaturzoom auf der Kartenfläche bleibt. */
  interactive?: boolean;
  /** `click`: Platzhalter, Kacheln erst nach „Karte laden“ (Standard). `auto`: sofort laden. */
  load?: MapLoad;
  /** Kachel-Adresse mit {z}, {x}, {y} (https, Pfad ab Wurzel oder http://localhost). Standard: OpenStreetMap (Demo). */
  tileUrl?: string;
  /** Text der Quellenangabe; leer ergibt den Standard, ausblenden geht nicht. */
  attribution?: string;
  /** Hinweis im Platzhalter. */
  privacyNote?: string;
  /** Links je Ort: `osm`, `geo`, `route`. */
  appLinks?: MapAppLink[];
  /** Liste der Orte sichtbar (Standard); `false`: nur für Hilfstechnik. */
  showList?: boolean;
  /** Kacheln im Dunkelmodus abdunkeln (Standard). */
  dimInDark?: boolean;
  /** `dim` (Standard) oder `invert`. */
  darkTiles?: MapDarkTiles;
  /** Text für den Sitzmarker; Standard „Vereinssitz“. */
  seatLabel?: string;
  /** Zusätzliche Klasse am Wurzelelement. */
  className?: string;
}

/** Verhalten der Karte: wie Leaflet geladen wird und was die Seite erfährt. */
export interface MapBehavior {
  /**
   * Liefert Leaflet (das Modul oder das Global `L`). Standard `import('leaflet')`: das braucht einen Bundler oder eine importmap.
   * Ohne Bundler eine lokale Datei laden, z. B. `() => import('/vendor/leaflet/leaflet-src.esm.js')`.
   */
  loadLeaflet?: () => Promise<unknown>;
  /** Die Karte steht; Argument ist die Leaflet-Karte. */
  onLoad?: (map: unknown) => void;
  /** Laden fehlgeschlagen. */
  onError?: (reason: MapErrorReason) => void;
  /** Ein Marker wurde angeklickt (vor der Navigation zu `href`). */
  onMarkerClick?: (item: MapItem) => void;
  /** Sprache nur für diese Karte (sonst die globale Sprache; ein Sprachwechsel führt die Texte nach, ohne Leaflet neu zu laden). */
  locale?: string;
  /** Eigene Texte nach Katalogschlüssel (`map.*`); `mapText` und die Eigenschaften der Karte (`privacyNote`, `seatLabel` …) gehen vor. */
  texts?: Record<string, string | { one: string; other: string; [form: string]: string }>;
}

/** Optionen von `renderMap`. */
export interface MapRenderOptions {
  /** Basis der erzeugten ids (Kartenfläche, Liste); nur Buchstaben, Ziffern, `_` und `-`. Ohne Angabe ein Hash der Eingaben. */
  uid?: string;
  /** Sprache nur für diesen Aufruf (sonst die globale Sprache). */
  locale?: string;
  /** Eigene Texte nach Katalogschlüssel (`map.*`); `mapText` und die Eigenschaften der Karte gehen vor. */
  texts?: Record<string, string | { one: string; other: string; [form: string]: string }>;
  /** Sprache der Seite, wenn kein `document` da ist (Node): weicht die Sprache der Karte ab, bekommt die Wurzel `lang`. */
  documentLang?: string;
}

export interface MapMountHandle extends HoopsHandle {
  /**
   * Aktualisiert Marker, Mitte, Zoom, Gesten, Kachel-Adresse und Texte, ohne die Karte neu aufzubauen. Teilweise Eigenschaften: nur Angegebenes ändert
   * sich, `undefined` wird ignoriert, `null` nimmt eine Eigenschaft zurück (es gilt wieder der Standard). Eine fehlende `tileUrl` bleibt die bisherige.
   */
  update(props: Partial<{ [K in keyof MapProps]: MapProps[K] | null }> & MapBehavior): void;
}

/** Markup der Karte wie `MapView` im Server-Rendering; „Karte laden“ ist bedienbar. Ohne Leaflet, ohne Netzverkehr, läuft in Node. */
export function renderMap(props: MapProps, options?: MapRenderOptions): string;
/**
 * Macht vorhandenes Markup lebendig. `el` ist das Element `.hoops-map` (von `renderMap`) oder ein Vorfahr (auch die Hallenkarte).
 * `options`: die Eigenschaften der Karte (`markers` ist nötig) plus `loadLeaflet`, `onLoad`, `onError`, `onMarkerClick`.
 */
export function initMap(el: Element, options: Partial<MapProps> & MapBehavior): MapMountHandle;
/** `renderMap` in `el` einsetzen (Styles über das CSSOM) und `initMap` starten; `destroy` stellt den früheren Inhalt wieder her. */
export function mountMap(el: Element, props: MapProps, options?: MapBehavior & MapRenderOptions): MapMountHandle;
/** Anbindung für `initAll` (`data-hoops="map"`): Markup vorhanden → `initMap`, leerer Behälter → `mountMap`. */
export function initMapBlock(el: Element, options: Partial<MapProps> & MapBehavior): MapMountHandle;
