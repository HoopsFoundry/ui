<script lang="ts">
  /**
   * DSS Accordion · Svelte 5 (Gruppe)
   * --------------------------------------------------------------
   * Fasst `AccordionItem`-Bereiche zusammen: nur ein Bereich offen (`exclusive`), „Alle öffnen/schließen“ (`expandAll`),
   * Sprungleiste (`nav`), Deep-Link per URL-Anker (`syncHash`), klebender Kopf (`sticky`) und Pfeiltasten zwischen den Köpfen.
   * Eine Gruppe in einem Bereich ist verschachtelt (`dss-acc--nested`, kleiner) und zählt die Überschriftenebene hoch.
   * Sprungleiste und „Alle öffnen/schließen“ entstehen im Browser (sie kennen die Bereiche erst nach dem Anmelden).
   * Nutzt ausschließlich die Klassen aus css/components.css (kein eigener Scoped-Style).
   */
  import { untrack, type Snippet } from 'svelte';
  import type { HeadingTag } from '../js/heading.js';
  import { moveFocus, scrollToElement, summaryText, writeHash } from '../js/accordion.js';
  import { provideGroup, useParentItem, type AccordionEntry } from './accordion-context.js';

  let {
    exclusive = false,
    variant = 'card',
    expandAll = false,
    nav = false,
    syncHash = true,
    sticky = false,
    navLabel = 'Bereiche',
    titleAs = undefined,
    class: klass = '',
    children,
  }: {
    /** Nur ein Bereich gleichzeitig offen (Standard false); „Alle öffnen/schließen“ entfällt dann. */
    exclusive?: boolean;
    /** Karte (Rand, Radius, Schatten) oder flach (nur Trennlinien). */
    variant?: 'card' | 'flat';
    /** Zeigt „Alle öffnen“ und „Alle schließen“ mit Ansage. */
    expandAll?: boolean;
    /** Sprungleiste mit Links auf die Bereiche (unter 640 px selbst einklappbar). */
    nav?: boolean;
    /** Deep-Link: `#id` öffnet den Bereich samt Eltern; Klick setzt den Anker (Standard true). */
    syncHash?: boolean;
    /** Kopf des offenen Bereichs klebt oben (Abstand: `--hoops-acc-sticky-top`). */
    sticky?: boolean;
    /** Name der Sprungleiste (`aria-label` der Navigation und Text des Handy-Schalters), Standard „Bereiche“. Mehrere Sprungleisten auf einer Seite brauchen verschiedene Namen. */
    navLabel?: string;
    /** Ebene der Bereichsüberschriften, h2 bis h6; ein `titleAs` am Bereich gewinnt. Ohne Angabe gilt `HeadingLevel`, sonst h3. */
    titleAs?: HeadingTag;
    class?: string;
    children?: Snippet;
  } = $props();

  const uid = $props.id();
  const listId = `dss-acc-nav-${uid}`;
  const nested = useParentItem() !== undefined;

  let root = $state<HTMLElement>();
  let entries = $state.raw<AccordionEntry[]>([]);
  let current = $state<string | null>(null);
  let announcement = $state('');
  let navOpen = $state(false);

  const byDom = (a: AccordionEntry, b: AccordionEntry) =>
    a.el && b.el ? (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1) : 0;

  provideGroup({
    get exclusive() { return exclusive; },
    get syncHash() { return syncHash; },
    get titleAs() { return titleAs; },
    get count() { return entries.length; },
    register(entry) {
      entries = [...entries, entry].sort(byDom);
      return () => {
        entries = entries.filter((e) => e !== entry);
        if (current === entry.id) current = null;
      };
    },
    closeOthers(id) {
      for (const e of entries) if (e.id !== id && e.open) e.setOpen(false);
    },
    opened(id, open) {
      if (open) current = id;
      else if (current === id) current = null;
    },
    onKey(event) {
      if (root && moveFocus(root, event.currentTarget as Element, event.key, event)) event.preventDefault();
    },
  });

  // Bei `exclusive` bleibt nur der erste offene Bereich (in Dokumentreihenfolge) offen; läuft beim Start und wenn sich Bereiche oder `exclusive` ändern
  $effect(() => {
    if (!exclusive) return;
    const list = entries;
    untrack(() => {
      for (const e of list.filter((x) => x.open).slice(1)) e.setOpen(false);
    });
  });

  const showAll = $derived(expandAll && !exclusive);

  function setAll(flag: boolean) {
    // Gesperrte Bereiche behalten ihren Zustand; die Ansage nennt, wie viele danach offen sind
    const after = entries.filter((e) => (e.disabled ? e.open : flag)).length;
    for (const e of entries) if (!e.disabled) e.setOpen(flag);
    announcement = summaryText(after, entries.length);
  }

  function jump(event: MouseEvent, entry: AccordionEntry) {
    event.preventDefault();
    entry.reveal();
    if (syncHash) writeHash(entry.id, true);
    scrollToElement(entry.el);
    entry.trigger?.focus({ preventScroll: true });
  }

  const classes = $derived(['dss-acc', `dss-acc--${variant}`, sticky && 'dss-acc--sticky', nested && 'dss-acc--nested', klass].filter(Boolean).join(' '));
</script>

<div class={classes} bind:this={root}>
  {#if entries.length === 0 && (showAll || nav)}
    <!-- Platz für Leiste und Sprungleiste schon im Server-Markup: kein Sprung nach dem Hydrieren -->
    <div class="dss-acc-tools dss-acc-tools--pending" data-parts={showAll && nav ? 'both' : showAll ? 'bar' : 'nav'} aria-hidden="true"></div>
  {:else if entries.length > 0 && (showAll || nav)}
    <div class="dss-acc-tools">
      {#if showAll}
        <div class="dss-acc-bar">
          <button type="button" class="dss-btn dss-btn--secondary dss-btn--sm" aria-controls={entries.map((e) => `${e.id}-panel`).join(' ')} onclick={() => setAll(true)}>Alle öffnen</button>
          <button type="button" class="dss-btn dss-btn--secondary dss-btn--sm" aria-controls={entries.map((e) => `${e.id}-panel`).join(' ')} onclick={() => setAll(false)}>Alle schließen</button>
          <span class="dss-sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
        </div>
      {/if}
      {#if nav}
        <nav class="dss-acc-nav{navOpen ? ' is-open' : ''}" aria-label={navLabel}>
          <button type="button" class="dss-acc-nav-toggle" aria-expanded={navOpen} aria-controls={listId} onclick={() => (navOpen = !navOpen)}>{navLabel}</button>
          <ul class="dss-acc-nav-list" id={listId}>
            {#each entries.filter((e) => e.anchor !== false && e.title) as entry (entry.id)}
              <li class="dss-acc-nav-item">
                <a class="dss-acc-nav-link" href={`#${encodeURIComponent(entry.id)}`} aria-current={current === entry.id ? 'true' : undefined} onclick={(event) => jump(event, entry)}>{entry.title}</a>
              </li>
            {/each}
          </ul>
        </nav>
      {/if}
    </div>
  {/if}
  {@render children?.()}
</div>
