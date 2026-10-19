<script>
  // als `tr` importiert: die Matrix unten nutzt `t` als Schleifenvariable ({#each tones as t}), die den Import sonst verdeckt
  import { t as tr } from '../../js/i18n/index.js';
  import { onMount } from 'svelte';
  import AppNav from '../../svelte/AppNav.svelte';
  import TopBar from '../../svelte/TopBar.svelte';
  import AppNavDemo from './AppNavDemo.svelte';
  import { ensureSprite } from '../../svelte/Icon.svelte';

  /** @type {{ example: string }} */
  let { example } = $props();

  let wrap = $state();
  onMount(() => {
    ensureSprite();
    // Mobil-Vorschau: Menü und erste Gruppe öffnen, damit der Zustand ohne Klick zu sehen ist
    if (example === 'mobil-offen' && wrap) {
      wrap.querySelector('.hoops-appnav-toggle')?.click();
      // Zeitgeber beim Abbau löschen: sonst greift er nach dem Aushängen auf ein leeres `wrap` zu
      const timer = setTimeout(() => wrap?.querySelector('.hoops-appnav-group-btn')?.click(), 0);
      return () => clearTimeout(timer);
    }
  });

  const cols = ['Standard', 'Hover', 'Fokus', 'Gedrückt', 'Aktuell', 'Gesperrt'];
  const stateClass = { Standard: '', Hover: 'pseudo-hover', Fokus: 'pseudo-focus-visible', Gedrückt: 'pseudo-hover pseudo-active', Aktuell: '', Gesperrt: '' };
  const tones = [{ id: 'light', name: 'Hell' }, { id: 'dark', name: 'Dunkel' }];
  const kinds = [
    { id: 'link', name: 'Eintrag' },
    { id: 'group', name: 'Gruppe' },
    { id: 'child', name: 'Eintrag im Menü' },
    { id: 'toggle', name: 'Menü-Umschalter' },
  ];

  const flat = [
    { id: 'teams', label: 'Teams', href: '/teams' },
    { id: 'config', label: 'Konfiguration', href: '/konfiguration' },
    { id: 'export', label: 'Export', href: '/export' },
  ];
  const withLocked = [
    { id: 'teams', label: 'Teams', href: '/teams' },
    { id: 'schedule', label: 'Zeitplan', href: '/zeitplan', disabled: true, hint: 'Erst nach dem Zeitplan verfügbar' },
    { id: 'overview', label: 'Turnierübersicht', href: '/uebersicht' },
  ];
  const withoutLocked = withLocked.filter((i) => !i.disabled);
  const many = ['Teams', 'Konfiguration', 'Zeitplan', 'Ergebnisse', 'Turnierübersicht', 'Auswertung', 'Export', 'Anleitung', 'Demo-Turniere'].map((label, i) => ({ id: `m${i}`, label, href: `/m${i}` }));
</script>

