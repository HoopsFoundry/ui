<script lang="ts">
  import MatchCard from '../../svelte/MatchCard.svelte';
  import PlayerCard from '../../svelte/PlayerCard.svelte';
  import Skeleton from '../../svelte/Skeleton.svelte';

  // Erfundene Vereinslogos (nur Storybook); SV Kiefernau hat kein Logo und zeigt die Initialen
  // Demo-Fotos (nur Storybook): Foto und erfundener Name gehören zusammen, siehe players.ts und assets/players/CREDITS.md
  import { PLAYERS } from './players';

  // Erfundene Vereinslogos (nur Storybook); SV Kiefernau hat kein Logo und zeigt die Initialen
  import nordhainLogo from '../assets/logos/nordhain.svg';
  import hawksLogo from '../assets/logos/hawks.svg';
  import seebergLogo from '../assets/logos/seeberg.svg';

  let { example }: { example: string } = $props();

  const NORDHAIN = { name: 'TSV Nordhain 1920', short: 'TSV N.', logo: nordhainLogo };
  const HAWKS = { name: 'Lindenberg Hawks', short: 'Hawks', logo: hawksLogo };
  const SEEBERG = { name: 'BG Seeberg', short: 'Seeberg', logo: seebergLogo };
  const KIEFERNAU = { name: 'SV Kiefernau', short: 'Kiefernau' };

  // Ungültige Bilddaten: der Browser meldet einen Ladefehler (onerror), ohne eine Anfrage ins Netz
  const KAPUTT = 'data:image/jpeg;base64,AAAA';
  const TANNER = [{ label: 'PPG', value: '17.4', accent: true }, { label: 'APG', value: '6.2' }, { label: 'RPG', value: '3.1' }, { label: 'EFF', value: '22.8' }];

  const noop = () => {};

  // Erzwingt einen Zustand auf dem Wurzelelement der Karte (die Svelte-Karten haben keine class-Prop)
  function mark(node: HTMLElement, cls: string) {
    const target = node.querySelector<HTMLElement>('.hoops-match, .hoops-pc-row');
    if (cls && target) target.classList.add(...cls.split(' '));
  }

  const cols = ['Standard', 'Hover', 'Fokus', 'Aktiv'] as const;
  const stateClass: Record<(typeof cols)[number], string> = {
    Standard: '',
    Hover: 'pseudo-hover',
    Fokus: 'pseudo-focus-visible',
    Aktiv: 'pseudo-hover pseudo-active',
  };
</script>

