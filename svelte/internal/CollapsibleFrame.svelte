<script lang="ts">
  /**
   * DSS CollapsibleFrame · Svelte 5 (intern, nicht Teil der öffentlichen Exporte)
   * --------------------------------------------------------------
   * Der einklappbare Rahmen von `Table`, `ScheduleTable`, `ScheduleGrid` (`kind="frame"`) und `LeagueCard` (`kind="league"`):
   * Der Kopf ist eine Überschrift mit Button (`<h3><button aria-expanded aria-controls>`), der Inhalt das Panel. Titel, Untertitel
   * und Zusatzinfo stehen im Button (Teil des Namens, getrennt durch das unsichtbare Komma `.dss-acc-sep`). Der Inhalt bekommt die
   * Ebene unter dem Titel. Im Kontext einer `Accordion`-Gruppe meldet sich der Rahmen an (Sprungleiste, „Alle öffnen“, `exclusive`,
   * Deep-Link, Tastatur); steht er direkt im Panel eines `AccordionItem`, bleibt er einzeln. Ohne `id` gibt es keinen Anker.
   * Das Panel trägt keine eigene Region: Der Inhalt bringt schon eine benannte Region mit (der Scrollbereich der Tabelle).
   * Nutzt ausschließlich die Klassen aus css/components.css.
   */
  import { untrack, type Snippet } from 'svelte';
  import { levelOfTag, nextLevel, type HeadingTag } from '../../js/heading.js';
  import { createCollapsible } from '../../js/accordion.js';
  import { provideHeadingLevel, useHeadingTag } from '../heading-context.js';
  import { provideItem, useGroup, useParentItem } from '../accordion-context.js';

  let {
    kind = 'frame',
    rootClass,
    id = undefined,
    title,
    sub = '',
    titleAs = undefined,
    open = $bindable(false),
    meta = undefined,
    children,
  }: {
    /** `frame`: Rahmen der Tabellen (`dss-frame`); `league`: Karte der Liga (`dss-league`). */
    kind?: 'frame' | 'league';
    /** Alle Klassen des äußeren Elements (ohne `is-collapsible`/`is-open`). */
    rootClass: string;
    /** Anker für Deep-Link und Sprungleiste; ohne `id` gibt es keinen. */
    id?: string;
    title: string;
    /** Untertitel unter dem Titel (nur `league`). */
    sub?: string;
    titleAs?: HeadingTag;
    open?: boolean;
    /** Zusatzinfo rechts im Kopf (mit eigenem Wrapper des Aufrufers); Teil des zugänglichen Namens. */
    meta?: Snippet;
    children?: Snippet;
  } = $props();

  const outer = useGroup();
  const parent = useParentItem();
  // Direkt im Panel eines Bereichs (die Gruppe ist die des Bereichs): einzeln bleiben, sonst schlösse `exclusive` den Elternbereich
  const group = outer && !(parent && parent.group === outer) ? outer : undefined;
  const heading = useHeadingTag(() => titleAs ?? group?.titleAs);
  provideHeadingLevel(() => nextLevel(levelOfTag(heading.tag)));

  const uid = $props.id();
  const key = $derived(id ?? `dss-cf-${uid}`);
  const triggerId = $derived(`${key}-trigger`);
  const panelId = $derived(`${key}-panel`);

  let el = $state<HTMLElement>();
  let trigger = $state<HTMLButtonElement>();
  let panel = $state<HTMLElement>();

  const collapsible = createCollapsible({
    id: () => key,
    title: () => title,
    open: () => open,
    disabled: () => false,
    anchor: () => id !== undefined,
    group: () => group,
    parent: () => parent,
    el: () => el,
    trigger: () => trigger,
    panel: () => panel,
    commit: (next) => { open = next; },
  });
  const { setOpen, reveal, entry } = collapsible;

  provideItem({
    get id() { return key; },
    reveal,
    group: outer,
  });

  $effect(() => {
    if (group) return untrack(() => group.register(entry));
  });
  $effect(() => {
    const [now, isOpen] = [key, open];
    untrack(() => group?.opened(now, isOpen));
  });
  $effect(() => {
    if (id === undefined || !(group?.syncHash ?? true) || typeof window === 'undefined') return;
    untrack(collapsible.checkHash);
    window.addEventListener('hashchange', collapsible.checkHash);
    return () => window.removeEventListener('hashchange', collapsible.checkHash);
  });

  const base = $derived(kind === 'league' ? 'dss-league' : 'dss-frame');
  const rootClasses = $derived(`${rootClass} is-collapsible${open ? ' is-open' : ''}`);
</script>

<div class={rootClasses} {id} bind:this={el}>
  <div class="{base}-head {base}-head--acc">
    <svelte:element this={heading.tag} class="{base}-title">
      <button
        type="button"
        class="dss-acc-trigger"
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        bind:this={trigger}
        onclick={() => setOpen(!open, true)}
        onkeydown={(event) => group?.onKey(event)}
      >
        <!-- Das Komma (.dss-acc-sep, Schriftgröße 0) hängt am Titel bzw. Untertitel: der Name lautet „Titel, Untertitel, Zusatz“ -->
        <span class="dss-acc-label">{title}{#if sub}<span class="dss-acc-sep">,</span><span class="dss-acc-sub">{sub}{#if meta}<span class="dss-acc-sep">,</span>{/if}</span>{:else if meta}<span class="dss-acc-sep">,</span>{/if}</span>
        {#if meta}{@render meta()}{/if}
        <svg class="dss-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5" /></svg>
      </button>
    </svelte:element>
  </div>
  <div class="dss-acc-panel" id={panelId} bind:this={panel} hidden={!open} inert={!open}>
    <div class="dss-acc-panel-inner">{@render children?.()}</div>
  </div>
</div>
