export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Spielkarte: hoops-match--scheduled | --live | --finished.
     Klickbar als a (Link) oder button (type="button"), sonst div. Bei finished: Verlierer mit is-loser. -->
<div class="hoops-match hoops-match--live">
  <span class="hoops-match-head">
    <span class="hoops-match-league">
      <span>Bayernliga Süd</span><span class="hoops-match-muted">· 17. Spieltag</span>
    </span>
    <span class="hoops-match-live"><span class="hoops-match-pulse" aria-hidden="true"></span> Live · 4. Viertel 02:14</span>
  </span>
  <span class="hoops-match-body">
    <span class="hoops-match-team">
      <span class="hoops-match-dot" aria-hidden="true"></span>
      <span class="hoops-match-name">TSV Nordhain</span>
      <span class="hoops-match-score">87</span>
    </span>
    <span class="hoops-match-team hoops-match-team--gast">
      <span class="hoops-match-dot" aria-hidden="true"></span>
      <span class="hoops-match-name">Lindenberg Hawks</span>
      <span class="hoops-match-score">64</span>
    </span>
  </span>
  <span class="hoops-match-foot"><span>Nordhain-Halle</span></span>
</div>

<!-- Spielerzeile (compact); als button klickbar -->
<button type="button" class="hoops-pc-row">
  <span class="hoops-tn heim small captain">4</span>
  <span class="hoops-pc-who">
    <span class="hoops-pc-name">J. Tanner (C)</span>
    <span class="hoops-pc-meta">PG</span>
  </span>
  <span class="hoops-pos pg" aria-hidden="true">PG</span>
  <span class="hoops-pc-stat">22<span class="hoops-pc-stat-l">PTS</span></span>
</button>

<!-- Ladezustand: dekorativ verborgen, ein Status-Text meldet das Laden -->
<div class="hoops-skel-row" aria-hidden="true">
  <div class="hoops-skel hoops-skel--circle" style="width: 44px; height: 44px;"></div>
  <div class="hoops-skel-who">
    <div class="hoops-skel hoops-skel--line" style="width: 50%; height: 14px;"></div>
    <div class="hoops-skel hoops-skel--line" style="width: 30%; height: 10px; margin-top: 4px;"></div>
  </div>
  <div class="hoops-skel hoops-skel--line" style="width: 60px; height: 18px;"></div>
</div>
<span role="status" class="hoops-sr-only">Lädt …</span>`;

export const svelte = `<script>
  import MatchCard from '@hoopsfoundry/ui/svelte/MatchCard';
  import PlayerCard from '@hoopsfoundry/ui/svelte/PlayerCard';
  import Skeleton from '@hoopsfoundry/ui/svelte/Skeleton';
</script>

<MatchCard
  state="live"
  league="Bayernliga Süd"
  matchday="17. Spieltag"
  period={4}
  clock="02:14"
  venue="Nordhain-Halle"
  heim={{ name: 'TSV Nordhain', score: 87 }}
  gast={{ name: 'Lindenberg Hawks', score: 64 }}
/>

<!-- Mit href ein Link, mit onclick ein Button, sonst ein div -->
<MatchCard state="scheduled" heim={{ name: 'TSV Nordhain' }} gast={{ name: 'Lindenberg Hawks' }} href="/spiele/17" />

<PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" team="heim" captain stat={22} statLabel="PTS" onclick={openSpieler} />

<PlayerCard
  size="standard"
  jersey="4"
  name="J. Tanner"
  position="PG"
  team="heim"
  captain
  age="24 J."
  height_cm="188"
  vitals={[
    { label: 'PPG', value: '17.4', accent: true },
    { label: 'APG', value: '6.2' },
    { label: 'RPG', value: '3.1' },
    { label: 'EFF', value: '22.8' },
  ]}
/>

<!-- Ladezustand: fertige Muster oder Bausteine -->
<Skeleton variant="row" count={4} />
<Skeleton variant="match" />
<Skeleton variant="line" width="80%" height="22px" />`;

export const react = `import { MatchCard, PlayerCard, Skeleton } from '@hoopsfoundry/ui/react';

<MatchCard
  state="live"
  league="Bayernliga Süd"
  matchday="17. Spieltag"
  period={4}
  clock="02:14"
  venue="Nordhain-Halle"
  heim={{ name: 'TSV Nordhain', score: 87 }}
  gast={{ name: 'Lindenberg Hawks', score: 64 }}
