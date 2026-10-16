export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Tonalität: hoops-empty--neutral | --action | --error.
     Button passend dazu: hoops-btn--primary | --amber | --danger. Die Überschrift passt zur Gliederung (h2 bis h6; Rangfolge: titleAs, dann HeadingLevel, dann h3). -->
<div class="hoops-empty hoops-empty--neutral">
  <div class="hoops-empty-icon">
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16"/>
    </svg>
  </div>
  <h3 class="hoops-empty-title">Noch keine Spiele angesetzt</h3>
  <p class="hoops-empty-body">Sobald Spiele für den aktuellen Spieltag eingetragen sind, erscheinen sie hier.</p>
  <div class="hoops-empty-actions">
    <button type="button" class="hoops-btn hoops-btn--md hoops-btn--primary">Spielplan öffnen</button>
  </div>
</div>`;

export const svelte = `<script>
  import EmptyState from '@hoopsfoundry/ui/svelte/EmptyState';
  import Button from '@hoopsfoundry/ui/svelte/Button';
</script>

<EmptyState
  tone="neutral"
  title="Noch keine Spiele angesetzt"
  body="Sobald Spiele für den aktuellen Spieltag eingetragen sind, erscheinen sie hier."
  cta="Spielplan öffnen"
  onclick={openSpielplan}
/>

<EmptyState tone="action" title="Schiri-Lizenz fehlt" body="Für die Freigabe wird die Lizenz des Hauptschiedsrichters benötigt." cta="Lizenz hinzufügen" onclick={addLizenz} />

<EmptyState tone="error" title="Verbindung fehlgeschlagen" body="Wir konnten die Spielberichte nicht synchronisieren." cta="Erneut versuchen" onclick={reload} />

<!-- Eigene Aktionen als Snippet, Zusatztext als Kinder; Überschriftenebene nach der Seite -->
<EmptyState tone="neutral" title="Noch keine Mannschaft" titleAs="h2">
  {#snippet actions()}
    <Button variant="primary" onclick={anlegen}>Mannschaft anlegen</Button>
    <Button variant="ghost" onclick={uebernehmen}>Aus Vorsaison übernehmen</Button>
  {/snippet}
  Fragen? Die Hilfe erklärt den Ablauf.
</EmptyState>`;

export const react = `import { Button, EmptyState } from '@hoopsfoundry/ui/react';

<EmptyState
  tone="neutral"
  title="Noch keine Spiele angesetzt"
  body="Sobald Spiele für den aktuellen Spieltag eingetragen sind, erscheinen sie hier."
  cta="Spielplan öffnen"
  onCta={openSpielplan}
/>

<EmptyState tone="action" title="Schiri-Lizenz fehlt" body="Für die Freigabe wird die Lizenz des Hauptschiedsrichters benötigt." cta="Lizenz hinzufügen" onCta={addLizenz} />

<EmptyState tone="error" title="Verbindung fehlgeschlagen" body="Wir konnten die Spielberichte nicht synchronisieren." cta="Erneut versuchen" onCta={reload} />

{/* Eigene Aktionen als Prop, Zusatztext als Kinder; Überschriftenebene nach der Seite */}
<EmptyState
  tone="neutral"
  title="Noch keine Mannschaft"
  titleAs="h2"
  icon="calendar"
  actions={
    <>
      <Button variant="primary" onClick={anlegen}>Mannschaft anlegen</Button>
      <Button variant="ghost" onClick={uebernehmen}>Aus Vorsaison übernehmen</Button>
    </>
  }
>
  Fragen? Die Hilfe erklärt den Ablauf.
</EmptyState>`;