{#if example === 'spiel'}
  <div class="grid3">
    <MatchCard state="scheduled" league="Bayernliga Süd" matchday="17. Spieltag" date="Sa, 25. Mai" time="19:30" venue="Nordhain-Halle" heim={{ name: 'TSV Nordhain' }} gast={{ name: 'Lindenberg Hawks' }} />
    <MatchCard state="live" league="Bayernliga Süd" matchday="17. Spieltag" period={4} clock="02:14" venue="Nordhain-Halle" heim={{ name: 'TSV Nordhain', score: 87 }} gast={{ name: 'Lindenberg Hawks', score: 64 }} />
    <MatchCard state="finished" league="Bayernliga Süd" matchday="16. Spieltag" venue="Nordhain-Halle" heim={{ name: 'TSV Nordhain', score: 92 }} gast={{ name: 'BG Nordlicht', score: 79 }} />
  </div>
{:else if example === 'abschnitte'}
  <div class="grid3">
    <div>
      <div class="cap">period=&#123;3&#125; · Viertel</div>
      <MatchCard state="live" league="Bayernliga Süd" period={3} clock="06:40" heim={{ name: 'TSV Nordhain', score: 61 }} gast={{ name: 'Lindenberg Hawks', score: 58 }} />
    </div>
    <div>
      <div class="cap">periods=&#123;8&#125; period=&#123;5&#125; · Achtel</div>
      <MatchCard state="live" league="U10 Mini-Liga" period={5} periods={8} clock="03:10" heim={{ name: 'TSV Nordhain', score: 24 }} gast={{ name: 'Lindenberg Hawks', score: 22 }} />
    </div>
    <div>
      <div class="cap">period=&#123;5&#125; · Verlängerung</div>
      <MatchCard state="live" league="Bayernliga Süd" period={5} clock="02:05" heim={{ name: 'TSV Nordhain', score: 88 }} gast={{ name: 'Lindenberg Hawks', score: 88 }} />
    </div>
    <div>
      <div class="cap">period=&#123;6&#125; · 2. Verlängerung</div>
      <MatchCard state="live" league="Bayernliga Süd" period={6} clock="04:12" heim={{ name: 'TSV Nordhain', score: 95 }} gast={{ name: 'Lindenberg Hawks', score: 94 }} />
    </div>
  </div>
{:else if example === 'namen'}
  <div class="grid3">
    <div>
      <div class="cap">names="full" (Standard)</div>
      <MatchCard state="scheduled" league="Bayernliga Süd" date="Sa, 25. Mai" time="19:30" heim={NORDHAIN} gast={HAWKS} />
    </div>
    <div>
      <div class="cap">names="short"</div>
      <MatchCard state="scheduled" league="Bayernliga Süd" date="Sa, 25. Mai" time="19:30" names="short" heim={NORDHAIN} gast={HAWKS} />
    </div>
  </div>
{:else if example === 'logos'}
  <div class="grid3">
    <MatchCard state="scheduled" league="Bayernliga Süd" date="Sa, 25. Mai" time="19:30" logos heim={NORDHAIN} gast={HAWKS} />
    <MatchCard state="live" league="Bayernliga Süd" period={4} clock="02:14" logos names="short" heim={{ ...SEEBERG, score: 52 }} gast={{ ...KIEFERNAU, score: 48 }} />
    <MatchCard state="finished" league="Bayernliga Süd" matchday="16. Spieltag" logos heim={{ ...NORDHAIN, score: 92 }} gast={{ ...HAWKS, score: 79 }} />
  </div>
{:else if example === 'namen-handy'}
  <div class="device">
    <MatchCard state="scheduled" league="Bayernliga Süd" date="Sa, 25. Mai" time="19:30" logos heim={NORDHAIN} gast={HAWKS} />
  </div>
{:else if example === 'spieler'}
  <div class="stack">
    <div>
      <div class="cap">Compact · Roster-Zeile</div>
      <div class="list">
        <PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" team="heim" captain stat={22} statLabel="PTS" />
        <PlayerCard size="compact" jersey="7" name="M. Okafor" position="SG" team="heim" stat={19} statLabel="PTS" />
        <PlayerCard size="compact" jersey="13" name="K. Vogler" position="PF" team="heim" stat={12} statLabel="PTS" />
      </div>
    </div>
    <div>
      <div class="cap">Standard · Übersicht</div>
      <div class="grid2">
        <PlayerCard size="standard" jersey="4" name="J. Tanner" position="PG" team="heim" captain age="24 J." height_cm="188" vitals={[{ label: 'PPG', value: '17.4', accent: true }, { label: 'APG', value: '6.2' }, { label: 'RPG', value: '3.1' }, { label: 'EFF', value: '22.8' }]} />
        <PlayerCard size="standard" jersey="15" name="D. Hollis" position="C" team="heim" age="29 J." height_cm="208" vitals={[{ label: 'PPG', value: '12.1' }, { label: 'RPG', value: '9.8', accent: true }, { label: 'BPG', value: '1.4' }, { label: 'EFF', value: '18.5' }]} />
      </div>
    </div>
    <div>
      <div class="cap">Hero · Profil (immer dunkel)</div>
      <PlayerCard size="hero" jersey="4" name="J. Tanner" position="PG" captain age="24 J." height_cm="188" vitals={[{ label: 'PPG', value: '17.4', accent: true }, { label: 'APG', value: '6.2' }, { label: 'STL', value: '2.1' }, { label: '3P%', value: '41.8' }]} />
    </div>
  </div>
{:else if example === 'spieler-foto'}
  <div class="stack">
    <div>
      <div class="cap">Compact · mit Foto (Avatar 32 px, Trikotnummer als Badge) und ohne</div>
      <div class="list">
        <PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" team="heim" captain stat={22} statLabel="PTS" photo={PLAYERS.tanner.photo} />
        <PlayerCard size="compact" jersey="7" name="M. Okafor" position="SG" team="heim" stat={19} statLabel="PTS" photo={PLAYERS.okafor.photo} />
        <PlayerCard size="compact" jersey="13" name="K. Vogler" position="PF" team="heim" stat={12} statLabel="PTS" photo={PLAYERS.vogler.photo} />
        <PlayerCard size="compact" jersey="15" name="D. Hollis" position="C" team="heim" stat={9} statLabel="PTS" />
      </div>
    </div>
    <div>
      <div class="cap">Standard · Kopfbild 64 px</div>
      <div class="grid2">
        <PlayerCard size="standard" jersey="4" name="J. Tanner" position="PG" team="heim" captain age="24 J." height_cm="188" photo={PLAYERS.tanner.photo} vitals={TANNER} />
        <PlayerCard size="standard" jersey="15" name="D. Hollis" position="C" team="gast" age="29 J." height_cm="208" photo={PLAYERS.hollis.photo} vitals={[{ label: 'PPG', value: '12.1' }, { label: 'RPG', value: '9.8', accent: true }, { label: 'BPG', value: '1.4' }, { label: 'EFF', value: '18.5' }]} />
      </div>
    </div>
    <div>
      <div class="cap">Hero · Porträt links mit Verlauf nach Dunkel (immer dunkel)</div>
      <PlayerCard size="hero" jersey="4" name="J. Tanner" position="PG" captain age="24 J." height_cm="188" photo={PLAYERS.tanner.photo} vitals={[{ label: 'PPG', value: '17.4', accent: true }, { label: 'APG', value: '6.2' }, { label: 'STL', value: '2.1' }, { label: '3P%', value: '41.8' }]} />
    </div>
  </div>
{:else if example === 'spieler-foto-handy'}
  <div class="device">
    <PlayerCard size="hero" jersey="4" name="J. Tanner" position="PG" captain age="24 J." height_cm="188" photo={PLAYERS.tanner.photo} vitals={[{ label: 'PPG', value: '17.4', accent: true }, { label: 'APG', value: '6.2' }, { label: 'STL', value: '2.1' }, { label: '3P%', value: '41.8' }]} />
  </div>
{:else if example === 'spieler-foto-fallback'}
  <div class="stack">
    <div>
      <div class="cap">Das Bild lädt nicht (<code>photo</code> ist ungültig): die Trikotmarke erscheint, kein kaputtes Bildsymbol</div>
      <div class="list">
        <PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" team="heim" captain stat={22} statLabel="PTS" photo={KAPUTT} />
      </div>
    </div>
    <div class="grid2">
      <div>
        <div class="cap">Standard · Ladefehler</div>
        <PlayerCard size="standard" jersey="4" name="J. Tanner" position="PG" team="heim" age="24 J." height_cm="188" photo={KAPUTT} vitals={TANNER} />
      </div>
      <div>
        <div class="cap">Standard · <code>photo=""</code></div>
        <PlayerCard size="standard" jersey="4" name="J. Tanner" position="PG" team="heim" age="24 J." height_cm="188" photo="" vitals={TANNER} />
      </div>
    </div>
    <div>
      <div class="cap">Hero · Ladefehler</div>
      <PlayerCard size="hero" jersey="4" name="J. Tanner" position="PG" captain age="24 J." height_cm="188" photo={KAPUTT} vitals={[{ label: 'PPG', value: '17.4', accent: true }, { label: 'APG', value: '6.2' }, { label: 'STL', value: '2.1' }, { label: '3P%', value: '41.8' }]} />
    </div>
  </div>
{:else if example === 'do-foto-alt'}
  <div class="narrow">
    <PlayerCard size="compact" jersey="7" name="M. Okafor" position="SG" team="heim" stat={19} statLabel="PTS" photo={PLAYERS.okafor.photo} />
    <p class="read">Screenreader: „7, M. Okafor“ (Bild bleibt stumm)</p>
  </div>
{:else if example === 'dont-foto-alt'}
  <div class="narrow">
    <PlayerCard size="compact" jersey="7" name="M. Okafor" position="SG" team="heim" stat={19} statLabel="PTS" photo={PLAYERS.okafor.photo} photoAlt="M. Okafor" />
    <p class="read">Screenreader: „Bild M. Okafor“, dann „7, M. Okafor“ (Name doppelt)</p>
  </div>
{:else if example === 'do-foto-ausschnitt'}
  <div class="narrow">
    <PlayerCard size="standard" jersey={PLAYERS.mertens.jersey} name={PLAYERS.mertens.name} position={PLAYERS.mertens.position} team="gast" age="26 J." height_cm="198" photo={PLAYERS.mertens.photo} vitals={[{ label: 'PPG', value: '9.4' }, { label: 'RPG', value: '6.0' }]} />
  </div>
{:else if example === 'dont-foto-ausschnitt'}
  <!-- Das Bild zeigt nur einen Ausschnitt aus dem Hintergrund (oben links); nur Doku, per CSS `object-fit: none` nachgestellt -->
  <div class="narrow bad-crop">
    <PlayerCard size="standard" jersey={PLAYERS.mertens.jersey} name={PLAYERS.mertens.name} position={PLAYERS.mertens.position} team="gast" age="26 J." height_cm="198" photo={PLAYERS.mertens.photo} vitals={[{ label: 'PPG', value: '9.4' }, { label: 'RPG', value: '6.0' }]} />
  </div>
{:else if example === 'skeleton'}
  <div class="grid2">
    <div>
      <div class="cap">Spielerliste · 4 Zeilen</div>
      <Skeleton variant="row" count={4} />
    </div>
    <div class="col">
      <div>
        <div class="cap">Spielkarte</div>
        <Skeleton variant="match" label="" />
        <div class="gap"></div>
        <Skeleton variant="match" label="" />
      </div>
      <div>
        <div class="cap">Bausteine: line, block</div>
        <Skeleton variant="line" width="80%" height="22px" label="" />
        <div class="gap-s"></div>
        <Skeleton variant="line" width="60%" height="14px" label="" />
        <div class="gap"></div>
        <Skeleton variant="block" height="140px" label="" />
      </div>
    </div>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface" tabindex="0" role="region" aria-label="Zustände von Spielkarte und Spielerzeile, seitlich scrollbar">
      <div class="states">
        <div class="colhead"></div>
        {#each cols as c}<div class="colhead">{c}</div>{/each}
        <div class="rowlabel">Spiel&shy;karte</div>
        {#each cols as c}
          <div class="cell" use:mark={stateClass[c]}>
            <MatchCard state="scheduled" league="BBL" date="Sa, 25. Mai" heim={{ name: 'TSV Nordhain' }} gast={{ name: 'Lindenberg Hawks' }} onclick={noop} />
          </div>
        {/each}
        <div class="rowlabel">Spieler&shy;zeile</div>
        {#each cols as c}
          <div class="cell" use:mark={stateClass[c]}>
            <PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" team="heim" stat={22} statLabel="PTS" onclick={noop} />
          </div>
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-skeleton'}
  <div class="narrow"><Skeleton variant="match" /></div>
{:else if example === 'dont-skeleton'}
  <div class="narrow"><Skeleton variant="block" height="140px" /></div>
{:else if example === 'do-platzhalter'}
  <div class="narrow">
    <PlayerCard size="standard" jersey="15" name="D. Hollis" position="C" team="heim" age="29 J." height_cm="208" vitals={[{ label: 'PPG', value: '12.1' }, { label: 'RPG', value: '9.8', accent: true }, { label: 'BPG', value: '–' }, { label: 'EFF', value: '18.5' }]} />
  </div>
{:else if example === 'dont-platzhalter'}
  <div class="narrow">
    <PlayerCard size="standard" jersey="15" name="D. Hollis" position="C" team="heim" age="29 J." height_cm="208" vitals={[{ label: 'PPG', value: '12.1' }, { label: 'RPG', value: '9.8', accent: true }, { label: 'BPG', value: '' }, { label: 'EFF', value: '18.5' }]} />
  </div>
{:else if example === 'do-status'}
  <div class="narrow">
    <MatchCard state="finished" league="Bayernliga Süd" matchday="16. Spieltag" venue="Nordhain-Halle" heim={{ name: 'TSV Nordhain', score: 92 }} gast={{ name: 'BG Nordlicht', score: 79 }} />
  </div>
{:else if example === 'dont-status'}
  <div class="narrow">
    <MatchCard state="live" league="Bayernliga Süd" matchday="16. Spieltag" period={4} clock="00:00" venue="Nordhain-Halle" heim={{ name: 'TSV Nordhain', score: 92 }} gast={{ name: 'BG Nordlicht', score: 79 }} />
  </div>
{:else if example === 'do-zeile'}
  <div class="narrow list">
    <PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" team="heim" captain stat={22} statLabel="PTS" />
    <PlayerCard size="compact" jersey="7" name="M. Okafor" position="SG" team="heim" stat={19} statLabel="PTS" />
    <PlayerCard size="compact" jersey="13" name="K. Vogler" position="PF" team="heim" stat={12} statLabel="PTS" />
  </div>
{:else if example === 'dont-zeile'}
  <div class="narrow list">
    <PlayerCard size="standard" jersey="4" name="J. Tanner" position="PG" team="heim" captain age="24 J." height_cm="188" vitals={[{ label: 'PTS', value: '22', accent: true }]} />
    <PlayerCard size="standard" jersey="7" name="M. Okafor" position="SG" team="heim" age="27 J." height_cm="194" vitals={[{ label: 'PTS', value: '19', accent: true }]} />
  </div>
{/if}

<style>
  .device { box-sizing: border-box; width: 100%; padding: 12px; } /* Vorschau in Gerätebreite: volle Breite des Iframes */
  .grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: 18px; align-items: start; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 18px; }
  .stack { display: flex; flex-direction: column; gap: 28px; }
  .col { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .narrow { width: 100%; max-width: 380px; }
  .read { margin: 8px 2px 0; font-size: var(--hoops-fs-caption); color: var(--hoops-page-mute); }
  /* Gegenbeispiel: Das Bild zeigt nur einen Ausschnitt aus dem Hintergrund (oben links), kein Gesicht */
  .bad-crop :global(.hoops-pc-img) { object-fit: none; object-position: 0% 0%; }
  .gap { height: 10px; }
  .gap-s { height: 8px; }
  .cap, .colhead, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 10px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 64px repeat(4, minmax(190px, 1fr)); gap: 16px 14px; align-items: center; }
  .cell { padding: 6px; }
</style>
