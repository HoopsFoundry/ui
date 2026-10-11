// Beispiel (nicht Teil des Pakets): Kachel-Proxy als SvelteKit-Endpunkt, Datei src/routes/tiles/[...path]/+server.ts.
// Aufruf aus der Karte: tileUrl="/tiles/{z}/{x}/{y}.png". Der Besucher spricht nur mit diesem Server, OpenStreetMap sieht nur dessen IP.
// Kein offener Proxy: der Host ist fest, aus der Anfrage werden nur drei Ganzzahlen übernommen; ausgeliefert wird ausschließlich png.

/** Fester Kachelserver. Für den Dauerbetrieb einen eigenen Server oder einen EU-Anbieter mit Auftragsverarbeitungsvertrag eintragen. */
const TILE_HOST = 'https://tile.openstreetmap.org';
/** Eindeutige Kennung der App mit Kontakt (Pflicht laut Tile Usage Policy), kein Browser-User-Agent. */
const USER_AGENT = 'Hallenkarte-Nordhain/1.0 (+https://beispiel.example/kontakt)';
const MAX_ZOOM = 19;

export interface Tile {
  z: number;
  x: number;
  y: number;
}

/**
 * Prüft den Pfad `z/x/y.png`: nur Ganzzahlen ohne führende Nullen, Zoom 0 bis 19, 0 ≤ x, y < 2^z, Endung png.
 * Alles andere ergibt null (404), auch Pfade mit `..`, Schrägstrichen, Parametern oder anderen Endungen.
 */
export function parseTilePath(path: string): Tile | null {
  const match = path.match(/^(0|[1-9]\d?)\/(0|[1-9]\d{0,6})\/(0|[1-9]\d{0,6})\.png$/);
  if (!match) return null;
  const z = Number(match[1]);
  const x = Number(match[2]);
  const y = Number(match[3]);
  if (z > MAX_ZOOM) return null;
  const size = 2 ** z;
  if (x >= size || y >= size) return null;
  return { z, x, y };
}

/** SvelteKit ruft GET mit den Routenparametern auf; `params.path` ist der Rest hinter /tiles/. */
export async function GET({ params }: { params: { path: string } }): Promise<Response> {
  const tile = parseTilePath(params.path);
  if (!tile) return new Response('Kachel nicht gefunden', { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(`${TILE_HOST}/${tile.z}/${tile.x}/${tile.y}.png`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return new Response('Kartendienst nicht erreichbar', { status: 502 });
  }
  if (!upstream.ok) return new Response('Kartendienst nicht erreichbar', { status: 502 });

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      // Cache-Control des Kartendienstes weiterreichen (Pflicht der Policy); ohne Angabe einen Tag
      'Cache-Control': upstream.headers.get('Cache-Control') ?? 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
