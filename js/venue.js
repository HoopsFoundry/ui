/**
 * DSS Venue · Hilfsfunktionen für die Hallenkarte (VenueCard)
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM und ohne Intl (feste Formatierung, SSR-stabil). Svelte und React nutzen dieselbe Logik.
 * Typen: js/venue.d.ts.
 */
import { isCoord, mapLinks, safeHref } from './map.js';

export const venueText = {
  gamesLabel: 'Nächste Spiele in der Halle',
  linkLabel: 'Zur Hallenseite',
  mapLink: 'Größere Karte',
  routeLink: 'Route planen',
  contact: 'Kontakt',
  phone: 'Telefon',
  email: 'E-Mail',
  home: 'Heim',
  away: 'Gast',
  live: 'Live',
  cancelled: 'Abgesagt',
  postponed: 'Verschoben',
  mapLabel: 'Karte',
};

/** Höchstzahl der Spiele, wenn die App nichts angibt, und die obere Grenze. */
export const DEFAULT_GAMES = 2;
export const MAX_GAMES = 5;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

/** Name der Karte für Hilfstechnik: „Karte: Sporthalle Nordhain“ (verschiedene Hallen ergeben verschiedene Namen). */
export function venueMapLabel(name) {
  const n = text(name);
  return n ? `${venueText.mapLabel}: ${n}` : venueText.mapLabel;
}

/** Adresse in höchstens zwei Zeilen: Straße, dann „PLZ Ort“. Leere Teile entfallen; ohne Angaben `[]`. */
export function addressLines(address) {
  if (!address || typeof address !== 'object') return [];
  const street = text(address.street);
  const place = [text(address.zip), text(address.city)].filter(Boolean).join(' ');
  return [street, place].filter(Boolean);
}

/** Zahl für `tel:`: nur Ziffern und ein führendes Plus, mindestens drei Ziffern; sonst `undefined`. */
export function telHref(phone) {
  const raw = text(phone);
  if (!raw || raw.length > 40) return undefined;
  // erlaubt sind nur Ziffern, Leerzeichen und die üblichen Trenner einer Rufnummer (kein Zeilenumbruch: zwei Nummern ergäben eine)
  if (!/^\+?[\d ()./-]+$/.test(raw)) return undefined;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 3) return undefined;
  return `tel:${raw.startsWith('+') ? '+' : ''}${digits}`;
}

/** Adresse für `mailto:`: einfache Form `name@domain.tld` ohne Leerraum, Parameter (`?`, `&`) und Sonderzeichen; sonst `undefined`. */
export function mailHref(email) {
  const raw = text(email);
  if (!raw || raw.length > 254) return undefined;
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(raw)) return undefined;
  return safeHref(`mailto:${raw}`);
}

/**
 * Kontakt aufbereiten: `{ name, phone?: { text, href? }, email?: { text, href? } }`. Ohne Name, Telefon und E-Mail `null`.
 * Ein Wert ohne gültigen Link (Zeichenkette, die keine Rufnummer bzw. Adresse ist) bleibt als Text stehen, ohne `href`.
 */
export function contactInfo(contact) {
  if (!contact || typeof contact !== 'object') return null;
  const name = text(contact.name);
  const phone = text(contact.phone);
  const email = text(contact.email);
  if (!name && !phone && !email) return null;
  return {
    name,
    phone: phone ? { text: phone, href: telHref(phone) } : undefined,
    email: email ? { text: email, href: mailHref(email) } : undefined,
  };
}

/** Anzahl der Spiele: ganze Zahl 1 bis `MAX_GAMES`, sonst 2. Größere Werte werden begrenzt. */
export function gamesLimit(limit) {
  if (!Number.isInteger(limit) || limit < 1) return DEFAULT_GAMES;
  return Math.min(limit, MAX_GAMES);
}

/**
 * Spiele für die Halle: nur Spiele mit Heim- oder Gastmannschaft, ohne beendete (`finished`) und Spielfrei (`bye`); in der Reihenfolge der
 * Eingabe, höchstens `limit` (Standard 2, höchstens 5). Eine ungültige Eingabe ergibt `[]`.
 */
export function venueGames(games, limit) {
  if (!Array.isArray(games)) return [];
  return games
    .filter((g) => g && typeof g === 'object' && g.state !== 'finished' && g.state !== 'bye' && (g.heim?.name || g.gast?.name))
    .slice(0, gamesLimit(limit));
}

/**
 * Eindeutige Schlüssel für die Spielzeilen (Listenschlüssel in Svelte und React): `id` als Text, fehlende oder leere `id` ergeben `spiel-<Index>`,
 * doppelte bekommen ein Suffix (`-2`, `-3` …), das nie mit einer anderen `id` zusammenfällt.
 */
export function gameKeys(games) {
  const list = Array.isArray(games) ? games : [];
  const given = new Set(list.map((g) => g?.id).filter((id) => (typeof id === 'string' && id !== '') || typeof id === 'number').map(String));
  const used = new Set();
  return list.map((g, index) => {
    const hasId = (typeof g?.id === 'string' && g.id !== '') || typeof g?.id === 'number';
    const base = hasId ? String(g.id) : `spiel-${index}`;
    let key = base;
    for (let n = 2; used.has(key) || (given.has(key) && !(hasId && key === base)); n++) key = `${base}-${n}`;
    used.add(key);
    return key;
  });
}

/** Zeitangabe eines Spiels: „Sa, 17.10.2026 · 17:30“ (Datum und Uhrzeit, soweit vorhanden). */
export function gameWhen(game) {
  return [text(game?.date), text(game?.time)].filter(Boolean).join(' · ');
}

/** Zusatzzeile eines Spiels: Liga und Feld, getrennt durch „ · “. */
export function gameMeta(game) {
  return [text(game?.league?.name), text(game?.field)].filter(Boolean).join(' · ');
}

/** Hinweis zum Zustand: `{ text, tone }` für „Live“ (ok), „Abgesagt“ (err) und „Verschoben“ (warn); sonst `undefined`. */
export function gameState(game) {
  if (game?.state === 'live') return { text: venueText.live, tone: 'ok' };
  if (game?.state === 'cancelled') return { text: venueText.cancelled, tone: 'err' };
  if (game?.state === 'postponed') return { text: venueText.postponed, tone: 'warn' };
  return undefined;
}

/** Links unter der Karte (Größere Karte, Route planen); ohne gültige Koordinaten `[]`. */
export function venueMapLinks({ lat, lng, name }) {
  if (!isCoord(lat, lng)) return [];
  const links = mapLinks({ lat, lng, label: text(name) });
  return [
    { kind: 'osm', text: venueText.mapLink, href: links.osm },
    { kind: 'route', text: venueText.routeLink, href: links.route },
  ];
}

/** Ziel der Hallenseite: nur sichere Ziele (siehe `safeHref`), sonst `undefined`. */
export function venueHref(href) {
  return safeHref(href);
}

export { isCoord };
