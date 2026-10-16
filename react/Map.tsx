import { useEffect, useId, useRef, useState } from 'react';
import { cn } from './cn';
import { DEFAULT_TILE_URL, mapItems, mapText, placeholderPins, tilesMode, validTileUrl } from '../js/map.js';
import type { MapAppLink, MapDarkTiles, MapMarker } from '../js/map.js';
import { createMapController, devWarn } from '../js/map-leaflet.js';

export type { MapAppLink, MapDarkTiles, MapMarker };
export type MapLoad = 'click' | 'auto';
export type MapErrorReason = 'tile-url' | 'import' | 'init' | 'update' | 'tiles';

export interface MapViewProps {
  /** Orte auf der Karte: `{ id, lat, lng, label, href?, number?, own?, kind? }` (`kind: 'seat'`: Vereinssitz mit Haus-Symbol). Ungültige Koordinaten werden ignoriert. */
  markers: MapMarker[];
  /** Name der Karte für Hilfstechnik (Region). Mehrere Karten auf einer Seite brauchen verschiedene Namen. */
  label: string;
  /** Mittelpunkt `[Breite, Länge]`. Ohne `center` und `zoom` passt sich der Ausschnitt allen Markern an. */
  center?: [number, number];
  /** Zoomstufe 3 bis 19 (Standard 15 bei Mittelpunkt oder einem Marker). */
  zoom?: number;
  /** Höhe der Karte in Pixeln (Standard 320, 200 bis 2000). */
  height?: number;
  /** `false`: kein Ziehen, Scrollzoom und Doppelklick; Tasten und Zoom-Schaltflächen bleiben. */
  interactive?: boolean;
  /** `click`: Platzhalter, Kacheln erst nach „Karte laden“ (Standard). `auto`: sofort laden. */
  load?: MapLoad;
  /** Kachel-Adresse mit {z}, {x}, {y}. Standard: OpenStreetMap (Demo); produktiv ein eigener Proxy oder Kachelserver. */
  tileUrl?: string;
  /** Text der Quellenangabe (verlinkt auf die OpenStreetMap-Urheberrechtsseite); leer ergibt den Standard, ausblenden geht nicht. */
  attribution?: string;
  /** Hinweis im Platzhalter, z. B. bei eigenem Proxy ein anderer Text. */
  privacyNote?: string;
  /** Links je Ort: `osm`, `geo`, `route`. */
  appLinks?: MapAppLink[];
  /** Liste der Orte sichtbar (Standard); `false`: nur für Hilfstechnik. */
  showList?: boolean;
  /** Kacheln im Dunkelmodus abdunkeln (Standard). `false` lässt sie unverändert. */
  dimInDark?: boolean;
  /** Verfahren im Dunkelmodus: `dim` dunkelt ab (Standard), `invert` invertiert und färbt um (Wasser und Straßen wirken fremd, die Karte wird wirklich dunkel). Wirkt nur mit `dimInDark`. */
  darkTiles?: MapDarkTiles;
  /** Text für den Sitzmarker (`kind: 'seat'`) in Liste und Marker-Namen; Standard „Vereinssitz“. */
  seatLabel?: string;
  /** Die Karte ist bereit; Argument ist die Leaflet-Karte. */
  onLoad?: (map: unknown) => void;
  /** Laden fehlgeschlagen. */
  onError?: (reason: MapErrorReason) => void;
  onMarkerClick?: (marker: unknown) => void;
  className?: string;
}

type Phase = 'idle' | 'loading' | 'ready';
type Controller = ReturnType<typeof createMapController>;

const Plus = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M10 4v12M4 10h12" />
  </svg>
);
const Minus = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M4 10h12" />
  </svg>
);

/**
 * Karte mit Leaflet und OpenStreetMap. Der Name ist `MapView`, damit das JS-Global `Map` nicht überdeckt wird.
 * Leaflet ist eine optionale Peer-Abhängigkeit und wird erst beim Laden nachgeladen; die App lädt `leaflet/dist/leaflet.css`.
 * Standard ist die Zwei-Klick-Lösung (Platzhalter, Kacheln erst nach „Karte laden“); `load="auto"` lädt sofort.
 */
