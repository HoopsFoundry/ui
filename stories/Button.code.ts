export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md">Spielbericht freigeben</button>
<button type="button" class="hoops-btn hoops-btn--amber hoops-btn--md is-touch">Live-Scoring starten</button>
<button type="button" class="hoops-btn hoops-btn--danger hoops-btn--md">Verwerfen</button>
<button type="button" class="hoops-btn hoops-btn--ghost hoops-btn--sm">Mehr…</button>
<button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md" disabled>Gesperrt</button>`;

export const svelte = `import Button from '@hoopsfoundry/ui/svelte/Button';

<Button>Spielbericht freigeben</Button>
<Button variant="amber" touch>Live-Scoring starten</Button>
<Button variant="danger">Verwerfen</Button>
<Button variant="ghost" size="sm">Mehr…</Button>
<Button disabled>Gesperrt</Button>`;

export const react = `import { Button } from '@hoopsfoundry/ui/react';

<Button>Spielbericht freigeben</Button>
<Button variant="amber" touch>Live-Scoring starten</Button>
<Button variant="danger">Verwerfen</Button>
<Button variant="ghost" size="sm">Mehr…</Button>
<Button disabled>Gesperrt</Button>`;
