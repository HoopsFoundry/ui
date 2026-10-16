<script lang="ts">
  // Spielwiese: Controls als Props, gezeigt werden die echten Komponenten.
  // `kind` wählt die Tabelle (ScheduleTable) oder das Zeitraster (ScheduleGrid).
  import ScheduleTable from '../../svelte/ScheduleTable.svelte';
  import ScheduleGrid from '../../svelte/ScheduleGrid.svelte';
  import type { ScheduleGame, ScheduleLayout, ScheduleNames, ScheduleOutcome, ScheduleState, ScheduleTeam } from '../../js/schedule.js';
  // Erfundene Vereinslogos (nur Storybook); Teams ohne Datei zeigen die Initialen
  import nordhainLogo from '../assets/logos/nordhain.svg';
  import hawksLogo from '../assets/logos/hawks.svg';
  import seebergLogo from '../assets/logos/seeberg.svg';
  import elbachLogo from '../assets/logos/elbach.svg';

  type Dens = 'auto' | 'touch' | 'default' | 'compact';

  let {
    kind = 'table',
    layout = 'opponent',
    density = 'auto',
    names = 'full',
    logos = 'auto',
    state = 'live',
    provisional = false,
    scoreHeim = 52,
    scoreGast = 48,
    note = '',
    showLeague = false,
    showVenue = false,
    showField = false,
    own = false,
    placeholder = false,
    outcome = 'auto',
    showNotice = false,
    editableTime = false,
    halls = 3,
    showBreak = true,
    showBye = true,
    showEmptyCell = true,
    collapsible = false,
    open = true,
    id = '',
  }: {
    kind?: 'table' | 'grid';
    layout?: ScheduleLayout;
    density?: Dens;
    names?: ScheduleNames;
    logos?: 'auto' | 'on' | 'off';
    state?: ScheduleState;
    provisional?: boolean;
    scoreHeim?: number;
    scoreGast?: number;
    note?: string;
    showLeague?: boolean;
    showVenue?: boolean;
    showField?: boolean;
    own?: boolean;
    placeholder?: boolean;
    outcome?: 'auto' | ScheduleOutcome;
    showNotice?: boolean;
    editableTime?: boolean;
    halls?: number;
    showBreak?: boolean;
    showBye?: boolean;
    showEmptyCell?: boolean;
    collapsible?: boolean;
    open?: boolean;
    id?: string;
  } = $props();

  const dens = $derived(density === 'auto' ? undefined : density);
  const noteText = $derived(note.trim() === '' ? undefined : note);

  // Kurznamen und Logos (erfunden) für die Namen-Controls
  const SHORT: Record<string, string> = {
    'TSV Nordhain': 'Nordhain', 'TV Elbach': 'Elbach', 'Lindenberg Hawks': 'Hawks', 'BG Seeberg': 'Seeberg', 'SV Kiefernau': 'Kiefernau',
    'MTV Bergfeld': 'Bergfeld', 'TuSpo Hellenthal': 'Hellenthal', 'CVJM Ostfeld': 'Ostfeld', 'TB Grünfeld': 'Grünfeld', 'FC Waldbach': 'Waldbach',
    'TG 48 Mainau': 'Mainau', 'TV Wiesental': 'Wiesental', 'Erster Gruppe A': 'Erster A',
  };
  const LOGO: Record<string, string> = { 'TSV Nordhain': nordhainLogo, 'TV Elbach': elbachLogo, 'Lindenberg Hawks': hawksLogo, 'BG Seeberg': seebergLogo };
  const withShort = (name: string, extra: Partial<ScheduleTeam> = {}): ScheduleTeam => ({ name, short: SHORT[name], logo: LOGO[name], ...extra });

  // Table: Standard (Layout opponent an, sonst aus), an, aus. Grid: Standard ist aus.
  const tableLogos = $derived(logos === 'auto' ? undefined : logos === 'on');
  const gridLogos = $derived(logos === 'on');

  const TEAM = 'TSV Nordhain';
  const OPP = $derived(placeholder ? 'Erster Gruppe A' : 'TV Elbach');

  // ---------- Tabelle ----------
  const league = { name: 'Bayernliga Herren Mitte' };

  const tableGames = $derived.by<ScheduleGame[]>(() => {
    const test: ScheduleGame = {
      id: 'test',
      state,
      section: 'Spieltag 5',
      nr: '#1',
      date: 'Sa, 10.10.2026',
      time: '17:30',
      ...(showVenue ? { venue: 'Sporthalle Nordhain' } : {}),
      ...(showField ? { field: 'F1' } : {}),
      ...(showLeague ? { league } : {}),
      ...(provisional ? { provisional: true } : {}),
      ...(noteText ? { note: noteText } : {}),
    };
    if (layout === 'opponent') {
      test.at = 'heim';
      test.ownScore = scoreHeim;
      test.opponent = withShort(OPP, { score: scoreGast, placeholder });
      if (outcome !== 'auto') test.outcome = outcome;
      if (state === 'bye') test.heim = withShort(TEAM);
    } else {
      test.heim = withShort(TEAM, { score: scoreHeim, own });
      if (state !== 'bye') test.gast = withShort(OPP, { score: scoreGast, placeholder });
    }

    const ctx = (id: string, c: Partial<ScheduleGame>, o: { section: string; nr: string; date: string; time: string; field?: string; venue?: string }): ScheduleGame => ({
      id,
      section: o.section,
      nr: o.nr,
      date: o.date,
      time: o.time,
      ...(showVenue && o.venue ? { venue: o.venue } : {}),
      ...(showField && o.field ? { field: o.field } : {}),
      ...(showLeague ? { league } : {}),
      ...c,
    });

    const mk = (id: string, gameState: ScheduleState, at: 'heim' | 'gast', name: string, a: number, b: number, extra: Partial<ScheduleGame>, o: Parameters<typeof ctx>[2]): ScheduleGame => {
      if (layout === 'opponent') {
        return ctx(id, { state: gameState, at, ownScore: a, opponent: withShort(name, { score: b }), ...extra }, o);
      }
      const you: ScheduleTeam = withShort(TEAM, { score: a });
      const them: ScheduleTeam = withShort(name, { score: b });
      return ctx(id, { state: gameState, heim: at === 'heim' ? you : them, gast: at === 'heim' ? them : you, ...extra }, o);
    };

    return [
      test,
      mk('c1', 'finished', 'heim', 'Lindenberg Hawks', 65, 58, {}, { section: 'Spieltag 5', nr: '#2', date: 'Sa, 10.10.2026', time: '19:30', field: 'F2', venue: 'Seehalle Seeberg' }),
      mk('c2', 'scheduled', 'gast', 'BG Seeberg', 0, 0, {}, { section: 'Spieltag 6', nr: '#3', date: 'Sa, 17.10.2026', time: '15:00', field: 'F1', venue: 'Sporthalle Nordhain' }),
      mk('c3', 'cancelled', 'heim', 'SV Kiefernau', 0, 0, { note: 'Halle gesperrt' }, { section: 'Spieltag 6', nr: '#4', date: 'Sa, 17.10.2026', time: '17:30', field: 'F2', venue: 'Seehalle Seeberg' }),
    ];
  });


  // ---------- Zeitraster ----------
  const HALL_NAMES = ['Sporthalle Nordhain', 'Seehalle Seeberg', 'Feld 3', 'Mainauer Sporthalle', 'Halle am Stadtpark'];
  const TEAMS = ['Lindenberg Hawks', 'BG Seeberg', 'SV Kiefernau', 'MTV Bergfeld', 'TuSpo Hellenthal', 'CVJM Ostfeld', 'TB Grünfeld', 'FC Waldbach', 'TG 48 Mainau', 'TV Wiesental'];
  const TIMES = ['09:00', '09:30', '10:00'];
  const PLAN: [ScheduleState, string][][] = [
    [['finished', ''], ['finished', ''], ['finished', ''], ['live', ''], ['scheduled', '']],
    [['scheduled', ''], ['cancelled', 'Halle gesperrt'], ['scheduled', ''], ['scheduled', ''], ['postponed', 'Verlegt auf 14.11.']],
    [['scheduled', ''], ['scheduled', ''], ['scheduled', ''], ['scheduled', ''], ['scheduled', '']],
  ];

  const count = $derived(Math.min(5, Math.max(1, Math.round(Number(halls) || 1))));
  const columns = $derived(HALL_NAMES.slice(0, count).map((label, i) => ({ id: `h${i + 1}`, label })));

  const gridGames = $derived.by<ScheduleGame[]>(() => {
    const list: ScheduleGame[] = [];
    TIMES.forEach((time, s) => {
      columns.forEach((col, h) => {
        const nr = `#${s * 5 + h + 1}`;
        if (s === 0 && h === 0) {
          const g: ScheduleGame = {
            id: 'gtest',
            state,
            nr,
            section: 'Gruppe A',
            time,
            column: col.id,
            heim: withShort(TEAM, { score: scoreHeim, own }),
          };
          if (state !== 'bye') g.gast = withShort(OPP, { score: scoreGast, placeholder });
          if (provisional) g.provisional = true;
          if (noteText) g.note = noteText;
          list.push(g);
          return;
        }
        if (showEmptyCell && s === 2 && h === count - 1) return;
        const [st, nt] = PLAN[s][h];
        const scored = st === 'finished' || st === 'live';
        list.push({
          id: `g${s}${h}`,
          state: st,
          nr,
          section: 'Gruppe A',
          time,
          column: col.id,
          heim: withShort(TEAMS[(h * 2 + s) % TEAMS.length], scored ? { score: 40 + h * 3 + s } : {}),
          gast: withShort(TEAMS[(h * 2 + s + 1) % TEAMS.length], scored ? { score: 35 + h * 2 } : {}),
          ...(nt ? { note: nt } : {}),
        });
      });
    });
    if (showBye) list.push({ id: 'gbye', state: 'bye', time: '09:30', heim: withShort('MTV Bergfeld') });
    return list;
  });
