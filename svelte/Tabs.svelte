<script lang="ts">
  /**
   * HoopsFoundry UI Tabs · Svelte 5 example
   * --------------------------------------------------------------
   * Matches the v0.6 Navigation spec — four variants:
   *
   *   underline  — page tabs, sticky-safe (default)
   *   segmented  — single-pick toggle with shared track
   *   pills      — wrap-friendly filter chips (multi-active possible)
   *   vertical   — sidebar-style tabs (settings pages)
   *
   * Usage:
   *   <Tabs bind:value={tab} variant="underline" items={[
   *     { id: 'overview', label: 'Übersicht', icon: 'i-calendar' },
   *     { id: 'roster',   label: 'Aufstellung', count: 12 },
   *     { id: 'box',      label: 'Boxscore' },
   *   ]} />
   *
   * Nutzt ausschließlich die Klassen aus css/components.css (kein eigener Scoped-Style);
   * tokens.css und components.css müssen im App-Root importiert sein.
   * Icons referenced via `icon` are <use href="#i-…">; sprite must be
   * loaded in the page (or use the Icon.svelte component to inline).
   */

  import { nextTab } from '../js/tabs.js';

  type TabItem = {
    id: string;
    label: string;
    icon?: string;     // sprite id, e.g. 'i-calendar'  (without the '#')
    count?: number;    // optional badge
    disabled?: boolean;
  };

  type Variant = 'underline' | 'segmented' | 'pills' | 'vertical';
  type Size = 'sm' | 'md' | 'lg';

  let {
    items,
    value = $bindable(''),
    variant = 'underline',
    size = 'md',
    multi = false,         // pills can toggle multi-select
    activeIds = $bindable<string[]>([]),
    ariaLabel = 'Tabs',
    onchange,
  }: {
    items: TabItem[];
    value?: string;
    variant?: Variant;
    size?: Size;
    multi?: boolean;
    activeIds?: string[];
    ariaLabel?: string;
    onchange?: (id: string) => void;
  } = $props();

  // Initialise value to the first item if not provided.
  $effect(() => {
    if (!multi && !value && items.length) value = items[0].id;
  });

  function isActive(id: string) {
    return multi ? activeIds.includes(id) : value === id;
  }

  function select(item: TabItem) {
    if (item.disabled) return;
    if (multi) {
      activeIds = activeIds.includes(item.id)
        ? activeIds.filter(x => x !== item.id)
        : [...activeIds, item.id];
    } else {
      value = item.id;
    }
    onchange?.(item.id);
  }

  function onKey(e: KeyboardEvent, idx: number) {
    if (multi) return; // Mehrfachauswahl: jeder Schalter ist per Tab erreichbar, keine Pfeiltasten
    const axis = variant === 'vertical' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight'];
    if (!['Home', 'End', ...axis].includes(e.key)) return; // Pfeile der anderen Achse bleiben unberührt
    const n = nextTab(idx, e.key, items, { vertical: variant === 'vertical' });
    e.preventDefault();
    if (n === idx) return;
    select(items[n]);
    const btns = (e.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('button.hoops-tab');
    btns?.[n]?.focus();
  }
</script>

<div
  class="hoops-tabs hoops-tabs--{variant} hoops-tabs--{size}"
  role={multi ? 'group' : 'tablist'}
  aria-label={ariaLabel}
  aria-orientation={multi ? undefined : variant === 'vertical' ? 'vertical' : 'horizontal'}
>
  {#each items as item, i (item.id)}
    <button
      type="button"
      class="hoops-tab"
      class:is-active={isActive(item.id)}
      class:is-disabled={item.disabled}
      role={multi ? undefined : 'tab'}
      aria-selected={multi ? undefined : isActive(item.id)}
      aria-pressed={multi ? isActive(item.id) : undefined}
      disabled={item.disabled}
      tabindex={multi ? undefined : isActive(item.id) ? 0 : -1}
      onclick={() => select(item)}
      onkeydown={(e) => onKey(e, i)}
    >
      {#if item.icon}
        <svg class="hoops-tab-ic" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <use href={`#${item.icon}`}></use>
        </svg>
      {/if}
      <span class="hoops-tab-label">{item.label}</span>
      {#if item.count !== undefined}
        <span class="hoops-tab-count">{item.count}</span>
      {/if}
    </button>
  {/each}
</div>
