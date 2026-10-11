// Demo-Daten der Karten-Doku: erfundene Hallen mit frei erfundenen Koordinaten in einem Waldgebiet. Es sind keine realen Gebäude oder Adressen.
// ?no-inline: sonst bettet Vite das kleine Bild als data-Adresse ein (die keine gültige Kachel-Adresse ist)
import demoPng from '../assets/tiles/demo.png?no-inline';

export type DemoMarker = { id: string; lat: number; lng: number; label: string; own?: boolean; href?: string; number?: number };

export const HALLEN: DemoMarker[] = [
  { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true },
  { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg', href: '#halle-seeberg' },
  { id: 'kiefernau', lat: 49.2955, lng: 7.8905, label: 'Gymnasium Kiefernau' },
];

/** Kachel-Adresse für die Doku: ein lokales Bild (kein Netzverkehr zu OpenStreetMap). Die Parameter z, x und y hängen nur an, damit die Adresse die drei Platzhalter enthält. */
export function demoTileUrl(): string {
  const query = '?z={z}&x={x}&y={y}';
  // Im Browser den absoluten Pfad verwenden (validTileUrl erlaubt nur https, Pfade ab Wurzel und http://localhost); beim Server-Rendering reicht die Rohadresse
  if (typeof location === 'undefined') return `${demoPng}${query}`;
  return new URL(demoPng, location.href).pathname + query;
}
