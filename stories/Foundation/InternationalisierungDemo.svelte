<script lang="ts">
  import LeagueCard from '../../svelte/LeagueCard.svelte';
  import Stepper from '../../svelte/Stepper.svelte';
  import FormChips from '../../svelte/FormChips.svelte';
  import { mountLeagueCard } from '../../js/render/index.js';
  import type { LeagueCardProps } from '../../js/render/league-card.js';

  // Beispiele der Seite „Internationalisierung“. Alle folgen dem Umschalter „Sprache“ der Werkzeugleiste ohne Neuaufbau der Story:
  // die Svelte-Komponenten über das Abonnement am Kern, die Vanilla-Karte (mountLeagueCard) über das Ereignis hoops:localechange.
  let { example }: { example: string } = $props();

  // Erfundene Daten
  const teams: LeagueCardProps['teams'] = [
    { rank: 1, name: 'Lindenberg Hawks', short: 'Hawks', played: 8, won: 7, lost: 1, diff: 64, points: 14, zone: 'up', form: ['S', 'S', 'N', 'S'] },
    { rank: 2, name: 'TSV Nordhain 1920', short: 'Nordhain', played: 8, won: 6, lost: 2, diff: 31, points: 12, own: true, form: ['S', 'U', 'S'] },
    { rank: 3, name: 'BG Seeberg', played: 8, won: 5, lost: 3, diff: -4, points: 10, zone: 'playoff', form: ['N', 'S'] },
  ];
  const schritte = [
    { id: 'team', label: 'Mannschaft', state: 'done' as const },
    { id: 'kader', label: 'Kader', state: 'current' as const },
    { id: 'pruefen', label: 'Prüfen', state: 'pending' as const },
  ];

  type Mount = (el: Element, props: LeagueCardProps) => { update(props: LeagueCardProps): void; destroy(): void };
  function run(node: HTMLElement, props: LeagueCardProps) {
    const handle = (mountLeagueCard as Mount)(node, props);
    return { update: (next: LeagueCardProps) => handle.update(next), destroy: () => handle.destroy() };
  }
</script>

{#if example === 'svelte'}
  <div class="stack">
    <LeagueCard title="Bezirksliga Nordhain (Svelte)" {teams} teamCount={10} played={40} total={90} columns={['diff', 'form']} href="#tabelle" live={1} />
    <Stepper steps={schritte} />
    <FormChips form={['S', 'N', 'U']} variant="letters" />
  </div>
{:else if example === 'vanilla'}
  <div use:run={{ title: 'Bezirksliga Nordhain (Vanilla)', teams, teamCount: 10, played: 40, total: 90, columns: ['diff', 'form'], href: '#tabelle', live: 1 }}></div>
{:else if example === 'texte'}
  <LeagueCard title="Bezirksliga Nordhain (eigene Texte)" {teams} href="#tabelle" texts={{ 'league.link': 'Alle Tabellen des Bezirks', 'league.legend': 'Zeichenerklärung' }} />
{/if}

<style>
  .stack { display: grid; gap: 16px; max-width: 720px; }
</style>
