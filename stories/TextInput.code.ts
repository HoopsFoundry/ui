export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Standard mit Hilfetext -->
<div class="hoops-field">
  <label class="hoops-field-label" for="trikot">Trikotnummer <span class="req" aria-hidden="true">*</span></label>
  <div class="hoops-input-group">
    <input id="trikot" class="hoops-input hoops-input--default" type="text" inputmode="numeric" maxlength="2"
           placeholder="0 · 00 · 1–99" required aria-describedby="trikot-help" />
  </div>
  <div id="trikot-help" class="hoops-field-help">FIBA: 0, 00, einstellig (1–9), zweistellig (01–99).</div>
</div>

<!-- Optional -->
<div class="hoops-field">
  <label class="hoops-field-label" for="zweitname">Zweitname <span class="opt">Optional</span></label>
  <div class="hoops-input-group">
    <input id="zweitname" class="hoops-input hoops-input--default" type="text" placeholder="z.B. Sandro" />
  </div>
</div>

<!-- Fehler: is-error am Feld, aria-invalid am Input, Hilfetext mit --err -->
<div class="hoops-field is-error">
  <label class="hoops-field-label" for="trikot-err">Trikotnummer <span class="req" aria-hidden="true">*</span></label>
  <div class="hoops-input-group">
    <input id="trikot-err" class="hoops-input hoops-input--default" type="text" value="107" required
           aria-invalid="true" aria-describedby="trikot-err-help" />
  </div>
  <div id="trikot-err-help" class="hoops-field-help hoops-field-help--err">Ungültig: Nummern müssen FIBA-konform sein (max. 99).</div>
</div>

<!-- Gesperrt -->
<div class="hoops-field">
  <label class="hoops-field-label" for="spieler-id">Spieler-ID</label>
  <div class="hoops-input-group">
    <input id="spieler-id" class="hoops-input hoops-input--default" type="text" value="BBV-91842" disabled aria-describedby="spieler-id-help" />
  </div>
  <div id="spieler-id-help" class="hoops-field-help">Automatisch zugewiesen, nicht editierbar.</div>
</div>

<!-- Zusätze links und rechts, kompakte Höhe -->
<div class="hoops-field">
  <label class="hoops-field-label" for="betrag">Startgeld</label>
  <div class="hoops-input-group">
    <span class="hoops-addon">€</span>
    <input id="betrag" class="hoops-input hoops-input--compact" type="text" inputmode="decimal" />
    <span class="hoops-addon hoops-addon--right">pro Team</span>
  </div>
</div>`;

export const svelte = `<script>
  import TextInput from '@hoopsfoundry/ui/svelte/Input';

  let nummer = $state('');
</script>

<TextInput label="Trikotnummer" bind:value={nummer} placeholder="0 · 00 · 1–99"
  help="FIBA: 0, 00, einstellig (1–9), zweistellig (01–99)." required inputmode="numeric" maxlength={2} />

<TextInput label="Zweitname" optional="Optional" placeholder="z.B. Sandro" />

<TextInput label="Trikotnummer" value="107" state="error" required
  help="Ungültig: Nummern müssen FIBA-konform sein (max. 99)." />

<TextInput label="Spieler-ID" value="BBV-91842" disabled help="Automatisch zugewiesen, nicht editierbar." />

<TextInput label="Startgeld" density="compact" inputmode="decimal">
  {#snippet prefix()}€{/snippet}
  {#snippet suffix()}pro Team{/snippet}
</TextInput>`;

export const react = `import { TextInput } from '@hoopsfoundry/ui/react';

<TextInput label="Trikotnummer" placeholder="0 · 00 · 1–99" required inputMode="numeric" maxLength={2}
  help="FIBA: 0, 00, einstellig (1–9), zweistellig (01–99)." />

<TextInput label="Zweitname" optional="Optional" placeholder="z.B. Sandro" />

<TextInput label="Trikotnummer" defaultValue="107" state="error" required
  help="Ungültig: Nummern müssen FIBA-konform sein (max. 99)." />

<TextInput label="Spieler-ID" defaultValue="BBV-91842" disabled help="Automatisch zugewiesen, nicht editierbar." />

<TextInput label="Startgeld" density="compact" inputMode="decimal" prefix="€" suffix="pro Team" />`;
