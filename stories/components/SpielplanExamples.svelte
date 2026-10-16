<script lang="ts">
  import ScheduleTable from '../../svelte/ScheduleTable.svelte';
  import ScheduleGrid from '../../svelte/ScheduleGrid.svelte';
  import Accordion from '../../svelte/Accordion.svelte';
  import type { ScheduleGame } from '../../js/schedule.js';
  // Erfundene Vereinslogos (nur Storybook, nicht im Paket)
  import nordhainLogo from '../assets/logos/nordhain.svg';
  import hawksLogo from '../assets/logos/hawks.svg';
  import seebergLogo from '../assets/logos/seeberg.svg';
  import elbachLogo from '../assets/logos/elbach.svg';

  let { example }: { example: string } = $props();

  const D = 'Sa, 10.10.2026';

  // 01 · kleine Beispiele
  const miniLiga: ScheduleGame[] = [
    { id: 'a1', state: 'scheduled', date: D, time: '15:00', heim: { name: 'Norvik Baskets Rosenau', href: '#' }, gast: { name: 'FC Waldbach', href: '#' }, league: { name: 'Bayernliga Herren Mitte', href: '#' }, venue: 'Halle am Stadtpark' },
  ];
  const miniMannschaft: ScheduleGame[] = [
    { id: 'a2', state: 'scheduled', date: D, time: '19:30', at: 'gast', opponent: { name: 'Bergheimer Basketball Club', href: '#' } },
  ];
  const miniTurnier: ScheduleGame[] = [
    { id: 'a3', state: 'scheduled', nr: '#6', time: '10:00–10:20', field: 'F1', heim: { name: 'BG Seeberg' }, gast: { name: 'TSV Nordhain', own: true } },
  ];
  const miniRaster: ScheduleGame[] = [
    { id: 'a4', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'TSV Nordhain', own: true }, gast: { name: 'Lindenberg Hawks' } },
    { id: 'a5', state: 'scheduled', time: '09:00', column: 'h2', heim: { name: 'BG Seeberg' }, gast: { name: 'TV Elbach' } },
  ];
  const miniHallen = [{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }];

  // 02 · Layouts
  const mannschaft: ScheduleGame[] = [
    { id: 'm1', state: 'finished', date: 'Sa, 26.09.2026', time: '17:30', at: 'heim', opponent: { name: 'TSV Falken Auental', href: '#', score: 108 }, ownScore: 65 },
    { id: 'm2', state: 'finished', date: 'Sa, 03.10.2026', time: '17:30', at: 'heim', provisional: true, opponent: { name: 'Dukes Eschental', href: '#', score: 0 }, ownScore: 20, outcome: 'S' },
    { id: 'm3', state: 'scheduled', date: 'Sa, 10.10.2026', time: '19:30', at: 'gast', opponent: { name: 'Bergheimer Basketball Club', href: '#' } },
    { id: 'm4', state: 'postponed', date: 'So, 25.10.2026', time: '17:00', at: 'gast', opponent: { name: 'TV 1881 Wiesental', href: '#' }, note: 'Verlegt auf Sa, 14.11.2026, 19:00' },
  ];
  const liga: ScheduleGame[] = [
    { id: 'l1', state: 'finished', section: 'Spieltag 5', date: 'So, 04.10.2026', time: '17:00', heim: { name: 'TuSpo Hellenthal', href: '#', score: 64 }, gast: { name: 'TSV Hollbach 2', href: '#', score: 90 }, league: { name: 'Bayernliga Herren Mitte', href: '#' }, venue: 'Sporthalle Hellenthal' },
    { id: 'l2', state: 'live', section: 'Spieltag 5', date: 'So, 04.10.2026', time: '15:45', heim: { name: 'TG 48 Mainau 2', href: '#', score: 52 }, gast: { name: 'CVJM Ostfeld', href: '#', score: 48 }, league: { name: 'Bayernliga Herren Mitte', href: '#' }, venue: 'Mainauer Sporthalle' },
    { id: 'l3', state: 'scheduled', section: 'Spieltag 6', date: D, time: '15:00', heim: { name: 'Norvik Baskets Rosenau', href: '#', own: true }, gast: { name: 'FC Waldbach', href: '#' }, league: { name: 'U18 männlich Bezirksoberliga', href: '#' }, venue: 'Halle am Stadtpark Rosenau' },
  ];
  const turnier: ScheduleGame[] = [
    { id: 't1', state: 'finished', nr: '#1', section: 'Runde 1 · Gruppe A', time: '09:00–09:20', field: 'F1', venue: 'Halle 1', heim: { name: 'TSV Nordhain', score: 42, own: true }, gast: { name: 'Lindenberg Hawks', score: 31 } },
    { id: 't2', state: 'live', nr: '#2', section: 'Runde 1 · Gruppe A', time: '09:00–09:20', field: 'F2', venue: 'Halle 1', heim: { name: 'BG Seeberg', score: 28 }, gast: { name: 'TV Elbach', score: 26 } },
    { id: 't3', state: 'scheduled', nr: '#3', section: 'Runde 2 · Gruppe A', time: '09:30–09:50', field: 'F1', venue: 'Halle 2', heim: { name: 'TSV Nordhain', own: true }, gast: { name: 'TV Elbach' } },
    { id: 't9', state: 'scheduled', nr: '#9', section: 'Halbfinale', time: '11:00–11:20', field: 'F1', venue: 'Halle 1', heim: { name: 'Erster Gruppe A', placeholder: true }, gast: { name: 'Zweiter Gruppe B', placeholder: true } },
  ];

  // Do und Don't stehen in schmalen Spalten (Handy-Karten): dort ohne Links, damit Namen und Unterzeile die Zielfläche nicht verdecken
  const ligaOhneLinks: ScheduleGame[] = liga.map((g) => ({ ...g, league: g.league && { name: g.league.name }, heim: g.heim && { ...g.heim, href: undefined }, gast: g.gast && { ...g.gast, href: undefined } }));

  // 03 · Raster
  const raster: ScheduleGame[] = [
    { id: 'r1', state: 'finished', nr: '#1', section: 'Gruppe A', time: '09:00', column: 'h1', heim: { name: 'TSV Nordhain', score: 42, own: true }, gast: { name: 'Lindenberg Hawks', score: 31 } },
    { id: 'r2', state: 'finished', nr: '#2', section: 'Gruppe A', time: '09:00', column: 'h2', heim: { name: 'BG Seeberg', score: 28 }, gast: { name: 'TV Elbach', score: 35 } },
    { id: 'r3', state: 'live', nr: '#3', section: 'Gruppe B', time: '09:00', column: 'h3', heim: { name: 'SV Kiefernau', score: 12 }, gast: { name: 'MTV Bergfeld', score: 10 } },
    { id: 'r4', state: 'scheduled', nr: '#4', section: 'Gruppe A', time: '09:30', column: 'h1', heim: { name: 'TSV Nordhain', own: true }, gast: { name: 'TV Elbach' } },
    { id: 'r5', state: 'cancelled', nr: '#5', section: 'Gruppe A', time: '09:30', column: 'h2', heim: { name: 'Lindenberg Hawks' }, gast: { name: 'BG Seeberg' }, note: 'Halle gesperrt' },
    { id: 'r6', state: 'scheduled', nr: '#9', section: 'Halbfinale', time: '11:00', column: 'h1', heim: { name: 'Erster Gruppe A', placeholder: true }, gast: { name: 'Zweiter Gruppe B', placeholder: true } },
    { id: 'r7', state: 'bye', time: '09:30', heim: { name: 'SV Kiefernau' } },
  ];
  const hallen = [
    { id: 'h1', label: 'Sporthalle Nordhain' },
    { id: 'h2', label: 'Seehalle Seeberg' },
    { id: 'h3', label: 'Feld 3' },
  ];
  const hallen5 = [
    { id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }, { id: 'h3', label: 'Halle 3' },
    { id: 'h4', label: 'Halle 4' }, { id: 'h5', label: 'Halle 5' },
  ];
  const raster5: ScheduleGame[] = [
    { id: 'f1', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'TSV Nordhain', own: true }, gast: { name: 'Lindenberg Hawks' } },
    { id: 'f2', state: 'live', time: '09:00', column: 'h2', heim: { name: 'BG Seeberg', score: 8 }, gast: { name: 'TV Elbach', score: 6 } },
    { id: 'f3', state: 'scheduled', time: '09:00', column: 'h3', heim: { name: 'SV Kiefernau' }, gast: { name: 'MTV Bergfeld' } },
    { id: 'f4', state: 'scheduled', time: '09:00', column: 'h4', heim: { name: 'TB Grünfeld' }, gast: { name: 'TG 48 Mainau' } },
    { id: 'f5', state: 'scheduled', time: '09:00', column: 'h5', heim: { name: 'CVJM Ostfeld' }, gast: { name: 'FC Waldbach' } },
    { id: 'f6', state: 'scheduled', time: '09:30', column: 'h1', heim: { name: 'TV Elbach' }, gast: { name: 'BG Seeberg' } },
  ];

  // 04 · Zustände (je ein Spiel)
  const ft = (id: string, extra: Partial<ScheduleGame>): ScheduleGame => ({
    id, state: 'scheduled', date: D, time: '15:00',
    heim: { name: 'TuSpo Hellenthal' }, gast: { name: 'TSV Hollbach 2' }, ...extra,
  });
  const opp = (id: string, extra: Partial<ScheduleGame>): ScheduleGame => ({
    id, state: 'finished', date: D, time: '17:30', at: 'heim',
    opponent: { name: 'TSV Falken Auental', score: 70 }, ownScore: 80, ...extra,
  });

  type StateEx = { key: string; label: string; games: ScheduleGame[]; layout?: 'versus' | 'opponent' | 'columns'; extra?: 'notice' | 'time' };
  const states: StateEx[] = [
    { key: 'scheduled', label: 'Geplant', games: [ft('s1', {})] },
    { key: 'live', label: 'Live', games: [ft('s2', { state: 'live', heim: { name: 'TuSpo Hellenthal', score: 52 }, gast: { name: 'TSV Hollbach 2', score: 48 } })] },
    { key: 'finished', label: 'Beendet', games: [ft('s3', { state: 'finished', heim: { name: 'TuSpo Hellenthal', score: 64 }, gast: { name: 'TSV Hollbach 2', score: 90 } })] },
    { key: 'provisional', label: 'Vorläufig', games: [ft('s4', { state: 'finished', provisional: true, heim: { name: 'TuSpo Hellenthal', score: 64 }, gast: { name: 'TSV Hollbach 2', score: 90 } })] },
    { key: 'cancelled', label: 'Abgesagt', games: [ft('s5', { state: 'cancelled', note: 'Abgesagt: Halle gesperrt' })] },
    { key: 'postponed', label: 'Verlegt', games: [ft('s6', { state: 'postponed', note: 'Verlegt auf Sa, 14.11.2026, 19:00' })] },
    { key: 'bye', label: 'Freilos', games: [{ id: 's7', state: 'bye', time: '09:30', heim: { name: 'TSV Nordhain' } }], layout: 'columns' },
    { key: 'own', label: 'Eigene Mannschaft', games: [ft('s8', { heim: { name: 'Norvik Baskets Rosenau', own: true }, gast: { name: 'FC Waldbach' } })], layout: 'versus' },
    { key: 'placeholder', label: 'Platzhalter', games: [ft('s9', { heim: { name: 'Erster Gruppe A', placeholder: true }, gast: { name: 'Zweiter Gruppe B', placeholder: true } })] },
    { key: 'win', label: 'Sieg (S)', games: [opp('s10', {})], layout: 'opponent' },
    { key: 'loss', label: 'Niederlage (N)', games: [opp('s11', { opponent: { name: 'TSV Falken Auental', score: 108 }, ownScore: 65 })], layout: 'opponent' },
    { key: 'draw', label: 'Unentschieden (U)', games: [opp('s12', { opponent: { name: 'TSV Falken Auental', score: 70 }, ownScore: 70 })], layout: 'opponent' },
    { key: 'forfeit', label: 'Forfait über outcome', games: [opp('s13', { opponent: { name: 'Dukes Eschental', score: 0 }, ownScore: 20, outcome: 'S' })], layout: 'opponent' },
    { key: 'notice', label: 'Konflikt-Hinweis', games: [{ id: 's14', state: 'scheduled', nr: '#6', time: '10:00–10:20', field: 'F1', heim: { name: 'BG Seeberg' }, gast: { name: 'TSV Nordhain', own: true } }], layout: 'columns', extra: 'notice' },
    { key: 'time', label: 'Bearbeitbare Zeit', games: [{ id: 's15', state: 'scheduled', nr: '#9', time: '11:00', field: 'F1', heim: { name: 'Erster Gruppe A', placeholder: true }, gast: { name: 'Zweiter Gruppe B', placeholder: true } }], layout: 'columns', extra: 'time' },
  ];

  // Zeitraster: Live (mit Stand) und vorläufig nebeneinander
  const rasterZustaende: ScheduleGame[] = [
    { id: 'z1', state: 'live', time: '09:00', column: 'h1', heim: { name: 'SV Kiefernau', score: 12 }, gast: { name: 'MTV Bergfeld', score: 10 } },
    { id: 'z2', state: 'finished', provisional: true, time: '09:00', column: 'h2', heim: { name: 'BG Seeberg', score: 28 }, gast: { name: 'TV Elbach', score: 35 } },
  ];
  // Dichte mit vorläufigem Ergebnis: die Zeilenhöhe bleibt wie ohne Tag
  const turnierVorlaeufig: ScheduleGame[] = [{ ...turnier[0], provisional: true }, turnier[1]];

  // Dos und Don'ts
  const eigene: ScheduleGame[] = [
    ft('e1', { heim: { name: 'Norvik Baskets Rosenau', own: true }, gast: { name: 'FC Waldbach' } }),
    ft('e2', { time: '17:00' }),
  ];

  // 05 · Namen und Logos (Kurznamen und Logo-Dateien erfunden; Kiefernau und Bergfeld ohne Logo zeigen die Initialen)
  const NORDHAIN = { name: 'TSV Nordhain 1920', short: 'TSV N.', logo: nordhainLogo };
  const HAWKS = { name: 'Lindenberg Hawks', short: 'Hawks', logo: hawksLogo };
  const SEEBERG = { name: 'BG Seeberg', short: 'Seeberg', logo: seebergLogo };
  const ELBACH = { name: 'TV Elbach', short: 'Elbach', logo: elbachLogo };
  const KIEFERNAU = { name: 'SV Kiefernau', short: 'Kiefernau' };
  const BERGFELD = { name: 'MTV Bergfeld', short: 'Bergfeld' };
  const namen: ScheduleGame[] = [
    { id: 'n1', state: 'finished', section: 'Spieltag 5', date: D, time: '15:00', heim: { ...NORDHAIN, href: '#', score: 87, own: true }, gast: { ...HAWKS, href: '#', score: 64 } },
    { id: 'n2', state: 'live', section: 'Spieltag 5', date: D, time: '17:00', heim: { ...SEEBERG, href: '#', score: 52 }, gast: { ...ELBACH, href: '#', score: 48 } },
    { id: 'n3', state: 'scheduled', section: 'Spieltag 6', date: 'Sa, 17.10.2026', time: '15:00', heim: { ...KIEFERNAU, href: '#' }, gast: { ...BERGFELD, href: '#' } },
  ];
  const namenTurnier: ScheduleGame[] = [
    { id: 'nt1', state: 'finished', nr: '#1', section: 'Runde 1 · Gruppe A', time: '09:00–09:20', field: 'F1', heim: { ...NORDHAIN, score: 42, own: true }, gast: { ...HAWKS, score: 31 } },
    { id: 'nt2', state: 'scheduled', nr: '#2', section: 'Runde 1 · Gruppe A', time: '09:30–09:50', field: 'F2', heim: { ...SEEBERG }, gast: { ...KIEFERNAU } },
    { id: 'nt9', state: 'scheduled', nr: '#9', section: 'Halbfinale', time: '11:00–11:20', field: 'F1', heim: { name: 'Erster Gruppe A', short: 'Erster A', placeholder: true }, gast: { name: 'Zweiter Gruppe B', short: 'Zweiter B', placeholder: true } },
  ];
  const namenMannschaft: ScheduleGame[] = [
    { id: 'nm1', state: 'finished', date: 'Sa, 26.09.2026', time: '17:30', at: 'heim', opponent: { name: 'Bergheimer Basketball Club', short: 'BBC', href: '#', logo: elbachLogo, score: 58 }, ownScore: 71 },
    { id: 'nm2', state: 'scheduled', date: 'Sa, 10.10.2026', time: '19:30', at: 'gast', opponent: { name: 'Dukes Eschental', short: 'Dukes', href: '#' } },
  ];
  const namenRaster: ScheduleGame[] = [
    { id: 'nr1', state: 'live', time: '09:00', column: 'h1', heim: { ...NORDHAIN, score: 12, own: true }, gast: { ...HAWKS, score: 10 } },
    { id: 'nr2', state: 'scheduled', time: '09:00', column: 'h2', heim: { ...SEEBERG }, gast: { ...KIEFERNAU } },
    { id: 'nr3', state: 'scheduled', time: '09:30', column: 'h1', heim: { ...ELBACH }, gast: { ...BERGFELD } },
  ];
  const namenDichte = namenTurnier.slice(0, 2);
  const eindeutig: ScheduleGame[] = [namen[0], namen[1]];
  // Gegenbeispiel: zwei Vereine mit demselben Kurznamen
  const mehrdeutig: ScheduleGame[] = [
    { id: 'md1', state: 'finished', date: D, time: '15:00', heim: { name: 'TSV Nordhain 1920', short: 'TSV', score: 87 }, gast: { name: 'TSV Hollbach 2', short: 'TSV', score: 64 } },
    { id: 'md2', state: 'scheduled', date: D, time: '17:00', heim: { name: 'TSV Falken Auental', short: 'TSV' }, gast: { name: 'TSV Nordhain 1920', short: 'TSV' } },
  ];

  const inputStyle = 'width: 7ch; font: inherit; padding: 2px 6px; border: 1px solid var(--hoops-line); border-radius: 6px; background: var(--hoops-surface); color: var(--hoops-fg);';
