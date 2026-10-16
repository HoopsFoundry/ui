// Code-Beispiele der Seite „Überschriften“ (tests/headings-code.test.ts prüft sie: React per TypeScript-Compiler,
// Svelte per Server-Rendering, Vanilla gegen die Ausgabe der Komponenten).

// Seite mit zwei Abschnitten: die h1 gehört der App, die Abschnitte sind h2, die Komponenten darin h3.
export const seiteVanilla = `<!-- Vanilla: kein Provider. Die Ebene schreibst du selbst ins Markup (h2 bis h6),
     die Größe hängt an der Klasse (dss-frame-title, dss-pc-nm …), nie am Elementnamen. -->
<h1 class="dss-t-h1">Mannschaft</h1>

<section>
  <h2 class="dss-t-h2">Spiele</h2>
  <div class="dss-frame">
    <div class="dss-frame-head"><h3 class="dss-frame-title">Nächste Spiele</h3><div class="dss-frame-meta"></div></div>
    <div class="dss-table-scroll" role="region" tabindex="0" aria-label="Nächste Spiele">
      <table class="dss-tbl dss-tbl--default">
        <thead><tr><th scope="col" class="left">Datum</th><th scope="col" class="left">Gegner</th></tr></thead>
        <tbody><tr><td>Sa 12.10.</td><td>Lindenberg Hawks</td></tr></tbody>
      </table>
    </div>
  </div>
</section>

<section>
  <h2 class="dss-t-h2">Kader</h2>
  <div class="dss-pc-card"><div class="dss-pc-head"><span class="dss-tn heim large ">4</span> <div class="dss-pc-who"><h3 class="dss-pc-nm">J. Tanner</h3> <div class="dss-pc-role"><span class="dss-pos pg">PG</span></div></div></div></div>
  <div class="dss-pc-card"><div class="dss-pc-head"><span class="dss-tn gast large ">11</span> <div class="dss-pc-who"><h3 class="dss-pc-nm">M. Kraus</h3> <div class="dss-pc-role"><span class="dss-pos c">C</span></div></div></div></div>
</section>`;

export const seiteSvelte = `<script lang="ts">
  import HeadingLevel from '@bbv/dss-design-system/svelte/HeadingLevel';
  import Table from '@bbv/dss-design-system/svelte/Table';
  import PlayerCard from '@bbv/dss-design-system/svelte/PlayerCard';

  const spalten = [
    { key: 'datum', label: 'Datum' },
    { key: 'gegner', label: 'Gegner' },
  ];
</script>

<!-- Die h1 gehört der App, die Komponenten geben nie eine h1 aus -->
<h1 class="dss-t-h1">Mannschaft</h1>

<section>
  <h2 class="dss-t-h2">Spiele</h2>
  <!-- Alles darin bekommt h3, ohne titleAs an jeder Komponente -->
  <HeadingLevel level={3}>
    <Table title="Nächste Spiele" columns={spalten}>
      {#snippet rows()}
        <tr><td>Sa 12.10.</td><td>Lindenberg Hawks</td></tr>
      {/snippet}
    </Table>
  </HeadingLevel>
</section>

<section>
  <h2 class="dss-t-h2">Kader</h2>
  <HeadingLevel level={3}>
    <PlayerCard jersey="4" name="J. Tanner" position="PG" />
    <PlayerCard jersey="11" name="M. Kraus" position="C" team="gast" />
  </HeadingLevel>
</section>`;

export const seiteReact = `import { HeadingLevel, PlayerCard, Table } from '@bbv/dss-design-system/react';

const spalten = [
  { key: 'datum', label: 'Datum' },
  { key: 'gegner', label: 'Gegner' },
];

{/* Die h1 gehört der App, die Komponenten geben nie eine h1 aus */}
<h1 className="dss-t-h1">Mannschaft</h1>

<section>
  <h2 className="dss-t-h2">Spiele</h2>
  {/* Alles darin bekommt h3, ohne titleAs an jeder Komponente */}
  <HeadingLevel level={3}>
    <Table title="Nächste Spiele" columns={spalten}>
      <tr><td>Sa 12.10.</td><td>Lindenberg Hawks</td></tr>
    </Table>
  </HeadingLevel>
</section>

<section>
  <h2 className="dss-t-h2">Kader</h2>
  <HeadingLevel level={3}>
    <PlayerCard jersey="4" name="J. Tanner" position="PG" />
    <PlayerCard jersey="11" name="M. Kraus" position="C" team="gast" />
  </HeadingLevel>
</section>`;

