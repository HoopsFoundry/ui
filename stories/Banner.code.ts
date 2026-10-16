export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Schweregrad: hoops-banner--info | --ok | --warn | --danger.
     role="alert" für warn und danger, role="status" für info und ok. -->
<div class="hoops-banner hoops-banner--warn" role="alert">
  <svg class="hoops-banner-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path d="M8 1.5L15 14H1z"/><path d="M8 6v3M8 11.5v.05"/>
  </svg>
  <div class="hoops-banner-body">
    <p class="hoops-banner-title">Hallenzeit knapp</p>
    Das passt nur mit weniger Runden in die Hallenzeit. <a href="/turnier/runden">Rundenzahl ändern</a>
  </div>
</div>

<!-- Ohne Symbol und ohne Titel -->
<div class="hoops-banner hoops-banner--info" role="status">
  <div class="hoops-banner-body">Geschätzte Gesamtdauer: 180 Minuten.</div>
</div>`;

export const svelte = `<script>
  import Banner from '@hoopsfoundry/ui/svelte/Banner';
</script>

<Banner>Geschätzte Gesamtdauer: 180 Minuten.</Banner>

<Banner severity="ok">Spielplan gespeichert.</Banner>

<Banner severity="warn" title="Hallenzeit knapp">
  Das passt nur mit weniger Runden in die Hallenzeit. <a href="/turnier/runden">Rundenzahl ändern</a>
</Banner>

<Banner severity="danger" title="Export fehlgeschlagen">Bitte erneut versuchen.</Banner>

<!-- Ohne Symbol; die Rolle lässt sich überschreiben -->
<Banner icon={false} role="status">Geschätzte Gesamtdauer: 180 Minuten.</Banner>`;

export const react = `import { Banner } from '@hoopsfoundry/ui/react';

<Banner>Geschätzte Gesamtdauer: 180 Minuten.</Banner>

<Banner severity="ok">Spielplan gespeichert.</Banner>

<Banner severity="warn" title="Hallenzeit knapp">
  Das passt nur mit weniger Runden in die Hallenzeit. <a href="/turnier/runden">Rundenzahl ändern</a>
</Banner>

<Banner severity="danger" title="Export fehlgeschlagen">Bitte erneut versuchen.</Banner>

{/* Ohne Symbol; die Rolle lässt sich überschreiben */}
<Banner icon={false} role="status">Geschätzte Gesamtdauer: 180 Minuten.</Banner>`;
