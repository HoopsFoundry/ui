<script lang="ts">
  import LeagueCard from '../../svelte/LeagueCard.svelte';
  import Accordion from '../../svelte/Accordion.svelte';
  import { LIGEN, demoTable } from './leagueData';

  let { example }: { example: string } = $props();

  const COMMON = { teamCount: 12, played: 66, total: 132, href: '#tabelle' };
  // Jede Karte hat einen eigenen Titel (LIGEN): die Tabelle ist eine benannte Region, gleiche Namen verletzen axe landmark-unique
  const mid = demoTable(7);

  // Erzwingt einen Zustand auf dem Link (Hover und Fokus wirken über die Pseudo-Klassen des Storybook-Addons)
  function mark(node: HTMLElement, cls: string) {
    const targets = node.querySelectorAll<HTMLElement>('.dss-league-link, .dss-league-more');
    if (cls) for (const target of targets) target.classList.add(...cls.split(' '));
  }
  const cols = ['Standard', 'Hover', 'Fokus'] as const;
  const stateClass: Record<(typeof cols)[number], string> = { Standard: '', Hover: 'pseudo-hover', Fokus: 'pseudo-focus-visible' };

  // Nachgestellte Fehler (Don'ts): entfernt den versteckten Text der Form-Zellen, so wie ein reines Punkte-Markup ihn nicht hätte
  function stripFormText(node: HTMLElement) {
    for (const cell of node.querySelectorAll('td .dss-form-list')) {
      for (const hidden of cell.closest('td')?.querySelectorAll('.dss-sr-only') ?? []) hidden.remove();
    }
  }
</script>

