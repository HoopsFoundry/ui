<script lang="ts">
  import StatGrid from '../../svelte/StatGrid.svelte';
  import FormChips from '../../svelte/FormChips.svelte';
  import LeagueCard from '../../svelte/LeagueCard.svelte';
  import { LIGEN, demoTable } from './leagueData';
  import { formLettersMarkup, formMarkup, statsCompactMarkup, statsMarkup } from '../Stats.code';

  // Alle Beispiele stehen auf einer Seite. Die Tabellen der LeagueCard sind benannte Regionen und brauchen verschiedene Titel (axe landmark-unique).
  let { example }: { example: string } = $props();

  const STATS = [
    { label: 'Siege', value: 12 },
    { label: 'Niederlagen', value: 3 },
    { label: 'Punkte pro Spiel', value: 82.4 },
    { label: 'Rebounds', value: 41.3 },
    { label: 'Assists', value: 18.7 },
    { label: 'Ballgewinne', value: 9.2 },
  ];
  const WITH_EMPTY = [...STATS.slice(0, 3), { label: 'Ballverluste', value: null }];
  const MANY = [
    ...STATS,
    { label: 'Blocks', value: 3.1 }, { label: 'Fouls', value: 14.8 }, { label: 'Freiwürfe', value: '71 %' }, { label: 'Dreier', value: '34 %' }, { label: 'Feldwürfe', value: '47 %' }, { label: 'Turnovers', value: 12.6 },
  ];

  // Vanilla-Beispiele: dasselbe Markup wie im Code-Beispiel
  function fragment(node: HTMLElement, html: string) {
    node.replaceChildren(document.createRange().createContextualFragment(html));
  }
</script>

{#if example === 'aufbau'}
  <div class="medium"><StatGrid items={WITH_EMPTY} /></div>
{:else if example === 'kompakt'}
  <div class="stack">
    <div class="surface">
      <div class="cap">Kopf einer Karte · compact</div>
      <StatGrid items={STATS.slice(0, 4)} compact />
    </div>
    <div>
      <div class="cap">Zum Vergleich · Kacheln</div>
      <StatGrid items={STATS.slice(0, 4)} />
    </div>
  </div>
{:else if example === 'form'}
  <div class="stack">
    <div class="row"><span class="who">TSV Nordhain 1920</span><FormChips form={['S', 'S', 'N', 'S', 'U']} /></div>
    <div class="row"><span class="who">Lindenberg Hawks · letters</span><FormChips form={['N', 'S', 'S', 'U', 'N']} variant="letters" /></div>
    <div class="row"><span class="who">Nur zwei Spiele bisher</span><FormChips form={['S', 'N']} variant="letters" /></div>
  </div>
{:else if example === 'tabelle'}
  <!-- Dieselbe Form in der Spalte „Form“ der LeagueCard -->
  <div class="medium">
    <LeagueCard title={LIGEN[40]} teams={demoTable(3)} columns={['form']} limit={3} size="compact" />
  </div>
{:else if example === 'vanilla'}
  <div class="stack">
    <div use:fragment={statsMarkup}></div>
    <div use:fragment={statsCompactMarkup}></div>
    <div class="row"><span class="who">Punkte</span><span use:fragment={formMarkup}></span></div>
    <div class="row"><span class="who">Buchstaben</span><span use:fragment={formLettersMarkup}></span></div>
  </div>
{:else if example === 'handy'}
  <div class="narrow">
    <StatGrid items={STATS} />
    <div class="gap"></div>
    <div class="row"><span class="who">TSV Nordhain 1920</span><FormChips form={['S', 'S', 'N', 'S', 'U']} /></div>
    <div class="gap"></div>
    <LeagueCard title={LIGEN[41]} teams={demoTable(2)} columns={['form']} limit={3} size="compact" />
  </div>
{:else if example === 'handy-dunkel'}
  <div class="narrow">
    <StatGrid items={WITH_EMPTY} />
    <div class="gap"></div>
    <StatGrid items={STATS.slice(0, 3)} compact />
    <div class="gap"></div>
    <div class="row"><span class="who">Lindenberg Hawks</span><FormChips form={['N', 'S', 'S', 'U', 'N']} variant="letters" /></div>
    <div class="gap"></div>
    <LeagueCard title={LIGEN[42]} teams={demoTable(5)} columns={['form']} limit={3} size="compact" />
  </div>
{:else if example === 'do-farbe'}
  <div class="row"><span class="who">TSV Nordhain 1920</span><FormChips form={['S', 'N', 'S', 'U', 'S']} /></div>
{:else if example === 'dont-farbe'}
  <!-- Falsch: nur Farbe, gleiche Form, kein Text für Screenreader -->
  <div class="row">
    <span class="who">TSV Nordhain 1920</span>
    <span class="dont-dots"><i class="g"></i><i class="r"></i><i class="g"></i><i class="y"></i><i class="g"></i></span>
  </div>
{:else if example === 'do-wenige'}
  <div class="narrow"><StatGrid items={STATS.slice(0, 4)} /></div>
{:else if example === 'dont-wenige'}
  <!-- Falsch: ein Dutzend Kacheln machen aus der Kennzahl eine Tabelle -->
  <div class="narrow"><StatGrid items={MANY} /></div>
{:else if example === 'do-kurz'}
  <div class="narrow"><StatGrid items={[{ label: 'Punkte pro Spiel', value: 82.4 }, { label: 'Rebounds', value: 41.3 }]} /></div>
{:else if example === 'dont-kurz'}
  <!-- Falsch: Satz im Wert, die Beschriftung wiederholt ihn -->
  <div class="narrow"><StatGrid items={[{ label: 'Spiele', value: '82,4 Punkte im Schnitt pro Spiel' }, { label: 'Rebounds', value: '41,3 pro Begegnung' }]} /></div>
{/if}

<style>
  .stack { display: grid; gap: 20px; max-width: 760px; }
  .narrow { width: 100%; max-width: 380px; }
  .medium { width: 100%; max-width: 640px; }
  .gap { height: 14px; }
  .surface { background: var(--dss-surface); border: 1px solid var(--dss-line); border-radius: var(--radius-lg); padding: 14px 18px; }
  .cap { margin-bottom: 10px; font-family: var(--font-mono); font-size: var(--fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--page-mute); }
  .row { display: flex; align-items: center; gap: 14px; font-size: var(--fs-body-md); color: var(--page-fg); }
  .who { min-width: 12rem; }
  /* Don't: gleiche Form, nur Farbe */
  .dont-dots { display: inline-flex; gap: 5px; }
  .dont-dots i { display: block; width: 10px; height: 10px; border-radius: 50%; }
  .dont-dots .g { background: #3a9d5d; }
  .dont-dots .r { background: #cf3b3b; }
  .dont-dots .y { background: #c9a227; }
</style>