{#if example === 'mobil-offen' || example === 'mobil-geschlossen'}
  <div bind:this={wrap}><AppNavDemo tone="light" currentHref="/ergebnisse" ariaLabel={example === 'mobil-offen' ? 'Hauptnavigation, mobil offen' : 'Hauptnavigation, mobil'} /></div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe.
       Die Navigationen tragen is-open, damit die Liste auch unter 720 px sichtbar bleibt. -->
  <div class="matrix" data-fixed-states>
    <div class="surface">
      <div class="states">
        <div class="head"></div>
        {#each cols as c}<div class="head">{c}</div>{/each}
        {#each tones as t}
          {#each kinds as k}
            <div class="rowlabel">{t.name}<br />{k.name}</div>
            {#each cols as c}
              <div class="cell">
                {#if k.id === 'toggle'}
                  {#if c === 'Aktuell' || c === 'Gesperrt'}<span class="none">nicht vorgesehen</span>{:else}
                    <nav class="hoops-appnav hoops-appnav--{t.id}" aria-label="Beispiel {t.name} {k.name} {c}">
                      <div class="hoops-appnav-bar">
                        <button type="button" class="hoops-appnav-toggle {stateClass[c]}" style="display: inline-flex" aria-expanded="false">
                          <svg class="hoops-icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-menu"></use></svg>
                          <span>{tr('appnav.menu')}</span>
                        </button>
                      </div>
                    </nav>
                  {/if}
                {:else}
                  <nav class="hoops-appnav hoops-appnav--{t.id} is-open" aria-label="Beispiel {t.name} {k.name} {c}">
                    <div class="hoops-appnav-bar">
                      <ul class="hoops-appnav-list">
                        <li class="hoops-appnav-item">
                          {#if k.id === 'link'}
                            {#if c === 'Gesperrt'}
                              <span role="link" aria-disabled="true" class="hoops-appnav-link is-disabled">Zeitplan</span>
                            {:else}
                              <a href="#zustaende" class="hoops-appnav-link {c === 'Aktuell' ? 'is-active' : ''} {stateClass[c]}" aria-current={c === 'Aktuell' ? 'page' : undefined}>Teams</a>
                            {/if}
                          {:else if k.id === 'group'}
                            <button type="button" class="hoops-appnav-group-btn {c === 'Aktuell' ? 'is-active' : ''} {c === 'Gesperrt' ? 'is-disabled' : ''} {stateClass[c]}" aria-expanded="false" disabled={c === 'Gesperrt'}>
                              Ansehen
                              {#if c !== 'Gesperrt'}<svg class="hoops-icon hoops-appnav-chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-chevron-d"></use></svg>{/if}
                            </button>
                          {:else}
                            <ul class="hoops-appnav-panel static">
                              <li>
                                {#if c === 'Gesperrt'}
                                  <span role="link" aria-disabled="true" class="hoops-appnav-link is-disabled">Zeitplan</span>
                                {:else}
                                  <a href="#zustaende" class="hoops-appnav-link {c === 'Aktuell' ? 'is-active' : ''} {stateClass[c]}" aria-current={c === 'Aktuell' ? 'page' : undefined}>Teams</a>
                                {/if}
                              </li>
                            </ul>
                          {/if}
                        </li>
                      </ul>
                    </div>
                  </nav>
                {/if}
              </div>
            {/each}
          {/each}
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-gruppe'}
  <div class="nav"><AppNav ariaLabel="Hauptnavigation, Ein Ziel richtig" items={flat} currentHref="/export" /></div>
{:else if example === 'dont-gruppe'}
  <!-- Gruppe mit nur einem Ziel, geöffnet dargestellt: der Eintrag steckt hinter einem zusätzlichen Klick -->
  <div class="nav open-demo">
    <nav class="hoops-appnav hoops-appnav--light is-open" aria-label="Hauptnavigation, Ein Ziel falsch">
      <div class="hoops-appnav-bar">
        <ul class="hoops-appnav-list">
          <li class="hoops-appnav-item"><a href="#x" class="hoops-appnav-link">Teams</a></li>
          <li class="hoops-appnav-item"><a href="#x" class="hoops-appnav-link">Konfiguration</a></li>
          <li class="hoops-appnav-item">
            <button type="button" class="hoops-appnav-group-btn is-open" aria-expanded="true">
              Export
              <svg class="hoops-icon hoops-appnav-chev" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-chevron-d"></use></svg>
            </button>
            <ul class="hoops-appnav-panel"><li><a href="#x" class="hoops-appnav-link">Export starten</a></li></ul>
          </li>
        </ul>
      </div>
    </nav>
  </div>
{:else if example === 'do-aktuell'}
  <div class="nav"><AppNav ariaLabel="Hauptnavigation, aktuelle Seite richtig" items={flat} currentHref="/konfiguration" /></div>
{:else if example === 'dont-aktuell'}
  <div class="nav"><AppNav ariaLabel="Hauptnavigation, aktuelle Seite falsch" items={flat} /></div>
{:else if example === 'do-gesperrt'}
  <div class="nav"><AppNav ariaLabel="Hauptnavigation, gesperrt richtig" items={withLocked} currentHref="/teams" /></div>
{:else if example === 'dont-gesperrt'}
  <div class="nav"><AppNav ariaLabel="Hauptnavigation, gesperrt falsch" items={withoutLocked} currentHref="/teams" /></div>
{:else if example === 'do-wenige'}
  <div class="nav"><AppNav ariaLabel="Hauptnavigation, wenige Einträge" items={flat} currentHref="/teams" /></div>
{:else if example === 'dont-wenige'}
  <!-- Die Liste bricht nicht um: Einträge, die nicht passen, ragen aus der Leiste. Der Rahmen schneidet sie hier ab. -->
  <div class="nav clip"><AppNav ariaLabel="Hauptnavigation, viele Einträge" items={many} currentHref="/m0" /></div>
{/if}

<style>
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 110px repeat(6, minmax(150px, 1fr)); gap: 10px 12px; align-items: center; }
  .head, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cell { display: flex; align-items: center; min-width: 0; }
  .cell > :global(.hoops-appnav) { width: 100%; border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-md); }
  .cell :global(.hoops-appnav-bar) { padding: 4px 6px; }
  .cell :global(.hoops-appnav-panel.static) { position: static; margin: 0; box-shadow: none; min-width: 0; width: 100%; box-sizing: border-box; }
  .none { font-size: var(--hoops-fs-caption); color: var(--hoops-page-mute); }
  .nav { width: 100%; max-width: 100%; }
  .nav.clip { overflow: hidden; }
  .open-demo { min-height: 130px; }
</style>
