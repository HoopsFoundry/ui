// Teamkarte (Platzhalter-URLs für die Logo-Dateien); das Vanilla-Markup entspricht dem Svelte-/React-Ausgabe-Markup (tests/karten-code.test.ts)
export const vanilla = `<!-- Teamkarte: hoops-team--standard; compact: hoops-team--compact (Listenzeile).
     Klickbar: der Name in der Überschrift ist ein <a class="hoops-team-link"> oder <button class="hoops-team-link" type="button">,
     die Karte bekommt hoops-team--link (der Link deckt per ::after die ganze Karte ab). Blöcke, für die es keine Daten gibt, lässt du weg. -->
<div class="hoops-team hoops-team--standard hoops-team--link">
  <div class="hoops-team-head">
    <span class="hoops-team-logo hoops-team-logo--lg" aria-hidden="true"><img src="/logos/nordhain.svg" alt="" loading="lazy" /></span>
    <div class="hoops-team-who">
      <h3 class="hoops-team-nm"><a class="hoops-team-link" href="/teams/nordhain">TSV Nordhain 1920</a></h3>
      <div class="hoops-team-sub"><span>Bayernliga Süd</span><span>2026/27</span></div>
    </div>
  </div>
  <div class="hoops-team-vitals">
    <div>
      <div class="hoops-pc-v" aria-hidden="true">12–3</div>
      <div class="hoops-pc-l" aria-hidden="true">S–N</div>
      <span class="hoops-sr-only">Bilanz: 12 Siege, 3 Niederlagen</span>
    </div>
    <div>
      <div class="hoops-pc-v" aria-hidden="true">3</div>
      <div class="hoops-pc-l" aria-hidden="true">Platz von 12</div>
      <span class="hoops-sr-only">Tabellenplatz 3 von 12</span>
    </div>
  </div>
  <div class="hoops-team-games">
    <div class="hoops-team-game">
      <div class="hoops-team-game-l">Nächstes Spiel</div>
      <div class="hoops-team-game-row">
        <span class="hoops-chip hoops-chip--mono hoops-chip--sky" aria-hidden="true">vs.</span>
        <span class="hoops-team-game-opp"><span><span class="hoops-sr-only">Heimspiel gegen </span>Lindenberg Hawks</span></span>
        <span class="hoops-team-game-end">Sa, 25.05. · 19:30</span>
      </div>
      <div class="hoops-team-game-venue">Nordhain-Halle</div>
    </div>
    <div class="hoops-team-game">
      <div class="hoops-team-game-l">Letztes Spiel · Sa, 18.05.</div>
      <div class="hoops-team-game-row">
        <span class="hoops-chip hoops-chip--mono hoops-chip--amber" aria-hidden="true">@</span>
        <span class="hoops-team-game-opp"><span><span class="hoops-sr-only">Auswärtsspiel bei </span>BG Seeberg</span></span>
        <span class="hoops-team-game-end">
          <span class="hoops-chip hoops-chip--mono hoops-chip--ok" aria-hidden="true">S</span>
          <span class="hoops-team-game-score" aria-hidden="true">92 : 79</span>
          <span class="hoops-sr-only">Eigene 92, Gegner 79, Sieg</span>
        </span>
      </div>
    </div>
  </div>
  <div class="hoops-team-squad">14 Spieler · 3 Trainer</div>
  <div class="hoops-team-stats" role="group" aria-label="Saison-Statistik">
    <div class="hoops-team-sec" aria-hidden="true">Saison-Statistik</div>
    <div class="hoops-team-vitals">
      <div><div class="hoops-pc-v">48,2</div><div class="hoops-pc-l">2PP %</div></div>
      <div><div class="hoops-pc-v">41,3</div><div class="hoops-pc-l">TRB</div></div>
    </div>
  </div>
</div>

<!-- Listenzeile (compact) -->
<div class="hoops-team hoops-team--compact hoops-team--link">
  <span class="hoops-team-logo" aria-hidden="true"><img src="/logos/nordhain.svg" alt="" loading="lazy" /></span>
  <div class="hoops-team-who">
    <span class="hoops-team-nm"><a class="hoops-team-link" href="/teams/nordhain">TSV Nordhain 1920</a></span>
    <div class="hoops-team-sub"><span>Bayernliga Süd</span></div>
  </div>
  <span class="hoops-team-end">
    <span class="hoops-team-rec" aria-hidden="true">12–3</span>
    <span class="hoops-sr-only">Bilanz: 12 Siege, 3 Niederlagen</span>
    <span class="hoops-team-rank" aria-hidden="true">Platz 3</span>
    <span class="hoops-sr-only">Tabellenplatz 3</span>
  </span>
</div>`;

