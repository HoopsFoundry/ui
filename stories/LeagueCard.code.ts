// Ligencard. Das Vanilla-Markup entspricht der Svelte-/React-Ausgabe (tests/league-code.test.ts); die Beispiele rendern bzw. kompilieren dort.
export const vanilla = `<!-- Ligencard: dss-league (compact: dss-league--compact). Die Tabelle ist eine echte table mit caption (versteckt, nennt den Ausschnitt).
     Eigene Zeile: class="is-own" plus versteckter Text. Zone: class="dss-league-zone dss-league-zone--up|playoff|down" plus versteckter Text und Legende.
     S, N, Diff und Form tragen dss-league-opt (bis 640 px ausgeblendet). Diff: Vorzeichen als Text, Klasse plus bzw. minus. -->
<div class="dss-league">
  <div class="dss-league-head">
    <div class="dss-league-heading">
      <h3 class="dss-league-title">Oberliga Nordhain Männer</h3>
      <p class="dss-league-sub">12 Teams · 66 von 132 Spielen gespielt</p>
    </div>
    <span class="dss-league-live">
      <span class="dss-live"><span class="dss-live-dot" aria-hidden="true"></span>Live</span>
      <span class="dss-league-live-n">2 Spiele laufen</span>
    </span>
  </div>
  <div class="dss-table-scroll dss-league-scroll" role="region" tabindex="0" aria-label="Tabelle: Oberliga Nordhain Männer">
    <table class="dss-tbl dss-tbl--touch dss-league-tbl">
      <caption class="dss-sr-only">Oberliga Nordhain Männer, Plätze 1 bis 4 von 12</caption>
      <thead>
        <tr>
          <th scope="col" class="dss-league-rank"><span aria-hidden="true">#</span><span class="dss-sr-only">Platz</span></th>
          <th scope="col">Mannschaft</th>
          <th scope="col" class="num"><span aria-hidden="true">SP</span><span class="dss-sr-only">Spiele</span></th>
          <th scope="col" class="num dss-league-opt"><span aria-hidden="true">Diff</span><span class="dss-sr-only">Korbdifferenz</span></th>
          <th scope="col" class="num dss-league-pts"><span aria-hidden="true">PKT</span><span class="dss-sr-only">Punkte</span></th>
        </tr>
      </thead>
      <tbody>
        <tr class="dss-league-zone dss-league-zone--up">
          <td class="dss-league-rank">1</td>
          <td class="dss-league-team"><span class="dss-league-who">Lindenberg Hawks<span class="dss-sr-only">, Aufstiegsplatz</span></span></td>
          <td class="num">11</td>
          <td class="num dss-league-opt plus">+31</td>
          <td class="num lead dss-league-pts">20</td>
        </tr>
        <tr>
          <td class="dss-league-rank">2</td>
          <td class="dss-league-team"><span class="dss-league-who">BG Seeberg</span></td>
          <td class="num">11</td>
          <td class="num dss-league-opt plus">+24</td>
          <td class="num lead dss-league-pts">18</td>
        </tr>
        <tr class="is-own">
          <td class="dss-league-rank">3</td>
          <td class="dss-league-team"><span class="dss-league-who"><a class="dss-link dss-league-link" href="/teams/nordhain">TSV Nordhain 1920</a><span class="dss-sr-only">, eigene Mannschaft</span></span></td>
          <td class="num">11</td>
          <td class="num dss-league-opt plus">+17</td>
          <td class="num lead dss-league-pts">16</td>
        </tr>
        <tr>
          <td class="dss-league-rank">4</td>
          <td class="dss-league-team"><span class="dss-league-who">TSV Elbach</span></td>
          <td class="num">11</td>
          <td class="num dss-league-opt minus">−3</td>
          <td class="num lead dss-league-pts">14</td>
        </tr>
      </tbody>
    </table>
  </div>
  <ul class="dss-league-legend" aria-label="Legende">
    <li><span class="dss-league-key dss-league-key--up" aria-hidden="true"></span>Aufstieg</li>
  </ul>
  <div class="dss-league-foot">
    <a class="dss-link dss-league-more" href="/liga/tabelle">Komplette Tabelle und Spielplan<span class="dss-sr-only">, Oberliga Nordhain Männer</span></a>
  </div>
</div>

<!-- Seitenleiste: dss-league--compact (Dichte compact, kein Untertitel) -->
<div class="dss-league dss-league--compact">
  <div class="dss-league-head">
    <div class="dss-league-heading">
      <h3 class="dss-league-title">Oberliga Nordhain Männer</h3>
    </div>
  </div>
  <div class="dss-table-scroll dss-league-scroll" role="region" tabindex="0" aria-label="Tabelle: Oberliga Nordhain Männer">
    <table class="dss-tbl dss-tbl--compact dss-league-tbl">
      <caption class="dss-sr-only">Oberliga Nordhain Männer, Plätze 1 bis 3 von 6</caption>
      <thead>
        <tr>
          <th scope="col" class="dss-league-rank"><span aria-hidden="true">#</span><span class="dss-sr-only">Platz</span></th>
          <th scope="col">Mannschaft</th>
          <th scope="col" class="num"><span aria-hidden="true">SP</span><span class="dss-sr-only">Spiele</span></th>
          <th scope="col" class="num dss-league-pts"><span aria-hidden="true">PKT</span><span class="dss-sr-only">Punkte</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="dss-league-rank">1</td>
          <td class="dss-league-team"><span class="dss-league-who">Lindenberg Hawks</span></td>
          <td class="num">11</td>
          <td class="num lead dss-league-pts">20</td>
        </tr>
        <tr>
          <td class="dss-league-rank">2</td>
          <td class="dss-league-team"><span class="dss-league-who">BG Seeberg</span></td>
          <td class="num">11</td>
          <td class="num lead dss-league-pts">18</td>
        </tr>
        <tr>
          <td class="dss-league-rank">3</td>
          <td class="dss-league-team"><span class="dss-league-who">TSV Nordhain 1920</span></td>
          <td class="num">11</td>
          <td class="num lead dss-league-pts">16</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;

const teamsJs = `{ rank: 1, name: 'Lindenberg Hawks', played: 11, points: 20, diff: 31, zone: 'up' },
    { rank: 2, name: 'BG Seeberg', played: 11, points: 18, diff: 24 },
    { rank: 3, name: 'TSV Nordhain 1920', played: 11, points: 16, diff: 17, own: true, href: '/teams/nordhain' },
    { rank: 4, name: 'TSV Elbach', played: 11, points: 14, diff: -3 },
    { rank: 5, name: 'SV Kiefernau', played: 11, points: 14, diff: -9 },
    { rank: 6, name: 'TuS Waldmark', played: 11, points: 12, diff: -12 },`;

export const svelte = `<script>
  import LeagueCard from '@bbv/dss-design-system/svelte/LeagueCard';

  // Die ganze Tabelle (oder ein Teil); die Karte wählt den Ausschnitt selbst: mit eigener Mannschaft
  // (own: true) zwei davor, die eigene und eine dahinter, sonst die ersten limit (Standard 3).
  const teams = [
    ${teamsJs}
  ];
