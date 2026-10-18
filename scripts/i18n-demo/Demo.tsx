// Demo für scripts/check-i18n-browser.mjs (React): wie Demo.svelte, dazu ein Bereich mit HoopsProvider (eigene Sprache, eigene Texte).
import { useState } from 'react';
import { Accordion, HeadingLevel, AccordionItem, AppNav, BottomNav, Breadcrumbs, FormChips, HoopsProvider, LeagueCard, MapView, MatchCard, Modal, PlayByPlay, PlayerCard, ScheduleGrid, ScheduleTable, StatGrid, Stepper, Table, Tabs, TeamCard, VenueCard } from '../../react/index';

const game = (id: string, state: string, extra: Record<string, unknown> = {}) => ({ id, state, date: 'Sat', time: '17:30', venue: 'Arena', heim: { name: 'Alpha Hawks', short: 'Alp', score: 3 }, gast: { name: 'Beta Owls', short: 'Bet', score: 2 }, ...extra }) as any;
const games = [game('a', 'finished'), game('b', 'live'), game('c', 'bye')];

export function Demo() {
  const [modal, setModal] = useState(false);
  return (
    <>
      <h1 className="hoops-sr-only">Demo</h1>
      <HeadingLevel level={2}>
      <AppNav items={[{ id: 'a', label: 'Start', href: '/a' }]} />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Page' }]} />
      <button type="button" className="hoops-btn hoops-btn--primary hoops-btn--md" id="open-modal" onClick={() => setModal(true)}>
        Open
      </button>
      <Tabs items={[{ id: 'a', label: 'One' }, { id: 'b', label: 'Two' }]} />
      <Stepper onStep={() => {}} steps={[{ id: 'a', label: 'One', state: 'done' }, { id: 'b', label: 'Two', state: 'current' }, { id: 'c', label: 'Three', state: 'pending' }]} />
      <Accordion expandAll nav>
        <AccordionItem id="x" title="Section X" defaultOpen>
          Content
        </AccordionItem>
        <AccordionItem id="y" title="Section Y">
          Content
        </AccordionItem>
      </Accordion>
      <StatGrid items={[{ label: 'Wins', value: 12.5 }, { label: 'Rate', value: null }]} />
      <FormChips form={['S', 'N', 'U']} variant="letters" />
      <LeagueCard title="League" teams={[{ rank: 1, name: 'One', own: true, played: 3, points: 4, won: 2, lost: 1, diff: 5, zone: 'up', form: ['S', 'N'] }, { rank: 2, name: 'Two', zone: 'down' }]} columns={['won', 'lost', 'diff', 'form']} href="/league" live={2} />
      <TeamCard name="Alpha Hawks" league="League" record={{ w: 8, l: 3 }} rank={3} rankOf={12} points={16} next={{ opponent: { name: 'Beta Owls' }, at: 'heim', date: 'Sat' }} last={{ opponent: { name: 'Gamma' }, at: 'gast', ownScore: 92, opponentScore: 79 }} squad={{ players: 14, staff: 3 }} stats={{ trb: 38.2, to: 12 }} />
      <MatchCard state="live" period={3} clock="04:12" heim={{ name: 'Alpha Hawks', score: 41 }} gast={{ name: 'Beta Owls', score: 39 }} />
      <ScheduleTable games={games} title="Schedule" />
      <ScheduleGrid games={[game('g1', 'scheduled', { column: 'a', time: '17:30' }), game('g2', 'bye', { time: '' })]} columns={[{ id: 'a', label: 'Hall A' }]} slots={['17:30']} title="Grid" />
      <Table title="Standings" live columns={[{ key: 'a', label: 'A' }]}>{null}</Table>
      <PlayByPlay events={[{ id: 1, time: '9:12', period: 3, team: 'heim', title: 'Layup', score: { heim: 2, gast: 0 } }]} />
      <PlayerCard jersey={7} name="Pat" captain heightCm="188" />
      <VenueCard name="Arena" lat={49.3} lng={7.9} address={{ street: 'Road 1', zip: '12345', city: 'Town' }} contact={{ name: 'Jo', phone: '030 123456' }} games={games.slice(1, 2)} href="/arena" />
      <MapView label="Map of halls" markers={[{ id: 'a', lat: 49.3, lng: 7.9, label: 'Arena' }]} />
      {/* Bereich mit eigener Sprache und eigenem Text: gilt nur hier, der Rest der Seite folgt der globalen Sprache */}
      <section id="provider" aria-label="Provider">
        <HoopsProvider locale="de" documentLang="en" texts={{ 'stepper.label': 'Fortschritt (Anbieter)' }}>
          <Stepper steps={[{ id: 'a', label: 'Eins', state: 'done' }, { id: 'b', label: 'Zwei', state: 'pending' }]} />
        </HoopsProvider>
      </section>
      <BottomNav items={[{ id: 'a', label: 'Home', href: '/a' }, { id: 'b', label: 'Games', href: '/b' }]} />
      </HeadingLevel>
      <Modal open={modal} onOpenChange={setModal} title="Dialog">
        Content
      </Modal>
    </>
  );
}
