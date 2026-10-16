export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<div class="hoops-field">
  <label class="hoops-field-label" for="modus">Turniermodus</label>
  <select id="modus" class="hoops-select">
    <option value="round-robin">Jeder gegen Jeden</option>
    <option value="round-robin+finals">Gruppenphase + Endrunde</option>
    <option value="swiss">Einstufungsturnier (Schweizer System)</option>
  </select>
</div>

<!-- Fehler: is-error am Feld, aria-invalid am Select, Hilfetext mit --err -->
<div class="hoops-field is-error">
  <label class="hoops-field-label" for="modus-err">Turniermodus <span class="req" aria-hidden="true">*</span></label>
  <select id="modus-err" class="hoops-select" required aria-invalid="true" aria-describedby="modus-err-help">
    <option value="">Bitte wählen</option>
    <option value="round-robin">Jeder gegen Jeden</option>
  </select>
  <div id="modus-err-help" class="hoops-field-help hoops-field-help--err">Bitte einen Modus wählen.</div>
</div>

<!-- Kompakt und gesperrt -->
<div class="hoops-field">
  <label class="hoops-field-label" for="modus-kompakt">Turniermodus</label>
  <select id="modus-kompakt" class="hoops-select hoops-select--compact" disabled>
    <option>Jeder gegen Jeden</option>
  </select>
</div>`;

export const svelte = `<script>
  import Select from '@hoopsfoundry/ui/svelte/Select';

  const options = [
    { value: 'round-robin', label: 'Jeder gegen Jeden' },
    { value: 'round-robin+finals', label: 'Gruppenphase + Endrunde' },
    { value: 'swiss', label: 'Einstufungsturnier (Schweizer System)' },
  ];
  let modus = $state('round-robin');
</script>

<Select label="Turniermodus" {options} bind:value={modus} />
<Select label="Turniermodus" {options} bind:value={modus} required state="error" help="Bitte einen Modus wählen." />
<Select label="Turniermodus" {options} bind:value={modus} density="compact" disabled />`;

export const react = `import { Select } from '@hoopsfoundry/ui/react';

const options = [
  { value: 'round-robin', label: 'Jeder gegen Jeden' },
  { value: 'round-robin+finals', label: 'Gruppenphase + Endrunde' },
  { value: 'swiss', label: 'Einstufungsturnier (Schweizer System)' },
];

<Select label="Turniermodus" options={options} defaultValue="round-robin" />
<Select label="Turniermodus" options={options} required state="error" help="Bitte einen Modus wählen." />
<Select label="Turniermodus" options={options} density="compact" disabled />`;
