<script lang="ts">
  /**
   * HoopsFoundry UI Map (Karte) · Svelte 5
   * --------------------------------------------------------------
   * Interaktive Karte mit Leaflet und OpenStreetMap-Kacheln. Leaflet ist eine optionale Peer-Abhängigkeit und wird erst beim Laden der
   * Karte nachgeladen (`import('leaflet')`); die App lädt zusätzlich `leaflet/dist/leaflet.css`. Standard ist die Zwei-Klick-Lösung:
   * zuerst ein Platzhalter mit Hinweis (kein Netzverkehr), die Kacheln erst nach „Karte laden“ (`load="auto"` lädt sofort).
   * Die Textalternative (nummerierte Liste mit Koordinaten und Links) ist immer da. Zoom-Schaltflächen, Quellenangabe, Platzhalter und
   * Fehlerhinweis sind eigenes Markup; die Quellenangabe lässt sich nicht ausblenden. Nutzt nur Klassen aus css/components.css (`hoops-map*`).
   * Der Dateiname ist `Map.svelte`; beim Import `MapView` nennen, damit das JS-Global `Map` nicht überdeckt wird.
   */
  import { tick, untrack } from 'svelte';
  import { DEFAULT_TILE_URL, mapItems, mapText, placeholderPins, tilesMode, validTileUrl } from '../js/map.js';
  import type { MapAppLink, MapDarkTiles, MapMarker } from '../js/map.js';
  import { createMapController, devWarn } from '../js/map-leaflet.js';

  type Phase = 'idle' | 'loading' | 'ready';

  let {
    markers,
    label,
    center = undefined,
    zoom = undefined,
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
    seatLabel = undefined,
    onload = undefined,
    onerror = undefined,
    onmarkerclick = undefined,
    class: klass = '',
  }: {
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
    load?: 'click' | 'auto';
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
    onload?: (map: unknown) => void;
    /** Laden fehlgeschlagen: `tile-url`, `import`, `init`, `update` oder `tiles`. */
    onerror?: (reason: string) => void;
    onmarkerclick?: (marker: unknown) => void;
    class?: string;
  } = $props();

  const uid = $props.id();
  const canvasId = `hoops-map-canvas-${uid}`;
  const textId = `hoops-map-text-${uid}`;

  let phase = $state<Phase>(untrack(() => (load === 'auto' ? 'loading' : 'idle')));
  let failure = $state<string | null>(null);
  let canvas = $state<HTMLElement>();
  let controller = $state.raw<ReturnType<typeof createMapController> | null>(null);
  let zoomNow = $state({ zoom: 0, min: 0, max: 99 });
  let userStarted = false;

  const items = $derived(mapItems(markers, appLinks, { seat: seatLabel }));
  const pins = $derived(placeholderPins(items));
  const urlOk = $derived(validTileUrl(tileUrl));
  const state = $derived(!urlOk || failure ? 'error' : phase);
  const running = $derived(state === 'loading' || state === 'ready');
  const status = $derived(state === 'error' ? mapText.error : state === 'loading' ? mapText.loading : '');
  const source = $derived(attribution && attribution.trim() ? attribution : mapText.attribution);

  $effect(() => {
    if (!urlOk) devWarn(`[hoops-map] Ungültige tileUrl: ${tileUrl}. Erwartet wird eine Adresse mit {z}, {x} und {y} über https, ein Pfad ab Wurzel oder http://localhost.`);
  });

  // Neue Kachel-Adresse: ein früherer Fehler gilt nicht mehr, die Karte versucht es erneut
  $effect(() => {
    tileUrl;
    untrack(() => { failure = null; });
  });

  const options = () => ({ markers, appLinks, center, zoom, interactive, tileUrl, seatLabel });

  // Karte erzeugen und beim Entfernen abbauen (map.remove()); die Eingaben liest nur der zweite Effekt
  $effect(() => {
    if (!running || !canvas) return;
    const host = canvas;
    const ctrl = createMapController(host, untrack(options), {
      onReady: (map: unknown) => {
        phase = 'ready';
        // Erst nach dem Rendern: bis dahin ist die Fläche inert und nimmt den Fokus nicht an
        if (userStarted) {
          userStarted = false;
          void tick().then(() => host.focus({ preventScroll: true }));
        }
        onload?.(map);
      },
      onError: (reason: string) => {
        failure = reason;
        onerror?.(reason);
      },
      onZoom: (z: { zoom: number; min: number; max: number }) => { zoomNow = z; },
      onMarkerClick: (item: unknown) => onmarkerclick?.(item),
    });
    controller = ctrl;
    return () => {
      ctrl.destroy();
      controller = null;
    };
  });

  // Props reaktiv: Marker, Mitte, Zoom, Gesten und Kachel-Adresse ohne Neuaufbau
  $effect(() => {
    const next = options();
    controller?.update(next);
  });

  function start() {
    userStarted = true;
    phase = 'loading';
  }
  const canIn = $derived(zoomNow.zoom < zoomNow.max);
  const canOut = $derived(zoomNow.zoom > zoomNow.min);
