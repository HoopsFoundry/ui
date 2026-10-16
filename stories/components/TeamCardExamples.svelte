<script lang="ts">
  import TeamCard from '../../svelte/TeamCard.svelte';

  // Erfundene Vereinslogos (nur Storybook); SV Kiefernau hat kein Logo und zeigt die Initialen
  import nordhainLogo from '../assets/logos/nordhain.svg';
  import hawksLogo from '../assets/logos/hawks.svg';
  import seebergLogo from '../assets/logos/seeberg.svg';
  import elbachLogo from '../assets/logos/elbach.svg';

  let { example }: { example: string } = $props();

  // Teamkarten: erfundene Daten, Logos wie oben
  const TEAM = {
    name: 'TSV Nordhain 1920', short: 'Nordhain', logo: nordhainLogo, league: 'Bayernliga Süd', season: '2026/27',
    record: { w: 12, l: 3 }, rank: 3, rankOf: 12, points: 24,
    next: { date: 'Sa, 25.05.', time: '19:30', opponent: { name: 'Lindenberg Hawks', short: 'Hawks', logo: hawksLogo }, at: 'heim' as const, venue: 'Nordhain-Halle' },
    last: { date: 'Sa, 18.05.', opponent: { name: 'BG Seeberg', short: 'Seeberg', logo: seebergLogo }, ownScore: 92, opponentScore: 79, at: 'gast' as const },
    squad: { players: 14, staff: 3 },
  };
  const STATS = { twoPtPct: 48.2, threePtPct: 36.5, trb: 41.3, to: 12.1 };
  const LISTE = [
    { name: 'TSV Nordhain 1920', short: 'Nordhain', logo: nordhainLogo, league: 'Bayernliga Süd', record: { w: 12, l: 3 }, rank: 3 },
    { name: 'Lindenberg Hawks', short: 'Hawks', logo: hawksLogo, league: 'Bayernliga Süd', record: { w: 14, l: 1 }, rank: 1 },
    { name: 'BG Seeberg', short: 'Seeberg', logo: seebergLogo, league: 'Bayernliga Süd', record: { w: 9, l: 6 }, rank: 5 },
    { name: 'SV Kiefernau', short: 'Kiefernau', league: 'Bayernliga Süd', record: { w: 4, l: 11 }, rank: 11 },
  ];

  const noop = () => {};

  // Erzwingt einen Zustand auf dem Link der Karte (Hover und Fokus wirken über den Link, siehe css/components.css)
  function mark(node: HTMLElement, cls: string) {
    const target = node.querySelector<HTMLElement>('.dss-team-link');
    if (cls && target) target.classList.add(...cls.split(' '));
  }
  const cols = ['Standard', 'Hover', 'Fokus', 'Aktiv'] as const;
  const stateClass: Record<(typeof cols)[number], string> = {
    Standard: '',
    Hover: 'pseudo-hover',
    Fokus: 'pseudo-focus-visible',
    Aktiv: 'pseudo-hover pseudo-active',
  };
</script>