</script>

{#if example === 'mini-liga'}
  <ScheduleTable games={miniLiga} layout="versus" caption="Beispiel Liga" />
{:else if example === 'mini-mannschaft'}
  <ScheduleTable games={miniMannschaft} layout="opponent" caption="Beispiel Mannschaft" />
{:else if example === 'mini-turnier'}
  <ScheduleTable games={miniTurnier} layout="columns" caption="Beispiel Turnier-Liste" />
{:else if example === 'mini-raster'}
  <ScheduleGrid games={miniRaster} columns={miniHallen} caption="Beispiel Tagesplan" />
{:else if example === 'layout-opponent'}
  <ScheduleTable games={mannschaft} layout="opponent" title="Spielplan" meta="4 Spiele" caption="Beispiel Mannschafts-Spielplan" />
{:else if example === 'layout-versus'}
  <ScheduleTable games={liga} layout="versus" title="Spieltage" meta="Bayernliga" caption="Beispiel Liga-Spielplan" />
{:else if example === 'layout-columns'}
  <ScheduleTable games={turnier} layout="columns" title="Spielplan" meta="4 Spiele" caption="Beispiel Turnier-Spielplan" />
{:else if example === 'raster-3'}
  <ScheduleGrid
    games={raster}
    columns={hallen}
    breaks={[{ time: '10:15', label: 'Mittagspause' }]}
    title="Zeitraster"
    meta="Samstag, 10.10.2026"
    caption="Turnier-Tagesplan"
  />
{:else if example === 'raster-5'}
  <ScheduleGrid games={raster5} columns={hallen5} title="Fünf Hallen" meta="09:00 bis 09:30" caption="Zeitraster mit fünf Hallen" />
{:else if example === 'dichte-touch'}
  <ScheduleTable games={turnier.slice(0, 2)} layout="columns" density="touch" caption="Dichte Touch · 60 px" />
{:else if example === 'dichte-default'}
  <ScheduleTable games={turnier.slice(0, 2)} layout="columns" density="default" caption="Dichte Standard · 48 px" />
{:else if example === 'dichte-compact'}
  <ScheduleTable games={turnier.slice(0, 2)} layout="columns" density="compact" caption="Dichte Kompakt · 40 px" />
{:else if example === 'dichte-vorlaeufig'}
  <ScheduleTable games={turnierVorlaeufig} layout="columns" density="compact" caption="Dichte Kompakt mit vorläufigem Ergebnis" />
{:else if example === 'zustand-raster'}
  <ScheduleGrid games={rasterZustaende} columns={[{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }]} caption="Zeitraster: live und vorläufig" />
{:else if example === 'namen-voll'}
  <ScheduleTable games={namen} layout="versus" caption="Volle Namen" />
{:else if example === 'namen-kurz'}
  <ScheduleTable games={namen} layout="versus" names="short" caption="Kurznamen" />
{:else if example === 'logos-versus'}
  <ScheduleTable games={namen} layout="versus" logos caption="Gegenüberstellung mit Logos" />
{:else if example === 'logos-versus-kurz'}
  <ScheduleTable games={namen} layout="versus" logos names="short" caption="Gegenüberstellung mit Logos und Kurznamen" />
{:else if example === 'logos-columns'}
  <ScheduleTable games={namenTurnier} layout="columns" logos names="short" caption="Turnier-Liste mit Logos und Kurznamen" />
{:else if example === 'logos-opponent'}
  <ScheduleTable games={namenMannschaft} layout="opponent" caption="Mannschaftssicht, Logos wie bisher" />
{:else if example === 'logos-opponent-aus'}
  <ScheduleTable games={namenMannschaft} layout="opponent" logos={false} names="short" caption="Mannschaftssicht ohne Logos, Kurznamen" />
{:else if example === 'logos-raster'}
  <ScheduleGrid games={namenRaster} columns={[{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }]} logos names="short" caption="Zeitraster mit Logos und Kurznamen" />
{:else if example === 'logos-touch'}
  <ScheduleTable games={namenDichte} layout="columns" density="touch" logos caption="Logos in Touch" />
{:else if example === 'logos-default'}
  <ScheduleTable games={namenDichte} layout="columns" density="default" logos caption="Logos in Standard" />
{:else if example === 'logos-compact'}
  <ScheduleTable games={namenDichte} layout="columns" density="compact" logos caption="Logos in Kompakt" />
{:else if example === 'namen-handy'}
  <ScheduleTable games={namen} layout="versus" logos title="Spieltage" caption="Namen und Logos auf dem Handy" />
{:else if example === 'do-kurz'}
  <ScheduleTable games={eindeutig} layout="versus" names="short" caption="Eindeutige Kurznamen" />
{:else if example === 'dont-kurz'}
  <ScheduleTable games={mehrdeutig} layout="versus" names="short" caption="Mehrdeutige Kurznamen" />
{:else if example === 'do-logo'}
  <ScheduleTable games={[{ ...namen[0], section: undefined }]} layout="versus" logos caption="Logo mit leerem Alternativtext" />
  <p class="readout">Screenreader: <q>TSV Nordhain 1920, gegen, Lindenberg Hawks</q></p>
{:else if example === 'dont-logo'}
  <!-- Nachgestellt: die Komponente setzt immer alt="". Hier trägt das Bild den Vereinsnamen als Alternativtext. -->
  <div class="hoops-frame">
    <div class="hoops-table-scroll">
      <table role="table" class="hoops-tbl hoops-tbl--schedule hoops-tbl--default hoops-sch--versus">
        <caption class="hoops-sr-only">Logo mit Alternativtext</caption>
        <tbody role="rowgroup">
          <tr role="row" class="hoops-sch-row">
            <td role="cell" class="hoops-sch-when"><span class="hoops-sch-date">{D}</span> <span class="hoops-sch-time">15:00</span></td>
            <td role="cell" class="hoops-sch-match">
              <span class="hoops-sch-team hoops-sch-team--logo"><span class="hoops-team-logo"><img src={nordhainLogo} alt="Logo TSV Nordhain 1920" /></span><a class="hoops-link" href="#">TSV Nordhain 1920</a></span>
              <span class="hoops-sch-sep" aria-hidden="true"> – </span>
              <span class="hoops-sr-only"> gegen </span>
              <span class="hoops-sch-team hoops-sch-team--logo"><span class="hoops-team-logo"><img src={hawksLogo} alt="Logo Lindenberg Hawks" /></span><a class="hoops-link" href="#">Lindenberg Hawks</a></span>
            </td>
            <td role="cell" class="hoops-sch-res"><span class="hoops-sch-none">–</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <p class="readout">Screenreader: <q>Logo TSV Nordhain 1920, TSV Nordhain 1920, gegen, Logo Lindenberg Hawks, Lindenberg Hawks</q></p>
{:else if example === 'do-dichte'}
  <ScheduleTable games={turnier.slice(0, 2)} layout="columns" density="touch" caption="Touch-Dichte" />
{:else if example === 'dont-dichte'}
  <ScheduleTable games={turnier.slice(0, 2)} layout="columns" density="compact" caption="Kompakte Dichte" />
{:else if example === 'do-absage'}
  <ScheduleTable games={[ft('d1', { state: 'cancelled', note: 'Abgesagt: Halle gesperrt' })]} caption="Abgesagt mit Grund" />
{:else if example === 'dont-absage'}
  <ScheduleTable games={[ft('d2', { state: 'cancelled' })]} caption="Abgesagt ohne Grund" />
{:else if example === 'do-hallen'}
  <ScheduleGrid games={raster} columns={hallen} caption="Drei Hallen" />
{:else if example === 'dont-hallen'}
  <ScheduleGrid games={raster5} columns={hallen5} caption="Fünf Hallen" />
{:else if example === 'do-eigene'}
  <ScheduleTable games={eigene} layout="versus" caption="Eigene Mannschaft dezent" />
{:else if example === 'dont-eigene'}
  <!-- Nachgestellt: die Komponente kann eine laute Zeile nicht, die Hintergrundfarbe kommt von außen. -->
  <div class="shout">
    <ScheduleTable games={eigene} layout="versus" caption="Eigene Mannschaft laut" />
  </div>
{:else if example === 'einklappbar'}
  <div class="stack">
    <ScheduleTable collapsible open games={liga} layout="versus" title="Spieltage der Herren" meta="3 Spiele" caption="Einklappbar: Spielplan offen" />
    <ScheduleGrid collapsible games={raster} columns={hallen} title="Zeitraster am Samstag" meta="3 Hallen" caption="Einklappbar: Zeitraster zu" />
  </div>
{:else if example === 'einklappbar-id'}
  <div class="stack">
    <p class="links">Direkt springen: <a class="hoops-link" href="#sp-turnier">Turnierplan (Deep-Link)</a></p>
    <ScheduleTable collapsible id="sp-mannschaft" games={mannschaft} layout="opponent" title="Spielplan der Mannschaft" meta="4 Spiele" caption="Deep-Link: Mannschaftsplan" />
    <ScheduleTable collapsible id="sp-turnier" games={turnier} layout="columns" title="Turnierplan" meta="4 Spiele" caption="Deep-Link: Turnierplan" />
  </div>
{:else if example === 'einklappbar-gruppe'}
  <Accordion syncHash={false} nav navLabel="Bereiche des Spieltags" expandAll>
    <ScheduleTable collapsible id="gr-liga" games={liga} layout="versus" title="Liga-Spieltag" meta="3 Spiele" caption="Gruppe: Liga-Spieltag" />
    <ScheduleTable collapsible id="gr-turnier" games={turnier} layout="columns" title="Turnier-Spielplan" meta="4 Spiele" caption="Gruppe: Turnier-Spielplan" />
    <ScheduleGrid collapsible id="gr-raster" games={raster} columns={hallen} title="Hallenbelegung" meta="3 Hallen" caption="Gruppe: Hallenbelegung" />
  </Accordion>
{:else if example === 'do-offen'}
  <div class="stack">
    <ScheduleTable collapsible open games={ligaOhneLinks} layout="versus" title="Heutiger Spieltag" meta="Live" caption="Do: heutiger Spieltag" />
    <ScheduleTable collapsible games={mannschaft} layout="opponent" title="Restliche Saison" meta="4 Spiele" caption="Do: restliche Saison" />
  </div>
{:else if example === 'dont-zu'}
  <div class="stack">
    <ScheduleTable collapsible games={ligaOhneLinks} layout="versus" title="Heutiger Spieltag" meta="Live" caption="Don't: heutiger Spieltag" />
    <ScheduleTable collapsible games={mannschaft} layout="opponent" title="Restliche Saison" meta="4 Spiele" caption="Don't: restliche Saison" />
  </div>
{/if}

{#each states as s (s.key)}
  {#if example === 'zustand-' + s.key}
    {#if s.extra === 'notice'}
      <ScheduleTable games={s.games} layout={s.layout} caption={`Zustand ${s.label}`}>
        {#snippet notice()}<span class="hoops-chip hoops-chip--warn">Sperrzeit</span>{/snippet}
      </ScheduleTable>
    {:else if s.extra === 'time'}
      <ScheduleTable games={s.games} layout={s.layout} caption={`Zustand ${s.label}`}>
        {#snippet time(game)}<input type="text" value={game.time} aria-label={`Anwurfzeit Spiel ${game.nr}`} style={inputStyle} />{/snippet}
      </ScheduleTable>
    {:else}
      <ScheduleTable games={s.games} layout={s.layout} caption={`Zustand ${s.label}`} />
    {/if}
  {/if}
{/each}

<style>
  .stack { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .links { margin: 0; font-size: var(--hoops-fs-body-sm); color: var(--hoops-page-fg); }
  .readout { margin: 8px 0 0; font-size: var(--hoops-fs-body-sm); color: var(--hoops-fg-soft); }
  .shout :global(.hoops-tbl tbody tr:not(.hoops-sch-group)) { background: var(--hoops-signal-400); }
</style>
