<script lang="ts">
  import { onMount } from 'svelte';
  import Tabs from '../../svelte/Tabs.svelte';
  import { ensureSprite } from '../../svelte/Icon.svelte';
  import { initAll } from '../../js/vanilla-core.js';
  import { initTabs } from '../../js/tabs.js';
  import { registerMarkup, filterMarkup } from '../Tabs.code';

  let { example }: { example: string } = $props();

  // Tab-Symbole kommen aus dem Sprite, das Icon.svelte einmal einhängt
  onMount(() => ensureSprite());

  const page = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'roster', label: 'Aufstellung', count: 12 },
    { id: 'box', label: 'Boxscore' },
    { id: 'pbp', label: 'Play-by-Play', count: 47 },
    { id: 'crew', label: 'Kampfgericht' },
  ];
  const density = [
    { id: 'touch', label: 'Touch' },
    { id: 'default', label: 'Default' },
    { id: 'compact', label: 'Compact' },
    { id: 'dense', label: 'Dense' },
  ];
  const filters = [
    { id: 'a', label: 'Bayernliga Süd' },
    { id: 'b', label: 'Regionalliga' },
    { id: 'c', label: 'Saison 25/26' },
    { id: 'd', label: 'Damen' },
    { id: 'e', label: 'U18 männlich' },
    { id: 'f', label: 'Pokal' },
  ];
  const settings = [
    { id: 'profile', label: 'Profil' },
    { id: 'notify', label: 'Benachrichtigungen' },
    { id: 'team', label: 'Team-Config' },
    { id: 'license', label: 'Schiedsrichter-Lizenz' },
  ];
  const quarters = [
    { id: 'q1', label: 'Q1' },
    { id: 'q2', label: 'Q2' },
    { id: 'q3', label: 'Q3' },
    { id: 'q4', label: 'Q4' },
    { id: 'ot', label: 'OT', disabled: true },
  ];
  const withIcons = [
    { id: 'board', label: 'Spielzug', icon: 'i-edit' },
    { id: 'roster', label: 'Aufstellung', icon: 'i-roster', count: 12 },
    { id: 'stats', label: 'Statistik', icon: 'i-stats' },
    { id: 'sub', label: 'Wechsel', icon: 'i-sub', disabled: true },
  ];
  const sizes = [
    { size: 'sm', label: 'sm · 36 px' },
    { size: 'md', label: 'md · 44 px (Standard)' },
    { size: 'lg', label: 'lg · 56 px' },
  ];
  const variants = [
    { id: 'underline', name: 'Underline' },
    { id: 'segmented', name: 'Segmented' },
    { id: 'pills', name: 'Pills' },
    { id: 'vertical', name: 'Vertical' },
  ];
  const cols = ['Standard', 'Hover', 'Fokus', 'Gedrückt', 'Gewählt', 'Gesperrt'];
  const stateClass = { Standard: '', Hover: 'pseudo-hover', Fokus: 'pseudo-focus-visible', Gedrückt: 'pseudo-hover pseudo-active', Gewählt: 'is-active', Gesperrt: '' };

  // Vanilla-Beispiele: das Markup aus dem Code-Beispiel (createContextualFragment statt HTML-Zuweisung), gestartet mit initAll.
  function vanillaMarkup(node: HTMLElement, markup: string) {
    node.replaceChildren(document.createRange().createContextualFragment(markup));
    const handle = initAll(node, { only: ['tabs'] });
    return { destroy: () => handle.destroy() };
  }
  // Filter: die Seite reagiert auf dss:tabchange
  let filterText = $state('Bayernliga Süd, Pokal');
  function vanillaFilter(node: HTMLElement) {
    const handle = vanillaMarkup(node, filterMarkup);
    const onChange = (event: Event) => {
      const ids = (event as CustomEvent<{ ids: string[] }>).detail.ids;
      filterText = ids.length ? ids.map((id) => node.querySelector(`[id="${id}"]`)?.textContent?.trim()).join(', ') : 'keine';
    };
    node.addEventListener('dss:tabchange', onChange);
    return { destroy: () => { node.removeEventListener('dss:tabchange', onChange); handle.destroy(); } };
  }
  // Einzelne Leiste mit Optionen (Handy-Beispiel dunkel)
  function bar(node: HTMLElement, options: Parameters<typeof initTabs>[1]) {
    const handle = initTabs(node, options);
    return { destroy: () => handle.destroy() };
  }

  let single = $state('overview');
  let multi = $state(['a', 'c']);
  const panels = { overview: 'Zusammenfassung des Spiels.', roster: 'Aufstellung beider Mannschaften.', box: 'Boxscore mit allen Werten.', pbp: 'Jede Aktion in der Reihenfolge des Spiels.', crew: 'Schiedsrichter und Kampfgericht.' };
