<script lang="ts">
  /**
   * HoopsFoundry UI EmptyState · Svelte 5
   * --------------------------------------------------------------
   * Drei Tonalitäten für „hier ist nichts“-Zustände:
   *
   *   neutral — keine Daten / Erstnutzung (ruhig)
   *   action  — etwas fehlt, die Nutzerin kann es beheben (Amber)
   *   error   — Laden fehlgeschlagen, Wiederholen möglich (Rot)
   *
   * Immer einen nächsten Schritt anbieten (CTA, `actions` oder Hinweis).
   * Nutzt nur Klassen aus css/components.css.
   */
  import type { Snippet } from 'svelte';
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';

  let {
    tone = 'neutral',
    title,
    body = '',
    icon = '',
    cta = '',
    onclick,
    titleAs = undefined,
    actions,
    children,
  }: {
    tone?: 'neutral' | 'action' | 'error';
    title: string;
    body?: string;
    icon?: string; // Sprite-ID ohne #
    cta?: string;
    onclick?: () => void;
    /** Überschriftenebene, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
    titleAs?: HeadingTag;
    actions?: Snippet;
    children?: Snippet;
  } = $props();

  const heading = useHeadingTag(() => titleAs);

  const ctaVariant = $derived(tone === 'error' ? 'danger' : tone === 'action' ? 'amber' : 'primary');
</script>

<div class={`hoops-empty hoops-empty--${tone}`}>
  <div class="hoops-empty-icon">
    {#if icon}
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
        <use href={`#${icon}`}></use>
      </svg>
    {:else if tone === 'error'}
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m12 4 10 17H2L12 4Z"/><path d="M12 10v5"/><circle cx="12" cy="18.2" r=".7" fill="currentColor"/></svg>
    {:else if tone === 'action'}
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16.5" r=".7" fill="currentColor"/></svg>
    {:else}
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16"/></svg>
    {/if}
  </div>
  <svelte:element this={heading.tag} class="hoops-empty-title">{title}</svelte:element>
  {#if body}<p class="hoops-empty-body">{body}</p>{/if}
  {#if cta || actions}
    <div class="hoops-empty-actions">
      {#if cta}
        <button type="button" class={`hoops-btn hoops-btn--md hoops-btn--${ctaVariant}`} {onclick}>{cta}</button>
      {/if}
      {#if actions}{@render actions()}{/if}
    </div>
  {/if}
  {#if children}<div class="hoops-empty-extra">{@render children()}</div>{/if}
</div>
