<script>
  import { onMount } from 'svelte';
  import TopBar from '../../svelte/TopBar.svelte';
  import BottomNav from '../../svelte/BottomNav.svelte';
  import Breadcrumbs from '../../svelte/Breadcrumbs.svelte';
  import Stepper from '../../svelte/Stepper.svelte';
  import { ensureSprite } from '../../svelte/Icon.svelte';

  /** @type {{ example: string }} */
  let { example } = $props();

  // BottomNav-Symbole kommen aus dem Sprite, das Icon.svelte einmal einhängt
  onMount(() => ensureSprite());

  const schiriNav = [
    { id: 'overview', label: 'Übersicht', icon: 'i-home' },
    { id: 'roster', label: 'Roster', icon: 'i-roster' },
    { id: 'score', label: 'Erfassen', icon: 'i-plus', fab: true },
    { id: 'foul', label: 'Fouls', icon: 'i-foul-p', badge: 3 },
    { id: 'settings', label: 'Settings', icon: 'i-cog' },
  ];
  const coachNav = [
    { id: 'team', label: 'Team', icon: 'i-roster' },
    { id: 'play', label: 'Spielzug', icon: 'i-edit' },
    { id: 'stats', label: 'Stats', icon: 'i-stats' },
    { id: 'subs', label: 'Wechsel', icon: 'i-sub' },
  ];
  const zuViele = [
    { id: 'overview', label: 'Übersicht', icon: 'i-home' },
    { id: 'roster', label: 'Roster', icon: 'i-roster' },
    { id: 'play', label: 'Spielzug', icon: 'i-edit' },
    { id: 'foul', label: 'Fouls', icon: 'i-foul-p' },
    { id: 'stats', label: 'Stats', icon: 'i-stats' },
    { id: 'subs', label: 'Wechsel', icon: 'i-sub' },
    { id: 'settings', label: 'Einstellungen', icon: 'i-cog' },
  ];
  const setupSteps = [
    { id: 's1', label: 'Spiel-Daten', description: 'Datum, Halle, Liga', state: 'done' },
    { id: 's2', label: 'Aufstellungen', description: 'Heim & Gast bestätigen', state: 'done' },
    { id: 's3', label: 'Kampfgericht', description: 'Schiri-Lizenzen & Crew', state: 'current' },
    { id: 's4', label: 'Freigabe', description: 'Unterschriften & Übertragung', state: 'pending' },
  ];

  // Klickbarer Stepper: Zurückspringen auf erledigte oder den aktuellen Schritt
  let current = $state(2);
  let clickable = $derived(setupSteps.map((s, i) => ({ ...s, state: i < current ? 'done' : i === current ? 'current' : 'pending' })));
  const goTo = (id) => (current = setupSteps.findIndex((s) => s.id === id));

  const cols = ['Standard', 'Hover', 'Fokus', 'Gedrückt', 'Aktuell', 'Gesperrt'];
  const stateClass = { Standard: '', Hover: 'pseudo-hover', Fokus: 'pseudo-focus-visible', Gedrückt: 'pseudo-hover pseudo-active', Aktuell: '', Gesperrt: '' };
  const rows = ['BottomNav-Eintrag', 'BottomNav-FAB', 'Breadcrumb-Link', 'Breadcrumb-Chip', 'Stepper-Punkt', 'Aktion in der TopBar'];
</script>

