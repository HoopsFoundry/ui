<script lang="ts">
  // Testhilfe: die Svelte-Komponenten mit eingebauten Texten in einer Seite; `over` setzt Überschreib-Eigenschaften (label, ariaLabel …).
  import Modal from '../../svelte/Modal.svelte';
  import Tabs from '../../svelte/Tabs.svelte';
  import Stepper from '../../svelte/Stepper.svelte';
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import AppNav from '../../svelte/AppNav.svelte';
  import BottomNav from '../../svelte/BottomNav.svelte';
  import Breadcrumbs from '../../svelte/Breadcrumbs.svelte';
  import Skeleton from '../../svelte/Skeleton.svelte';
  import PlayByPlay from '../../svelte/PlayByPlay.svelte';
  import PlayerCard from '../../svelte/PlayerCard.svelte';

  let { over = {}, withModal = true }: { over?: Record<string, string>; withModal?: boolean } = $props();
  let tab = $state('b');
  let open = $state(true);
  let item = $state(true);
  export function snapshot() {
    return { tab, open, item };
  }
</script>

{#if withModal}<Modal bind:open title="Titel" closeLabel={over.closeLabel}>Inhalt</Modal>{/if}
<Tabs bind:value={tab} ariaLabel={over.tabs} items={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} />
<Stepper ariaLabel={over.stepper} onstep={() => {}} steps={[{ id: 'a', label: 'Eins', state: 'done' }, { id: 'b', label: 'Zwei', state: 'current' }, { id: 'c', label: 'Drei', state: 'pending' }]} />
<Accordion expandAll nav navLabel={over.accordion}>
  <AccordionItem id="x" title="X" bind:open={item}>Text</AccordionItem>
  <AccordionItem id="y" title="Y">Text</AccordionItem>
</Accordion>
<AppNav ariaLabel={over.appnav} menuLabel={over.menu} items={[{ id: 'a', label: 'A', href: '/a' }]} />
<BottomNav ariaLabel={over.bottomnav} items={[{ id: 'a', label: 'A', href: '/a' }]} />
<Breadcrumbs ariaLabel={over.breadcrumbs} items={[{ label: 'A', href: '/a' }, { label: 'B' }]} />
<Skeleton label={over.skeleton} />
<PlayByPlay title={over.pbp} events={[{ id: 1, time: '9:12', team: 'heim', title: 'Korb', score: { heim: 2, gast: 0 } }]} />
<PlayerCard jersey={7} name="Pat" captain height_cm="188" />
