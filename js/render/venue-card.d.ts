import type { HeadingTag } from '../heading.js';
import type { ScheduleGame } from '../schedule.js';
import type { VenueAddress, VenueContact } from '../venue.js';
import type { RenderOptions } from './core.js';

export interface VenueCardRenderOptions extends RenderOptions {
  /** `true`: „Karte laden“ ist bedienbar (die Seite startet `initMap`). Standard: gesperrt, solange keine Karte angebunden ist. */
  mapActive?: boolean;
  /**
   * `true`: markiert die Karte für `initAll` (`data-dss="map"` am Behälter `.dss-venue-map`, die Optionen als JSON in `data-dss-options`).
   * Für Markup, das auf dem Server entsteht; „Karte laden“ bleibt ohne Skript gesperrt.
   */
  init?: boolean;
}

/** Optionen von `mountVenueCard`: die Karte startet, wenn `initMap` (aus dem Karten-Bündel `dss-map.js`) übergeben wird. */
export interface VenueCardMountOptions extends MountOptions {
  /** `initMap` aus `dss-map.js` oder `js/map-vanilla.js`: startet die eingebettete Karte (nicht interaktiv, ohne Liste). */
  initMap?: (el: Element, options: Record<string, unknown>) => { update(props: Record<string, unknown>): void; destroy(): void };
  /** Liefert Leaflet (das Modul oder das Global `L`); Standard `import('leaflet')`. */
  loadLeaflet?: () => Promise<unknown>;
  /** Die Karte steht; Argument ist die Leaflet-Karte. */
  onLoad?: (map: unknown) => void;
  /** Laden fehlgeschlagen: `tile-url`, `import`, `init`, `update` oder `tiles`. */
  onError?: (reason: string) => void;
  onMarkerClick?: (marker: unknown) => void;
  /** „Karte laden“ ohne `initMap` bedienbar machen (die Seite startet die Karte selbst). */
  mapActive?: boolean;
}
import type { MountHandle, MountOptions } from './mount.js';

export interface VenueCardProps {
  /** Name der Halle; leer oder nur Leerraum ergibt keine Überschrift. */
  name: string;
  address?: VenueAddress;
  /** Koordinaten; ohne beide gültigen Werte keine Karte. */
  lat?: number;
  lng?: number;
  info?: string;
  contact?: VenueContact;
  /** Spiele in der Halle; gezeigt werden die nächsten `limit` ohne beendete und Spielfrei (nur `standard`). */
  games?: ScheduleGame[];
  /** Höchstzahl der Spiele (1 bis 5, Standard 2). */
  limit?: number;
  gamesLabel?: string;
  /** Seite der Halle (nur sichere Ziele). */
  href?: string;
  linkLabel?: string;
  names?: 'full' | 'short';
  logos?: boolean;
  size?: 'standard' | 'compact';
  titleAs?: HeadingTag;
  /** `click`: Platzhalter, Kacheln erst nach „Karte laden“ (Standard). `auto`: sofort laden. */
  load?: 'click' | 'auto';
  /** Kachel-Adresse (siehe Map); eine ungültige ergibt den Fehlerzustand mit Adresse und Links. */
  tileUrl?: string;
  privacyNote?: string;
  /** Mindesthöhe der Karte in Pixeln (mindestens 200, Standard 250). */
  mapHeight?: number;
  className?: string;
}

/** Markup der Hallenkarte, die Karte als Platzhalter (ohne Leaflet); `initMap` (js/map-vanilla.js) macht sie lebendig. */
export function renderVenueCard(props: VenueCardProps, options?: VenueCardRenderOptions): string;
export function mountVenueCard(el: Element, props: VenueCardProps, options?: VenueCardMountOptions): MountHandle<VenueCardProps>;