export const svelte = `<script>
  import TeamCard from '@hoopsfoundry/ui/svelte/TeamCard';

  const nordhain = {
    name: 'TSV Nordhain 1920',
    short: 'Nordhain',
    logo: '/logos/nordhain.svg',
    league: 'Bayernliga Süd',
    season: '2026/27',
    record: { w: 12, l: 3 },
    rank: 3,
    rankOf: 12,
    points: 24,
    next: { date: 'Sa, 25.05.', time: '19:30', opponent: { name: 'Lindenberg Hawks', short: 'Hawks' }, at: 'heim', venue: 'Nordhain-Halle' },
    last: { date: 'Sa, 18.05.', opponent: { name: 'BG Seeberg', short: 'Seeberg' }, ownScore: 92, opponentScore: 79, at: 'gast' },
    squad: { players: 14, staff: 3 },
  };
</script>

<!-- Alles außer name ist optional; was fehlt, erscheint nicht. href: die ganze Karte ist der Link (onclick: Button). -->
<TeamCard {...nordhain} href="/teams/nordhain" />

<!-- Saison-Statistik nur mit Daten: nur übergebene Felder erscheinen, ohne Feld entfällt der Block -->
<TeamCard {...nordhain} stats={{ twoPtPct: 48.2, threePtPct: 36.5, trb: 41.3, to: 12.1 }} />

<!-- Nur der Name -->
<TeamCard name="SV Kiefernau" />

<!-- Liste: size="compact", Kurzname und Logo -->
<TeamCard size="compact" name="TSV Nordhain 1920" short="Nordhain" logo="/logos/nordhain.svg" league="Bayernliga Süd" record={{ w: 12, l: 3 }} rank={3} href="/teams/nordhain" />

<!-- names="short": Kurzname (bis 640 px automatisch); logos: Logo/Initialen der Gegner; titleAs: 'h2' bis 'h6' -->
<TeamCard {...nordhain} names="short" logos titleAs="h2" />`;

export const react = `import { TeamCard, type TeamCardProps } from '@hoopsfoundry/ui/react';

const nordhain: TeamCardProps = {
  name: 'TSV Nordhain 1920',
  short: 'Nordhain',
  logo: '/logos/nordhain.svg',
  league: 'Bayernliga Süd',
  season: '2026/27',
  record: { w: 12, l: 3 },
  rank: 3,
  rankOf: 12,
  points: 24,
  next: { date: 'Sa, 25.05.', time: '19:30', opponent: { name: 'Lindenberg Hawks', short: 'Hawks' }, at: 'heim', venue: 'Nordhain-Halle' },
  last: { date: 'Sa, 18.05.', opponent: { name: 'BG Seeberg', short: 'Seeberg' }, ownScore: 92, opponentScore: 79, at: 'gast' },
  squad: { players: 14, staff: 3 },
};

{/* Alles außer name ist optional; was fehlt, erscheint nicht. href: die ganze Karte ist der Link (onClick: Button). */}
<TeamCard {...nordhain} href="/teams/nordhain" />

{/* Saison-Statistik nur mit Daten: nur übergebene Felder erscheinen, ohne Feld entfällt der Block */}
<TeamCard {...nordhain} stats={{ twoPtPct: 48.2, threePtPct: 36.5, trb: 41.3, to: 12.1 }} />

{/* Nur der Name */}
<TeamCard name="SV Kiefernau" />

{/* Liste: size="compact", Kurzname und Logo */}
<TeamCard size="compact" name="TSV Nordhain 1920" short="Nordhain" logo="/logos/nordhain.svg" league="Bayernliga Süd" record={{ w: 12, l: 3 }} rank={3} href="/teams/nordhain" />

{/* names="short": Kurzname (bis 640 px automatisch); logos: Logo/Initialen der Gegner; titleAs: 'h2' bis 'h6' */}
<TeamCard {...nordhain} names="short" logos titleAs="h2" />`;
