<script lang="ts">
  // Demo für scripts/check-i18n-browser.mjs: Bausteine mit eingebauten Texten in einer Seite (Daten sind erfundene Platzhalter).
  import HeadingLevel from '../../svelte/HeadingLevel.svelte';
  import Modal from '../../svelte/Modal.svelte';
  import Tabs from '../../svelte/Tabs.svelte';
  import Stepper from '../../svelte/Stepper.svelte';
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import AppNav from '../../svelte/AppNav.svelte';
  import BottomNav from '../../svelte/BottomNav.svelte';
  import Breadcrumbs from '../../svelte/Breadcrumbs.svelte';
  import PlayByPlay from '../../svelte/PlayByPlay.svelte';
  import PlayerCard from '../../svelte/PlayerCard.svelte';
  import LeagueCard from '../../svelte/LeagueCard.svelte';
  import TeamCard from '../../svelte/TeamCard.svelte';
  import MatchCard from '../../svelte/MatchCard.svelte';
  import ScheduleTable from '../../svelte/ScheduleTable.svelte';
  import ScheduleGrid from '../../svelte/ScheduleGrid.svelte';
  import StatGrid from '../../svelte/StatGrid.svelte';
  import FormChips from '../../svelte/FormChips.svelte';
  import VenueCard from '../../svelte/VenueCard.svelte';
  import MapView from '../../svelte/Map.svelte';
  import Table from '../../svelte/Table.svelte';

  let modal = $state(false);
  let tab = $state('a');
  let item = $state(true);
  const game = (id: string, state: string, extra: Record<string, unknown> = {}) => ({ id, state, date: 'Sat', time: '17:30', venue: 'Arena', heim: { name: 'Alpha Hawks', short: 'Alp', score: 3 }, gast: { name: 'Beta Owls', short: 'Bet', score: 2 }, ...extra }) as any;
  const games = [game('a', 'finished'), game('b', 'live'), game('c', 'bye')];
  const hall = { id: 'a', lat: 49.3, lng: 7.9, label: 'Arena' };
</script>

<h1 class="hoops-sr-only">Demo</h1>
<HeadingLevel level={2}>
<AppNav items={[{ id: 'a', label: 'Start', href: '/a' }]} />
<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />
<button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md" id="open-modal" onclick={() => (modal = true)}>Open</button>
<Tabs bind:value={tab} items={[{ id: 'a', label: 'One' }, { id: 'b', label: 'Two' }]} />
<Stepper onstep={() => {}} steps={[{ id: 'a', label: 'One', state: 'done' }, { id: 'b', label: 'Two', state: 'current' }, { id: 'c', label: 'Three', state: 'pending' }]} />
<Accordion expandAll nav>
  <AccordionItem id="x" title="Section X" bind:open={item}>Content</AccordionItem>
  <AccordionItem id="y" title="Section Y">Content</AccordionItem>
</Accordion>
<StatGrid items={[{ label: 'Wins', value: 12.5 }, { label: 'Rate', value: null }]} />
<FormChips form={['S', 'N', 'U']} variant="letters" />
<LeagueCard title="League" teams={[{ rank: 1, name: 'One', own: true, played: 3, points: 4, won: 2, lost: 1, diff: 5, zone: 'up', form: ['S', 'N'] }, { rank: 2, name: 'Two', zone: 'down' }]} columns={['won', 'lost', 'diff', 'form']} href="/league" live={2} />
<TeamCard name="Alpha Hawks" league="League" record={{ w: 8, l: 3 }} rank={3} rankOf={12} points={16} next={{ opponent: { name: 'Beta Owls' }, at: 'heim', date: 'Sat' }} last={{ opponent: { name: 'Gamma' }, at: 'gast', ownScore: 92, opponentScore: 79 }} squad={{ players: 14, staff: 3 }} stats={{ trb: 38.2, to: 12 }} />
<MatchCard state="live" period={3} clock="04:12" heim={{ name: 'Alpha Hawks', score: 41 }} gast={{ name: 'Beta Owls', score: 39 }} />
<ScheduleTable {games} title="Schedule" />
<ScheduleGrid games={[game('g1', 'scheduled', { column: 'a', time: '17:30' }), game('g2', 'bye', { time: '' })]} columns={[{ id: 'a', label: 'Hall A' }]} slots={['17:30']} title="Grid" />
<Table title="Standings" live columns={[{ key: 'a', label: 'A' }]} />
<PlayByPlay events={[{ id: 1, time: '9:12', period: 3, team: 'heim', title: 'Layup', score: { heim: 2, gast: 0 } }]} />
<PlayerCard jersey={7} name="Pat" captain height_cm="188" />
<VenueCard name="Arena" lat={49.3} lng={7.9} address={{ street: 'Road 1', zip: '12345', city: 'Town' }} contact={{ name: 'Jo', phone: '030 123456' }} games={games.slice(1, 2)} href="/arena" />
<MapView label="Map of halls" markers={[hall]} />
<BottomNav items={[{ id: 'a', label: 'Home', href: '/a' }, { id: 'b', label: 'Games', href: '/b' }]} />
</HeadingLevel>
<Modal bind:open={modal} title="Dialog">Content</Modal>