</script>

<!-- Standard: #, Mannschaft, SP, PKT. columns schaltet S, N, Diff und Form zu (bis 640 px aus). -->
<LeagueCard
  title="Oberliga Nordhain Männer"
  {teams}
  teamCount={12}
  played={66}
  total={132}
  columns={['diff']}
  href="/liga/tabelle"
  live={2}
/>

<!-- Seitenleiste: size="compact", Logos und Kurznamen (logo/short an den Teams), Ebene: titleAs 'h2' bis 'h6' -->
<LeagueCard title="Oberliga Nordhain Männer" {teams} size="compact" logos names="short" titleAs="h2" />

<!-- Ohne eigene Mannschaft (own): die ersten limit Plätze -->
<LeagueCard title="Oberliga Nordhain Männer" teams={teams.map(({ own, ...team }) => team)} limit={5} />`;

export const react = `import { LeagueCard, type LeagueTeam } from '@bbv/dss-design-system/react';

// Die ganze Tabelle (oder ein Teil); die Karte wählt den Ausschnitt selbst: mit eigener Mannschaft
// (own: true) zwei davor, die eigene und eine dahinter, sonst die ersten limit (Standard 3).
const teams: LeagueTeam[] = [
  ${teamsJs.replace(/\n    /g, '\n  ')}
];