/>

{/* Mit href ein Link, mit onClick ein Button, sonst ein div */}
<MatchCard state="scheduled" heim={{ name: 'TSV Nordhain' }} gast={{ name: 'Lindenberg Hawks' }} href="/spiele/17" />

<PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" team="heim" captain stat={22} statLabel="PTS" onClick={openSpieler} />

<PlayerCard
  size="standard"
  jersey="4"
  name="J. Tanner"
  position="PG"
  team="heim"
  captain
  age="24 J."
  heightCm="188"
  vitals={[
    { label: 'PPG', value: '17.4', accent: true },
    { label: 'APG', value: '6.2' },
    { label: 'RPG', value: '3.1' },
    { label: 'EFF', value: '22.8' },
  ]}
/>

{/* Ladezustand: fertige Muster oder Bausteine */}
<Skeleton variant="row" count={4} />
<Skeleton variant="match" />
<Skeleton variant="line" width="80%" height="22px" />`;


// Kurznamen und Logos der MatchCard (Platzhalter-URL für die Logo-Dateien)
export const namesVanilla = `<!-- Mit Logos: hoops-match--logos an der Karte, Logo zwischen Trikotpunkt und Name.
     names="short": hoops-team-name--short am Namen; ohne die Klasse erscheint der Kurzname nur bis 640 px Breite. -->
<div class="hoops-match hoops-match--scheduled hoops-match--logos">
  <span class="hoops-match-head">
    <span class="hoops-match-league"><span>Bayernliga Süd</span></span>
    <span class="hoops-match-when">Sa, 25. Mai · 19:30</span>
  </span>
  <span class="hoops-match-body">
    <span class="hoops-match-team">
      <span class="hoops-match-dot" aria-hidden="true"></span>
      <span class="hoops-team-logo" aria-hidden="true"><img src="/logos/nordhain.svg" alt="" loading="lazy" /></span>
      <span class="hoops-match-name hoops-team-name hoops-team-name--short"><span class="hoops-name-full">TSV Nordhain 1920</span><span class="hoops-name-short" aria-hidden="true">TSV N.</span></span>
    </span>
    <span class="hoops-match-team hoops-match-team--gast">
      <span class="hoops-match-dot" aria-hidden="true"></span>
      <span class="hoops-team-logo hoops-team-logo--initials" aria-hidden="true">LH</span>
      <span class="hoops-match-name">Lindenberg Hawks</span>
    </span>
  </span>
</div>`;

export const namesSvelte = `<script>
  import MatchCard from '@hoopsfoundry/ui/svelte/MatchCard';
</script>

<!-- names="short": Kurzname; logos: Logo bzw. Initialen. Bis 640 px Breite erscheint der Kurzname auch bei names="full". -->
<MatchCard
  state="scheduled"
  league="Bayernliga Süd"
  date="Sa, 25. Mai"
  time="19:30"
  names="short"
  logos
  heim={{ name: 'TSV Nordhain 1920', short: 'TSV N.', logo: '/logos/nordhain.svg' }}
  gast={{ name: 'Lindenberg Hawks', short: 'Hawks' }}
/>`;

export const namesReact = `import { MatchCard } from '@hoopsfoundry/ui/react';

{/* names="short": Kurzname; logos: Logo bzw. Initialen. Bis 640 px Breite erscheint der Kurzname auch bei names="full". */}
<MatchCard
  state="scheduled"
  league="Bayernliga Süd"
  date="Sa, 25. Mai"
  time="19:30"
  names="short"
  logos
  heim={{ name: 'TSV Nordhain 1920', short: 'TSV N.', logo: '/logos/nordhain.svg' }}
  gast={{ name: 'Lindenberg Hawks', short: 'Hawks' }}
/>`;


// Spielerkarte mit Foto (Platzhalter-URL für die Bilddatei)
export const photoVanilla = `<!-- Foto statt Trikotmarke: .hoops-pc-av um Bild und Badge; die Trikotnummer bleibt als .hoops-tn--badge.
     alt="" (dekorativ): der Name steht daneben. width/height gleich, lazy und async laden. -->