{#if example === 'standard'}
  <div class="grid2">
    <div>
      <div class="cap">Vollständig</div>
      <TeamCard {...TEAM} stats={STATS} />
    </div>
    <div>
      <div class="cap">Ohne Saison-Statistik</div>
      <TeamCard {...TEAM} />
    </div>
  </div>
{:else if example === 'forfait'}
  <div class="grid2">
    <div>
      <div class="cap">Ohne outcome: Sieg aus den Punkten</div>
      <TeamCard name="BG Seeberg" short="Seeberg" logo={seebergLogo} league="Bayernliga Süd" last={{ date: 'Sa, 18.05.', opponent: { name: 'TSV Elbach', logo: elbachLogo }, ownScore: 20, opponentScore: 0, at: 'heim' }} />
    </div>
    <div>
      <div class="cap">outcome="N": Forfait, Wertung gegen die Zahlen</div>
      <TeamCard name="BG Seeberg" short="Seeberg" logo={seebergLogo} league="Bayernliga Süd" last={{ date: 'Sa, 18.05.', opponent: { name: 'TSV Elbach', logo: elbachLogo }, ownScore: 20, opponentScore: 0, at: 'heim', outcome: 'N' }} />
    </div>
  </div>
{:else if example === 'minimal'}
  <div class="grid2">
    <div>
      <div class="cap">Nur der Name</div>
      <TeamCard name="SV Kiefernau" />
    </div>
    <div>
      <div class="cap">Name, Liga, Bilanz, Kader</div>
      <TeamCard name="SV Kiefernau" league="Bezirksliga" season="2026/27" record={{ w: 4, l: 11 }} squad={{ players: 11 }} />
    </div>
  </div>
{:else if example === 'logos'}
  <div class="grid2">
    <div>
      <div class="cap">logos · names="short" (Gegner mit Logo und Kurzname)</div>
      <TeamCard {...TEAM} logos names="short" />
    </div>
    <div>
      <div class="cap">Ohne Logo: Initialen im Kreis</div>
      <TeamCard name="SV Kiefernau" short="Kiefernau" league="Bezirksliga" record={{ w: 4, l: 11 }} rank={11} rankOf={12} last={{ opponent: { name: 'TSV Elbach', logo: elbachLogo }, ownScore: 60, opponentScore: 64 }} logos />
    </div>
  </div>
{:else if example === 'compact'}
  <div class="narrow wide-list">
    <div class="cap">Kurzname und Logo in der Liste (compact)</div>
    <div class="list">
      {#each LISTE as t (t.name)}<TeamCard size="compact" {...t} />{/each}
    </div>
  </div>
{:else if example === 'klickbar'}
  <div class="grid2">
    <div>
      <div class="cap">href · die ganze Karte ist der Link</div>
      <TeamCard {...TEAM} href="#nordhain" />
    </div>
    <div class="col">
      <div>
        <div class="cap">onclick · Button</div>
        <TeamCard {...TEAM} next={undefined} last={undefined} squad={undefined} onclick={noop} />
      </div>
      <div>
        <div class="cap">compact · href</div>
        <div class="list">
          <TeamCard size="compact" {...LISTE[0]} href="#nordhain" />
          <TeamCard size="compact" {...LISTE[1]} href="#hawks" />
        </div>
      </div>
    </div>
  </div>
{:else if example === 'handy'}
  <div class="narrow">
    <TeamCard {...TEAM} stats={STATS} href="#nordhain" />
    <div class="gap"></div>
    <div class="list">
      <TeamCard size="compact" {...LISTE[0]} href="#nordhain" />
      <TeamCard size="compact" {...LISTE[3]} href="#kiefernau" />
    </div>
  </div>
{:else if example === 'do-stats'}
  <div class="narrow">
    <TeamCard name="BG Seeberg" short="Seeberg" logo={seebergLogo} league="Bayernliga Süd" season="2026/27" record={{ w: 9, l: 6 }} rank={5} rankOf={12} squad={{ players: 12, staff: 2 }} />
  </div>
{:else if example === 'dont-stats'}
  <!-- Falsch: Der Block erscheint hier mit Strichen als Platzhalter; die Komponente tut das nie, die Doku stellt es mit eigenem Markup nach. -->
  <div class="narrow">
    <TeamCard name="BG Seeberg" short="Seeberg" logo={seebergLogo} league="Bayernliga Süd" season="2026/27" record={{ w: 9, l: 6 }} rank={5} rankOf={12} squad={{ players: 12, staff: 2 }} />
    <div class="fake-stats" aria-hidden="true">
      <div class="cap">Saison-Statistik</div>
      <div class="fake-grid"><div><b>–</b><span>2PP %</span></div><div><b>–</b><span>3PP %</span></div><div><b>–</b><span>TRB</span></div><div><b>–</b><span>TO</span></div></div>
    </div>
  </div>
{:else if example === 'do-liste'}
  <div class="narrow list">
    {#each LISTE.slice(0, 3) as t (t.name)}<TeamCard size="compact" {...t} />{/each}
  </div>
{:else if example === 'dont-liste'}
  <div class="narrow list">
    {#each LISTE.slice(0, 2) as t (t.name)}<TeamCard {...t} next={TEAM.next} last={TEAM.last} squad={TEAM.squad} />{/each}
  </div>
{:else if example === 'do-aktion'}
  <div class="narrow">
    <TeamCard {...TEAM} next={undefined} last={undefined} href="#nordhain" />
  </div>
{:else if example === 'dont-aktion'}
  <!-- Falsch: ganze Karte klickbar und zusätzlich ein zweiter Link (Liga) in der Karte; die Komponente verhindert das (leagueHref zählt nur ohne href), die Doku stellt es mit eigenem Markup nach. -->
  <div class="narrow fake-nested">
    <TeamCard {...TEAM} next={undefined} last={undefined} league="" href="#nordhain" />
    <a class="dss-link fake-league" href="#liga">Bayernliga Süd</a>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface" tabindex="0" role="region" aria-label="Zustände der Teamkarte, seitlich scrollbar">
      <div class="states">
        <div class="colhead"></div>
        {#each cols as c}<div class="colhead">{c}</div>{/each}
        <div class="rowlabel">Zeile</div>
        {#each cols as c}
          <div class="cell" use:mark={stateClass[c]}>
            <TeamCard size="compact" name="TSV Nordhain" short="Nordhain" logo={nordhainLogo} record={{ w: 12, l: 3 }} rank={3} onclick={noop} />
          </div>
        {/each}
      </div>
      <div class="states3">
        <div class="colhead">Standard</div><div class="colhead">Hover</div><div class="colhead">Fokus</div>
        {#each cols.slice(0, 3) as c}
          <div class="cell" use:mark={stateClass[c]}>
            <TeamCard {...TEAM} next={undefined} last={undefined} squad={undefined} onclick={noop} />
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 18px; }
  .col { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .narrow { width: 100%; max-width: 380px; }
  .gap { height: 10px; }
  .cap, .colhead, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 10px; }
  .wide-list { max-width: 560px; }
  .fake-stats { margin-top: 10px; padding: 12px 20px; border: 1px solid var(--hoops-page-line); border-radius: 14px; }
  .fake-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 8px; }
  .fake-grid div { display: flex; flex-direction: column; font-family: var(--hoops-font-mono); }
  .fake-grid b { font-size: var(--hoops-fs-stat); color: var(--hoops-page-mute); }
  .fake-grid span { font-size: var(--hoops-fs-caption); color: var(--hoops-page-mute); }
  .fake-nested { position: relative; }
  .fake-league { position: absolute; top: 22px; right: 20px; z-index: 2; font-size: var(--hoops-fs-body-sm); }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 64px repeat(4, minmax(210px, 1fr)); gap: 16px 14px; align-items: center; }
  .states3 { display: grid; grid-template-columns: repeat(3, minmax(300px, 1fr)); gap: 16px 14px; margin-top: 22px; }
  .cell { padding: 6px; }
</style>