</script>

<div
  class={`hoops-map${klass ? ` ${klass}` : ''}`}
  data-state={state}
  data-dim={dimInDark ? 'true' : 'false'}
  data-tiles={tilesMode(darkTiles)}
  style={`--hoops-map-h:${Number.isFinite(height) ? Math.min(2000, Math.max(200, height)) : 320}px`}
>
  <a class="hoops-map-skip" href={`#${textId}`}>{mapText.skip}</a>
  <div class="hoops-map-frame" role="region" aria-label={label}>
    <div class="hoops-map-stage">
      {#if running}
        <div class="hoops-map-canvas" id={canvasId} role="group" aria-label={mapText.canvasHint} inert={state === 'loading'} bind:this={canvas}></div>
      {/if}
      {#if state !== 'ready'}
        <div class="hoops-map-ph">
          {#each state === 'error' ? [] : pins as pin (pin.id)}
            <span class={`hoops-map-ph-pin${pin.own ? ' is-own' : ''}${pin.kind === 'seat' ? ' is-seat' : ''}`} style={`left:${pin.x}%;top:${pin.y}%`} aria-hidden="true">{pin.number ?? ''}</span>
          {/each}
          {#if state === 'idle'}
            <div class="hoops-map-ph-card">
              <p class="hoops-map-note">{privacyNote}</p>
              <button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md hoops-map-load" onclick={start}>{mapText.load}</button>
            </div>
          {/if}
        </div>
      {/if}
      {#if state === 'ready'}
        <div class="hoops-map-zoom" role="group" aria-label={mapText.zoomGroup}>
          <button type="button" class="hoops-map-zoom-btn" aria-label={mapText.zoomIn} aria-controls={canvasId} aria-disabled={canIn ? undefined : 'true'} onclick={() => canIn && controller?.zoomIn()}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M10 4v12M4 10h12" /></svg>
          </button>
          <button type="button" class="hoops-map-zoom-btn" aria-label={mapText.zoomOut} aria-controls={canvasId} aria-disabled={canOut ? undefined : 'true'} onclick={() => canOut && controller?.zoomOut()}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 10h12" /></svg>
          </button>
        </div>
      {/if}
      <div class="hoops-map-status" role="status">{status}</div>
      <p class="hoops-map-attr"><a href={mapText.attributionHref}>{source}</a></p>
    </div>
  </div>
  <div class={`hoops-map-text${showList ? '' : ' is-quiet'}`} id={textId} tabindex="-1">
    <ol class="hoops-map-list" aria-label={mapText.listLabel}>
      {#each items as item (item.id)}
        <li class="hoops-map-item" value={item.number ?? undefined}>
          {#if item.kind === 'seat'}<span class={`hoops-map-num is-seat${item.own ? ' is-own' : ''}`} aria-hidden="true"></span>{:else if item.number !== null}<span class={`hoops-map-num${item.own ? ' is-own' : ''}`} aria-hidden="true">{item.number}</span>{/if}
          <div class="hoops-map-item-body">
            <p class="hoops-map-name">
              {#if item.href}<a class="hoops-link" href={item.href}>{item.label}</a>{:else}<span>{item.label}</span>{/if}
              {#if item.kind === 'seat'}<span class="hoops-chip">{item.seatText}</span>{/if}
              {#if item.own}<span class="hoops-chip hoops-chip--amber">{mapText.own}</span>{/if}
            </p>
            <p class="hoops-map-coords">{item.coords}</p>
            {#if showList && item.links.length}
              <div class="hoops-map-links">
                {#each item.links as link (link.kind)}
                  <a class="hoops-link" href={link.href}>{link.text}<span class="hoops-sr-only">, {item.label}</span></a>
                {/each}
              </div>
            {/if}
          </div>
        </li>
      {/each}
    </ol>
  </div>
</div>
