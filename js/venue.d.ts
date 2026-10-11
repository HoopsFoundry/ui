import type { ScheduleGame } from './schedule.js';

export interface VenueAddress {
  street?: string;
  zip?: string;
  city?: string;
}

export interface VenueContact {
  name: string;
  phone?: string;
  email?: string;
}

export interface ContactValue {
  /** Anzeigetext wie übergeben (ohne Leerraum am Rand). */
  text: string;
  /** `tel:`- bzw. `mailto:`-Adresse; fehlt, wenn der Wert keine gültige Rufnummer bzw. Adresse ist. */
  href: string | undefined;
}

export interface ContactInfo {
  name: string;
  phone: ContactValue | undefined;
  email: ContactValue | undefined;
}

export interface VenueMapLink {
  kind: 'osm' | 'route';
  text: string;
  href: string;
}

export const venueText: {
  gamesLabel: string; linkLabel: string; mapLink: string; routeLink: string; contact: string; phone: string; email: string;
  home: string; away: string; live: string; cancelled: string; postponed: string; mapLabel: string;
};
export const DEFAULT_GAMES: number;
export const MAX_GAMES: number;

/** Name der Karte für Hilfstechnik: „Karte: Sporthalle Nordhain“. */
export function venueMapLabel(name: string | undefined): string;
/** Adresse in höchstens zwei Zeilen: Straße, dann „PLZ Ort“; leere Teile entfallen. */
export function addressLines(address: VenueAddress | undefined): string[];
/** `tel:`-Adresse aus einer Rufnummer; ungültige Zeichen oder weniger als drei Ziffern ergeben `undefined`. */
export function telHref(phone: string | undefined): string | undefined;
/** `mailto:`-Adresse aus einer einfachen E-Mail-Adresse; Parameter und Sonderzeichen ergeben `undefined`. */
export function mailHref(email: string | undefined): string | undefined;
/** Kontakt aufbereiten; ohne Name, Telefon und E-Mail `null`. */
export function contactInfo(contact: VenueContact | undefined): ContactInfo | null;
/** Anzahl der Spiele: 1 bis 5, sonst 2. */
export function gamesLimit(limit: unknown): number;
/** Nächste Spiele der Halle: ohne beendete und Spielfrei, höchstens `limit` (Standard 2). */
export function venueGames(games: ScheduleGame[] | undefined, limit?: number): ScheduleGame[];
export function gameWhen(game: ScheduleGame): string;
export function gameMeta(game: ScheduleGame): string;
/** Hinweis zum Zustand eines Spiels (Live, Abgesagt, Verschoben) mit Ton für den Chip. */
export function gameState(game: ScheduleGame): { text: string; tone: 'ok' | 'err' | 'warn' } | undefined;
export function venueMapLinks(options: { lat?: number; lng?: number; name?: string }): VenueMapLink[];
export function venueHref(href: string | undefined): string | undefined;
export function isCoord(lat: unknown, lng: unknown): boolean;
