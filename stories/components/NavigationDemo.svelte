<script>
  import TopBar from '../../svelte/TopBar.svelte';
  import BottomNav from '../../svelte/BottomNav.svelte';
  import Breadcrumbs from '../../svelte/Breadcrumbs.svelte';
  import Stepper from '../../svelte/Stepper.svelte';
  import Icon from '../../svelte/Icon.svelte';

  let { view = 'topbar' } = $props();

  // ── BottomNav presets ──
  const schiriNav = [
    { id: 'overview',  label: 'Übersicht', icon: 'i-home' },
    { id: 'roster',    label: 'Roster',    icon: 'i-roster' },
    { id: 'score',     label: 'Erfassen',  icon: 'i-plus',   fab: true },
    { id: 'foul',      label: 'Fouls',     icon: 'i-foul-p', badge: 3 },
    { id: 'settings',  label: 'Settings',  icon: 'i-cog' },
  ];
  const coachNav = [
    { id: 'team',    label: 'Team',     icon: 'i-roster' },
    { id: 'play',    label: 'Spielzug', icon: 'i-edit' },
    { id: 'stats',   label: 'Stats',    icon: 'i-stats' },
    { id: 'subs',    label: 'Wechsel',  icon: 'i-sub' },
  ];

  // ── Stepper presets ──
  const setupSteps = [
    { id: 's1', label: 'Spiel-Daten',  description: 'Datum, Halle, Liga',                     state: 'done' },
    { id: 's2', label: 'Aufstellungen', description: 'Heim & Gast bestätigen',                  state: 'done' },
    { id: 's3', label: 'Kampfgericht',  description: 'Schiri-Lizenzen & Crew',                  state: 'current' },
    { id: 's4', label: 'Freigabe',      description: 'Unterschriften & Übertragung',            state: 'pending' },
  ];
</script>

<div style="padding: 24px; display: flex; flex-direction: column; gap: 32px;">

{#if view === 'topbar' || view === 'all'}
  <section>
    <div class="hdr">Top-Bar · Live-Spiel</div>
    <div class="frame">
      <TopBar
        brand="HoopsFoundry UI"
        mark="D"
        context="live"
        matchLabel="BBL · 17. Spieltag"
        score="87 : 64"
        clock="Q4 · 02:14"
        user="Sven R."
        userInitials="SR"
      />
    </div>
  </section>

  <section>
    <div class="hdr">Top-Bar · Admin / Vereinsregister</div>
    <div class="frame">
      <TopBar
        brand="BBV"
        mark="B"
        context="admin"
        matchLabel="Vereinsregister · TSV Nordhain 1920"
        user="Jule Arendt"
        userInitials="JA"
      />
    </div>
  </section>

  <section>
    <div class="hdr">Top-Bar · Default</div>
    <div class="frame">
      <TopBar brand="HoopsFoundry UI Coach" mark="C" user="Timo B." userInitials="TB" />
    </div>
  </section>
{/if}

{#if view === 'bottomnav' || view === 'all'}
  <section>
    <div class="hdr">Bottom-Nav · Schiri-App (5 Items, FAB)</div>
    <div class="phone">
      <BottomNav items={schiriNav} />
    </div>
  </section>

  <section>
    <div class="hdr">Bottom-Nav · Coach-App (4 Items)</div>
    <div class="phone">
      <BottomNav items={coachNav} />
    </div>
  </section>
{/if}

{#if view === 'breadcrumbs' || view === 'all'}
  <section>
    <div class="hdr">Breadcrumbs · Plain</div>
    <div class="frame light">
      <Breadcrumbs items={[
        { label: 'Verband',    href: '#' },
        { label: 'Bayernliga', href: '#' },
        { label: 'TSV Nordhain',href: '#' },
        { label: 'Roster' },
      ]} />
    </div>
  </section>

  <section>
    <div class="hdr">Breadcrumbs · Tagged</div>
    <div class="frame light">
      <Breadcrumbs variant="tagged" items={[
        { label: 'Verband',    href: '#', tag: 'Org' },
        { label: 'Bayernliga', href: '#', tag: 'Liga' },
        { label: 'TSV Nordhain',href: '#', tag: 'Team' },
        { label: 'Roster', tag: 'View' },
      ]} />
    </div>
  </section>

  <section>
    <div class="hdr">Breadcrumbs · Chip</div>
    <div class="frame light">
      <Breadcrumbs variant="chip" items={[
        { label: 'Verband',    href: '#' },
        { label: 'Bayernliga', href: '#' },
        { label: 'Roster' },
      ]} />
    </div>
  </section>
{/if}

{#if view === 'stepper' || view === 'all'}
  <section>
    <div class="hdr">Stepper · Horizontal (Setup-Flow)</div>
    <div class="frame light wide">
      <Stepper steps={setupSteps} />
    </div>
  </section>

  <section>
    <div class="hdr">Stepper · Compact (Sticky-Header)</div>
    <div class="frame light" style="max-width: 420px;">
      <Stepper steps={setupSteps} variant="compact" />
    </div>
  </section>

  <section>
    <div class="hdr">Stepper · Vertikal (Sidebar-Wizard)</div>
    <div class="frame light" style="max-width: 460px;">
      <Stepper steps={setupSteps} variant="vertical" />
    </div>
  </section>
{/if}

<!-- Hidden sprite for BottomNav icons -->
<Icon name="home" size={0} />

</div>

<style>
  .hdr {
    font-family: var(--hoops-font-mono); font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--hoops-page-mute);
    margin-bottom: 10px;
  }
  .frame {
    border: 1px solid var(--hoops-page-line);
    border-radius: 14px;
    overflow: hidden;
    background: var(--hoops-n-0);
  }
  .frame.light { padding: 22px; }
  .frame.wide  { padding: 32px 28px; }
  .phone {
    width: 380px;
    border: 1px solid var(--hoops-page-line);
    border-radius: 24px;
    overflow: hidden;
    background: var(--hoops-n-0);
    padding: 8px 0 0;
  }
  .phone::before {
    content: ''; display: block; width: 100%; height: 200px;
    background: linear-gradient(0deg, var(--hoops-n-50), var(--hoops-n-0));
    border-bottom: 1px solid var(--hoops-page-line);
  }
</style>
