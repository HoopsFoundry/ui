import { useEffect, useId, useRef, useState } from 'react';
import { cn } from './cn';
import { DEFAULT_TILE_URL, mapItems, mapText, placeholderPins, validTileUrl } from '../js/map.js';
import type { MapAppLink, MapMarker } from '../js/map.js';
import { createMapController, devWarn } from '../js/map-leaflet.js';

export type { MapAppLink, MapMarker };
export type MapLoad = 'click' | 'auto';
export type MapErrorReason = 'tile-url' | 'import' | 'init' | 'update' | 'tiles';

export interface MapViewProps {
  /** Orte auf der Karte: `{ id, lat, lng, label, href?, number?, own? }`. Ungültige Koordinaten werden ignoriert. */
  markers: MapMarker[];
  /** Name der Karte für Hilfstechnik (Region). Mehrere Karten auf einer Seite brauchen verschiedene Namen. */
  label: string;
  /** Mittelpunkt `[Breite, Länge]`. Ohne `center` und `zoom` passt sich der Ausschnitt allen Markern an. */
  center?: [number, number];
  /** Zoomstufe 3 bis 19 (Standard 15 bei Mittelpunkt oder einem Marker). */
  zoom?: number;
  /** Höhe der Karte in Pixeln (Standard 320, mindestens 200). */
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
  /** Kacheln im Dunkelmodus abdunkeln. */
  dimInDark?: boolean;
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
  onLoad,
  onError,
  onMarkerClick,
  className,
}: MapViewProps) {
  const uid = useId();
  const canvasId = `dss-map-canvas-${uid}`;
  const textId = `dss-map-text-${uid}`;
  const [phase, setPhase] = useState<Phase>(load === 'auto' ? 'loading' : 'idle');
  const [failure, setFailure] = useState<string | null>(null);
  const [zoomNow, setZoomNow] = useState({ zoom: 0, min: 0, max: 99 });
  const canvas = useRef<HTMLDivElement | null>(null);
  const controller = useRef<Controller | null>(null);
  const userStarted = useRef(false);
  const handlers = useRef({ onLoad, onError, onMarkerClick });
  handlers.current = { onLoad, onError, onMarkerClick };

  const items = mapItems(markers, appLinks);
  const pins = placeholderPins(items);
  const urlOk = validTileUrl(tileUrl);
  const state = !urlOk || failure ? 'error' : phase;
  const running = state === 'loading' || state === 'ready';
  const status = state === 'error' ? mapText.error : state === 'loading' ? mapText.loading : '';
  const source = attribution && attribution.trim() ? attribution : mapText.attribution;
  const options = { markers, appLinks, center, zoom, interactive, tileUrl };
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!urlOk) devWarn(`[dss-map] Ungültige tileUrl: ${tileUrl}. Erwartet wird eine Adresse mit {z}, {x} und {y} über https, ein Pfad ab Wurzel oder http://localhost.`);
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
      className={cn('dss-map', className)}
      data-state={state}
      data-dim={dimInDark ? 'true' : 'false'}
      style={{ '--dss-map-h': `${Number.isFinite(height) ? Math.max(200, height) : 320}px` } as React.CSSProperties}
    >
      <a className="dss-map-skip" href={`#${textId}`}>
        {mapText.skip}
      </a>
      <div className="dss-map-frame" role="region" aria-label={label}>
        <div className="dss-map-stage">
          {running ? <div className="dss-map-canvas" id={canvasId} role="group" aria-label={mapText.canvasHint} ref={canvas} {...inert} /> : null}
          {state !== 'ready' ? (
            <div className="dss-map-ph">
              {(state === 'error' ? [] : pins).map((pin) => (
                <span key={pin.id} className={cn('dss-map-ph-pin', pin.own && 'is-own')} style={{ left: `${pin.x}%`, top: `${pin.y}%` }} aria-hidden="true">
                  {pin.number ?? ''}
                </span>
              ))}
              {state === 'idle' ? (
                <div className="dss-map-ph-card">
                  <p className="dss-map-note">{privacyNote}</p>
                  <button
                    type="button"
                    className="dss-btn dss-btn--primary dss-btn--md dss-map-load"
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
            <div className="dss-map-zoom" role="group" aria-label={mapText.zoomGroup}>
              <button type="button" className="dss-map-zoom-btn" aria-label={mapText.zoomIn} aria-controls={canvasId} aria-disabled={canIn ? undefined : 'true'} onClick={() => canIn && controller.current?.zoomIn()}>
                <Plus />
              </button>
              <button type="button" className="dss-map-zoom-btn" aria-label={mapText.zoomOut} aria-controls={canvasId} aria-disabled={canOut ? undefined : 'true'} onClick={() => canOut && controller.current?.zoomOut()}>
                <Minus />
              </button>
            </div>
          ) : null}
          <div className="dss-map-status" role="status">
            {status}
          </div>
          <p className="dss-map-attr">
            <a href={mapText.attributionHref}>{source}</a>
          </p>
        </div>
      </div>
      <div className={cn('dss-map-text', !showList && 'is-quiet')} id={textId} tabIndex={-1}>
        <ol className="dss-map-list" aria-label={mapText.listLabel}>
          {items.map((item) => (
            <li key={item.id} className="dss-map-item" value={item.number ?? undefined}>
              {item.number !== null ? (
                <span className={cn('dss-map-num', item.own && 'is-own')} aria-hidden="true">
                  {item.number}
                </span>
              ) : null}
              <div className="dss-map-item-body">
                <p className="dss-map-name">
                  {item.href ? (
                    <a className="dss-link" href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {item.own ? <span className="dss-chip dss-chip--amber">{mapText.own}</span> : null}
                </p>
                <p className="dss-map-coords">{item.coords}</p>
                {showList && item.links.length > 0 ? (
                  <div className="dss-map-links">
                    {item.links.map((link) => (
                      <a key={link.kind} className="dss-link" href={link.href}>
                        {link.text}
                        <span className="dss-sr-only">, {item.label}</span>
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