export function MapView({
  markers,
  label,
  center,
  zoom,
  height = 320,
  interactive = true,
  load = 'click',
  tileUrl = DEFAULT_TILE_URL,
  attribution = mapText.attribution,
  privacyNote = mapText.privacy,
  appLinks = ['osm', 'route'],
  showList = true,
  dimInDark = true,
  darkTiles = 'dim',
  seatLabel,
  onLoad,
  onError,
  onMarkerClick,
  className,
}: MapViewProps) {
  const uid = useId();
  const canvasId = `hoops-map-canvas-${uid}`;
  const textId = `hoops-map-text-${uid}`;
  const [phase, setPhase] = useState<Phase>(load === 'auto' ? 'loading' : 'idle');
  const [failure, setFailure] = useState<string | null>(null);
  const [zoomNow, setZoomNow] = useState({ zoom: 0, min: 0, max: 99 });
  const canvas = useRef<HTMLDivElement | null>(null);
  const controller = useRef<Controller | null>(null);
  const userStarted = useRef(false);
  const handlers = useRef({ onLoad, onError, onMarkerClick });
  handlers.current = { onLoad, onError, onMarkerClick };

  const items = mapItems(markers, appLinks, { seat: seatLabel });
  const pins = placeholderPins(items);
  const urlOk = validTileUrl(tileUrl);
  const state = !urlOk || failure ? 'error' : phase;
  const running = state === 'loading' || state === 'ready';
  const status = state === 'error' ? mapText.error : state === 'loading' ? mapText.loading : '';
  const source = attribution && attribution.trim() ? attribution : mapText.attribution;
  const options = { markers, appLinks, center, zoom, interactive, tileUrl, seatLabel };
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!urlOk) devWarn(`[hoops-map] Ungültige tileUrl: ${tileUrl}. Erwartet wird eine Adresse mit {z}, {x} und {y} über https, ein Pfad ab Wurzel oder http://localhost.`);
  }, [urlOk, tileUrl]);

  // Neue Kachel-Adresse: ein früherer Fehler gilt nicht mehr, die Karte versucht es erneut
  useEffect(() => {
    setFailure(null);
  }, [tileUrl]);

  // Karte erzeugen und beim Entfernen abbauen (map.remove()); StrictMode: der erste Aufbau wird abgebrochen, bevor Leaflet geladen ist
  useEffect(() => {
    const host = canvas.current;
    if (!running || !host) return;
    const ctrl = createMapController(host, optionsRef.current, {
      onReady: (map: unknown) => {
        setPhase('ready');
        handlers.current.onLoad?.(map);
      },
      onError: (reason: string) => {
        setFailure(reason);
        handlers.current.onError?.(reason as MapErrorReason);
      },
      onZoom: (z: { zoom: number; min: number; max: number }) => setZoomNow(z),
      onMarkerClick: (item: unknown) => handlers.current.onMarkerClick?.(item),
    });
    controller.current = ctrl;
    return () => {
      ctrl.destroy();
      controller.current = null;
    };
  }, [running]);

  // Nach „Karte laden“ auf die Kartenfläche fokussieren, sobald sie nicht mehr inert ist (die Schaltfläche ist verschwunden)
  useEffect(() => {
    if (phase === 'ready' && userStarted.current) {
      userStarted.current = false;
      canvas.current?.focus({ preventScroll: true });
    }
  }, [phase]);

  // Props reaktiv: Marker, Mitte, Zoom, Gesten und Kachel-Adresse ohne Neuaufbau (der Vergleich steckt im Controller)
  useEffect(() => {
    controller.current?.update(options);
  });

  const canIn = zoomNow.zoom < zoomNow.max;
  const canOut = zoomNow.zoom > zoomNow.min;
  // React 18 kennt `inert` nicht als Prop; als Attribut mit leerem Wert wird es gesetzt
  const inert = state === 'loading' ? ({ inert: '' } as Record<string, string>) : {};

  return (
    <div
      className={cn('hoops-map', className)}
      data-state={state}
      data-dim={dimInDark ? 'true' : 'false'}
      data-tiles={tilesMode(darkTiles)}
      style={{ '--hoops-map-h': `${Number.isFinite(height) ? Math.min(2000, Math.max(200, height)) : 320}px` } as React.CSSProperties}
    >
      <a className="hoops-map-skip" href={`#${textId}`}>
        {mapText.skip}
      </a>
      <div className="hoops-map-frame" role="region" aria-label={label}>
        <div className="hoops-map-stage">
          {running ? <div className="hoops-map-canvas" id={canvasId} role="group" aria-label={mapText.canvasHint} ref={canvas} {...inert} /> : null}
          {state !== 'ready' ? (
            <div className="hoops-map-ph">
              {(state === 'error' ? [] : pins).map((pin) => (
                <span key={pin.id} className={cn('hoops-map-ph-pin', pin.own && 'is-own', pin.kind === 'seat' && 'is-seat')} style={{ left: `${pin.x}%`, top: `${pin.y}%` }} aria-hidden="true">
                  {pin.number ?? ''}
                </span>
              ))}
              {state === 'idle' ? (
                <div className="hoops-map-ph-card">
                  <p className="hoops-map-note">{privacyNote}</p>
                  <button
                    type="button"
                    className="hoops-btn hoops-btn--primary hoops-btn--md hoops-map-load"
                    onClick={() => {
                      userStarted.current = true;
                      setPhase('loading');
                    }}
                  >
                    {mapText.load}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {state === 'ready' ? (
            <div className="hoops-map-zoom" role="group" aria-label={mapText.zoomGroup}>
              <button type="button" className="hoops-map-zoom-btn" aria-label={mapText.zoomIn} aria-controls={canvasId} aria-disabled={canIn ? undefined : 'true'} onClick={() => canIn && controller.current?.zoomIn()}>
                <Plus />
              </button>
              <button type="button" className="hoops-map-zoom-btn" aria-label={mapText.zoomOut} aria-controls={canvasId} aria-disabled={canOut ? undefined : 'true'} onClick={() => canOut && controller.current?.zoomOut()}>
                <Minus />
              </button>
            </div>
          ) : null}
          <div className="hoops-map-status" role="status">
            {status}
          </div>
          <p className="hoops-map-attr">
            <a href={mapText.attributionHref}>{source}</a>
          </p>
        </div>
      </div>
      <div className={cn('hoops-map-text', !showList && 'is-quiet')} id={textId} tabIndex={-1}>
        <ol className="hoops-map-list" aria-label={mapText.listLabel}>
          {items.map((item) => (
            <li key={item.id} className="hoops-map-item" value={item.number ?? undefined}>
              {item.kind === 'seat' ? (
                <span className={cn('hoops-map-num', 'is-seat', item.own && 'is-own')} aria-hidden="true" />
              ) : item.number !== null ? (
                <span className={cn('hoops-map-num', item.own && 'is-own')} aria-hidden="true">
                  {item.number}
                </span>
              ) : null}
              <div className="hoops-map-item-body">
                <p className="hoops-map-name">
                  {item.href ? (
                    <a className="hoops-link" href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {item.kind === 'seat' ? <span className="hoops-chip">{item.seatText}</span> : null}
                  {item.own ? <span className="hoops-chip hoops-chip--amber">{mapText.own}</span> : null}
                </p>
                <p className="hoops-map-coords">{item.coords}</p>
                {showList && item.links.length > 0 ? (
                  <div className="hoops-map-links">
                    {item.links.map((link) => (
                      <a key={link.kind} className="hoops-link" href={link.href}>
                        {link.text}
                        <span className="hoops-sr-only">, {item.label}</span>
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
