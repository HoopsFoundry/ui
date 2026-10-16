<script>
  import Tabs from '../../svelte/Tabs.svelte';

  const presets = {
    page: [
      { id: 'overview', label: 'Übersicht' },
      { id: 'roster',   label: 'Aufstellung', count: 12 },
      { id: 'box',      label: 'Boxscore' },
      { id: 'pbp',      label: 'Play-by-Play', count: 47 },
      { id: 'crew',     label: 'Kampfgericht' },
    ],
    density: [
      { id: 'touch',   label: 'Touch' },
      { id: 'default', label: 'Default' },
      { id: 'compact', label: 'Compact' },
      { id: 'dense',   label: 'Dense' },
    ],
    quarters: [
      { id: 'q1', label: 'Q1' },
      { id: 'q2', label: 'Q2' },
      { id: 'q3', label: 'Q3' },
      { id: 'q4', label: 'Q4' },
      { id: 'ot', label: 'OT', disabled: true },
    ],
    filters: [
      { id: 'a', label: 'Bayernliga Süd' },
      { id: 'b', label: 'Regionalliga' },
      { id: 'c', label: 'Saison 25/26' },
      { id: 'd', label: 'Damen' },
      { id: 'e', label: 'U18 männlich' },
      { id: 'f', label: 'Pokal' },
    ],
    settings: [
      { id: 'profile', label: 'Profil' },
      { id: 'notify',  label: 'Benachrichtigungen' },
      { id: 'team',    label: 'Team-Config' },
      { id: 'license', label: 'Schiedsrichter-Lizenz' },
      { id: 'print',   label: 'Druck & Export' },
    ],
  };

  let {
    variant = 'underline',
    size = 'md',
    preset = 'page',
    value = 'overview',
    activeIds = ['a', 'c'],
    multi = false,
    sidebar = false,
  } = $props();

  let items = $derived(presets[preset] ?? presets.page);
</script>

<div style="padding: 24px;">
  {#if sidebar}
    <div style="display: flex; gap: 24px; align-items: flex-start;">
      <Tabs {items} {variant} {size} {value} />
      <div style="flex:1;background:var(--hoops-page-surface-0);border:1px solid var(--hoops-page-line);border-radius:var(--hoops-radius-lg);padding:24px;min-height:240px;max-width:480px;">
        <h3 style="margin:0 0 8px;font-family:var(--hoops-font-display);">Settings-Section</h3>
        <p style="margin:0;color:var(--hoops-fg-soft);font-size:14px;">Inhalt der gewählten Section.</p>
      </div>
    </div>
  {:else}
    <Tabs {items} {variant} {size} {value} {multi} {activeIds} />
  {/if}
</div>