// Verschachtelt und relativ: by zählt vom übergeordneten HeadingLevel aus (ohne Vorfahr von Ebene 2 aus)
export const relativSvelte = `<script lang="ts">
  import HeadingLevel from '@bbv/dss-design-system/svelte/HeadingLevel';
  import EmptyState from '@bbv/dss-design-system/svelte/EmptyState';
</script>

<!-- Ausgangsebene 2, by=1 ergibt h3 -->
<HeadingLevel>
  <EmptyState title="Noch keine Spiele" />            <!-- h3 -->

  <HeadingLevel>
    <EmptyState title="Keine Ergebnisse" />           <!-- h4 -->
  </HeadingLevel>

  <!-- titleAs gewinnt immer -->
  <EmptyState title="Gesperrt" titleAs="h2" />        <!-- h2 -->

  <!-- Ziffern als Text gelten wie die Zahl: level="5" ist level={5} -->
  <HeadingLevel level="5">
    <EmptyState title="Als Text" />                   <!-- h5 -->
  </HeadingLevel>
</HeadingLevel>`;

export const relativReact = `import { EmptyState, HeadingLevel } from '@bbv/dss-design-system/react';

{/* Ausgangsebene 2, by=1 ergibt h3 */}
<HeadingLevel>
  <EmptyState title="Noch keine Spiele" />            {/* h3 */}

  <HeadingLevel>
    <EmptyState title="Keine Ergebnisse" />           {/* h4 */}
  </HeadingLevel>

  {/* titleAs gewinnt immer */}
  <EmptyState title="Gesperrt" titleAs="h2" />        {/* h2 */}

  {/* Ziffern als Text gelten wie die Zahl: level="5" ist level={5} */}
  <HeadingLevel level="5">
    <EmptyState title="Als Text" />                   {/* h5 */}
  </HeadingLevel>
</HeadingLevel>`;

// Modal: Titel h2, Inhalt eine Ebene tiefer
export const modalSvelte = `<script lang="ts">
  import Modal from '@bbv/dss-design-system/svelte/Modal';
  import Table from '@bbv/dss-design-system/svelte/Table';

  let open = $state(true);
</script>

<!-- Titel h2 (titleAs ändert das), die Tabelle darin bekommt automatisch h3 -->
<Modal bind:open title="Kader">
  <Table title="Spieler" columns={[{ key: 'name', label: 'Name' }]}>
    {#snippet rows()}
      <tr><td>J. Tanner</td></tr>
    {/snippet}
  </Table>
</Modal>`;

export const modalReact = `import { Modal, Table } from '@bbv/dss-design-system/react';

{/* Titel h2 (titleAs ändert das), die Tabelle darin bekommt automatisch h3 */}
<Modal open onOpenChange={() => {}} title="Kader">
  <Table title="Spieler" columns={[{ key: 'name', label: 'Name' }]}>
    <tr><td>J. Tanner</td></tr>
  </Table>
</Modal>`;

// Eigene Überschrift, die der Ebene der Komponenten folgt (React)
export const hookReact = `import type { ReactNode } from 'react';
import { useHeadingLevel } from '@bbv/dss-design-system/react';
import { headingTag } from '@bbv/dss-design-system/heading.js';

// Liest die Ebene aus dem nächsten HeadingLevel (ohne: 3) und gibt das passende Element aus
export function SectionTitle({ children }: { children: ReactNode }) {
  const Tag = headingTag(useHeadingLevel());
  return <Tag className="dss-t-h3">{children}</Tag>;
}`;

export const funktionenJs = `import { headingTag, nextLevel } from '@bbv/dss-design-system/heading.js';

headingTag(4);        // 'h4'
headingTag(1);        // 'h2'   (Komponenten geben nie eine h1 aus)
headingTag(7);        // 'h6'
headingTag(3.5);      // 'h3'   (keine Ganzzahl: Standard)
headingTag('4');      // 'h4'   (Zeichenkette aus Ziffern gilt wie eine Zahl)
nextLevel(3);         // 4
nextLevel(3, 2);      // 5
nextLevel(undefined); // 3      (ohne Vorfahr zählt die Ausgangsebene 2)`;

export const tokensCss = `.seitenleiste {
  --hoops-title-size: var(--hoops-fs-body-md);   /* alle Komponentenüberschriften darin: 14 px */
}
.kader {
  --hoops-card-title-size: var(--hoops-fs-h3);   /* nur Karten (PlayerCard, TeamCard, EmptyState): 20 px */
}`;
