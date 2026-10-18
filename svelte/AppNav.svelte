<script lang="ts" module>
  let seq = 0;
</script>

<script lang="ts">
  /**
   * HoopsFoundry UI AppNav · Svelte 5
   * --------------------------------------------------------------
   * Hauptnavigation mit Gruppen-Dropdowns (Disclosure), gesperrten
   * Einträgen (Links und ganze Gruppen) und mobilem Hamburger-Menü (< 720 px). Nutzt nur Klassen
   * aus css/components.css. Aktiv ist der Link, dessen href `currentHref`
   * entspricht (aria-current="page").
   */
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { useI18n } from './i18n.js';

  type Link = { id: string; label: string; href: string; disabled?: boolean; hint?: string };
  type Group = { id: string; label: string; items: Link[]; disabled?: boolean; hint?: string };
  type Item = Link | Group;

  let {
    items,
    currentHref = '',
    tone = 'light',
    ariaLabel,
    menuLabel,
    context,
    contained = false,
  }: {
    items: Item[];
    currentHref?: string;
    tone?: 'light' | 'dark';
    /** Name der Navigation; Standard aus dem Katalog (`appnav.label`). */
    ariaLabel?: string;
    /** Beschriftung des Menüknopfs; Standard aus dem Katalog (`appnav.menu`). */
    menuLabel?: string;
    /** Platz rechts in der Leiste, z. B. für einen späteren Turnierumschalter. */
    context?: Snippet;
    /** Begrenzt den Inhalt auf --hoops-shell-max (Hintergrund bleibt voll breit). */
    contained?: boolean;
  } = $props();

  const i18n = useI18n();
  const navLabel = $derived(ariaLabel ?? i18n.t('appnav.label'));
  const toggleLabel = $derived(menuLabel ?? i18n.t('appnav.menu'));
  const baseId = `hoops-appnav-${++seq}`;
  let menuOpen = $state(false);
  let openGroup = $state<string | null>(null);
  let root: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();
  const triggers: Record<string, HTMLButtonElement | undefined> = {};

  const slug = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '-');
  const isGroup = (item: Item): item is Group => 'items' in item;
  const isCurrent = (link: Link) => currentHref !== '' && link.href === currentHref;

  function closeAll() {
    openGroup = null;
    menuOpen = false;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    if (openGroup) {
      const id = openGroup;
      openGroup = null;
      triggers[id]?.focus();
    } else if (menuOpen) {
      menuOpen = false;
      toggleEl?.focus();
    }
  }

  function onFocusout(event: FocusEvent) {
    // Nur schließen, wenn der Fokus auf ein Element außerhalb wandert (relatedTarget null = z. B. Safari-Klick, nicht schließen).
    const next = event.relatedTarget as Node | null;
    if (openGroup && next && root && !root.contains(next)) openGroup = null;
  }

  function onWindowMousedown(event: MouseEvent) {
    if (openGroup && root && !root.contains(event.target as Node)) openGroup = null;
  }
</script>

<svelte:window onmousedown={onWindowMousedown} />

{#snippet link(l: Link)}
  {#if l.disabled}
    <span role="link" aria-disabled="true" class="hoops-appnav-link is-disabled" title={l.hint}>
      {l.label}{#if l.hint}<span class="hoops-sr-only"> – {l.hint}</span>{/if}
    </span>
  {:else}
    <a
      class="hoops-appnav-link"
      class:is-active={isCurrent(l)}
      href={l.href}
      aria-current={isCurrent(l) ? 'page' : undefined}
      onclick={closeAll}
    >{l.label}</a>
  {/if}
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<nav
  bind:this={root}
  class="hoops-appnav hoops-appnav--{tone}"
  class:hoops-appnav--contained={contained}
  class:is-open={menuOpen}
  aria-label={navLabel}
  lang={i18n.lang}
  onkeydown={onKeydown}
  onfocusout={onFocusout}
>
  <div class="hoops-appnav-bar">
    <button
      bind:this={toggleEl}
      type="button"
      class="hoops-appnav-toggle"
      aria-expanded={menuOpen}
      aria-controls="{baseId}-list"
      onclick={() => (menuOpen = !menuOpen)}
    >
      <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
      <span>{toggleLabel}</span>
    </button>
    <ul id="{baseId}-list" class="hoops-appnav-list">
      {#each items as item (item.id)}
        {#if isGroup(item) && item.disabled}
          <li class="hoops-appnav-item">
            <button type="button" class="hoops-appnav-group-btn is-disabled" disabled title={item.hint}>
              {item.label}{#if item.hint}<span class="hoops-sr-only"> – {item.hint}</span>{/if}
            </button>
          </li>
        {:else if isGroup(item)}
          <li class="hoops-appnav-item">
            <button
              bind:this={triggers[item.id]}
              type="button"
              class="hoops-appnav-group-btn"
              class:is-active={item.items.some(isCurrent)}
              class:is-open={openGroup === item.id}
              aria-expanded={openGroup === item.id}
              aria-controls="{baseId}-{slug(item.id)}"
              onclick={() => (openGroup = openGroup === item.id ? null : item.id)}
            >
              {item.label}
              <Icon name="chevron-d" size={16} class="hoops-appnav-chev" />
            </button>
            <ul id="{baseId}-{slug(item.id)}" class="hoops-appnav-panel" hidden={openGroup !== item.id}>
              {#each item.items as child (child.id)}
                <li>{@render link(child)}</li>
              {/each}
            </ul>
          </li>
        {:else}
          <li class="hoops-appnav-item">{@render link(item)}</li>
        {/if}
      {/each}
    </ul>
    {#if context}<div class="hoops-appnav-context">{@render context()}</div>{/if}
  </div>
</nav>
