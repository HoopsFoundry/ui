// Gemeinsame Beispieldaten der Titelkomponenten für Parität, Messung und Ebenen-Tests.
import { createElement, type ReactElement } from 'react';
import type { Snippet } from 'svelte';

export type RawSnippet = (html: string) => Snippet;

export interface TitleCase {
  /** Anzeigename und Schlüssel */
  name: string;
  /** Klasse der Überschrift im Markup */
  titleClass: string;
  svelte: string;
  react: string;
  reactName: string;
  /** Props der Svelte-Fassung (Snippets über `snip`) */
  svelteProps: (snip: RawSnippet) => Record<string, unknown>;
  /** Props der React-Fassung */
  reactProps: () => Record<string, unknown>;
}

const GAME = { id: '1', state: 'scheduled', date: 'Sa 12.10.', time: '10:00', column: 'h1', heim: { name: 'TSV Nordhain' }, gast: { name: 'Hawks' } };
const EVENTS = [{ id: 1, time: '9:12', period: 1, team: 'heim', kind: 'score-2p', title: 'Korbleger' }];

const LEAGUE_TEAM = { rank: 1, name: 'TSV Nordhain 1920', played: 10, points: 20 };

export const TITLE_CASES: TitleCase[] = [
  {
    name: 'ScheduleTable', titleClass: 'dss-frame-title', svelte: 'svelte/ScheduleTable.svelte', react: 'react/ScheduleTable.tsx', reactName: 'ScheduleTable',
    svelteProps: () => ({ games: [GAME], title: 'Spielplan' }), reactProps: () => ({ games: [GAME], title: 'Spielplan' }),
  },
  {
    name: 'ScheduleGrid', titleClass: 'dss-frame-title', svelte: 'svelte/ScheduleGrid.svelte', react: 'react/ScheduleGrid.tsx', reactName: 'ScheduleGrid',
    svelteProps: () => ({ games: [GAME], columns: [{ id: 'h1', label: 'Halle 1' }], title: 'Zeitraster' }),
    reactProps: () => ({ games: [GAME], columns: [{ id: 'h1', label: 'Halle 1' }], title: 'Zeitraster' }),
  },
  {
    name: 'Table', titleClass: 'dss-frame-title', svelte: 'svelte/Table.svelte', react: 'react/Table.tsx', reactName: 'Table',
    svelteProps: (snip) => ({ title: 'Tabelle', columns: [{ key: 'a', label: 'A' }], rows: snip('<tr><td>x</td></tr>') }),
    reactProps: () => ({ title: 'Tabelle', columns: [{ key: 'a', label: 'A' }], children: createElement('tr', null, createElement('td', null, 'x')) }),
  },
  {
    name: 'PlayerCard', titleClass: 'dss-pc-nm', svelte: 'svelte/PlayerCard.svelte', react: 'react/PlayerCard.tsx', reactName: 'PlayerCard',
    svelteProps: () => ({ size: 'standard', jersey: '4', name: 'J. Tanner', position: 'PG' }), reactProps: () => ({ size: 'standard', jersey: '4', name: 'J. Tanner', position: 'PG' }),
  },
  {
    name: 'PlayerCard (hero)', titleClass: 'dss-pc-nm', svelte: 'svelte/PlayerCard.svelte', react: 'react/PlayerCard.tsx', reactName: 'PlayerCard',
    svelteProps: () => ({ size: 'hero', jersey: '4', name: 'J. Tanner', position: 'PG' }), reactProps: () => ({ size: 'hero', jersey: '4', name: 'J. Tanner', position: 'PG' }),
  },
  {
    name: 'EmptyState', titleClass: 'dss-empty-title', svelte: 'svelte/EmptyState.svelte', react: 'react/EmptyState.tsx', reactName: 'EmptyState',
    svelteProps: () => ({ title: 'Noch keine Spiele' }), reactProps: () => ({ title: 'Noch keine Spiele' }),
  },
  {
    name: 'PlayByPlay', titleClass: 'dss-pbp-title', svelte: 'svelte/PlayByPlay.svelte', react: 'react/PlayByPlay.tsx', reactName: 'PlayByPlay',
    svelteProps: () => ({ events: EVENTS, title: 'Ereignisse' }), reactProps: () => ({ events: EVENTS, title: 'Ereignisse' }),
  },
  {
    name: 'TeamCard', titleClass: 'dss-team-nm', svelte: 'svelte/TeamCard.svelte', react: 'react/TeamCard.tsx', reactName: 'TeamCard',
    svelteProps: () => ({ name: 'TSV Nordhain 1920' }), reactProps: () => ({ name: 'TSV Nordhain 1920' }),
  },
  {
    name: 'TeamCard (compact)', titleClass: 'dss-team-nm', svelte: 'svelte/TeamCard.svelte', react: 'react/TeamCard.tsx', reactName: 'TeamCard',
    svelteProps: () => ({ name: 'TSV Nordhain 1920', size: 'compact' }), reactProps: () => ({ name: 'TSV Nordhain 1920', size: 'compact' }),
  },
  {
    name: 'LeagueCard', titleClass: 'dss-league-title', svelte: 'svelte/LeagueCard.svelte', react: 'react/LeagueCard.tsx', reactName: 'LeagueCard',
    svelteProps: () => ({ title: 'Oberliga', teams: [LEAGUE_TEAM] }), reactProps: () => ({ title: 'Oberliga', teams: [LEAGUE_TEAM] }),
  },
  {
    name: 'VenueCard', titleClass: 'dss-venue-title', svelte: 'svelte/VenueCard.svelte', react: 'react/VenueCard.tsx', reactName: 'VenueCard',
    svelteProps: () => ({ name: 'Sporthalle Nordhain' }), reactProps: () => ({ name: 'Sporthalle Nordhain' }),
  },
];

export type { ReactElement };