{/* Standard: #, Mannschaft, SP, PKT. columns schaltet S, N, Diff und Form zu (bis 640 px aus). */}
<LeagueCard
  title="Oberliga Nordhain Männer"
  teams={teams}
  teamCount={12}
  played={66}
  total={132}
  columns={['diff']}
  href="/liga/tabelle"
  live={2}
/>

{/* Seitenleiste: size="compact", Logos und Kurznamen (logo/short an den Teams), Ebene: titleAs 'h2' bis 'h6' */}
<LeagueCard title="Oberliga Nordhain Männer" teams={teams} size="compact" logos names="short" titleAs="h2" />

{/* Ohne eigene Mannschaft (own): die ersten limit Plätze */}
<LeagueCard title="Oberliga Nordhain Männer" teams={teams.map(({ own, ...team }) => team)} limit={5} />`;

export const ebeneSvelte = `<script>
  import HeadingLevel from '@bbv/dss-design-system/svelte/HeadingLevel';
  import LeagueCard from '@bbv/dss-design-system/svelte/LeagueCard';

  const teams = [{ rank: 1, name: 'Lindenberg Hawks', played: 11, points: 20 }];
</script>

<!-- Unter einer h2 der Seite: die Ligencard bekommt h3 (Standard) bzw. die Ebene aus HeadingLevel; titleAs gewinnt -->
<h2>Tabellen</h2>
<HeadingLevel level={4}>
  <LeagueCard title="Oberliga Nordhain Männer" {teams} />
  <LeagueCard title="Kreisliga Süd" {teams} titleAs="h5" />
</HeadingLevel>`;

export const ebeneReact = `import { HeadingLevel, LeagueCard, type LeagueTeam } from '@bbv/dss-design-system/react';

const teams: LeagueTeam[] = [{ rank: 1, name: 'Lindenberg Hawks', played: 11, points: 20 }];

{/* Unter einer h2 der Seite: die Ligencard bekommt h3 (Standard) bzw. die Ebene aus HeadingLevel; titleAs gewinnt */}
<h2>Tabellen</h2>
<HeadingLevel level={4}>
  <LeagueCard title="Oberliga Nordhain Männer" teams={teams} />
  <LeagueCard title="Kreisliga Süd" teams={teams} titleAs="h5" />
</HeadingLevel>`;

export const funktionenJs = `import { leagueWindow, leagueSummary, formLabel, windowLabel } from '@bbv/dss-design-system/league.js';

const teams = [
  { rank: 1, name: 'Lindenberg Hawks', played: 11, points: 20 },
  { rank: 2, name: 'BG Seeberg', played: 11, points: 18 },
  { rank: 3, name: 'TSV Nordhain 1920', played: 11, points: 16, own: true },
  { rank: 4, name: 'TSV Elbach', played: 11, points: 14 },
  { rank: 5, name: 'SV Kiefernau', played: 11, points: 14 },
];

// Ausschnitt: mit eigener Mannschaft zwei davor, die eigene, eine dahinter (an den Rändern verschoben); sonst die ersten limit
const rows = leagueWindow(teams); // Plätze 1 bis 4
leagueWindow(teams, { limit: 2 }); // wegen der eigenen Mannschaft trotzdem vier Zeilen
leagueWindow(teams.map(({ own, ...team }) => team), { limit: 2 }); // Plätze 1 und 2

leagueSummary({ teamCount: 12, played: 66, total: 132 }); // '12 Teams · 66 von 132 Spielen gespielt'
leagueSummary({ teamCount: 1 }); // '1 Team'
windowLabel(rows, 12); // 'Plätze 1 bis 4 von 12'
formLabel(['S', 'S', 'N']); // 'Form: Sieg, Sieg, Niederlage'`;
