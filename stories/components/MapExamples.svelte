<script lang="ts">
  import MapView from '../../svelte/Map.svelte';
  import { pinElement } from '../../js/map-leaflet.js';
  import { mountMap } from '../../js/map-vanilla.js';
  import { HALLEN, SITZ, demoTileUrl } from './mapData';

  let { example }: { example: string } = $props();

  // Jede Karte hat einen eigenen Namen (label): die Karte ist eine benannte Region, gleiche Namen verletzen axe landmark-unique
  const one = [HALLEN[0]];
  const three = HALLEN;
  const tile = demoTileUrl();

  // Pin als Inline-SVG wie in der Karte (Zustandsmatrix)
  function pin(node: HTMLElement, options: { number: number | null; own?: boolean; kind?: 'place' | 'seat' }) {
    node.appendChild(pinElement({ number: options.number, kind: options.kind }));
    if (options.kind === 'seat') node.classList.add('is-seat');
    if (options.own) node.classList.add('is-own');
  }
  // Vanilla: mountMap in einen Behälter (die Karte ohne Framework); update und destroy folgen dem Svelte-Lebenszyklus
  type VanillaProps = Parameters<typeof mountMap>[1];
  function vanilla(node: HTMLElement, props: VanillaProps) {
    const handle = mountMap(node, props);
    return { update: (next: VanillaProps) => handle.update(next), destroy: () => handle.destroy() };
  }
  const stateClass = ['', 'pseudo-hover', 'pseudo-focus-visible', ''] as const;
  const stateName = ['Standard', 'Hover', 'Fokus', 'Gesperrt'] as const;
</script>

