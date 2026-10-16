<script lang="ts">
  // Beispiele der Seite „Überschriften“: Ebene (Element) und Größe (Token) sind getrennt.
  // Unter jedem Beispiel steht die tatsächliche Gliederung, aus den Überschriften im Beispiel gelesen.
  import HeadingLevel from '../../svelte/HeadingLevel.svelte';
  import Table from '../../svelte/Table.svelte';
  import PlayerCard from '../../svelte/PlayerCard.svelte';

  type Mode = 'seite' | 'rangfolge' | 'tokens' | 'do-ebenen' | 'dont-ebenen' | 'do-groesse' | 'dont-groesse' | 'do-h1' | 'dont-h1';
  let { mode = 'seite' }: { mode?: Mode } = $props();

  let root: HTMLElement | undefined = $state();
  let outline = $state<{ level: number; text: string }[]>([]);
  $effect(() => {
    if (!root) return;
    const found = root.querySelectorAll('.stage :is(h1, h2, h3, h4, h5, h6):not(.cap)');
    outline = [...found].map((h) => ({ level: Number(h.tagName.slice(1)), text: (h.textContent ?? '').trim() }));
  });

  const spalten = [
    { key: 'datum', label: 'Datum' },
    { key: 'gegner', label: 'Gegner' },
  ];
</script>

{#snippet spieler()}
  <PlayerCard jersey="4" name="J. Tanner" position="PG" />
  <PlayerCard jersey="11" name="M. Kraus" position="C" team="gast" />
{/snippet}

{#snippet spiele()}
  <Table title="Nächste Spiele" columns={spalten}>
    {#snippet rows()}
      <tr><td>Sa 12.10.</td><td>Lindenberg Hawks</td></tr>
    {/snippet}
  </Table>
{/snippet}

<div class="wrap" bind:this={root}>
  <!-- inert: die Beispiele haben eigene h1/h2/h3 und eine andere Gliederung als die Doku-Seite; Screenreader der Doku sehen sie nicht (die Gliederung unten zeigt sie) -->
  <div class="stage" inert>
    {#if mode === 'seite'}
      <h1 class="dss-t-h1">Mannschaft</h1>
      <section>
        <h2 class="dss-t-h2">Spiele</h2>
        <HeadingLevel level={3}>{@render spiele()}</HeadingLevel>
      </section>
      <section>
        <h2 class="dss-t-h2">Kader</h2>
        <HeadingLevel level={3}><div class="row">{@render spieler()}</div></HeadingLevel>
      </section>
    {:else if mode === 'rangfolge'}
      <div class="row">
        <div class="col">
          <h3 class="cap">Ohne HeadingLevel, ohne titleAs</h3>
          <PlayerCard jersey="4" name="Standard" position="PG" />
        </div>
        <div class="col">
          <h3 class="cap">HeadingLevel level=4</h3>
          <HeadingLevel level={4}><PlayerCard jersey="4" name="Aus HeadingLevel" position="PG" /></HeadingLevel>
        </div>
        <div class="col">
          <h3 class="cap">HeadingLevel level=4, titleAs=h2</h3>
          <HeadingLevel level={4}><PlayerCard jersey="4" name="titleAs gewinnt" position="PG" titleAs="h2" /></HeadingLevel>
        </div>
      </div>
    {:else if mode === 'tokens'}
      <div class="row">
        <div class="col">
          <h3 class="cap">titleAs=h2, --hoops-title-size: var(--hoops-fs-body-md)</h3>
          <div style="--hoops-title-size: var(--hoops-fs-body-md)"><PlayerCard jersey="4" name="J. Tanner" position="PG" titleAs="h2" /></div>
        </div>
        <div class="col">
          <h3 class="cap">titleAs=h4, --hoops-title-size: var(--hoops-fs-h2)</h3>
          <div style="--hoops-title-size: var(--hoops-fs-h2)"><PlayerCard jersey="4" name="J. Tanner" position="PG" titleAs="h4" /></div>
        </div>
      </div>
    {:else if mode === 'do-ebenen'}
      <h2 class="dss-t-h3">Kader</h2>
      <HeadingLevel level={3}><div class="row">{@render spieler()}</div></HeadingLevel>
    {:else if mode === 'dont-ebenen'}
      <h2 class="dss-t-h3">Kader</h2>
      <div class="row">
        <PlayerCard jersey="4" name="J. Tanner" position="PG" titleAs="h5" />
        <PlayerCard jersey="11" name="M. Kraus" position="C" team="gast" titleAs="h5" />
      </div>
    {:else if mode === 'do-groesse'}
      <h2 class="dss-t-h3">Kader</h2>
      <div class="row" style="--hoops-card-title-size: var(--hoops-fs-h3)">
        <HeadingLevel level={3}>{@render spieler()}</HeadingLevel>
      </div>
    {:else if mode === 'dont-groesse'}
      <h2 class="dss-t-h3">Kader</h2>
      <div class="row">
        <PlayerCard jersey="4" name="J. Tanner" position="PG" titleAs="h2" />
        <PlayerCard jersey="11" name="M. Kraus" position="C" team="gast" titleAs="h2" />
      </div>
    {:else if mode === 'do-h1'}
      <h1 class="dss-t-h2">Mannschaft</h1>
      <h2 class="dss-t-h3">Spiele</h2>
      <h2 class="dss-t-h3">Kader</h2>
    {:else}
      <h1 class="dss-t-h2">Spiele</h1>
      <h1 class="dss-t-h2">Kader</h1>
    {/if}
  </div>

  <ul class="outline" aria-hidden="true">
    {#each outline as item}
      <li style="--hoops-d: {item.level - 1}"><code>h{item.level}</code> {item.text}</li>
    {/each}
  </ul>
</div>

<style>
  .wrap { font-family: var(--hoops-font-body); color: var(--hoops-page-fg); }
  .stage { display: grid; gap: 16px; }
  .row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
  .col { display: grid; gap: 8px; min-width: 0; }
  .cap { margin: 0; font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .outline { list-style: none; margin: 20px 0 0; padding: 12px 14px; border: 1px dashed var(--hoops-page-line); border-radius: var(--hoops-radius-md); display: grid; gap: 4px; font-size: var(--hoops-fs-body-sm); color: var(--hoops-page-mute); }
  .outline::before { content: 'Gliederung dieses Beispiels'; font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .outline li { padding-left: calc(var(--hoops-d) * 18px); }
  .outline code { font-family: var(--hoops-font-mono); font-weight: 700; color: var(--hoops-page-fg); }
</style>
