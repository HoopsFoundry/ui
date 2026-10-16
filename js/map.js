/**
 * HoopsFoundry UI Map · reine Funktionen für die Karten-Komponente (Map / MapView)
 * --------------------------------------------------------------
 * Ohne DOM, ohne Intl und ohne Leaflet (feste Formatierung, SSR-stabil). Svelte, React und eigene Seiten nutzen dieselbe Logik.
 * Typen: js/map.d.ts.
 */

import { safeHref } from './url.js';

/** Texte der Komponente (eine Quelle für Svelte und React). */
export const mapText = {
  load: 'Karte laden',
  loading: 'Karte wird geladen …',
  error: 'Die Karte konnte nicht geladen werden. Adresse und Route siehe unten.',
  privacy: 'Beim Laden der Karte erhält der Kartendienst deine IP-Adresse.',
  skip: 'Karte überspringen',
  zoomIn: 'Vergrößern',
  zoomOut: 'Verkleinern',
  attribution: '© OpenStreetMap-Mitwirkende',
  attributionHref: 'https://www.openstreetmap.org/copyright',
  linkGeo: 'In Karten-App öffnen',
  linkOsm: 'In OpenStreetMap öffnen',
  linkRoute: 'Route planen',
  listLabel: 'Orte auf der Karte',
  own: 'Eigener Ort',
  seat: 'Vereinssitz',
  zoomGroup: 'Maßstab',
  canvasHint: 'Kartenfläche. Pfeiltasten verschieben, Plus und Minus ändern den Maßstab.',
};

/** Standard-Kachel-Adresse (Demo und Entwicklung; produktiv einen eigenen Proxy oder Kachelserver nutzen). */
export const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 19;
export const DEFAULT_ZOOM = 15;

/** Gültige Koordinate: beide Werte endliche Zahlen (keine Zeichenketten), Breite −90 bis 90, Länge −180 bis 180. */
export function isCoord(lat, lng) {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  );
}

/** Zahl für Adressen: höchstens 6 Nachkommastellen, ohne überflüssige Nullen, ohne Exponent. */
const coordNumber = (value) => {
  const text = value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  return text === '-0' ? '0' : text;
};

/** encodeURIComponent plus die Zeichen, die es durchlässt und die in geo:-Bezeichnungen stören: ! ' ( ) * */
const encodeLabel = (text) => encodeURIComponent(text).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * Links in Karten-Apps. `geo`: geo:-URI (Android und viele Desktop-Karten-Apps), `osm`: OpenStreetMap mit Markierung,
 * `route`: OpenStreetMap-Routenplaner mit Ziel (Start offen). Die Bezeichnung ist kodiert (Umlaute, Leerzeichen, &, Klammern).
 * Ungültige Koordinaten ergeben `null`.
 */
export function mapLinks({ lat, lng, label } = {}) {
  if (!isCoord(lat, lng)) return null;
  const la = coordNumber(lat);
  const ln = coordNumber(lng);
  const name = typeof label === 'string' ? label.trim() : '';
  return {
    geo: `geo:${la},${ln}?q=${la},${ln}${name ? `(${encodeLabel(name)})` : ''}`,
    osm: `https://www.openstreetmap.org/?mlat=${la}&mlon=${ln}#map=17/${la}/${ln}`,
    route: `https://www.openstreetmap.org/directions?route=${encodeURIComponent(`;${la},${ln}`)}`,
  };
}

/**
 * Koordinaten im deutschen Format: „49,4875° N, 8,4660° O“ (4 Nachkommastellen, Komma, Himmelsrichtung statt Vorzeichen).
 * Null und −0 gelten als N und O; eine Länge von 180 ist O, −180 ist W. Ungültige Werte ergeben eine leere Zeichenkette.
 */
export function formatCoords(lat, lng) {
  if (!isCoord(lat, lng)) return '';
  const part = (value, plus, minus) => {
    const text = Math.abs(value).toFixed(4);
    const zero = Number(text) === 0;
    return `${text.replace('.', ',')}° ${value < 0 && !zero ? minus : plus}`;
  };
  return `${part(lat, 'N', 'S')}, ${part(lng, 'O', 'W')}`;
}

/**
 * Prüft eine Kachel-Adresse. Erlaubt: `{z}`, `{x}`, `{y}` (alle drei Pflicht) sowie `{s}` und `{r}`; Schema `https:`, ein
 * Pfad ab Wurzel (`/tiles/…`, nicht `//host`) oder `http://localhost` (mit Port und Pfad; andere Hosts über http nie). Alles andere ist ungültig,
 * ebenso andere Platzhalter, Leerzeichen, Anführungszeichen, spitze Klammern und Zugangsdaten in der Adresse.
 */
