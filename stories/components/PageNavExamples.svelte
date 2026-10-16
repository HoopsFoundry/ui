<script lang="ts">
  import { initAll } from '../../js/vanilla-core.js';
  import { initBackToTop } from '../../js/backtop.js';
  import { initPageNav } from '../../js/pagenav.js';
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import { pageMarkup } from '../PageNav.code';

  // Alle Beispiele stehen auf einer Seite: jede Navigation hat einen eigenen Namen (axe landmark-unique), jede id kommt nur einmal vor.
  // Die Beispiel-Überschriften sind h3 (unter den ##-Abschnitten der Seite); die Navigation wählt sie mit selector.
  let { example }: { example: string } = $props();

  type Options = Parameters<typeof initPageNav>[1];
  function nav(node: HTMLElement, options: Options) {
    const handle = initPageNav(node, options);
    return { destroy: () => handle.destroy() };
  }

  // Vanilla-Beispiel: dasselbe Markup wie im Code-Beispiel, gestartet mit initAll
  function vanillaPage(node: HTMLElement) {
    node.replaceChildren(document.createRange().createContextualFragment(pageMarkup.replace('<main ', '<div ').replace('</main>', '</div>').replace(/<h1>[^<]*<\/h1>/, '<h3>Verein Nordhain</h3>').replace(/<h2/g, '<h3').replace(/<\/h2>/g, '</h3>')));
    const root = node.querySelector<HTMLElement>('[data-hoops="pagenav"]');
    // Die Beispiel-Seite benutzt h3 statt h2; die Auswahl ist eine Option (am Element als JSON)
    root?.setAttribute('data-hoops-options', JSON.stringify({ label: 'Auf dieser Seite: Vanilla-Beispiel', selector: 'h3:not(:first-child), [data-pagenav]' }));
    const handle = initAll(node, { only: ['pagenav'] });
    return { destroy: () => handle.destroy() };
  }

  // Nachladen: ein Klick fügt einen Abschnitt hinzu, die Navigation übernimmt ihn nach kurzer Verzögerung
  let loaded = $state(0);
  function addSection(host: HTMLElement) {
    loaded += 1;
    const h = document.createElement('h3');
    h.textContent = `Nachgeladen ${loaded}`;
    const p = document.createElement('p');
    p.textContent = 'Dieser Abschnitt kam nach dem Start dazu.';
    host.append(h, p);
  }
  let loadHost = $state<HTMLElement>();
</script>

