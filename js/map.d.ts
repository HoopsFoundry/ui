/** Ein Marker der Karte. */
export interface MapMarker {
  /** Eindeutige Kennung (Schlüssel für Aktualisierungen). */
  id: string;
  lat: number;
  lng: number;
  /** Name des Orts: Titel des Markers, Eintrag der Liste, Bezeichnung in den Links. */
  label: string;
  /** Ziel, das Klick bzw. Enter am Marker öffnet. */
  href?: string;
  /** Angezeigte Nummer; ohne Angabe zählt die Komponente bei mehreren Markern von 1 an (ein Marker bleibt ohne Nummer). */
  number?: number;
  /** Eigener Ort (zum Beispiel die eigene Halle): Marker in Akzentfarbe. */
  own?: boolean;
}

export type MapAppLink = 'osm' | 'geo' | 'route';

export interface MapLinkSet {
  /** geo:-URI, z. B. `geo:49.4875,8.466?q=49.4875,8.466(Sporthalle%20Nordhain)`. */
  geo: string;
  /** OpenStreetMap mit Markierung. */
  osm: string;
  /** OpenStreetMap-Routenplaner mit Ziel. */
  route: string;
}

export interface MapBounds {
  /** Südwest: [Breite, Länge]. */
  sw: [number, number];
  /** Nordost: [Breite, Länge]; die Länge kann über 180 liegen, wenn der kürzere Weg über die Datumsgrenze führt. */
  ne: [number, number];
}

export interface MapItemLink {
  kind: MapAppLink;
  text: string;
  href: string;
}

export interface MapItem {
  id: string;
  lat: number;
  lng: number;
  label: string;
  href: string | undefined;
  own: boolean;
  /** Nummer am Marker und in der Liste; `null` bei einem einzelnen Marker ohne eigene Nummer. */
  number: number | null;
  /** Koordinaten im deutschen Format („49,4875° N, 8,4660° O“). */
  coords: string;
  links: MapItemLink[];
}

export type MapView =
  | { center: [number, number]; zoom: number }
  | { bounds: MapBounds };

export interface MapPin {
  id: string;
  number: number | null;
  own: boolean;
  /** Prozent von links. */
  x: number;
  /** Prozent von oben. */
  y: number;
}

export const mapText: {
  load: string; loading: string; error: string; privacy: string; skip: string; zoomIn: string; zoomOut: string;
  attribution: string; attributionHref: string; linkGeo: string; linkOsm: string; linkRoute: string; listLabel: string; own: string; zoomGroup: string; canvasHint: string;
};
export const DEFAULT_TILE_URL: string;
export const MIN_ZOOM: number;
export const MAX_ZOOM: number;
export const DEFAULT_ZOOM: number;

/** Gültige Koordinate: endliche Zahlen (keine Zeichenketten), Breite −90 bis 90, Länge −180 bis 180. */
export function isCoord(lat: unknown, lng: unknown): boolean;
/** Links in Karten-Apps; ungültige Koordinaten ergeben `null`. Die Bezeichnung ist kodiert. */
export function mapLinks(input: { lat: number; lng: number; label?: string }): MapLinkSet | null;
/** „49,4875° N, 8,4660° O“; ungültige Werte ergeben eine leere Zeichenkette. */
export function formatCoords(lat: number, lng: number): string;
/** Kachel-Adresse prüfen: `{z}`, `{x}`, `{y}` Pflicht; `https:`, Pfad ab Wurzel oder `http://localhost`. */
export function validTileUrl(url: unknown): boolean;
/** Prüft ein Marker-Ziel: nur http(s), mailto, tel, Pfade und #-Ziele; sonst `undefined` (zum Beispiel `javascript:`). */
export function safeHref(href: unknown): string | undefined;
/** Umschließendes Rechteck der gültigen Marker; ohne gültigen Marker `null`. */
export function boundsOf(markers: ReadonlyArray<Pick<MapMarker, 'lat' | 'lng'>>): MapBounds | null;
/** Marker für Liste, Platzhalter und Karte aufbereiten (ungültige entfallen). */
export function mapItems(markers: ReadonlyArray<MapMarker>, appLinks?: ReadonlyArray<MapAppLink>): MapItem[];
/** Ausschnitt beim Start: Mittelpunkt und Zoom oder ein Rechteck zum Einpassen. */
export function initialView(input: { markers?: ReadonlyArray<MapMarker>; center?: [number, number]; zoom?: number }): MapView;
/** Lage der Marker im Platzhalter in Prozent. */
export function placeholderPins(items: ReadonlyArray<Pick<MapItem, 'id' | 'lat' | 'lng' | 'number' | 'own'>>): MapPin[];