export function validTileUrl(url) {
  if (typeof url !== 'string' || !url || url.length > 2048) return false;
  if (/[\u0000-\u001f\u007f-\u009f\s"'<>\\`]/.test(url)) return false;
  for (const key of ['{z}', '{x}', '{y}']) if (!url.includes(key)) return false;
  const rest = url.replace(/\{[zxysr]\}/g, '');
  if (/[{}]/.test(rest)) return false;
  if (url.startsWith('/')) return !url.startsWith('//');
  const m = url.match(/^(https?):\/\/([^/?#]*)([/?#].*)?$/i);
  if (!m) return false;
  const scheme = m[1].toLowerCase();
  // Nur {s} darf im Host stehen ({z}, {x}, {y} nicht); Host aus Buchstaben, Ziffern, Punkt und Bindestrich, optional :Port (1 bis 65535)
  const host = m[2].replace(/\{s\}/g, 'a');
  const parts = host.match(/^([A-Za-z0-9.-]+)(?::(\d{1,5}))?$/);
  if (!parts) return false;
  if (parts[2] !== undefined && (Number(parts[2]) < 1 || Number(parts[2]) > 65535)) return false;
  if (scheme === 'https') return true;
  return parts[1].toLowerCase() === 'localhost';
}

// `safeHref` lebt jetzt in js/url.js (gemeinsam mit den Render-Funktionen); hier abwärtskompatibel erneut exportiert
export { safeHref };

/**
 * Umschließendes Rechteck aller gültigen Marker: `{ sw: [lat, lng], ne: [lat, lng] }` (Südwest, Nordost).
 * Keine gültigen Marker ergeben `null`, ein Marker ein Rechteck aus einem Punkt. Über die Datumsgrenze (Längen nahe 180 und −180)
 * wählt die Funktion den kürzeren Weg; dann kann die Nordost-Länge über 180 liegen (Leaflet versteht das).
 */
export function boundsOf(markers) {
  const list = (Array.isArray(markers) ? markers : []).filter((m) => m && isCoord(m.lat, m.lng));
  if (!list.length) return null;
  const lats = list.map((m) => m.lat);
  const lngs = list.map((m) => m.lng).sort((a, b) => a - b);
  let west = lngs[0];
  let east = lngs[lngs.length - 1];
  // Größte Lücke zwischen benachbarten Längen; ist sie größer als der Rest, verläuft der kürzere Weg über die Datumsgrenze
  let gap = 360 - (east - west);
  let gapAfter = -1;
  for (let i = 0; i < lngs.length - 1; i++) {
    if (lngs[i + 1] - lngs[i] > gap) { gap = lngs[i + 1] - lngs[i]; gapAfter = i; }
  }
  if (gapAfter >= 0) {
    west = lngs[gapAfter + 1];
    east = lngs[gapAfter] + 360;
  }
  return { sw: [Math.min(...lats), west], ne: [Math.max(...lats), east] };
}

/** Name eines Markers für Hilfstechnik: die sichtbare Nummer voran, dann der Name des Orts („1, Sporthalle Nordhain“); ein Sitzmarker hat keine Nummer und den Zusatz „Vereinssitz“ („Sporthalle Nordhain, Vereinssitz“, Text über `seatText` des Eintrags). */
export function markerName(item) {
  const label = item && typeof item.label === 'string' ? item.label : '';
  if (item?.kind === 'seat') {
    const seat = typeof item.seatText === 'string' && item.seatText.trim() ? item.seatText.trim() : mapText.seat;
    return label ? `${label}, ${seat}` : seat;
  }
  // Die sichtbare Nummer steht voran („1, Sporthalle Nordhain“): Der Name enthält so den Text des Markers (WCAG 2.5.3, Label im Namen)
  const number = item?.number;
  return Number.isInteger(number) && number >= 0 ? (label ? `${number}, ${label}` : String(number)) : label;
}

/** Kachelverfahren im Dunkelmodus: `invert` (invertieren und umfärben) oder `dim` (abdunkeln, Standard); alles andere ergibt `dim`. */
export function tilesMode(value) {
  return value === 'invert' ? 'invert' : 'dim';
}

/**
 * Marker für Liste, Platzhalter und Karte aufbereiten (`texts.seat`: Text für den Sitzmarker statt „Vereinssitz“): ungültige Koordinaten fallen weg, `href` läuft durch `safeHref`, ids sind eindeutig (doppelte und fehlende bekommen `marker-<Index>` bzw. `<id>-2`), Nummer = `number` oder bei mehreren
 * Markern die laufende Nummer (ein Marker bekommt keine), dazu Koordinatentext und Links (nur die in `appLinks` gewünschten).
 */
export function mapItems(markers, appLinks = ['osm', 'route'], texts = {}) {
  const valid = (Array.isArray(markers) ? markers : []).filter((m) => m && isCoord(m.lat, m.lng));
  const wants = Array.isArray(appLinks) ? appLinks : [];
  // Eindeutige ids: ausdrückliche ids behalten ihren Wert (die erste gewinnt), doppelte und fehlende bekommen einen freien Ersatz
  const explicit = new Set(valid.filter((m) => m.id !== undefined && m.id !== null && m.id !== '').map((m) => String(m.id)));
  const used = new Set();
  const unique = (base, isExplicit) => {
    let id = base;
    for (let n = 2; used.has(id) || (explicit.has(id) && !(isExplicit && id === base)); n++) id = `${base}-${n}`;
    used.add(id);
    return id;
  };
  // Sitzmarker (kind: 'seat') tragen keine Nummer und zählen nicht mit; die Orte werden unter sich von 1 an gezählt
  const places = valid.filter((m) => m.kind !== 'seat').length;
  let running = 0;
  return valid.map((m, index) => {
    const seat = m.kind === 'seat';
    if (!seat) running += 1;
    const label = typeof m.label === 'string' ? m.label : '';
    const all = mapLinks({ lat: m.lat, lng: m.lng, label });
    const links = [];
    if (wants.includes('geo')) links.push({ kind: 'geo', text: mapText.linkGeo, href: all.geo });
    if (wants.includes('osm')) links.push({ kind: 'osm', text: mapText.linkOsm, href: all.osm });
    if (wants.includes('route')) links.push({ kind: 'route', text: mapText.linkRoute, href: all.route });
    const given = Number.isInteger(m.number) && m.number >= 0 ? m.number : null;
    const hasId = m.id !== undefined && m.id !== null && m.id !== '';
    return {
      id: unique(hasId ? String(m.id) : `marker-${index}`, hasId),
      lat: m.lat,
      lng: m.lng,
      label,
      href: safeHref(m.href),
      own: m.own === true,
      kind: seat ? 'seat' : 'place',
      seatText: typeof texts?.seat === 'string' && texts.seat.trim() ? texts.seat.trim() : mapText.seat,
      number: seat ? null : given ?? (places > 1 ? running : null),
      coords: formatCoords(m.lat, m.lng),
      links,
    };
  });
}

/**
 * Ausschnitt beim Start. `center` (und `zoom`, Standard 15) gewinnt; nur `zoom` zentriert auf die Marker; ohne beides passt sich
 * der Ausschnitt allen Markern an (ein Marker: `zoom`); ganz ohne Marker zeigt die Karte Deutschland.
 * Ergebnis: `{ center: [lat, lng], zoom }` oder `{ bounds: { sw, ne } }`.
 */
export function initialView({ markers, center, zoom } = {}) {
  const z = Number.isFinite(zoom) ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom))) : null;
  if (Array.isArray(center) && isCoord(center[0], center[1])) return { center: [center[0], center[1]], zoom: z ?? DEFAULT_ZOOM };
  const bounds = boundsOf(markers);
  if (!bounds) return { center: [51.1657, 10.4515], zoom: z ?? 5 };
  const single = bounds.sw[0] === bounds.ne[0] && bounds.sw[1] === bounds.ne[1];
  if (z !== null || single) {
    const lat = (bounds.sw[0] + bounds.ne[0]) / 2;
    let lng = (bounds.sw[1] + bounds.ne[1]) / 2;
    if (lng > 180) lng -= 360;
    return { center: [lat, lng], zoom: z ?? DEFAULT_ZOOM };
  }
  return { bounds };
}

/**
 * Lage der Marker im Platzhalter in Prozent (x von links, y von oben) innerhalb des umschließenden Rechtecks mit Rand:
 * x von 12 bis 88, y von 14 bis 44 (unten sitzt die Karte mit Hinweis und Schaltfläche). Ein einzelner Marker liegt in der Mitte dieses Bereichs.
 */
export function placeholderPins(items) {
  const list = Array.isArray(items) ? items : [];
  const bounds = boundsOf(list);
  if (!bounds) return [];
  const spanLat = bounds.ne[0] - bounds.sw[0];
  const spanLng = bounds.ne[1] - bounds.sw[1];
  // Anteil 0 bis 1 im Rechteck, abgebildet auf [from, to]; ohne Ausdehnung die Mitte
  const pos = (value, min, span, from, to) => (span > 0 ? from + ((value - min) / span) * (to - from) : (from + to) / 2);
  return list
    .filter((m) => isCoord(m.lat, m.lng))
    .map((m) => {
      let lng = m.lng;
      if (lng < bounds.sw[1]) lng += 360;
      return {
        id: String(m.id),
        number: m.number ?? null,
        own: m.own === true,
        kind: m.kind === 'seat' ? 'seat' : 'place',
        x: Math.round(pos(lng, bounds.sw[1], spanLng, 12, 88) * 10) / 10,
        // Norden oben: größere Breite liegt weiter oben
        y: Math.round(pos(bounds.ne[0] - m.lat, 0, spanLat, 14, 44) * 10) / 10,
      };
    });
}
