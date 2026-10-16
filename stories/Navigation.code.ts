const setup = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->
`;

// ── TopBar ──
export const topBarVanilla = `${setup}
<!-- hoops-topbar--dark ist Pflicht (ohne den Modifier ist es die helle Leiste des Vereinsregisters) -->
<div class="hoops-topbar hoops-topbar--dark">
  <div class="hoops-topbar-brand">
    <span class="hoops-topbar-mark" aria-hidden="true">D</span>
    HoopsFoundry UI
  </div>
  <!-- Kontext: Live (Puls, Spielstand, Uhr) oder Admin (nur Text) -->
  <div class="hoops-topbar-ctx">
    <span class="hoops-topbar-live">Live</span>
    <span>BBL · 17. Spieltag</span>
    <span class="hoops-topbar-score">87 : 64</span>
    <span class="hoops-topbar-clock">Q4 · 02:14</span>
  </div>
  <span class="hoops-topbar-spacer"></span>
  <div class="hoops-topbar-user">
    <span class="hoops-topbar-av">SR</span>
    Sven R.
  </div>
</div>`;

export const topBarSvelte = `<script>
  import TopBar from '@hoopsfoundry/ui/svelte/TopBar';
  import Button from '@hoopsfoundry/ui/svelte/Button';
</script>

<!-- context: 'default' | 'live' | 'admin' -->
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

