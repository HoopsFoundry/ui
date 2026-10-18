<script lang="ts">
  /**
   * HoopsFoundry UI Breadcrumbs · Svelte 5
   * --------------------------------------------------------------
   * Drei Varianten, nutzt nur Klassen aus css/components.css:
   *   plain  — Pfad mit Chevron-Trennern (Seitenkopf)
   *   tagged — Pfad + Kontext-Kürzel je Eintrag (Admin / Archiv)
   *   chip   — Pill-Stil (mobil)
   *
   * Items: [{ label, href?, tag? }]. Das letzte Element ist die aktuelle Seite
   * (kein Link, aria-current="page"); Einträge ohne href sind reiner Text.
   */
  import { useI18n } from './i18n.js';

  type Item = {
    label: string;
    href?: string;
    tag?: string;
  };

  let {
    items,
    variant = 'plain',
    ariaLabel,
  }: {
    items: Item[];
    variant?: 'plain' | 'tagged' | 'chip';
    /** Name der Navigation; Standard aus dem Katalog (`breadcrumbs.label`). */
    ariaLabel?: string;
  } = $props();

  const i18n = useI18n();
  const label = $derived(ariaLabel ?? i18n.t('breadcrumbs.label'));

  const base = $derived(variant === 'chip' ? 'hoops-crumbs-chip' : 'hoops-crumbs-item');
</script>

<nav class={`hoops-crumbs hoops-crumbs--${variant}`} aria-label={label} lang={i18n.lang}>
  {#each items as it, i}
    {@const isLast = i === items.length - 1}
    {#if isLast}
      <span class={`${base} is-current`} aria-current="page">
        {#if variant === 'tagged' && it.tag}<span class="hoops-crumbs-tag">{it.tag}</span>{/if}
        {it.label}
      </span>
    {:else}
      {#if it.href}
        <a class={base} href={it.href}>
          {#if variant === 'tagged' && it.tag}<span class="hoops-crumbs-tag">{it.tag}</span>{/if}
          {it.label}
        </a>
      {:else}
        <span class={base}>
          {#if variant === 'tagged' && it.tag}<span class="hoops-crumbs-tag">{it.tag}</span>{/if}
          {it.label}
        </span>
      {/if}
      <svg class="hoops-crumbs-sep" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>
    {/if}
  {/each}
</nav>
