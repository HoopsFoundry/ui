import type { HeadingTag } from '../heading.js';
import type { ScheduleGame } from '../schedule.js';
import type { VenueAddress, VenueContact } from '../venue.js';
import type { RenderOptions } from './core.js';
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

/** Markup der Hallenkarte, die Karte als Platzhalter (ohne Leaflet); `initMap` (V2b) macht sie lebendig. */
export function renderVenueCard(props: VenueCardProps, options?: RenderOptions): string;
export function mountVenueCard(el: Element, props: VenueCardProps, options?: MountOptions): MountHandle<VenueCardProps>;
