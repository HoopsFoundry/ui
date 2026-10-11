// Code-Beispiele der Seite „PageNav“. Die Tests (tests/pagenav-docs.test.ts) übersetzen das React-Beispiel mit dem TypeScript-Compiler,
// rendern das Svelte-Beispiel und führen das Vanilla-Markup mit initAll in jsdom aus.

/** Markup der Seite; die Doku zeigt es und führt es auch aus (`initAll`). */
export const pageMarkup = `<main data-dss="pagenav" data-dss-options='{"label":"Auf dieser Seite"}'>
  <h1>Verein Nordhain</h1>
  <section>
    <h2>Tabelle</h2>
    <p>Platz 3 von 12 in der Bayernliga Süd.</p>
  </section>
  <section>
    <h2>Spielplan</h2>
    <p>Nächstes Spiel: Samstag, 19:30 Uhr.</p>
  </section>
  <section>
    <h2>Kader</h2>
    <p>Zehn Spieler im Aufgebot.</p>
  </section>
  <!-- Ohne Überschrift: data-pagenav benennt den Block -->
  <section data-pagenav="Kalender-Abo"><p>Die Termine als Kalender abonnieren.</p></section>
  <!-- Nicht aufnehmen: data-pagenav-skip -->
  <h2 data-pagenav-skip>Impressum</h2>
</main>`;

export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />

<!-- Seitennavigation und Nach-oben-Knopf entstehen im Browser aus den Überschriften -->
<body data-dss="backtop">
${pageMarkup}

<script type="module">
  import { initAll } from '@bbv/dss-design-system/vanilla-core.js';

  // Startet alle Elemente mit data-dss="pagenav|backtop|accordion|theme". Optionen je Baustein stehen in
  // initAll(document, { pagenav: { … } }) oder am Element in data-dss-options.
  const dss = initAll(document);
  // dss.destroy() baut alles wieder ab
</script>

<!-- Oder einzeln, ohne data-dss -->
<script type="module">
  import { initPageNav } from '@bbv/dss-design-system/pagenav.js';
  import { initBackToTop } from '@bbv/dss-design-system/backtop.js';

  const nav = initPageNav(document.querySelector('main'), {
    label: 'Auf dieser Seite',   // sichtbarer Text und Name der Navigation
    selector: 'h2, [data-pagenav]', // welche Elemente Einträge werden (Standard)
    minHeadings: 3,              // ab so vielen Einträgen erscheint die Navigation
    // container: '#seitenleiste', // Element oder Auswahl, in das die Navigation gesetzt wird
  });
  const top = initBackToTop({ label: 'Nach oben' });

  // nav.destroy(); top.destroy();
</script>
</body>`;

export const svelte = `<script>
  import { onMount } from 'svelte';
  import { initPageNav } from '@bbv/dss-design-system/pagenav.js';
  import { initBackToTop } from '@bbv/dss-design-system/backtop.js';

  // Es gibt keine Svelte-Komponente: die Navigation ist die Vanilla-Funktion. Sie legt Markup um den Inhalt
  // und beobachtet ihn, deshalb bekommt sie einen leeren Platz (container), den Svelte nicht anfasst.
  let seite;
  let platz;

  onMount(() => {
    const nav = initPageNav(seite, { container: platz, label: 'Auf dieser Seite' });
    const top = initBackToTop();
    return () => { nav.destroy(); top.destroy(); };
  });
</script>

<main bind:this={seite}>
  <h1>Verein Nordhain</h1>
  <div bind:this={platz}></div>
  <section><h2>Tabelle</h2><p>Platz 3 von 12.</p></section>
  <section><h2>Spielplan</h2><p>Nächstes Spiel: Samstag, 19:30 Uhr.</p></section>
  <section><h2>Kader</h2><p>Zehn Spieler im Aufgebot.</p></section>
</main>`;

export const react = `import { useEffect, useRef } from 'react';
import { initPageNav } from '@bbv/dss-design-system/pagenav.js';
import { initBackToTop } from '@bbv/dss-design-system/backtop.js';

// Es gibt keine React-Komponente: die Navigation ist die Vanilla-Funktion. Sie legt Markup um den Inhalt
// und beobachtet ihn, deshalb bekommt sie einen leeren Platz (container), den React nicht anfasst.
export function Verein() {
  const seite = useRef<HTMLElement>(null);
  const platz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!seite.current || !platz.current) return;
    const nav = initPageNav(seite.current, { container: platz.current, label: 'Auf dieser Seite' });
    const top = initBackToTop();
    return () => {
      nav.destroy();
      top.destroy();
    };
  }, []);

  return (
    <main ref={seite}>
      <h1>Verein Nordhain</h1>
      <div ref={platz} />
      <section><h2>Tabelle</h2><p>Platz 3 von 12.</p></section>
      <section><h2>Spielplan</h2><p>Nächstes Spiel: Samstag, 19:30 Uhr.</p></section>
      <section><h2>Kader</h2><p>Zehn Spieler im Aufgebot.</p></section>
    </main>
  );
}`;

export const tokensCss = `/* Scrollen und Nach-oben-Knopf laufen über Tokens und Opt-in-Klassen, nie über globale Regeln. */
:root {
  --dss-scroll-offset: 56px;      /* Höhe einer festen oberen Leiste: die Ziele halten diesen Abstand (plus 1rem) */
  --dss-backtop-offset: 80px;     /* Abstand des Knopfes von unten, z. B. über einer festen BottomNav (64px plus 16px) */
  --dss-backtop-gap: 16px;        /* Abstand von rechts */
  --dss-z-backtop: 20;            /* Ebene des Knopfes (Overlays wie das Modal liegen bei 100) */
}

/* Opt-in-Klasse: scroll-padding oben (Token) und unten (4,5rem), damit Fokus nicht unter Leiste oder Knopf endet.
   Setze sie auf <html> oder auf einen Scrollbereich: <html class="dss-scroll-pad"> */`;

export const funktionenJs = `import { slug, entries, signature } from '@bbv/dss-design-system/pagenav.js';
import { revealAround, scrollToElement } from '@bbv/dss-design-system/accordion.js';

slug('Größe & Ärger');                 // 'groesse-aerger'

// ids vergeben: bestehende bleiben, fehlende werden aus dem Text gebildet (eindeutig im Dokument)
const ziele = [...document.querySelectorAll('h2')];
const belegt = new Set([...document.querySelectorAll('[id]')].map((el) => el.id));
const liste = entries(ziele, belegt);  // [{ id, text, el }, …]; Ziele ohne Text entfallen
signature(liste);                      // 'abschnitt-tabelle|Tabelle\\nabschnitt-spielplan|Spielplan'

// Springen wie die Navigation: umgebende Bereiche und details öffnen, dann scrollen
const ziel = document.getElementById('abschnitt-kader');
if (ziel) {
  revealAround(ziel);                  // true, wenn etwas geöffnet wurde
  scrollToElement(ziel);
}`;