{#snippet phone(items, label)}
  <div class="phone">
    <div class="phone-top"></div>
    <BottomNav {items} ariaLabel={label} />
  </div>
{/snippet}

{#if example === 'topbar'}
  <div class="stack">
    <div>
      <div class="cap">Live · Schiri- und Coach-App</div>
      <div class="frame"><TopBar brand="HoopsFoundry UI" mark="D" context="live" matchLabel="BBL · 17. Spieltag" score="87 : 64" clock="Q4 · 02:14" user="Sven R." userInitials="SR" /></div>
    </div>
    <div>
      <div class="cap">Admin · Vereinsregister</div>
      <div class="frame"><TopBar brand="BBV" mark="B" context="admin" matchLabel="Vereinsregister · TSV Nordhain 1920" user="Jule Arendt" userInitials="JA" /></div>
    </div>
    <div>
      <div class="cap">Default · ruhig</div>
      <div class="frame"><TopBar brand="HoopsFoundry UI Coach" mark="C" user="Timo B." userInitials="TB" /></div>
    </div>
  </div>
{:else if example === 'topbar-eigene'}
  <div class="stack">
    <div>
      <div class="cap">center und actions</div>
      <div class="frame">
        <TopBar brand="HoopsFoundry UI" mark="D" user="Timo B." userInitials="TB">
          {#snippet center()}<span class="mid">Turnier-Manager</span>{/snippet}
          {#snippet actions()}<button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--sm">Hilfe</button>{/snippet}
        </TopBar>
      </div>
    </div>
  </div>
{:else if example === 'bottomnav'}
  <div class="phones">
    <div>
      <div class="cap">Schiri-App · 5 Einträge mit FAB und Badge</div>
      {@render phone(schiriNav, 'Hauptnavigation, Schiri-App')}
    </div>
    <div>
      <div class="cap">Coach-App · 4 Einträge</div>
      {@render phone(coachNav, 'Hauptnavigation, Coach-App')}
    </div>
  </div>
{:else if example === 'breadcrumbs'}
  <div class="stack">
    <div>
      <div class="cap">Plain</div>
      <div class="frame pad"><Breadcrumbs ariaLabel="Pfad, plain" items={[{ label: 'Verband', href: '#' }, { label: 'Bayernliga', href: '#' }, { label: 'TSV Nordhain', href: '#' }, { label: 'Roster' }]} /></div>
    </div>
    <div>
      <div class="cap">Tagged</div>
      <div class="frame pad"><Breadcrumbs ariaLabel="Pfad, tagged" variant="tagged" items={[{ label: 'Verband', href: '#', tag: 'Org' }, { label: 'Bayernliga', href: '#', tag: 'Liga' }, { label: 'TSV Nordhain', href: '#', tag: 'Team' }, { label: 'Roster', tag: 'View' }]} /></div>
    </div>
    <div>
      <div class="cap">Chip</div>
      <div class="frame pad"><Breadcrumbs ariaLabel="Pfad, chip" variant="chip" items={[{ label: 'Verband', href: '#' }, { label: 'Bayernliga', href: '#' }, { label: 'Roster' }]} /></div>
    </div>
  </div>
{:else if example === 'stepper'}
  <div class="stack">
    <div>
      <div class="cap">Horizontal</div>
      <div class="frame pad wide"><!-- svelte-ignore a11y_no_noninteractive_tabindex -- Fokussierbar mit Absicht: Tastaturnutzer müssen scrollbare Bereiche erreichen -->
<div class="hscroll" tabindex="0" role="region" aria-label="Stepper, seitlich scrollbar"><Stepper steps={setupSteps} /></div></div>
    </div>
    <div class="grid2">
      <div>
        <div class="cap">Compact</div>
        <div class="frame pad"><Stepper steps={setupSteps} variant="compact" /></div>
      </div>
      <div>
        <div class="cap">Vertikal</div>
        <div class="frame pad"><Stepper steps={setupSteps} variant="vertical" /></div>
      </div>
    </div>
  </div>
{:else if example === 'stepper-klickbar'}
  <div class="frame pad wide">
    <div class="hscroll"><Stepper steps={clickable} onstep={goTo} /></div>
    <p class="note">Aktuell: {setupSteps[current].label}. Erledigte und der aktuelle Schritt sind Schaltflächen, der ausstehende nicht.</p>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface">
      <div class="states">
        <div class="head"></div>
        {#each cols as c}<div class="head">{c}</div>{/each}

        <div class="rowlabel">{rows[0]}</div>
        {#each cols as c}
          <div class="cell">
            {#if c === 'Gesperrt'}<span class="none">nicht vorgesehen</span>{:else}
              <nav class="hoops-bnav" aria-label="Beispiel {c}">
                <button type="button" class="hoops-bnav-item {c === 'Aktuell' ? 'is-active' : ''} {stateClass[c]}" aria-current={c === 'Aktuell' ? 'page' : undefined}>
                  <span class="hoops-bnav-lbl">Roster</span>
                </button>
              </nav>
            {/if}
          </div>
        {/each}

        <div class="rowlabel">{rows[1]}</div>
        {#each cols as c}
          <div class="cell fabcell">
            {#if c === 'Aktuell' || c === 'Gesperrt'}<span class="none">nicht vorgesehen</span>{:else}
              <button type="button" class="hoops-bnav-fab {stateClass[c]}" aria-label="Erfassen"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
            {/if}
          </div>
        {/each}

        <div class="rowlabel">{rows[2]}</div>
        {#each cols as c}
          <div class="cell">
            {#if c === 'Gesperrt'}<span class="none">nicht vorgesehen</span>
            {:else if c === 'Aktuell'}<span class="hoops-crumbs-item is-current" aria-current="page">Roster</span>
            {:else}<a href="#zustaende" class="hoops-crumbs-item {stateClass[c]}">Bayernliga</a>{/if}
          </div>
        {/each}

        <div class="rowlabel">{rows[3]}</div>
        {#each cols as c}
          <div class="cell">
            {#if c === 'Gesperrt'}<span class="none">nicht vorgesehen</span>
            {:else if c === 'Aktuell'}<span class="hoops-crumbs-chip is-current" aria-current="page">Roster</span>
            {:else}<a href="#zustaende" class="hoops-crumbs-chip {stateClass[c]}">Bayernliga</a>{/if}
          </div>
        {/each}

        <div class="rowlabel">{rows[4]}</div>
        {#each cols as c}
          <div class="cell">
            <div class="hoops-step-item {c === 'Aktuell' ? 'is-current' : c === 'Gesperrt' ? 'is-pending' : 'is-done'}">
              {#if c === 'Gesperrt'}
                <span class="hoops-step-dot" style="width: 30px; height: 30px" aria-hidden="true"><span>4</span></span>
              {:else}
                <button type="button" class="hoops-step-dot {stateClass[c]}" style="width: 30px; height: 30px" aria-label="Schritt {c === 'Aktuell' ? 3 : 1}">
                  {#if c === 'Aktuell'}<span aria-hidden="true">3</span>{:else}<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>{/if}
                </button>
              {/if}
            </div>
          </div>
        {/each}

        <div class="rowlabel">{rows[5]}</div>
        {#each cols as c}
          <div class="cell dark">
            <div class="hoops-topbar hoops-topbar--dark tb">
              {#if c === 'Aktuell'}<span class="none-dark">nicht vorgesehen</span>
              {:else}<button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--sm {stateClass[c]}" disabled={c === 'Gesperrt'}>Hilfe</button>{/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-bottomnav'}
  <div class="narrow">{@render phone(schiriNav, 'Hauptnavigation, fünf Ziele')}</div>
{:else if example === 'dont-bottomnav'}
  <div class="narrow">{@render phone(zuViele, 'Hauptnavigation, sieben Ziele')}</div>
{:else if example === 'do-pfad'}
  <Breadcrumbs ariaLabel="Pfad, richtig" items={[{ label: 'Verband', href: '#' }, { label: 'Bayernliga', href: '#' }, { label: 'TSV Nordhain', href: '#' }, { label: 'Roster' }]} />
{:else if example === 'dont-pfad'}
  <Breadcrumbs ariaLabel="Pfad, falsch" items={[{ label: 'Startseite', href: '#' }, { label: 'Boxscore', href: '#' }, { label: 'Roster', href: '#' }, { label: 'Boxscore' }]} />
{:else if example === 'do-stepper'}
  <div class="narrow"><Stepper steps={setupSteps} variant="vertical" /></div>
{:else if example === 'dont-stepper'}
  <div class="narrow"><Stepper steps={[
    { id: 'a', label: 'Profil', state: 'done' },
    { id: 'b', label: 'Benachrichtigungen', state: 'current' },
    { id: 'c', label: 'Lizenz', state: 'pending' },
    { id: 'd', label: 'Druck & Export', state: 'pending' },
  ]} variant="vertical" /></div>
{:else if example === 'do-live'}
  <div class="frame wide100"><TopBar brand="HoopsFoundry UI" mark="D" context="live" matchLabel="BBL · 17. Spieltag" score="87 : 64" clock="Q4 · 02:14" /></div>
{:else if example === 'dont-live'}
  <div class="frame wide100"><TopBar brand="HoopsFoundry UI" mark="D" context="live" /></div>
{/if}

<style>
  .stack { display: flex; flex-direction: column; gap: 24px; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 24px; }
  .phones { display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start; }
  .cap, .head, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 8px; }
  .frame { border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); overflow: hidden; background: var(--hoops-page-bg); max-width: 100%; }
  .frame.pad { padding: 22px; }
  .frame.wide { padding: 32px 28px; }
  @media (max-width: 640px) { .frame.wide { padding: 24px 16px; } }
  .wide100 { width: 100%; }
  .phone { width: 380px; max-width: 100%; border: 1px solid var(--hoops-page-line); border-radius: 24px; overflow: hidden; background: var(--hoops-page-bg); }
  .phone-top { height: 160px; background: linear-gradient(0deg, var(--hoops-page-surface-2), var(--hoops-page-bg)); border-bottom: 1px solid var(--hoops-page-line); }
  /* Horizontal braucht etwa 480 px, sonst überlappen die Beschriftungen: in schmalen Rahmen scrollt der Stepper seitlich */
  .hscroll { overflow-x: auto; padding: 6px; margin: -6px; }
  .hscroll > :global(.hoops-step--h) { min-width: 480px; }
  .narrow { width: 100%; max-width: 380px; }
  .mid { font-family: var(--hoops-font-display); font-weight: 600; color: var(--hoops-n-100); }
  .note { margin: 18px 0 0; font-size: var(--hoops-fs-body-sm); color: var(--hoops-page-fg); }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 130px repeat(6, minmax(130px, 1fr)); gap: 10px 12px; align-items: center; }
  .cell { display: flex; align-items: center; justify-content: center; min-height: 72px; padding: 8px; border-radius: var(--hoops-radius-md); min-width: 0; }
  .cell.fabcell { min-height: 96px; padding-top: 24px; }
  .cell :global(.hoops-bnav) { width: 100%; }
  .cell.dark { padding: 0; }
  .tb { height: auto; width: 100%; box-sizing: border-box; justify-content: center; padding: 14px 10px; border-radius: var(--hoops-radius-md); }
  .none { font-size: var(--hoops-fs-caption); color: var(--hoops-page-mute); }
  .none-dark { font-size: var(--hoops-fs-caption); color: var(--hoops-n-300); }
</style>
