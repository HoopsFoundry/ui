export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Variante: hoops-card--default | --elevated | --flat | --hoverable.
     Abstand: hoops-card--pad-sm | --pad-md | --pad-lg (wirkt auf den Inhalt). -->
<article class="hoops-card hoops-card--default hoops-card--pad-md">
  <div class="hoops-card-head">Roster · TSV Nordhain</div>
  <div class="hoops-card-body">
    <p>12 Spieler</p>
  </div>
  <div class="hoops-card-foot">
    <span>Stand · 17. Spieltag</span>
    <span>BBL · Bayernliga Süd</span>
  </div>
</article>

<!-- Ganze Karte als Link: Element a statt article, Variante hoverable -->
<a class="hoops-card hoops-card--hoverable hoops-card--pad-md" href="/spiele/17">
  <div class="hoops-card-body">
    <p>17. Spieltag</p>
  </div>
</a>`;

export const svelte = `<script>
  import Card from '@hoopsfoundry/ui/svelte/Card';
</script>

<Card variant="elevated" padding="lg">
  <p>Inhalt der Karte</p>
</Card>

<!-- Kopf und Fuß sind Snippets -->
<Card>
  {#snippet header()}Roster · TSV Nordhain{/snippet}
  <p>12 Spieler</p>
  {#snippet footer()}
    <span>Stand · 17. Spieltag</span>
    <span>BBL · Bayernliga Süd</span>
  {/snippet}
</Card>

<!-- Mit href wird die Karte ein Link -->
<Card variant="hoverable" href="/spiele/17">17. Spieltag</Card>

<!-- Mit onclick auf dem div: role="button" und tabindex="0" kommen von allein -->
<Card variant="hoverable" onclick={() => openSpiel(17)}>17. Spieltag</Card>

<!-- Anderes Element, z. B. für Listeneinträge -->
<Card as="article">Meldung</Card>`;

export const react = `import { Card } from '@hoopsfoundry/ui/react';

<Card variant="elevated" padding="lg">
  <p>Inhalt der Karte</p>
</Card>

{/* Kopf und Fuß sind Props */}
<Card
  header="Roster · TSV Nordhain"
  footer={
    <>
      <span>Stand · 17. Spieltag</span>
      <span>BBL · Bayernliga Süd</span>
    </>
  }
>
  <p>12 Spieler</p>
</Card>

{/* Mit href wird die Karte ein Link */}
<Card variant="hoverable" href="/spiele/17">17. Spieltag</Card>

{/* Mit onClick auf dem div: role="button" und tabIndex=0 kommen von allein, Enter und Leertaste lösen aus */}
<Card variant="hoverable" onClick={() => openSpiel(17)}>17. Spieltag</Card>

{/* Anderes Element, z. B. für Listeneinträge */}
<Card as="article">Meldung</Card>`;
