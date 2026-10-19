<script lang="ts">
  import VenueCard from '../../svelte/VenueCard.svelte';
  import { initMap } from '../../js/map-vanilla.js';
  import { mountVenueCard } from '../../js/render/venue-card.js';
  import { demoTileUrl } from './mapData';
  import { demoGames, venueProps } from './venueData';

  let { example }: { example: string } = $props();

  // Jede Karte hat eine eigene Halle (venueData): die Karte ist eine benannte Region, gleiche Namen verletzen axe landmark-unique
  const tile = demoTileUrl();
  const games = demoGames();
  const gamesPlain = demoGames({ logos: false });
  const gamesStates = demoGames({ states: true });

  // Vanilla: mountVenueCard mit initMap (die Karte ohne Framework); update und destroy folgen dem Svelte-Lebenszyklus
  type VanillaProps = Parameters<typeof mountVenueCard>[1];
  function vanilla(node: HTMLElement, props: VanillaProps) {
    const handle = mountVenueCard(node, props, { initMap });
    return { update: (next: VanillaProps) => handle.update(next), destroy: () => handle.destroy() };
  }

  // Erzwingt einen Zustand auf den Links (Hover und Fokus wirken über die Pseudo-Klassen des Storybook-Addons)
  function mark(node: HTMLElement, cls: string) {
    const targets = node.querySelectorAll<HTMLElement>('.hoops-venue-more, .hoops-venue-contact .hoops-link, .hoops-venue-maplinks .hoops-link');
    if (cls) for (const target of targets) target.classList.add(...cls.split(' '));
  }
  const cols = ['Standard', 'Hover', 'Fokus'] as const;
  const stateClass: Record<(typeof cols)[number], string> = { Standard: '', Hover: 'pseudo-hover', Fokus: 'pseudo-focus-visible' };
</script>