</script>

{#snippet editTime(game: ScheduleGame)}
  {#if game.id === 'test'}
    <input
      type="text"
      value={game.time}
      aria-label="Anwurfzeit Testspiel"
      style="width: 7ch; font: inherit; padding: 2px 6px; border: 1px solid var(--hoops-line); border-radius: 6px; background: var(--hoops-surface); color: var(--hoops-fg);"
    />
  {:else}{game.time}{/if}
{/snippet}

{#snippet sperrzeit(game: ScheduleGame)}
  {#if game.id === 'test'}<span class="hoops-chip hoops-chip--warn">Sperrzeit</span>{/if}
{/snippet}

<div style="padding: 24px; max-width: 1100px;">
  {#if kind === 'table'}
    <ScheduleTable
      games={tableGames}
      {layout}
      density={dens as 'touch' | 'default' | 'compact' | undefined}
      {names}
      logos={tableLogos}
      title="Spielplan"
      meta="4 Spiele"
      caption="Spielplan Spielwiese"
      {collapsible}
      {open}
      id={id || undefined}
      time={editableTime ? editTime : undefined}
      notice={showNotice ? sperrzeit : undefined}
    />
  {:else}
    <ScheduleGrid
      games={gridGames}
      {columns}
      slots={TIMES}
      breaks={showBreak ? [{ time: '10:15', label: 'Mittagspause' }] : []}
      density={(dens ?? 'default') as 'touch' | 'default' | 'compact'}
      {names}
      logos={gridLogos}
      title="Zeitraster"
      meta="Samstag, 10.10.2026"
      caption="Zeitraster Spielwiese"
      {collapsible}
      {open}
      id={id || undefined}
    />
  {/if}
</div>
