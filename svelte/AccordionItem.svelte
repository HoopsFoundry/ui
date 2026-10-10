<script lang="ts">
  /**
   * DSS AccordionItem · Svelte 5 (ein Bereich)
   * --------------------------------------------------------------
   * Kopf als Überschrift mit Button (`<h3><button aria-expanded aria-controls>`), darunter der Bereich. Die Ebene der Überschrift:
   * `titleAs` > `titleAs` der Gruppe > `HeadingLevel` > h3. Der Inhalt bekommt die Ebene darunter (Titelkomponenten und verschachtelte
   * Gruppen zählen so hoch). Funktioniert auch allein ohne `Accordion` (dann ohne Sprungleiste und „Alle öffnen“).
   * `role="region"` trägt der Bereich nur bei höchstens 6 Bereichen in der Gruppe. Nutzt ausschließlich die Klassen aus css/components.css.
   */
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import { levelOfTag, nextLevel, type HeadingTag } from '../js/heading.js';
  import { hashTarget, scrollToElement, writeHash } from '../js/accordion.js';
  import { provideHeadingLevel, useHeadingTag } from './heading-context.js';
  import { provideItem, useGroup, useParentItem } from './accordion-context.js';

  let {
    id,
    title,
    open = $bindable(false),
    disabled = false,
    meta = undefined,
    titleAs = undefined,
    children,
  }: {
    /** Pflicht: Anker für den Deep-Link und die Sprungleiste; Grundlage der ids von Kopf und Bereich. */
    id: string;
    title: string;
    /** Geöffnet, mit `bind:open` gebunden. */
    open?: boolean;
    /** Gesperrt: kein Klick, gedämpft, wird von der Tastatur übersprungen (bleibt mit Tab erreichbar). */
    disabled?: boolean;
    /** Zusatzinfo rechts im Kopf (Zähler, Chip, Live-Tag); Teil des zugänglichen Namens. */
    meta?: Snippet;
    /** Ebene der Überschrift, h2 bis h6. */
    titleAs?: HeadingTag;
    children?: Snippet;
  } = $props();

  const group = useGroup();
  const parent = useParentItem();
  const heading = useHeadingTag(() => titleAs ?? group?.titleAs);
  provideHeadingLevel(() => nextLevel(levelOfTag(heading.tag)));

  let el = $state<HTMLElement>();
  let trigger = $state<HTMLButtonElement>();

  const triggerId = $derived(`${id}-trigger`);
  const panelId = $derived(`${id}-panel`);
  // Allein: immer eine Region; in einer Gruppe nur bis 6 Bereiche (die Anzahl ist erst im Browser bekannt)
  const region = $derived(group ? group.count > 0 && group.count <= 6 : true);

  function setOpen(next: boolean, user = false) {
    if (next === open) return;
    if (disabled) return;
    if (next && group?.exclusive) group.closeOthers(id);
    open = next;
    if (user && (group?.syncHash ?? true)) writeHash(id, next);
  }
  /** Öffnet diesen Bereich und alle Eltern-Bereiche (Deep-Link, Sprungleiste). */
  function reveal() {
    setOpen(true);
    parent?.reveal();
  }

  provideItem({
    get id() { return id; },
    reveal,
  });

  // Anmelden bei der Gruppe (Sprungleiste, Alle öffnen, Tastatur); Werte als Getter, damit sie aktuell bleiben
  const entry = {
    get id() { return id; },
    get title() { return title; },
    get open() { return open; },
    get disabled() { return disabled; },
    get el() { return el; },
    get trigger() { return trigger; },
    reveal,
    setOpen: (next: boolean) => setOpen(next),
  };
  $effect(() => {
    if (group) return untrack(() => group.register(entry));
  });
  // Zuletzt geöffneter Bereich (aria-current in der Sprungleiste); die Gruppe wird nicht als Abhängigkeit gelesen
  $effect(() => {
    const [now, isOpen] = [id, open];
    untrack(() => group?.opened(now, isOpen));
  });

  // Deep-Link: passender Anker beim Laden und bei hashchange
  $effect(() => {
    if (!(group?.syncHash ?? true) || typeof window === 'undefined') return;
    const check = () => {
      if (hashTarget(window.location.hash, [id]) !== id) return;
      reveal();
      scrollToElement(el);
    };
    untrack(check);
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  });

  const itemClass = $derived(['dss-acc-item', open && 'is-open', disabled && 'is-disabled'].filter(Boolean).join(' '));
</script>

<div class={itemClass} {id} bind:this={el}>
  <svelte:element this={heading.tag} class="dss-acc-title">
    <button
      type="button"
      class="dss-acc-trigger"
      id={triggerId}
      aria-expanded={open}
      aria-controls={panelId}
      aria-disabled={disabled ? 'true' : undefined}
      bind:this={trigger}
      onclick={() => setOpen(!open, true)}
      onkeydown={(event) => group?.onKey(event)}
    >
      <span class="dss-acc-label">{title}</span>
      {#if meta}<span class="dss-acc-meta"><span class="dss-sr-only">{', '}</span>{@render meta()}</span>{/if}
      <svg class="dss-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5" /></svg>
    </button>
  </svelte:element>
  <div class="dss-acc-panel" id={panelId} role={region ? 'region' : undefined} aria-labelledby={region ? triggerId : undefined} hidden={!open} inert={!open}>
    <div class="dss-acc-panel-inner">
      <div class="dss-acc-body">{@render children?.()}</div>
    </div>
  </div>
</div>