{#if example === 'standard'}
  <div class="grid2">
    <div>
      <div class="cap">Eigene Mannschaft auf Platz 7</div>
      <LeagueCard {...COMMON} title={LIGEN[0]} teams={mid} />
    </div>
    <div>
      <div class="cap">Ohne eigene Mannschaft: die ersten drei</div>
      <LeagueCard {...COMMON} title={LIGEN[1]} teams={demoTable()} />
    </div>
  </div>
{:else if example === 'minimal'}
  <div class="grid2">
    <div>
      <div class="cap">Nur title und teams</div>
      <LeagueCard title={LIGEN[2]} teams={demoTable()} />
    </div>
    <div>
      <div class="cap">Ein Team, ohne Zahlen</div>
      <LeagueCard title={LIGEN[3]} teams={[{ rank: 1, name: 'SV Kiefernau', played: 0, points: 0 }]} />
    </div>
  </div>
{:else if example === 'spalten'}
  <div class="grid2">
    <div>
      <div class="cap">Standard: #, Mannschaft, SP, PKT</div>
      <LeagueCard {...COMMON} title={LIGEN[4]} teams={mid} />
    </div>
    <div>
      <div class="cap">columns · S, N, Diff, Form</div>
      <LeagueCard {...COMMON} title={LIGEN[5]} teams={mid} columns={['won', 'lost', 'diff', 'form']} />
    </div>
  </div>
{:else if example === 'ausschnitt'}
  <div class="grid3">
    <div>
      <div class="cap">Platz 1: Plätze 1 bis 4</div>
      <LeagueCard {...COMMON} title={LIGEN[6]} teams={demoTable(1)} size="compact" />
    </div>
    <div>
      <div class="cap">Platz 7: Plätze 5 bis 8</div>
      <LeagueCard {...COMMON} title={LIGEN[7]} teams={demoTable(7)} size="compact" />
    </div>
    <div>
      <div class="cap">Platz 12: Plätze 9 bis 12</div>
      <LeagueCard {...COMMON} title={LIGEN[8]} teams={demoTable(12)} size="compact" />
    </div>
    <div>
      <div class="cap">Ohne eigene Mannschaft: die ersten drei</div>
      <LeagueCard {...COMMON} title={LIGEN[9]} teams={demoTable()} size="compact" />
    </div>
    <div>
      <div class="cap">Weniger Teams als Zeilen: alle drei</div>
      <LeagueCard title={LIGEN[10]} teams={demoTable(2).slice(0, 3)} teamCount={3} size="compact" />
    </div>
  </div>
{:else if example === 'logos'}
  <div class="grid2">
    <div>
      <div class="cap">logos · names="short"</div>
      <LeagueCard {...COMMON} title={LIGEN[11]} teams={demoTable(3)} logos names="short" />
    </div>
    <div>
      <div class="cap">Ohne Logo: Initialen im Kreis</div>
      <LeagueCard {...COMMON} title={LIGEN[12]} teams={demoTable(5, { logos: false })} logos />
    </div>
  </div>
{:else if example === 'zonen'}
  <div class="grid2">
    <div>
      <div class="cap">Abstieg im Ausschnitt: Legende erscheint</div>
      <LeagueCard {...COMMON} title={LIGEN[13]} teams={demoTable(11, { zones: true })} />
    </div>
    <div>
      <div class="cap">Aufstieg, Relegation und Abstieg zusammen</div>
      <LeagueCard {...COMMON} title={LIGEN[14]} teams={demoTable(0, { zones: true })} limit={12} size="compact" />
    </div>
  </div>
{:else if example === 'live'}
  <div class="grid2">
    <div>
      <div class="cap">live={'{2}'}</div>
      <LeagueCard {...COMMON} title={LIGEN[15]} teams={mid} live={2} />
    </div>
    <div>
      <div class="cap">live (nur „Live“) · compact</div>
      <LeagueCard {...COMMON} title={LIGEN[16]} teams={mid} live size="compact" />
    </div>
  </div>
{:else if example === 'compact'}
  <div class="narrow">
    <div class="cap">size="compact" · Seitenleiste</div>
    <LeagueCard {...COMMON} title={LIGEN[17]} teams={mid} size="compact" logos names="short" />
  </div>
{:else if example === 'handy'}
  <div class="narrow">
    <LeagueCard {...COMMON} title={LIGEN[18]} teams={mid} columns={['won', 'lost', 'diff', 'form']} logos live={2} />
    <div class="gap"></div>
    <LeagueCard {...COMMON} title={LIGEN[19]} teams={demoTable(11, { zones: true })} size="compact" columns={['diff']} />
  </div>
{:else if example === 'do-ausschnitt'}
  <div class="narrow">
    <LeagueCard {...COMMON} title={LIGEN[20]} titleAs="h4" teams={mid} size="compact" />
  </div>
{:else if example === 'dont-ausschnitt'}
  <!-- Falsch: ohne own zeigt die Karte nur die ersten drei, die eigene Mannschaft (Platz 7) fehlt -->
  <div class="narrow">
    <LeagueCard {...COMMON} title={LIGEN[21]} titleAs="h4" teams={demoTable()} size="compact" />
  </div>
{:else if example === 'do-zonen'}
  <div class="narrow">
    <LeagueCard {...COMMON} title={LIGEN[22]} titleAs="h4" teams={demoTable(11, { zones: true })} size="compact" />
  </div>
{:else if example === 'dont-zonen'}
  <!-- Falsch: Streifen ohne Legende, die Bedeutung steht nur in der Farbe; die Komponente zeigt die Legende immer, die Doku blendet sie hier aus. -->
  <div class="narrow no-legend">
    <LeagueCard {...COMMON} title={LIGEN[23]} titleAs="h4" teams={demoTable(11, { zones: true })} size="compact" />
  </div>
{:else if example === 'do-form'}
  <div class="narrow">
    <LeagueCard {...COMMON} title={LIGEN[24]} titleAs="h4" teams={mid} columns={['form']} size="compact" />
  </div>
{:else if example === 'dont-form'}
  <!-- Falsch: Form nur als Farbpunkte ohne Text; die Komponente hängt den Text immer an, die Doku entfernt ihn hier. -->
  <div class="narrow" use:stripFormText>
    <LeagueCard {...COMMON} title={LIGEN[25]} titleAs="h4" teams={mid} columns={['form']} size="compact" />
  </div>
{:else if example === 'do-zeilen'}
  <div class="narrow">
    <LeagueCard {...COMMON} title={LIGEN[26]} titleAs="h4" teams={mid} size="compact" />
  </div>
{:else if example === 'dont-zeilen'}
  <div class="narrow">
    <LeagueCard {...COMMON} title={LIGEN[27]} titleAs="h4" teams={demoTable()} size="compact" limit={12} />
  </div>
{:else if example === 'einklappbar'}
  <div class="grid2">
    <div>
      <div class="cap">Offen · collapsible open</div>
      <LeagueCard {...COMMON} collapsible open title={LIGEN[32]} teams={mid} live={2} />
    </div>
    <div>
      <div class="cap">Geschlossen · collapsible</div>
      <LeagueCard {...COMMON} collapsible title={LIGEN[33]} teams={mid} />
    </div>
  </div>
{:else if example === 'einklappbar-id'}
  <div class="grid1">
    <p class="links">Direkt springen: <a class="dss-link" href="#lc-west">Liga West (Deep-Link)</a></p>
    <div class="grid2">
      <LeagueCard {...COMMON} collapsible id="lc-ost" title={LIGEN[34]} teams={mid} />
      <LeagueCard {...COMMON} collapsible id="lc-west" title={LIGEN[35]} teams={mid} />
    </div>
  </div>
{:else if example === 'einklappbar-gruppe'}
  <Accordion syncHash={false} nav navLabel="Ligen der Vereinsseite" expandAll>
    <LeagueCard {...COMMON} collapsible id="lg-herren" title={LIGEN[36]} teams={mid} />
    <LeagueCard {...COMMON} collapsible id="lg-damen" title={LIGEN[37]} teams={demoTable()} live={1} />
    <LeagueCard {...COMMON} collapsible id="lg-jugend" title={LIGEN[38]} teams={mid} size="compact" />
  </Accordion>
{:else if example === 'do-offen'}
  <div class="grid1">
    <LeagueCard {...COMMON} collapsible open title={LIGEN[39]} titleAs="h4" teams={mid} />
    <LeagueCard {...COMMON} collapsible title={LIGEN[40]} titleAs="h4" teams={demoTable()} />
  </div>
{:else if example === 'dont-zu'}
  <div class="grid1">
    <LeagueCard {...COMMON} collapsible title={LIGEN[41]} titleAs="h4" teams={mid} />
    <LeagueCard {...COMMON} collapsible title={LIGEN[42]} titleAs="h4" teams={demoTable()} />
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface" tabindex="0" role="region" aria-label="Zustände der Ligencard, seitlich scrollbar">
      <div class="states">
        {#each cols as c (c)}<div class="colhead">{c}</div>{/each}
        {#each cols as c, i (c)}
          <div class="cell" use:mark={stateClass[c]}>
            <LeagueCard {...COMMON} title={LIGEN[28 + i]} teams={demoTable(7, { links: true })} size="compact" />
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); gap: 18px; align-items: start; }
  .grid1 { display: flex; flex-direction: column; gap: 18px; min-width: 0; max-width: 640px; }
  .links { margin: 0; font-size: var(--fs-body-sm); color: var(--page-fg); }
  .grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 18px; align-items: start; }
  .narrow { width: 100%; max-width: 380px; }
  .gap { height: 12px; }
  .cap, .colhead { font-family: var(--font-mono); font-size: var(--fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--page-mute); }
  .cap { margin-bottom: 10px; }
  .no-legend :global(.dss-league-legend) { display: none; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  /* position: relative: die versteckten Texte (position: absolute) liegen sonst außerhalb des Scrollbereichs und weiten die Seite (Standalone-Story bei 420 px) */
  .surface { position: relative; background: var(--page-bg); border: 1px solid var(--page-line); border-radius: var(--radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: repeat(3, minmax(300px, 1fr)); gap: 16px 14px; align-items: start; }
  .cell { padding: 6px; }
</style>