{#if example === 'aufbau'}
  <MapView label="Karte der Sporthalle Nordhain (Platzhalter)" markers={one} />
{:else if example === 'proxy'}
  <MapView label="Karte mit eigenem Kachel-Proxy" markers={one} privacyNote="Die Karte wird über den Server dieser Seite geladen. Dein Browser spricht nur mit uns." tileUrl={tile} />
{:else if example === 'geladen'}
  <MapView label="Geladene Karte der Sporthalle Nordhain" markers={one} tileUrl={tile} load="auto" height={300} />
{:else if example === 'mehrere'}
  <MapView label="Karte der Hallen im Kreis Nordhain" markers={three} tileUrl={tile} load="auto" />
{:else if example === 'sitz'}
  <MapView label="Karte mit Vereinssitz und zwei Hallen" markers={[SITZ, HALLEN[0], HALLEN[1]]} tileUrl={tile} load="auto" />
{:else if example === 'sitz-pins'}
  <div class="surface">
    <div class="states">
      <div class="cell"><div class="colhead">Sitz · helle Kachel</div><div class="swatch swatch--light"><div class="dss-map-marker is-seat" use:pin={{ number: null, kind: 'seat' }}></div></div></div>
      <div class="cell"><div class="colhead">Sitz · dunkle Kachel</div><div class="swatch swatch--dark"><div class="dss-map-marker is-seat" use:pin={{ number: null, kind: 'seat' }}></div></div></div>
      <div class="cell"><div class="colhead">Sitz, eigener Ort · helle Kachel</div><div class="swatch swatch--light"><div class="dss-map-marker is-seat is-own" use:pin={{ number: null, kind: 'seat', own: true }}></div></div></div>
      <div class="cell"><div class="colhead">Ort mit Nummer · dunkle Kachel</div><div class="swatch swatch--dark"><div class="dss-map-marker" use:pin={{ number: 1 }}></div></div></div>
    </div>
  </div>
{:else if example === 'dunkle-kacheln'}
  <div class="narrow">
    <div class="cap">darkTiles="dim" (Standard)</div>
    <MapView label="Karte mit abgedunkelten Kacheln" markers={[SITZ, HALLEN[0]]} tileUrl={tile} load="auto" height={220} showList={false} darkTiles="dim" />
    <div class="gap"></div>
    <div class="cap">darkTiles="invert"</div>
    <MapView label="Karte mit invertierten Kacheln" markers={[SITZ, HALLEN[1]]} tileUrl={tile} load="auto" height={220} showList={false} darkTiles="invert" />
  </div>
{:else if example === 'do-sitz'}
  <div class="narrow">
    <MapView label="Do: ein Sitz, die Hallen als Orte" markers={[SITZ, { ...HALLEN[1], id: 'do-seeberg' }]} tileUrl={tile} load="auto" height={240} />
  </div>
{:else if example === 'dont-sitz'}
  <!-- Falsch: jede Halle als Sitz; die Häuser unterscheiden sich nicht mehr, und die Nummern fehlen -->
  <div class="narrow">
    <MapView label="Don't: alles als Sitz" markers={[{ ...HALLEN[0], id: 'dont-nordhain', kind: 'seat' }, { ...HALLEN[1], id: 'dont-seeberg', kind: 'seat' }, { ...HALLEN[2], id: 'dont-kiefernau', kind: 'seat' }]} tileUrl={tile} load="auto" height={240} />
  </div>
{:else if example === 'ausschnitt'}
  <div class="grid2">
    <div>
      <div class="cap">zoom={'{13}'} · Mitte aus dem Marker</div>
      <MapView label="Karte im Zoom 13" markers={one} zoom={13} tileUrl={tile} load="auto" height={240} showList={false} />
    </div>
    <div>
      <div class="cap">center und zoom={'{17}'}</div>
      <MapView label="Karte im Zoom 17 mit eigener Mitte" markers={one} center={[49.3003, 7.9004]} zoom={17} tileUrl={tile} load="auto" height={240} showList={false} />
    </div>
  </div>
{:else if example === 'statisch'}
  <MapView label="Karte ohne Gesten" markers={one} interactive={false} tileUrl={tile} load="auto" height={240} showList={false} />
{:else if example === 'karten-app'}
  <MapView label="Karte mit allen Links" markers={[HALLEN[0], HALLEN[1]]} appLinks={['osm', 'geo', 'route']} />
{:else if example === 'fehler'}
  <MapView label="Karte mit ungültiger Kachel-Adresse" markers={one} tileUrl={'http://tiles.example.org/{z}/{x}/{y}.png'} />
{:else if example === 'handy'}
  <div class="narrow">
    <MapView label="Karte auf dem Handy (Platzhalter)" markers={three} height={260} />
    <div class="gap"></div>
    <MapView label="Karte auf dem Handy (geladen)" markers={three} tileUrl={tile} load="auto" height={260} />
  </div>
{:else if example === 'zustaende'}
  <div class="surface">
    <div class="matrix">
      <div>
        <div class="cap">Zoom-Schaltfläche</div>
        <div class="states">
          {#each stateName as name, i (name)}
            <div class="cell">
              <div class="colhead">{name}</div>
              <button type="button" class={`dss-map-zoom-btn ${stateClass[i]}`} aria-label={`Vergrößern (${name})`} aria-disabled={i === 3 ? 'true' : undefined}>
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M10 4v12M4 10h12" /></svg>
              </button>
            </div>
          {/each}
        </div>
      </div>
      <div>
        <div class="cap">Marker auf heller und dunkler Kachel</div>
        <div class="states">
          <div class="cell">
            <div class="colhead">Standard · helle Kachel</div>
            <div class="swatch swatch--light"><div class="dss-map-marker" use:pin={{ number: 1 }}></div></div>
          </div>
          <div class="cell">
            <div class="colhead">Fokus · helle Kachel</div>
            <div class="swatch swatch--light"><div class="dss-map-marker pseudo-focus-visible" tabindex="-1" use:pin={{ number: 2 }}></div></div>
          </div>
          <div class="cell">
            <div class="colhead">Eigener Ort · dunkle Kachel</div>
            <div class="swatch swatch--dark"><div class="dss-map-marker" use:pin={{ number: null, own: true }}></div></div>
          </div>
          <div class="cell">
            <div class="colhead">Standard · dunkle Kachel</div>
            <div class="swatch swatch--dark"><div class="dss-map-marker" use:pin={{ number: 3 }}></div></div>
          </div>
        </div>
      </div>
      <div>
        <div class="cap">Karte laden, Quellenangabe und Sprungmarke</div>
        <div class="states">
          {#each ['', 'pseudo-hover', 'pseudo-focus-visible'] as cls, i (i)}
            <div class="cell">
              <div class="colhead">{stateName[i]}</div>
              <button type="button" class={`dss-btn dss-btn--primary dss-btn--md dss-map-load ${cls}`}>Karte laden</button>
            </div>
          {/each}
          <div class="cell">
            <div class="colhead">Quellenangabe · Fokus</div>
            <p class="dss-map-attr attr-static"><a class="pseudo-focus-visible" href="https://www.openstreetmap.org/copyright">© OpenStreetMap-Mitwirkende</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else if example === 'vanilla'}
  <div use:vanilla={{ label: 'Vanilla: Karte der Sporthalle Nordhain', markers: one, tileUrl: tile } as never}></div>
{:else if example === 'vanilla-geladen'}
  <div use:vanilla={{ label: 'Vanilla: Vereinssitz und zwei Hallen', markers: [SITZ, HALLEN[0], HALLEN[1]], tileUrl: tile, load: 'auto', darkTiles: 'invert', height: 300 } as never}></div>
{:else if example === 'vanilla-handy'}
  <div class="narrow">
    <div use:vanilla={{ label: 'Vanilla: Hallen Seeberg und Kiefernau (Handy)', markers: [HALLEN[1], HALLEN[2]], tileUrl: tile, height: 240 } as never}></div>
  </div>
{:else if example === 'vanilla-handy-dunkel'}
  <div class="narrow">
    <div use:vanilla={{ label: 'Vanilla: Geschäftsstelle und Gymnasium Kiefernau (Handy)', markers: [SITZ, HALLEN[2]], tileUrl: tile, load: 'auto', height: 240 } as never}></div>
  </div>
{:else if example === 'do-lokal'}
  <pre class="code">{`<link rel="stylesheet" href="/vendor/leaflet/leaflet.css">\nloadLeaflet: () => import('/vendor/leaflet/leaflet-src.esm.js')`}</pre>
{:else if example === 'dont-lokal'}
  <pre class="code">{`<link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css">\nloadLeaflet: () => import('https://unpkg.com/leaflet/…')`}</pre>
{:else if example === 'do-adresse'}
  <div class="narrow">
    <MapView label="Do: Karte mit Adresse als Text" markers={one} height={280} />
  </div>
{:else if example === 'dont-adresse'}
  <!-- Falsch: die Adresse steht nur in der Karte. Die Komponente liefert die Liste immer (auch mit showList={false} für Hilfstechnik); die Doku blendet sie hier für alle aus. -->
  <div class="narrow no-text">
    <MapView label="Don't: Karte ohne Adresse als Text" markers={one} height={280} />
  </div>
{:else if example === 'do-datenschutz'}
  <div class="narrow">
    <MapView label="Do: Karte erst nach Klick" markers={one} height={280} />
  </div>
{:else if example === 'dont-datenschutz'}
  <!-- Falsch: Die Karte lädt sofort und holt Kacheln vom Fremdserver, noch bevor jemand zugestimmt hat. Die Doku nutzt das lokale Demo-Bild, damit kein Netzverkehr entsteht. -->
  <div class="narrow no-text">
    <MapView label="Don't: Karte lädt sofort" markers={one} tileUrl={tile} load="auto" height={280} />
  </div>
{:else if example === 'do-liste'}
  <div class="narrow">
    <MapView label="Do: mehrere Marker mit Liste" markers={three} tileUrl={tile} load="auto" height={220} />
  </div>
{:else if example === 'dont-liste'}
  <!-- Falsch: drei Nummern auf der Karte, aber keine Liste, die erklärt, was sie bedeuten. Die Doku blendet die Liste hier aus. -->
  <div class="narrow no-text">
    <MapView label="Don't: mehrere Marker ohne Liste" markers={three} tileUrl={tile} load="auto" height={220} />
  </div>
{:else if example === 'do-quelle'}
  <div class="narrow">
    <MapView label="Do: Quellenangabe sichtbar" markers={one} tileUrl={tile} load="auto" height={220} showList={false} />
  </div>
{:else if example === 'dont-quelle'}
  <!-- Falsch: Quellenangabe entfernt. Die Komponente bietet dafür kein Prop; die Doku blendet sie hier mit eigenem CSS aus, um den Fehler zu zeigen. -->
  <div class="narrow no-attr">
    <MapView label="Don't: Quellenangabe entfernt" markers={one} tileUrl={tile} load="auto" height={220} showList={false} />
  </div>
{/if}

<style>
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 18px; align-items: start; }
  .narrow { width: 100%; max-width: 380px; }
  .gap { height: 12px; }
  .cap, .colhead { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 10px; }
  .no-text :global(.dss-map-text) { display: none; }
  .no-attr :global(.dss-map-attr) { display: none; }
  .matrix { display: flex; flex-direction: column; gap: 20px; }
  /* position: relative: die versteckten Texte (position: absolute) liegen sonst außerhalb des Scrollbereichs und weiten die Seite */
  .surface { position: relative; background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px 14px; align-items: start; }
  .cell { padding: 6px; display: grid; gap: 8px; justify-items: start; }
  .swatch { width: 100%; max-width: 190px; height: 84px; display: flex; align-items: center; justify-content: center; border-radius: var(--hoops-radius-md); }
  .swatch--light { background: #ecebe6; }
  .swatch--dark { background: #3b3d40; }
  .attr-static { position: static; border-radius: var(--hoops-radius-md); }
  .code { margin: 0; padding: 12px 14px; overflow-wrap: anywhere; font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); line-height: 1.5; background: var(--hoops-page-surface-2); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-md); color: var(--hoops-page-fg); white-space: pre-wrap; }
</style>
