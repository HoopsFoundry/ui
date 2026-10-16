<script lang="ts">
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';
  /**
   * HoopsFoundry UI PlayerCard · Svelte 5
   * --------------------------------------------------------------
   * Drei Maßstäbe derselben Spielerprimitive. Nutzt nur Klassen aus css/components.css
   * (`.hoops-tn`/`.hoops-pos` teilt sie mit der Table).
   *
   *   compact  — Listenzeile (Roster / Bank); mit `onclick` ein Button, sonst ein div
   *   standard — Karte mit Kopf + 4 Kennzahlen
   *   hero     — dunkle Großkarte mit großer Trikotnummer + 4 Kennzahlen
   *
   * `photo` (URL) ersetzt die Trikotmarke durch ein Foto; die Trikotnummer bleibt als Badge (hero: Porträtfläche links).
   * `photoAlt` ist standardmäßig leer (dekorativ, der Name steht daneben). Ohne `photo`, mit leerem `photo` oder bei
   * Ladefehler bleibt die Trikotmarke.
   */
  type Size = 'compact' | 'standard' | 'hero';
  type Stat = { label: string; value: string | number; accent?: boolean };

  let {
    size = 'standard',
    jersey,
    name,
    position = '',
    team = 'heim',
    captain = false,
    age = '',
    height_cm = '',
    role = '',
    vitals = [],
    stat = null,
    statLabel = '',
    onclick = undefined,
    titleAs = undefined,
    photo = '',
    photoAlt = '',
  }: {
    size?: Size;
    jersey: string | number;
    name: string;
    position?: string;
    team?: 'heim' | 'gast';
    captain?: boolean;
    age?: string;
    height_cm?: string;
    role?: string;
    vitals?: Stat[];
    stat?: string | number | null;
    statLabel?: string;
    onclick?: () => void;
    /** Überschriftenebene, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
    titleAs?: HeadingTag;
    photo?: string;
    photoAlt?: string;
  } = $props();

  const heading = useHeadingTag(() => titleAs);

  const posClass = $derived(position ? `hoops-pos ${position.toLowerCase()}` : '');

  // Eine URL, die nicht lädt, wird gemerkt: dann erscheint wieder die Trikotmarke (kein kaputtes Bildsymbol)
  let failedUrl = $state('');
  const showPhoto = $derived(Boolean(photo) && photo !== failedUrl);
  const imgSize = $derived(size === 'compact' ? 32 : size === 'standard' ? 64 : 200);
</script>

{#snippet roleLine()}
  <div class="hoops-pc-role">
    {#if position}<span class={posClass}>{position}</span>{/if}
    {#if captain}<span class="hoops-pc-cap">Kapitän</span>{/if}
    {#if age}<span>{age}</span>{/if}
    {#if height_cm}<span>{height_cm} cm</span>{/if}
  </div>
{/snippet}

{#snippet vitalsGrid()}
  {#if vitals.length}
    <div class="hoops-pc-vitals">
      {#each vitals as v (v.label)}
        <div>
          <div class={`hoops-pc-v ${v.accent ? 'hoops-pc-v--amber' : ''}`}>{v.value}</div>
          <div class="hoops-pc-l">{v.label}</div>
        </div>
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet photoImg()}
  <img class="hoops-pc-img" src={photo} alt={photoAlt} width={imgSize} height={imgSize} loading="lazy" decoding="async" onerror={() => (failedUrl = photo)} />
{/snippet}

{#snippet compactBody()}
  {#if showPhoto}
    <span class="hoops-pc-av">{@render photoImg()}<span class={`hoops-tn hoops-tn--badge ${team} ${captain ? 'captain' : ''}`}>{jersey}</span></span>
  {:else}
    <span class={`hoops-tn ${team} small ${captain ? 'captain' : ''}`}>{jersey}</span>
  {/if}
  <span class="hoops-pc-who">
    <span class="hoops-pc-name">{name}{captain ? ' (C)' : ''}</span>
    {#if role || position}
      <span class="hoops-pc-meta">{position}{role ? ` · ${role}` : ''}</span>
    {/if}
  </span>
  <!-- Pill nur visuell: die Position steht schon in der Meta-Zeile. Leeres span = Platzhalter für die Grid-Spalte. -->
  {#if position}<span class={posClass} aria-hidden="true">{position}</span>{:else}<span></span>{/if}
  {#if stat !== null}
    <span class="hoops-pc-stat">
      {stat}
      {#if statLabel}<span class="hoops-pc-stat-l">{statLabel}</span>{/if}
    </span>
  {:else}
    <span></span>
  {/if}
{/snippet}

{#if size === 'compact'}
  {#if onclick}
    <button class="hoops-pc-row" {onclick} type="button">{@render compactBody()}</button>
  {:else}
    <div class="hoops-pc-row">{@render compactBody()}</div>
  {/if}

{:else if size === 'standard'}
  <div class="hoops-pc-card">
    <div class="hoops-pc-head">
      {#if showPhoto}
        <span class="hoops-pc-av hoops-pc-av--lg">{@render photoImg()}<span class={`hoops-tn hoops-tn--badge hoops-tn--badge-lg ${team} ${captain ? 'captain' : ''}`}>{jersey}</span></span>
      {:else}
        <span class={`hoops-tn ${team} large ${captain ? 'captain' : ''}`}>{jersey}</span>
      {/if}
      <div class="hoops-pc-who">
        <svelte:element this={heading.tag} class="hoops-pc-nm">{name}</svelte:element>
        {@render roleLine()}
      </div>
    </div>
    {@render vitalsGrid()}
  </div>

{:else}
  <div class={showPhoto ? 'hoops-pc-hero hoops-pc-hero--photo' : 'hoops-pc-hero'}>
    <div class="hoops-pc-hero-left">
      {#if showPhoto}
        {@render photoImg()}
        <span class={`hoops-tn hoops-tn--badge hoops-tn--badge-lg ${team} ${captain ? 'captain' : ''}`}>{jersey}</span>
      {:else}
        <span class={`hoops-tn hero ${team} ${captain ? 'captain' : ''}`}>{jersey}</span>
      {/if}
    </div>
    <div class="hoops-pc-hero-right">
      <svelte:element this={heading.tag} class="hoops-pc-nm">{name}</svelte:element>
      {@render roleLine()}
      {@render vitalsGrid()}
    </div>
  </div>
{/if}
