<script lang="ts">
  /**
   * HoopsFoundry UI Modal · Svelte 5 example
   * --------------------------------------------------------------
   * Modal with backdrop, optional icon header, body, and footer slot.
   * Closes on Escape; a click on the backdrop closes only with dismissOnBackdrop. Nutzt ausschließlich die Klassen aus
   * css/components.css (kein eigener Scoped-Style). Das Verhalten (Fokus hinein, Fokusfalle, Fokusrückgabe, Seite inert, Scroll-Sperre)
   * kommt wie im Vanilla-Baustein aus js/modal.js (`initModal`), das mit dem Markup gestartet wird, solange `open` gilt.
   */
  import { untrack, type Snippet } from 'svelte';
  import { levelOfTag, nextLevel, resolveHeading, type HeadingTag } from '../js/heading.js';
  import { provideHeadingLevel } from './heading-context.js';
  import { initModal } from '../js/modal.js';

  type Severity = 'default' | 'danger' | 'warn' | 'ok' | 'info';
  type Size = 'sm' | 'md' | 'wide' | 'xwide';

  let {
    open = $bindable(false),
    title = '',
    titleAs = undefined,
    subtitle = '',
    severity = 'default',
    size = 'md',
    closable = true,
    dismissOnBackdrop = false,
    children,
    footer,
    onclose,
  }: {
    open?: boolean;
    title?: string;
    /**
     * Ebene des Titels, h2 bis h6 (Standard h2). Titelkomponenten im Inhalt (Table, EmptyState …) bekommen die nächste
     * Ebene, bei h2 also h3; ein eigenes `HeadingLevel` im Inhalt oder `titleAs` an der Komponente gewinnt.
     */
    titleAs?: HeadingTag;
    subtitle?: string;
    severity?: Severity;
    size?: Size;
    closable?: boolean;
    /** Schließen per Klick auf den Hintergrund (Standard: false). */
    dismissOnBackdrop?: boolean;
    children: Snippet;
    footer?: Snippet;
    onclose?: () => void;
  } = $props();

  const uid = $props.id();
  const titleId = `hoops-modal-title-${uid}`;
  const titleTag = $derived(resolveHeading(titleAs, 2));
  provideHeadingLevel(() => nextLevel(levelOfTag(titleTag)));

  let root = $state<HTMLElement>();

  // Verhalten aus js/modal.js: öffnet sofort (Fokus ins Modal, Seite inert, Scroll-Sperre), beim Schließen oder Abräumen kehrt der Fokus zurück.
  // Escape, Schließen-Knopf und Hintergrund meldet initModal über onClose; open und onclose ziehen nach.
  $effect(() => {
    if (!open || !root) return;
    // Die Optionen werden beim Öffnen gelesen; ein Wechsel von closable oder dismissOnBackdrop öffnet das Modal nicht neu
    const handle = untrack(() => initModal(root!, {
      closable,
      dismissOnBackdrop,
      onClose: () => {
        open = false;
        onclose?.();
      },
    }));
    handle.open();
    return () => handle.destroy();
  });
</script>

{#if open}
<div bind:this={root}>
  <div class="hoops-backdrop" role="presentation"></div>
  <div class="hoops-modal-wrap" role="dialog" aria-modal="true" aria-labelledby={titleId}>
    <div class="hoops-modal hoops-modal--{size}">
      <div class="hoops-m-head">
        {#if severity !== 'default'}
          <div class="hoops-m-head-icon hoops-m-head-icon--{severity}">
            {#if severity === 'danger'}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M5.2 10.8l5.6-5.6"/></svg>
            {:else if severity === 'warn'}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5L15 14H1z"/><path d="M8 6v3M8 11.5v.05"/></svg>
            {:else if severity === 'ok'}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.2l3.5 3.5L13 5"/></svg>
            {:else}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="8" cy="8" r="6.5"/><path d="M8 7v4M8 4.5v.05"/></svg>
            {/if}
          </div>
        {/if}
        <div class="hoops-m-head-text">
          <svelte:element this={titleTag} class="hoops-m-title" id={titleId}>{title}</svelte:element>
          {#if subtitle}<div class="hoops-m-subtitle">{subtitle}</div>{/if}
        </div>
        {#if closable}
          <button type="button" class="hoops-m-close" aria-label="Schließen">
            <svg width="16" height="16" aria-hidden="true" focusable="false" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        {/if}
      </div>
      <div class="hoops-m-body">
        {@render children()}
      </div>
      {#if footer}
        <div class="hoops-m-footer">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}