</script>

{#if example === 'varianten'}
  <div class="grid2">
    <div class="card full">
      <div class="cap">Underline · Seiten-Ansichten</div>
      <div class="scroll"><Tabs items={page} variant="underline" value="overview" /></div>
    </div>
    <div class="card">
      <div class="cap">Segmented · Umschalter im Panel</div>
      <div class="scroll"><Tabs items={density} variant="segmented" value="default" /></div>
    </div>
    <div class="card">
      <div class="cap">Pills · Filterleiste (mehrere aktiv)</div>
      <Tabs items={filters} variant="pills" multi activeIds={['a', 'c']} />
    </div>
    <div class="card">
      <div class="cap">Vertical · Einstellungen</div>
      <Tabs items={settings} variant="vertical" value="team" />
    </div>
  </div>
{:else if example === 'groessen'}
  <div class="stack">
    {#each sizes as s}
      <div>
        <div class="cap">{s.label}</div>
        <div class="scroll"><Tabs items={density} variant="segmented" size={s.size} value="default" /></div>
      </div>
    {/each}
  </div>
{:else if example === 'bausteine'}
  <div class="stack">
    <div>
      <div class="cap">Zähler (count)</div>
      <div class="scroll"><Tabs items={page} variant="underline" value="roster" /></div>
    </div>
    <div>
      <div class="cap">Symbol (icon), Zähler und gesperrter Tab</div>
      <div class="scroll"><Tabs items={withIcons} variant="segmented" value="roster" /></div>
    </div>
    <div>
      <div class="cap">Gesperrter Tab (disabled)</div>
      <div class="scroll"><Tabs items={quarters} variant="segmented" size="lg" value="q2" /></div>
    </div>
  </div>
{:else if example === 'bedienung'}
  <div class="stack">
    <div class="card">
      <div class="cap">Einzelauswahl (role=tablist)</div>
      <div class="scroll"><Tabs bind:value={single} items={page} variant="underline" ariaLabel="Spielansicht" /></div>
      <p class="panel">{panels[single]}</p>
    </div>
    <div class="card">
      <div class="cap">Mehrfachauswahl (role=group, aria-pressed)</div>
      <Tabs bind:activeIds={multi} items={filters} variant="pills" multi ariaLabel="Ligen filtern" />
      <p class="panel">Aktiv: {multi.length ? multi.map((id) => filters.find((f) => f.id === id)?.label).join(', ') : 'keine'}</p>
    </div>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface">
      <div class="states">
        <div class="head"></div>
        {#each cols as c}<div class="head">{c}</div>{/each}
        {#each variants as v}
          <div class="rowlabel">{v.name}</div>
          {#each cols as c}
            <div class="cell">
              <div class="dss-tabs dss-tabs--{v.id} dss-tabs--md">
                <button type="button" class="dss-tab {stateClass[c]}" disabled={c === 'Gesperrt'}>Boxscore</button>
              </div>
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>

{:else if example === 'vanilla'}
  <div class="vanilla" use:vanillaMarkup={registerMarkup}></div>
{:else if example === 'vanilla-filter'}
  <div class="vanilla" use:vanillaFilter></div>
  <p class="panel" aria-live="polite">Gewählt: {filterText}</p>
{:else if example === 'handy'}
  <div class="narrow">
    <div class="vanilla" use:vanillaMarkup={registerMarkup}></div>
  </div>
{:else if example === 'handy-dunkel'}
  <div class="narrow">
    <div class="dss-tabs dss-tabs--underline dss-tabs--md" role="tablist" aria-label="Vereinsseite" use:bar={{ activation: 'manual' }}>
      <button type="button" class="dss-tab is-active" role="tab" id="hv-team" aria-selected="true" aria-controls="hv-team-panel" tabindex="0"><span class="dss-tab-label">Mannschaften</span><span class="dss-tab-count">7</span></button>
      <button type="button" class="dss-tab" role="tab" id="hv-halle" aria-selected="false" aria-controls="hv-halle-panel" tabindex="-1"><span class="dss-tab-label">Halle</span></button>
      <button type="button" class="dss-tab is-disabled" role="tab" id="hv-presse" aria-selected="false" aria-controls="hv-presse-panel" tabindex="-1" disabled><span class="dss-tab-label">Presse</span></button>
    </div>
    <div id="hv-team-panel" role="tabpanel" aria-labelledby="hv-team" tabindex="0"><p class="panel">Sieben Mannschaften, von U12 bis Herren. Pfeiltasten bewegen nur den Fokus, Enter wählt (activation: manual).</p></div>
    <div id="hv-halle-panel" role="tabpanel" aria-labelledby="hv-halle" tabindex="0" hidden inert><p class="panel">Nordhain-Halle am Sportpark, 420 Plätze.</p></div>
    <div id="hv-presse-panel" role="tabpanel" aria-labelledby="hv-presse" tabindex="0" hidden inert><p class="panel">Noch keine Berichte.</p></div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-panels'}
  <!-- Richtig: Inaktive Panels sind im Markup hidden, vor dem Skript ist nur der erste Inhalt sichtbar -->
  <div class="dss-tabs dss-tabs--underline dss-tabs--md" role="tablist" aria-label="Richtig: Panels verborgen" use:bar>
    <button type="button" class="dss-tab is-active" role="tab" id="dp-a" aria-selected="true" aria-controls="dp-a-panel" tabindex="0"><span class="dss-tab-label">Übersicht</span></button>
    <button type="button" class="dss-tab" role="tab" id="dp-b" aria-selected="false" aria-controls="dp-b-panel" tabindex="-1"><span class="dss-tab-label">Boxscore</span></button>
  </div>
  <div id="dp-a-panel" role="tabpanel" aria-labelledby="dp-a" tabindex="0"><p class="panel">Zusammenfassung des Spiels.</p></div>
  <div id="dp-b-panel" role="tabpanel" aria-labelledby="dp-b" tabindex="0" hidden inert><p class="panel">Boxscore mit allen Werten.</p></div>
{:else if example === 'dont-panels'}
  <!-- Falsch: alle Panels sind im Markup sichtbar; ohne Skript (oder davor) stehen alle Ansichten untereinander. Die Leiste ist nicht gestartet. -->
  <div class="dss-tabs dss-tabs--underline dss-tabs--md" role="tablist" aria-label="Falsch: Panels sichtbar">
    <button type="button" class="dss-tab is-active" role="tab" id="dq-a" aria-selected="true" aria-controls="dq-a-panel" tabindex="0"><span class="dss-tab-label">Übersicht</span></button>
    <button type="button" class="dss-tab" role="tab" id="dq-b" aria-selected="false" aria-controls="dq-b-panel" tabindex="-1"><span class="dss-tab-label">Boxscore</span></button>
  </div>
  <div id="dq-a-panel" role="tabpanel" aria-labelledby="dq-a"><p class="panel">Zusammenfassung des Spiels.</p></div>
  <div id="dq-b-panel" role="tabpanel" aria-labelledby="dq-b"><p class="panel">Boxscore mit allen Werten.</p></div>
{:else if example === 'do-ansichten'}
  <div class="scroll"><Tabs items={[{ id: 'overview', label: 'Übersicht' }, { id: 'box', label: 'Boxscore' }, { id: 'pbp', label: 'Play-by-Play' }]} variant="underline" value="overview" /></div>
{:else if example === 'dont-ansichten'}
  <div class="scroll"><Tabs items={[{ id: 'plan', label: 'Spielplan' }, { id: 'teams', label: 'Mannschaften' }, { id: 'set', label: 'Einstellungen' }]} variant="underline" value="plan" /></div>
{:else if example === 'do-wenige'}
  <Tabs items={[...filters, { id: 'g', label: 'U16 weiblich' }, { id: 'h', label: 'Senioren' }, { id: 'i', label: 'Hobby' }]} variant="pills" multi activeIds={['a']} />
{:else if example === 'dont-wenige'}
  <!-- Underline bricht nicht um: Tabs, die nicht passen, ragen aus der Leiste. Der Rahmen schneidet sie hier ab. -->
  <div class="clip">
    <Tabs items={[...filters, { id: 'g', label: 'U16 weiblich' }, { id: 'h', label: 'Senioren' }, { id: 'i', label: 'Hobby' }]} variant="underline" value="a" />
  </div>
{:else if example === 'do-zahl'}
  <div class="scroll"><Tabs items={[{ id: 'a', label: 'Aufstellung', count: 12 }, { id: 'b', label: 'Fouls', count: 3 }]} variant="underline" value="a" /></div>
{:else if example === 'dont-zahl'}
  <div class="scroll"><Tabs items={[{ id: 'a', label: 'Aufstellung (12)' }, { id: 'b', label: 'Fouls (3)' }]} variant="underline" value="a" /></div>
{:else if example === 'do-multi'}
  <Tabs items={filters.slice(0, 4)} variant="pills" multi activeIds={['a', 'c']} />
{:else if example === 'dont-multi'}
  <!-- Ohne multi ist es eine Einzelauswahl (role=tab): ein Klick ersetzt die Auswahl -->
  <Tabs items={filters.slice(0, 4)} variant="pills" value="a" />
{/if}

<style>
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 24px; }
  .stack { display: flex; flex-direction: column; gap: 24px; }
  .card { min-width: 0; border: 1px solid var(--page-line); border-radius: var(--radius-lg); padding: 18px 20px; background: var(--page-bg); }
  .card.full { grid-column: 1 / -1; }
  .cap, .head, .rowlabel { font-family: var(--font-mono); font-size: var(--fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--page-mute); }
  .cap { margin-bottom: 8px; }
  .panel { margin: 14px 0 0; font-size: var(--fs-body-sm); color: var(--page-fg); }
  .clip { width: 100%; overflow: hidden; }
  .narrow { box-sizing: border-box; max-width: 390px; padding: 14px; }
  .vanilla :global([role='tabpanel']) { margin: 14px 0 0; padding: 0 2px; font-size: var(--fs-body-sm); color: var(--page-fg); }
  .vanilla :global(.dss-tabs + [role='tabpanel']), .vanilla :global([role='tabpanel'] + .dss-tabs) { margin-top: 14px; }
  .vanilla :global([role='tabpanel'] p) { margin: 0; }
  /* Underline und Segmented brechen nicht um: in schmalen Bereichen scrollt die Leiste hier seitlich (Innenabstand für den Fokus-Ring) */
  .scroll { overflow-x: auto; max-width: 100%; padding: 6px; margin: -6px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--page-bg); border: 1px solid var(--page-line); border-radius: var(--radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 90px repeat(6, minmax(130px, 1fr)); gap: 10px 12px; align-items: center; }
  .cell { display: flex; align-items: center; justify-content: center; min-height: 64px; padding: 8px; }
  .cell :global(.dss-tabs--vertical) { min-width: 0; }
</style>
