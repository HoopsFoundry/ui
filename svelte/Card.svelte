<script lang="ts">
  /**
   * HoopsFoundry UI Card · Svelte 5 example
   * --------------------------------------------------------------
   * Frame/container component matching the v0.6 Cards & Lists spec.
   * Nutzt ausschließlich die Klassen aus css/components.css (kein eigener Scoped-Style);
   * tokens.css und components.css müssen im App-Root importiert sein.
   *
   * Variants:
   *   default    — 1 px border, radius-lg, surface-0
   *   elevated   — shadow-md, no border (floating list items, live tiles)
   *   flat       — surface-2, no border, no shadow (high-density lists)
   *   hoverable  — interactive: pointer cursor, border lifts, soft shadow on hover
   *
   * Slots:
   *   header  (optional) — pinned strip above body
   *   default            — body content
   *   footer  (optional) — muted footer strip
   */
  import type { Snippet } from 'svelte';

  type Variant = 'default' | 'elevated' | 'flat' | 'hoverable';

  let {
    variant = 'default',
    padding = 'md',
    as = 'div',
    href = undefined,
    onclick = undefined,
    header = undefined,
    children,
    footer = undefined,
    class: klass = '',
  }: {
    variant?: Variant;
    padding?: 'sm' | 'md' | 'lg';
    as?: 'div' | 'article' | 'section' | 'a' | 'button';
    href?: string;
    onclick?: (e: MouseEvent) => void;
    header?: Snippet;
    children: Snippet;
    footer?: Snippet;
    class?: string;
  } = $props();

  // If href is set and as is 'div', auto-promote to anchor.
  const tag = href ? 'a' : as;

  // Ein div mit onclick ist role="button": Enter und Leertaste lösen wie bei einem Button aus (wie in der React-Fassung).
  function onkeydown(e: KeyboardEvent) {
    if (tag !== 'div' || !onclick || e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onclick(e as unknown as MouseEvent);
    }
  }
</script>

<svelte:element
  this={tag}
  href={href}
  {onclick}
  {onkeydown}
  class={`hoops-card hoops-card--${variant} hoops-card--pad-${padding} ${klass}`}
  role={tag === 'div' && onclick ? 'button' : undefined}
  tabindex={tag === 'div' && onclick ? 0 : undefined}
>
  {#if header}
    <div class="hoops-card-head">{@render header()}</div>
  {/if}
  <div class="hoops-card-body">
    {@render children()}
  </div>
  {#if footer}
    <div class="hoops-card-foot">{@render footer()}</div>
  {/if}
</svelte:element>
