<script>
  import MatchCard from '../../svelte/MatchCard.svelte';
  import PlayerCard from '../../svelte/PlayerCard.svelte';
  import EmptyState from '../../svelte/EmptyState.svelte';
  import Skeleton from '../../svelte/Skeleton.svelte';

  let { view = 'match' } = $props();
</script>

<div style="padding: 32px;">

{#if view === 'match'}
  <div class="grid">
    <MatchCard
      state="scheduled"
      league="Bayernliga Süd"
      matchday="17. Spieltag"
      date="Sa, 25. Mai"
      time="19:30"
      venue="Nordhain-Halle · Nordhain"
      heim={{ name: 'TSV Nordhain 1920' }}
      gast={{ name: 'Lindenberg Hawks' }}
    />
    <MatchCard
      state="live"
      league="Bayernliga Süd"
      matchday="17. Spieltag"
      period={4}
      clock="02:14"
      venue="Nordhain-Halle"
      heim={{ name: 'TSV Nordhain 1920', score: 87 }}
      gast={{ name: 'Lindenberg Hawks',             score: 64 }}
    />
    <MatchCard
      state="finished"
      league="Bayernliga Süd"
      matchday="16. Spieltag"
      venue="Nordhain-Halle"
      heim={{ name: 'TSV Nordhain 1920', score: 92 }}
      gast={{ name: 'BG Nordlicht Süd',         score: 79 }}
    />
  </div>

{:else if view === 'player'}
  <div class="grid">
    <PlayerCard size="compact" jersey="4"  name="J. Tanner"  position="PG" team="heim" captain stat={22} statLabel="PTS" />
    <PlayerCard size="compact" jersey="7"  name="M. Okafor"   position="SG" team="heim" stat={19} statLabel="PTS" />
    <PlayerCard size="compact" jersey="13" name="K. Vogler"    position="PF" team="heim" stat={12} statLabel="PTS" />
  </div>

  <div style="margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px; max-width: 880px;">
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
        { label: 'PPG',   value: '17.4', accent: true },
        { label: 'APG',   value: '6.2' },
        { label: 'RPG',   value: '3.1' },
        { label: 'EFF',   value: '22.8' },
      ]}
    />
    <PlayerCard
      size="standard"
      jersey="15"
      name="D. Hollis"
      position="C"
      team="heim"
      age="29 J."
      height_cm="208"
      vitals={[
        { label: 'PPG', value: '12.1' },
        { label: 'RPG', value: '9.8', accent: true },
        { label: 'BPG', value: '1.4' },
        { label: 'EFF', value: '18.5' },
      ]}
    />
  </div>

  <div style="margin-top: 32px; max-width: 720px;">
    <PlayerCard
      size="hero"
      jersey="4"
      name="J. Tanner"
      position="PG"
      captain
      age="24 J."
      height_cm="188"
      vitals={[
        { label: 'PPG',  value: '17.4', accent: true },
        { label: 'APG',  value: '6.2' },
        { label: 'STL',  value: '2.1' },
        { label: '3P%',  value: '41.8' },
      ]}
    />
  </div>

{:else if view === 'empty'}
  <div class="grid">
    <EmptyState
      tone="neutral"
      title="Noch keine Spiele angesetzt"
      body="Sobald Spiele für den aktuellen Spieltag eingetragen sind, erscheinen sie hier."
      cta="Spielplan öffnen"
    />
    <EmptyState
      tone="action"
      title="Schiri-Lizenz fehlt"
      body="Für die Freigabe wird die Lizenz des Hauptschiedsrichters benötigt. Bitte ergänzen."
      cta="Lizenz hinzufügen"
    />
    <EmptyState
      tone="error"
      title="Verbindung zum Verband fehlgeschlagen"
      body="Wir konnten die Spielberichte nicht synchronisieren. Bitte erneut versuchen."
      cta="Erneut versuchen"
    />
  </div>

{:else if view === 'skeleton'}
  <div class="grid">
    <div>
      <div class="hdr">Player-List · 5 Reihen</div>
      <Skeleton variant="row" count={5} />
    </div>
    <div>
      <div class="hdr">Match-Card</div>
      <Skeleton variant="match" />
      <div style="height: 12px;"></div>
      <Skeleton variant="match" />
    </div>
    <div>
      <div class="hdr">Mixed</div>
      <Skeleton variant="line" width="80%" height="22px" />
      <div style="height: 8px;"></div>
      <Skeleton variant="line" width="60%" height="14px" />
      <div style="height: 14px;"></div>
      <Skeleton variant="block" height="140px" />
    </div>
  </div>
{/if}

</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 18px;
    max-width: 1080px;
  }
  .hdr {
    font-family: var(--hoops-font-mono); font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--hoops-page-mute);
    margin-bottom: 12px;
  }
</style>