{#if example === 'aufbau'}
  <VenueCard {...venueProps(0)} games={games} logos tileUrl={tile} />
{:else if example === 'geladen'}
  <VenueCard {...venueProps(1)} games={gamesPlain} tileUrl={tile} load="auto" />
{:else if example === 'minimal'}
  <div class="stack">
    <div>
      <div class="cap">Nur name (Daten über die ganze Breite)</div>
      <VenueCard name={venueProps(2).name} />
    </div>
    <div>
      <div class="cap">name und address, ohne Koordinaten</div>
      <VenueCard name={venueProps(3).name} address={venueProps(3).address} />
    </div>
    <div>
      <div class="cap">name und Koordinaten: die Karte, ohne Adresse</div>
      <VenueCard name={venueProps(23).name} lat={venueProps(23).lat} lng={venueProps(23).lng} tileUrl={tile} />
    </div>
  </div>
{:else if example === 'ohne-karte'}
  <VenueCard {...venueProps(4)} lat={undefined} lng={undefined} games={gamesPlain} />
{:else if example === 'kontakt'}
  <div class="stack">
    <div>
      <div class="cap">Telefon und E-Mail als Links</div>
      <VenueCard {...venueProps(5)} tileUrl={tile} />
    </div>
    <div>
      <div class="cap">Ungültige Angaben bleiben Text, ohne Link</div>
      <VenueCard {...venueProps(6)} contact={{ name: 'Sekretariat', phone: 'nur vormittags erreichbar', email: 'sekretariat (at) example.org' }} tileUrl={tile} />
    </div>
  </div>
{:else if example === 'spiele'}
  <div class="stack">
    <div>
      <div class="cap">Standard: höchstens zwei Spiele, mit Logos und Kurznamen</div>
      <VenueCard {...venueProps(7)} games={games} logos names="short" tileUrl={tile} />
    </div>
    <div>
      <div class="cap">limit · Live und Verschoben</div>
      <VenueCard {...venueProps(8)} games={gamesStates} limit={3} tileUrl={tile} gamesLabel="Belegung der Halle" />
    </div>
  </div>
{:else if example === 'compact'}
  <div class="medium">
    <div class="cap">size="compact" · kleinere Karte, ohne Spiele</div>
    <VenueCard {...venueProps(9)} games={games} size="compact" tileUrl={tile} />
  </div>
{:else if example === 'handy'}
  <div class="narrow">
    <VenueCard {...venueProps(10)} games={games} logos names="short" tileUrl={tile} />
    <div class="gap"></div>
    <VenueCard {...venueProps(11)} size="compact" tileUrl={tile} />
  </div>
{:else if example === 'handy-dunkel'}
  <!-- andere Hallen als bei 'handy': beide Vorschauen stehen auf einer Seite -->
  <div class="narrow">
    <VenueCard {...venueProps(0)} name="Sporthalle Nordhain Nord" games={games} logos names="short" tileUrl={tile} />
    <div class="gap"></div>
    <VenueCard {...venueProps(1)} name="Mehrzweckhalle Seeberg Süd" size="compact" tileUrl={tile} />
  </div>
{:else if example === 'vanilla'}
  <div use:vanilla={{ ...venueProps(13), name: 'Buchenhalle Süd', games: gamesPlain, tileUrl: tile } as never}></div>
{:else if example === 'vanilla-handy'}
  <div class="narrow">
    <div use:vanilla={{ ...venueProps(14), name: 'Ahornhalle Nord', games: games, logos: true, names: 'short', tileUrl: tile } as never}></div>
  </div>
{:else if example === 'vanilla-handy-dunkel'}
  <div class="narrow">
    <div use:vanilla={{ ...venueProps(21), name: 'Erlenhalle Ost', size: 'compact', tileUrl: tile, load: 'auto' } as never}></div>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface" tabindex="0" role="region" aria-label="Zustände der Hallenkarte, seitlich scrollbar">
      <div class="states">
        {#each cols as c (c)}<div class="colhead">{c}</div>{/each}
        {#each cols as c, i (c)}
          <div class="cell" use:mark={stateClass[c]}>
            <VenueCard {...venueProps(12 + i)} size="compact" tileUrl={tile} />
          </div>
        {/each}
      </div>
    </div>
  </div>
{:else if example === 'do-adresse'}
  <div class="narrow">
    <VenueCard {...venueProps(15)} size="compact" tileUrl={tile} />
  </div>
{:else if example === 'dont-adresse'}
  <!-- Falsch: nur Name und Karte, die Adresse fehlt als Text -->
  <div class="narrow">
    <VenueCard name={venueProps(16).name} lat={venueProps(16).lat} lng={venueProps(16).lng} size="compact" tileUrl={tile} />
  </div>
{:else if example === 'do-spiele'}
  <div class="narrow">
    <VenueCard {...venueProps(17)} games={games} tileUrl={tile} />
  </div>
{:else if example === 'dont-spiele'}
  <!-- Falsch: limit 5 macht aus der Hallenkarte einen Spielplan -->
  <div class="narrow">
    <VenueCard {...venueProps(18)} games={games} limit={5} tileUrl={tile} />
  </div>
{:else if example === 'do-kontakt'}
  <div class="narrow">
    <VenueCard {...venueProps(19)} size="compact" tileUrl={tile} />
  </div>
{:else if example === 'dont-kontakt'}
  <!-- Falsch: Rufnummer mit Zusatz und E-Mail in Wortform ergeben keine Links; die Karte zeigt sie als Text -->
  <div class="narrow">
    <VenueCard {...venueProps(20)} contact={{ name: 'Hallenwart', phone: '030 23125 100 (Mo bis Fr, vormittags)', email: 'hallenwart (at) example.org' }} size="compact" tileUrl={tile} />
  </div>
{:else if example === 'do-datenschutz'}
  <div class="narrow">
    <VenueCard {...venueProps(21)} size="compact" tileUrl={tile} />
  </div>
{:else if example === 'dont-datenschutz'}
  <!-- Falsch: load="auto" ohne Einwilligung holt Kacheln ungefragt. Die Doku nutzt das lokale Demo-Bild, damit kein Netzverkehr entsteht. -->
  <div class="narrow">
    <VenueCard {...venueProps(22)} size="compact" tileUrl={tile} load="auto" />
  </div>
{/if}

<style>
  .stack { display: grid; gap: 24px; max-width: 860px; }
  .narrow { width: 100%; max-width: 380px; }
  .medium { width: 100%; max-width: 700px; }
  .gap { height: 12px; }
  .cap, .colhead { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 10px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  /* position: relative: die versteckten Texte (position: absolute) liegen sonst außerhalb des Scrollbereichs und weiten die Seite (Standalone-Story bei 420 px) */
  .surface { position: relative; background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: repeat(3, minmax(420px, 1fr)); gap: 16px 14px; align-items: start; }
  .cell { padding: 6px; }
</style>