{#if example === 'aufbau'}
  <div class="page" use:nav={{ selector: 'h3', label: 'Auf dieser Seite' }}>
    <h3>Tabelle</h3><p>Platz 3 von 12 in der Bayernliga Süd, 12 Siege, 3 Niederlagen.</p>
    <h3>Spielplan</h3><p>Nächstes Spiel: Samstag, 19:30 Uhr in der Nordhain-Halle.</p>
    <h3>Kader</h3><p>Zehn Spieler im Aufgebot, dazu zwei Trainer.</p>
    <h3>Statistik</h3><p>Im Schnitt 82,4 Punkte pro Spiel.</p>
  </div>
{:else if example === 'bereiche'}
  <div class="page" use:nav={{ selector: 'h3:not(.hoops-acc-title), h4', label: 'Auf dieser Seite: Bereiche', syncHash: false }}>
    <h3>Übersicht</h3><p>Die Seite hat einen offenen Abschnitt und zwei Bereiche, die geschlossen sind.</p>
    <Accordion syncHash={false}>
      <AccordionItem id="pn-kader" title="Kader">
        <h4>Torhüter</h4><p>Zwei Torhüter im Aufgebot.</p>
        <h4>Guards</h4><p>Vier Guards im Aufgebot.</p>
      </AccordionItem>
      <AccordionItem id="pn-statistik" title="Statistik">
        <h4>Saison</h4><p>Im Schnitt 82,4 Punkte pro Spiel.</p>
      </AccordionItem>
    </Accordion>
    <details class="mehr"><summary>Mehr zur Halle</summary><h4>Anfahrt</h4><p>Die Halle liegt am Sportpark, Parkplätze sind ausgeschildert.</p></details>
  </div>
{:else if example === 'nachladen'}
  <div class="page" use:nav={{ selector: 'h3', label: 'Auf dieser Seite: Nachladen' }} bind:this={loadHost}>
    <h3>Erster Abschnitt</h3><p>Mit zwei Abschnitten erscheint noch keine Navigation (mindestens drei).</p>
    <h3>Zweiter Abschnitt</h3><p>Ein Klick auf den Knopf fügt Abschnitte hinzu.</p>
    <p><button type="button" class="hoops-btn hoops-btn--secondary" onclick={() => loadHost && addSection(loadHost)}>Abschnitt nachladen</button></p>
  </div>
{:else if example === 'optionen'}
  <div class="page" use:nav={{ selector: 'h3, [data-pagenav]', label: 'Auf dieser Seite: Optionen' }}>
    <h3>Tabelle</h3><p>Normale Überschrift: wird aufgenommen.</p>
    <div data-pagenav="Kalender-Abo"><p>Block ohne Überschrift: data-pagenav benennt ihn.</p></div>
    <h3 data-pagenav-skip>Impressum</h3><p>Mit data-pagenav-skip: fehlt in der Navigation.</p>
    <h3>Größe &amp; Ärger</h3><p>Die id wird aus dem Text gebildet: abschnitt-groesse-aerger.</p>
  </div>
{:else if example === 'vanilla'}
  <div class="page" use:vanillaPage></div>
{:else if example === 'handy'}
  <div class="narrow page" use:nav={{ selector: 'h3', label: 'Auf dieser Seite: Handy hell', syncHash: false }}>
    <h3>Tabelle</h3><p>Platz 3 von 12.</p>
    <h3>Spielplan</h3><p>Nächstes Spiel: Samstag, 19:30 Uhr in der Nordhain-Halle gegen die Lindenberg Hawks.</p>
    <h3>Kader und Trainerstab</h3><p>Zehn Spieler im Aufgebot.</p>
    <h3>Statistik der laufenden Saison</h3><p>Im Schnitt 82,4 Punkte.</p>
  </div>
{:else if example === 'handy-dunkel'}
  <div class="narrow page" use:nav={{ selector: 'h3:not(.hoops-acc-title), h4', label: 'Auf dieser Seite: Handy dunkel', syncHash: false }}>
    <h3>Übersicht</h3><p>Zwei geschlossene Bereiche.</p>
    <Accordion syncHash={false}>
      <AccordionItem id="pnd-kader" title="Kader"><h4>Torhüter</h4><p>Zwei Torhüter.</p><h4>Guards</h4><p>Vier Guards.</p></AccordionItem>
      <AccordionItem id="pnd-halle" title="Halle"><h4>Anfahrt</h4><p>Am Sportpark.</p></AccordionItem>
    </Accordion>
  </div>
{:else if example === 'do-kurz'}
  <div class="narrow page" use:nav={{ selector: 'h3', label: 'Auf dieser Seite: kurz' }}>
    <h3>Tabelle</h3><p>x</p><h3>Spielplan</h3><p>x</p><h3>Kader</h3><p>x</p><h3>Statistik</h3><p>x</p>
  </div>
{:else if example === 'dont-kurz'}
  <!-- Falsch: ein Dutzend lange Titel füllen die Navigation, der Überblick geht verloren -->
  <div class="narrow page" use:nav={{ selector: 'h3', label: 'Auf dieser Seite: lang' }}>
    <h3>Die komplette Tabelle der Bayernliga Süd mit allen Ergebnissen</h3><p>x</p>
    <h3>Der Spielplan der Hinrunde und Rückrunde im Überblick</h3><p>x</p>
    <h3>Der gesamte Kader mit Spielerinnen, Spielern und Trainerstab</h3><p>x</p>
    <h3>Alle Statistiken der laufenden Saison in einer Tabelle</h3><p>x</p>
    <h3>Alle Hallen und Anfahrtswege der Gegner</h3><p>x</p>
    <h3>Pressemitteilungen und Berichte des Vereins</h3><p>x</p>
  </div>
{:else if example === 'do-namen'}
  <div class="narrow">
    <nav class="hoops-pagenav" aria-labelledby="pn-do-1"><p class="hoops-eyebrow" id="pn-do-1">Im Bereich Verein</p><ul class="hoops-pagenav-list"><li><a class="hoops-pagenav-link" href="#pn-do-a">Tabelle</a></li><li><a class="hoops-pagenav-link" href="#pn-do-b">Kader</a></li></ul></nav>
    <nav class="hoops-pagenav" aria-labelledby="pn-do-2"><p class="hoops-eyebrow" id="pn-do-2">Im Bereich Mannschaft</p><ul class="hoops-pagenav-list"><li><a class="hoops-pagenav-link" href="#pn-do-c">Torhüter</a></li><li><a class="hoops-pagenav-link" href="#pn-do-d">Guards</a></li></ul></nav>
  </div>
{:else if example === 'dont-namen'}
  <!-- Falsch: zwei Navigationen mit demselben Namen; die Landmarken-Liste des Screenreaders zeigt zweimal „Auf dieser Seite“ (axe: landmark-unique) -->
  <div class="narrow">
    <nav class="hoops-pagenav" aria-labelledby="pn-dont-1"><p class="hoops-eyebrow" id="pn-dont-1">Auf dieser Seite</p><ul class="hoops-pagenav-list"><li><a class="hoops-pagenav-link" href="#pn-dont-a">Tabelle</a></li><li><a class="hoops-pagenav-link" href="#pn-dont-b">Kader</a></li></ul></nav>
    <nav class="hoops-pagenav" aria-labelledby="pn-dont-2"><p class="hoops-eyebrow" id="pn-dont-2">Auf dieser Seite</p><ul class="hoops-pagenav-list"><li><a class="hoops-pagenav-link" href="#pn-dont-c">Torhüter</a></li><li><a class="hoops-pagenav-link" href="#pn-dont-d">Guards</a></li></ul></nav>
  </div>
{:else if example === 'do-ueberschrift'}
  <div class="narrow page" use:nav={{ selector: 'h3', label: 'Auf dieser Seite: Überschriften' }}>
    <h3>Tabelle</h3><p>x</p><h3>Spielplan</h3><p>x</p><h3>Kader</h3><p>x</p>
  </div>
{:else if example === 'dont-ueberschrift'}
  <!-- Falsch: fette Absätze statt Überschriften; nichts davon ist eine Überschrift, die Navigation findet nichts und die Überschriften-Navigation der Screenreader auch nicht -->
  <div class="narrow page" use:nav={{ selector: 'h3', label: 'Auf dieser Seite: fett' }}>
    <p><strong>Tabelle</strong></p><p>x</p><p><strong>Spielplan</strong></p><p>x</p><p><strong>Kader</strong></p><p>x</p>
  </div>
{/if}

<style>
  .page { box-sizing: border-box; max-width: 640px; padding: 14px 18px; background: var(--hoops-surface); border: 1px solid var(--hoops-line); border-radius: var(--hoops-radius-lg); color: var(--hoops-fg); }
  .page :global(h3) { margin: 18px 0 6px; font-size: var(--hoops-fs-h3); line-height: var(--hoops-lh-h3); }
  .page :global(h3:first-child) { margin-top: 0; }
  .page :global(h4) { margin: 12px 0 4px; font-size: var(--hoops-fs-body); }
  .page :global(p) { margin: 0 0 8px; font-size: var(--hoops-fs-body-md); color: var(--hoops-fg-soft); }
  .page :global(.hoops-pagenav) { margin: 0 0 14px; }
  .page :global(.hoops-acc-title) { font-size: var(--hoops-fs-body); }
  .narrow { width: 100%; max-width: 380px; }
  .mehr { margin-top: 12px; padding: 8px 12px; border: 1px solid var(--hoops-line); border-radius: var(--hoops-radius-md); font-size: var(--hoops-fs-body-md); color: var(--hoops-fg); }
  .mehr summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; }
</style>
