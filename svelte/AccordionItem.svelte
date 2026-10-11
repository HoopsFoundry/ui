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
  import { createCollapsible } from '../js/accordion.js';
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
  let panel = $state<HTMLElement>();

  const triggerId = $derived(`${id}-trigger`);
  const panelId = $derived(`${id}-panel`);
  // Allein: immer eine Region; in einer Gruppe nur bis 6 Bereiche (die Anzahl ist erst im Browser bekannt)
  const region = $derived(group ? group.count > 0 && group.count <= 6 : true);

  // Verhalten (Öffnen, exclusive, Anker, Eltern, Eintrag für die Gruppe): gemeinsamer Baustein in js/accordion.js
  const collapsible = createCollapsible({
    id: () => id,
    title: () => title,
    open: () => open,
    disabled: () => disabled,
    anchor: () => true,
    group: () => group,
    parent: () => parent,
    el: () => el,
    trigger: () => trigger,
    panel: () => panel,
    commit: (next) => { open = next; },
  });
  const { setOpen, reveal, entry } = collapsible;

  provideItem({
    get id() { return id; },
    reveal,
    group,
  });

  // Anmelden bei der Gruppe (Sprungleiste, Alle öffnen, Tastatur); der Eintrag liest die Werte erst beim Zugriff
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
    untrack(collapsible.checkHash);
    window.addEventListener('hashchange', collapsible.checkHash);
    return () => window.removeEventListener('hashchange', collapsible.checkHash);
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
      <!-- Das Komma (.dss-acc-sep, Schriftgröße 0) hängt am Titel: der Name lautet „Titel, 14 Spieler“, auch wenn zwischen den Elementen Leerraum steht -->
      <span class="dss-acc-label">{title}{#if meta}<span class="dss-acc-sep">,</span>{/if}</span>
      {#if meta}<span class="dss-acc-meta">{@render meta()}</span>{/if}
      <svg class="dss-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5" /></svg>
    </button>
  </svelte:element>
  <div class="dss-acc-panel" id={panelId} bind:this={panel} role={region ? 'region' : undefined} aria-labelledby={region ? triggerId : undefined} hidden={!open} inert={!open}>
    <div class="dss-acc-panel-inner">
      <div class="dss-acc-body">{@render children?.()}</div>
    </div>
  </div>
</div>