<div class="hoops-pc-row">
  <span class="hoops-pc-av">
    <img class="hoops-pc-img" src="/players/jt.jpg" alt="" width="32" height="32" loading="lazy" decoding="async" />
    <span class="hoops-tn hoops-tn--badge heim captain">4</span>
  </span>
  <span class="hoops-pc-who">
    <span class="hoops-pc-name">J. Tanner (C)</span>
    <span class="hoops-pc-meta">PG</span>
  </span>
  <span class="hoops-pos pg" aria-hidden="true">PG</span>
  <span class="hoops-pc-stat">22<span class="hoops-pc-stat-l">PTS</span></span>
</div>

<!-- Standard: .hoops-pc-av--lg (64 px) im Kartenkopf, Badge mit .hoops-tn--badge-lg -->
<div class="hoops-pc-card">
  <div class="hoops-pc-head">
    <span class="hoops-pc-av hoops-pc-av--lg">
      <img class="hoops-pc-img" src="/players/jt.jpg" alt="" width="64" height="64" loading="lazy" decoding="async" />
      <span class="hoops-tn hoops-tn--badge hoops-tn--badge-lg heim captain">4</span>
    </span>
    <div class="hoops-pc-who">
      <h3 class="hoops-pc-nm">J. Tanner</h3>
      <div class="hoops-pc-role"><span class="hoops-pos pg">PG</span><span class="hoops-pc-cap">Kapitän</span></div>
    </div>
  </div>
</div>

<!-- Hero: .hoops-pc-hero--photo, Bild und Badge im linken Feld -->
<div class="hoops-pc-hero hoops-pc-hero--photo">
  <div class="hoops-pc-hero-left">
    <img class="hoops-pc-img" src="/players/jt.jpg" alt="" width="200" height="200" loading="lazy" decoding="async" />
    <span class="hoops-tn hoops-tn--badge hoops-tn--badge-lg heim captain">4</span>
  </div>
  <div class="hoops-pc-hero-right">
    <h3 class="hoops-pc-nm">J. Tanner</h3>
    <div class="hoops-pc-role"><span class="hoops-pos pg">PG</span><span class="hoops-pc-cap">Kapitän</span></div>
  </div>
</div>`;

export const photoSvelte = `<script>
  import PlayerCard from '@hoopsfoundry/ui/svelte/PlayerCard';
</script>

<!-- photo: URL des Fotos. photoAlt bleibt leer (dekorativ), weil der Name danebensteht.
     Ohne photo, mit leerem photo oder bei Ladefehler erscheint die Trikotmarke. -->
<PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" captain stat={22} statLabel="PTS" photo="/players/jt.jpg" />

<PlayerCard
  size="hero"
  jersey="4"
  name="J. Tanner"
  position="PG"
  captain
  photo="/players/jt.jpg"
  vitals={[
    { label: 'PPG', value: '17.4', accent: true },
    { label: 'APG', value: '6.2' },
    { label: 'STL', value: '2.1' },
    { label: '3P%', value: '41.8' },
  ]}
/>

<!-- Nur wenn das Bild eine Information trägt, die nicht im Text steht -->
<PlayerCard size="standard" jersey="4" name="J. Tanner" photo="/players/jt.jpg" photoAlt="J. Tanner im Heimtrikot" />`;

export const photoReact = `import { PlayerCard } from '@hoopsfoundry/ui/react';

{/* photo: URL des Fotos. photoAlt bleibt leer (dekorativ), weil der Name danebensteht.
    Ohne photo, mit leerem photo oder bei Ladefehler erscheint die Trikotmarke. */}
<PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" captain stat={22} statLabel="PTS" photo="/players/jt.jpg" />

<PlayerCard
  size="hero"
  jersey="4"
  name="J. Tanner"
  position="PG"
  captain
  photo="/players/jt.jpg"
  vitals={[
    { label: 'PPG', value: '17.4', accent: true },
    { label: 'APG', value: '6.2' },
    { label: 'STL', value: '2.1' },
    { label: '3P%', value: '41.8' },
  ]}
/>

{/* Nur wenn das Bild eine Information trägt, die nicht im Text steht */}
<PlayerCard size="standard" jersey="4" name="J. Tanner" photo="/players/jt.jpg" photoAlt="J. Tanner im Heimtrikot" />`;
