<script lang="ts">
  /**
   * HoopsFoundry UI Table · Svelte 5
   * --------------------------------------------------------------
   * Datentabelle nach der Tables-Spec. Nutzt nur die Klassen aus
   * css/components.css.
   *
   * Dichten : touch (60px) · default (48px) · compact (40px) · dense (32px)
   * Flächen : hell (Standard) · dunkel (Kampfgericht-Tisch)
   * Features: sticky Kopf (sobald der Scrollbereich eine Höhe hat), Sortier-Pfeil +
   *           aria-sort, optionales Striping, tfoot-Summenzeile, Hover.
   *           Der Scrollbereich ist eine Region mit Namen (caption, sonst title) und per
   *           Tastatur erreichbar.
   *
   * Zellen kommen vom Aufrufer über die `rows`/`body`-Snippets. Hilfsklassen:
   *   .num · .num.lead · .num.dim · .center
   *   .hoops-tn / .hoops-pos / .hoops-pill-s / .hoops-player (Dekoration)
   */
  import type { Snippet } from 'svelte';
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';
  import CollapsibleFrame from './internal/CollapsibleFrame.svelte';

  type Density = 'touch' | 'default' | 'compact' | 'dense';

  let {
    title = '',
    titleAs = undefined,
    meta = '',
    live = false,
    density = 'default',
    dark = false,
    striped = false,
    columns,
    rows,
    head = undefined,
    body,
    foot = undefined,
    caption = '',
    collapsible = false,
    open = $bindable(false),
    id = undefined,
    class: klass = '',
  }: {
    title?: string;
      /** Überschriftenebene, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
    titleAs?: HeadingTag;
    meta?: string;
    live?: boolean;
    density?: Density;
    dark?: boolean;
    striped?: boolean;
    columns?: { key: string; label: string; align?: 'left' | 'right' | 'center'; width?: string; sortable?: boolean; sort?: 'asc' | 'desc' | null }[];
    rows?: Snippet;
    head?: Snippet;
    body?: Snippet;
    foot?: Snippet;
    /** Unsichtbare Tabellenbeschriftung für Screenreader; benennt auch den Scrollbereich. */
    caption?: string;
    /** Einklappbar: der Rahmenkopf wird zum Bereichskopf (Button in der Überschrift), die Tabelle zum Bereich. Braucht einen `title`. */
    collapsible?: boolean;
    /** Geöffnet, mit `bind:open` gebunden (nur mit `collapsible`; Standard geschlossen). */
    open?: boolean;
    /** Anker für Deep-Link und Sprungleiste einer `Accordion`-Gruppe (nur mit `collapsible`); ohne `id` gibt es keinen. */
    id?: string;
    class?: string;
  } = $props();

  const heading = useHeadingTag(() => titleAs);
  // Nur in der Entwicklung (`$inspect` entfällt im Produktionsbuild)
  $inspect(collapsible && !title).with((_type, missing) => {
    if (missing) console.warn('[HoopsFoundry UI] Table: `collapsible` braucht einen `title`, sonst bleibt der Rahmen unverändert.');
  });
</script>

{#snippet frameMeta()}
  <span class="hoops-frame-meta">
    {#if meta}<span>{meta}</span>{/if}
    {#if live}<span class="hoops-crumb"><span class="hoops-crumb-dot" aria-hidden="true"></span> Live</span>{/if}
  </span>
{/snippet}

{#snippet tableRegion()}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -- Fokussierbar mit Absicht: Tastaturnutzer müssen den scrollbaren Bereich erreichen (WCAG 2.1.1) -->
  <div class="hoops-table-scroll" role="region" tabindex="0" aria-label={caption || title || 'Tabelle'}>
    <table class={`hoops-tbl hoops-tbl--${density} ${striped ? 'hoops-tbl--striped' : ''}`}>
      {#if caption}<caption class="hoops-sr-only">{caption}</caption>{/if}
      {#if columns}
        <thead>
          <tr>
            {#each columns as col (col.key)}
              <th
                scope="col"
                class={`${col.align ?? 'left'} ${col.sortable ? 'sortable' : ''} ${col.sort ? `sort-${col.sort}` : ''}`}
                style={col.width ? `width: ${col.width};` : ''}
                aria-sort={col.sort === 'asc' ? 'ascending' : col.sort === 'desc' ? 'descending' : undefined}
              >{col.label}</th>
            {/each}
          </tr>
        </thead>
      {/if}
      {#if head && !columns}<thead>{@render head()}</thead>{/if}
      {#if body || rows}<tbody>{@render (body ?? rows)?.()}</tbody>{/if}
      {#if foot}<tfoot>{@render foot()}</tfoot>{/if}
    </table>
  </div>
{/snippet}

{#if collapsible && title}
  <CollapsibleFrame rootClass={`hoops-frame ${dark ? 'hoops-frame--dark' : ''} ${klass}`} {id} {title} {titleAs} bind:open meta={meta || live ? frameMeta : undefined}>
    {@render tableRegion()}
  </CollapsibleFrame>
{:else}
<div class={`hoops-frame ${dark ? 'hoops-frame--dark' : ''} ${klass}`}>
  {#if title || meta || live}
    <div class="hoops-frame-head">
      {#if title}<svelte:element this={heading.tag} class="hoops-frame-title">{title}</svelte:element>{:else}<span></span>{/if}
      <div class="hoops-frame-meta">
        {#if meta}<span>{meta}</span>{/if}
        {#if live}<span class="hoops-crumb"><span class="hoops-crumb-dot" aria-hidden="true"></span> Live</span>{/if}
      </div>
    </div>
  {/if}

  {@render tableRegion()}
</div>
{/if}