<!-- Eigene Inhalte über Snippets: leading, center, actions -->
<TopBar brand="HoopsFoundry UI" mark="D" contained>
  {#snippet actions()}
    <Button variant="secondary" size="sm">Hilfe</Button>
  {/snippet}
</TopBar>`;

export const topBarReact = `import { Button, TopBar } from '@hoopsfoundry/ui/react';

export function Kopf() {
  return (
    <>
      {/* context: 'default' | 'live' | 'admin'; as="header" macht die Leiste zur banner-Landmark */}
      <TopBar
        as="header"
        brand="HoopsFoundry UI"
        mark="D"
        context="live"
        matchLabel="BBL · 17. Spieltag"
        score="87 : 64"
        clock="Q4 · 02:14"
        user="Sven R."
        userInitials="SR"
      />

      {/* Eigene Inhalte über leading, center, actions */}
      <TopBar brand="HoopsFoundry UI" mark="D" contained actions={<Button variant="secondary" size="sm">Hilfe</Button>} />
    </>
  );
}`;

// ── BottomNav ──
export const bottomNavVanilla = `${setup}
<!-- Symbole: <use href="#i-…"> braucht das Icon-Sprite auf der Seite.
     Aktuelle Seite: is-active und aria-current="page". Auswahl wechseln musst du selbst ergänzen. -->
<nav class="hoops-bnav" aria-label="Hauptnavigation">
  <button type="button" class="hoops-bnav-item is-active" aria-current="page">
    <svg class="hoops-bnav-ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><use href="#i-home"></use></svg>
    <span class="hoops-bnav-lbl">Übersicht</span>
  </button>
  <button type="button" class="hoops-bnav-item">
    <svg class="hoops-bnav-ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><use href="#i-roster"></use></svg>
    <span class="hoops-bnav-lbl">Roster</span>
  </button>
  <!-- Mittelaktion: das Label steht als aria-label, es wird nicht angezeigt -->
  <button type="button" class="hoops-bnav-fab" aria-label="Erfassen">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M12 5v14M5 12h14"/></svg>
  </button>
  <button type="button" class="hoops-bnav-item">
    <svg class="hoops-bnav-ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><use href="#i-foul-p"></use></svg>
    <span class="hoops-bnav-lbl">Fouls</span>
    <span class="hoops-bnav-badge">3</span>
  </button>
</nav>`;

export const bottomNavSvelte = `<script>
  import BottomNav from '@hoopsfoundry/ui/svelte/BottomNav';

  const items = [
    { id: 'overview', label: 'Übersicht', icon: 'i-home' },
    { id: 'roster', label: 'Roster', icon: 'i-roster' },
    { id: 'score', label: 'Erfassen', icon: 'i-plus', fab: true },
    { id: 'foul', label: 'Fouls', icon: 'i-foul-p', badge: 3 },
    { id: 'settings', label: 'Settings', icon: 'i-cog' },
  ];
  let value = $state('overview');
</script>

<!-- Der FAB ändert value nicht, er ruft nur onaction auf. Mit href wird ein Eintrag zum Link. -->
<BottomNav {items} bind:value onaction={(id) => console.log('Aktion', id)} />`;

export const bottomNavReact = `import { useState } from 'react';
import { BottomNav, type BottomNavItem } from '@hoopsfoundry/ui/react';

const items: BottomNavItem[] = [
  { id: 'overview', label: 'Übersicht', icon: 'home' },
  { id: 'roster', label: 'Roster', icon: 'roster' },
  { id: 'score', label: 'Erfassen', icon: 'plus', fab: true },
  { id: 'foul', label: 'Fouls', icon: 'foul-p', badge: 3 },
  { id: 'settings', label: 'Settings', icon: 'cog' },
];

export function Fuss() {
  const [value, setValue] = useState('overview');
  // Der FAB ändert value nicht, er ruft nur onAction auf. Mit href wird ein Eintrag zum Link.
  return <BottomNav items={items} value={value} onValueChange={setValue} onAction={(id) => console.log('Aktion', id)} />;
}`;

// ── Breadcrumbs ──
export const breadcrumbsVanilla = `${setup}
<!-- Varianten: hoops-crumbs--plain | --tagged | --chip. Bei chip heißen die Einträge hoops-crumbs-chip statt hoops-crumbs-item.
     Der letzte Eintrag ist die aktuelle Seite: kein Link, aria-current="page". -->
<nav class="hoops-crumbs hoops-crumbs--plain" aria-label="Breadcrumb">
  <a class="hoops-crumbs-item" href="/verband">Verband</a>
  <svg class="hoops-crumbs-sep" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>
  <a class="hoops-crumbs-item" href="/bayernliga">Bayernliga</a>
  <svg class="hoops-crumbs-sep" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6"/></svg>
  <span class="hoops-crumbs-item is-current" aria-current="page">Roster</span>
</nav>`;

export const breadcrumbsSvelte = `<script>
  import Breadcrumbs from '@hoopsfoundry/ui/svelte/Breadcrumbs';
</script>

<!-- variant: 'plain' | 'tagged' | 'chip'. Das letzte Element ist die aktuelle Seite (kein Link). -->
<Breadcrumbs
  items={[
    { label: 'Verband', href: '/verband' },
    { label: 'Bayernliga', href: '/bayernliga' },
    { label: 'Roster' },
  ]}
/>

<!-- tagged: Kontext-Kürzel je Eintrag -->
<Breadcrumbs
  variant="tagged"
  items={[
    { label: 'Verband', href: '/verband', tag: 'Org' },
    { label: 'Bayernliga', href: '/bayernliga', tag: 'Liga' },
    { label: 'Roster', tag: 'View' },
  ]}
/>`;

export const breadcrumbsReact = `import { Breadcrumbs } from '@hoopsfoundry/ui/react';

export function Pfad() {
  return (
    <>
      {/* variant: 'plain' | 'tagged' | 'chip'. Das letzte Element ist die aktuelle Seite (kein Link). */}
      <Breadcrumbs
        items={[
          { label: 'Verband', href: '/verband' },
          { label: 'Bayernliga', href: '/bayernliga' },
          { label: 'Roster' },
        ]}
      />

      {/* chip: Pill-Stil für schmale Bildschirme */}
      <Breadcrumbs
        variant="chip"
        items={[
          { label: 'Verband', href: '/verband' },
          { label: 'Roster' },
        ]}
      />
    </>
  );
}`;

// ── Stepper ──
export const stepperVanilla = `${setup}
<!-- Layouts: hoops-step--h (horizontal), hoops-step--c (kompakt), hoops-step--v (vertikal).
     Zustand je Schritt: is-done | is-current | is-pending. Der Zustand steht zusätzlich als unsichtbarer Text im Label. -->
<ol class="hoops-step hoops-step--h" aria-label="Fortschritt">
  <li class="hoops-step-item is-done">
    <span class="hoops-step-dot" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>
    </span>
    <div class="hoops-step-label">Spiel-Daten<span class="hoops-sr-only"> (erledigt)</span></div>
    <span class="hoops-step-line" aria-hidden="true"></span>
  </li>
  <li class="hoops-step-item is-current" aria-current="step">
    <span class="hoops-step-dot" aria-hidden="true"><span>2</span></span>
    <div class="hoops-step-label">Aufstellungen<span class="hoops-sr-only"> (aktuell)</span></div>
    <span class="hoops-step-line" aria-hidden="true"></span>
  </li>
  <li class="hoops-step-item is-pending">
    <span class="hoops-step-dot" aria-hidden="true"><span>3</span></span>
    <div class="hoops-step-label">Freigabe<span class="hoops-sr-only"> (ausstehend)</span></div>
  </li>
</ol>`;

export const stepperSvelte = `<script>
  import Stepper from '@hoopsfoundry/ui/svelte/Stepper';

  let aktuell = $state(1);
  const namen = [
    { id: 's1', label: 'Spiel-Daten', description: 'Datum, Halle, Liga' },
    { id: 's2', label: 'Aufstellungen', description: 'Heim & Gast bestätigen' },
    { id: 's3', label: 'Freigabe', description: 'Unterschriften' },
  ];
  const steps = $derived(
    namen.map((s, i) => ({ ...s, state: i < aktuell ? 'done' : i === aktuell ? 'current' : 'pending' })),
  );
</script>

<!-- variant: 'horizontal' | 'compact' | 'vertical'. Mit onstep sind erledigte und der aktuelle Schritt Schaltflächen. -->
<Stepper {steps} variant="vertical" onstep={(id) => (aktuell = namen.findIndex((s) => s.id === id))} />`;

export const stepperReact = `import { useState } from 'react';
import { Stepper, type StepItem } from '@hoopsfoundry/ui/react';

const namen = [
  { id: 's1', label: 'Spiel-Daten', description: 'Datum, Halle, Liga' },
  { id: 's2', label: 'Aufstellungen', description: 'Heim & Gast bestätigen' },
  { id: 's3', label: 'Freigabe', description: 'Unterschriften' },
];

export function Setup() {
  const [aktuell, setAktuell] = useState(1);
  const steps: StepItem[] = namen.map((s, i) => ({
    ...s,
    state: i < aktuell ? 'done' : i === aktuell ? 'current' : 'pending',
  }));
  // variant: 'horizontal' | 'compact' | 'vertical'. Mit onStep sind erledigte und der aktuelle Schritt Schaltflächen.
  return <Stepper steps={steps} variant="vertical" onStep={(id) => setAktuell(namen.findIndex((s) => s.id === id))} />;
}`;
