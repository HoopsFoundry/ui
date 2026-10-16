export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Mit Hinweistext: aria-describedby verknüpft ihn -->
<label class="hoops-check" for="rueckspiel">
  <input id="rueckspiel" type="checkbox" class="hoops-check-input" aria-describedby="rueckspiel-hint" checked />
  <span class="hoops-check-text">
    <span class="hoops-check-label">Mit Rückspiel</span>
    <span id="rueckspiel-hint" class="hoops-check-hint">Jede Paarung wird zweimal gespielt.</span>
  </span>
</label>

<!-- Kompakt -->
<label class="hoops-check hoops-check--compact" for="setzen">
  <input id="setzen" type="checkbox" class="hoops-check-input" />
  <span class="hoops-check-text"><span class="hoops-check-label">Teams setzen</span></span>
</label>

<!-- Gesperrt: is-disabled am Label, disabled am Input -->
<label class="hoops-check is-disabled" for="fixiert">
  <input id="fixiert" type="checkbox" class="hoops-check-input" disabled />
  <span class="hoops-check-text"><span class="hoops-check-label">Teams setzen</span></span>
</label>`;

export const svelte = `<script>
  import Checkbox from '@hoopsfoundry/ui/svelte/Checkbox';

  let rueckspiel = $state(true);
  let setzen = $state(false);
</script>

<Checkbox label="Mit Rückspiel" hint="Jede Paarung wird zweimal gespielt." bind:checked={rueckspiel} />
<Checkbox label="Teams setzen" bind:checked={setzen} density="compact" />
<Checkbox label="Teams setzen" checked={false} disabled />`;

export const react = `import { useState } from 'react';
import { Checkbox } from '@hoopsfoundry/ui/react';

const [rueckspiel, setRueckspiel] = useState(true);

<Checkbox label="Mit Rückspiel" hint="Jede Paarung wird zweimal gespielt."
  checked={rueckspiel} onChange={(e) => setRueckspiel(e.target.checked)} />
<Checkbox label="Teams setzen" density="compact" />
<Checkbox label="Teams setzen" disabled />`;
