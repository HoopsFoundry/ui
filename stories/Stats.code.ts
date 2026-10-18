// Code-Beispiele der Seite „Kennzahlen und Form“. Die Tests (tests/stats-docs.test.ts) übersetzen das React-Beispiel mit dem TypeScript-Compiler,
// rendern das Svelte-Beispiel und vergleichen das Vanilla-Markup mit der Ausgabe der Komponenten.

/** Markup des Kennzahlen-Gitters; die Doku zeigt es und rendert es auch. */
export const statsMarkup = `<dl class="hoops-stats">
  <div class="hoops-stat"><dt class="hoops-stat-label">Siege</dt><dd class="hoops-stat-value">12</dd></div>
  <div class="hoops-stat"><dt class="hoops-stat-label">Niederlagen</dt><dd class="hoops-stat-value">3</dd></div>
  <div class="hoops-stat"><dt class="hoops-stat-label">Punkte pro Spiel</dt><dd class="hoops-stat-value">82,4</dd></div>
  <div class="hoops-stat"><dt class="hoops-stat-label">Rebounds</dt><dd class="hoops-stat-value"><span aria-hidden="true">–</span><span class="hoops-sr-only">keine Angabe</span></dd></div>
</dl>`;

export const statsCompactMarkup = `<dl class="hoops-stats hoops-stats--compact">
  <div class="hoops-stat"><dt class="hoops-stat-label">Siege</dt><dd class="hoops-stat-value">12</dd></div>
  <div class="hoops-stat"><dt class="hoops-stat-label">Niederlagen</dt><dd class="hoops-stat-value">3</dd></div>
  <div class="hoops-stat"><dt class="hoops-stat-label">Korbdifferenz</dt><dd class="hoops-stat-value">+96</dd></div>
</dl>`;

/** Markup der Form (Punkte); der versteckte Text ist formLabel(form) aus league.js. */
export const formMarkup = `<span class="hoops-form"><span class="hoops-form-list" aria-hidden="true"><span class="hoops-form-item hoops-form-item--s"></span><span class="hoops-form-item hoops-form-item--s"></span><span class="hoops-form-item hoops-form-item--n"></span><span class="hoops-form-item hoops-form-item--s"></span><span class="hoops-form-item hoops-form-item--u"></span></span><span class="hoops-sr-only">Form: Sieg, Sieg, Niederlage, Sieg, Unentschieden</span></span>`;

export const formLettersMarkup = `<span class="hoops-form hoops-form--letters"><span class="hoops-form-list" aria-hidden="true"><span class="hoops-form-item hoops-form-item--s" data-letter="S"></span><span class="hoops-form-item hoops-form-item--n" data-letter="N"></span><span class="hoops-form-item hoops-form-item--u" data-letter="U"></span></span><span class="hoops-sr-only">Form: Sieg, Niederlage, Unentschieden</span></span>`;

export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />

<!-- Kennzahlen: Beschreibungsliste, Beschriftung zuerst (dt), Wert danach (dd); optisch steht der Wert über der Beschriftung.
     Ein fehlender Wert: Gedankenstrich (aria-hidden) plus versteckter Text „keine Angabe“. -->
${statsMarkup}

<!-- Kompakt: ohne Kacheln, in einer Zeile -->
${statsCompactMarkup}

<!-- Form: die Zeichen sind aria-hidden, der Text sagt Sieg, Niederlage, Unentschieden (nie nur Farbe).
     Den Text liefert formLabel(form) aus league.js. -->
${formMarkup}

<!-- Mit Buchstaben S, N, U (kommen aus dem CSS) -->
${formLettersMarkup}

<script type="module">
  import { formEntries, formLabel } from '@hoopsfoundry/ui/league.js';
  import { statItems } from '@hoopsfoundry/ui/stats.js';

  formEntries(['S', 'N', 'x', 'S']);  // ['S', 'N', 'S'] (höchstens die letzten fünf, Ungültiges entfällt)
  formLabel(['S', 'S', 'N']);         // 'Form: Sieg, Sieg, Niederlage'
  statItems([{ label: 'Punkte pro Spiel', value: 82.4 }, { label: 'Rebounds', value: null }]);
  // [{ label: 'Punkte pro Spiel', value: '82,4', empty: false }, { label: 'Rebounds', value: '–', empty: true }]
</script>`;

export const svelte = `<script>
  import StatGrid from '@hoopsfoundry/ui/svelte/StatGrid';
  import FormChips from '@hoopsfoundry/ui/svelte/FormChips';

  const stats = [
    { label: 'Siege', value: 12 },
    { label: 'Niederlagen', value: 3 },
    { label: 'Punkte pro Spiel', value: 82.4 },
    { label: 'Rebounds', value: null }, // fehlender Wert: Gedankenstrich mit Text „keine Angabe“
  ];
</script>

<StatGrid items={stats} />
<StatGrid items={stats.slice(0, 3)} compact />

<!-- Höchstens die letzten fünf Einträge, neueste zuletzt -->
<FormChips form={['S', 'S', 'N', 'S', 'U']} />
<FormChips form={['S', 'N', 'U']} variant="letters" />`;

export const react = `import { StatGrid, FormChips } from '@hoopsfoundry/ui/react';

const stats = [
  { label: 'Siege', value: 12 },
  { label: 'Niederlagen', value: 3 },
  { label: 'Punkte pro Spiel', value: 82.4 },
  { label: 'Rebounds', value: null }, // fehlender Wert: Gedankenstrich mit Text „keine Angabe“
];

export function Kennzahlen() {
  return (
    <>
      <StatGrid items={stats} />
      <StatGrid items={stats.slice(0, 3)} compact />

      {/* Höchstens die letzten fünf Einträge, neueste zuletzt */}
      <FormChips form={['S', 'S', 'N', 'S', 'U']} />
      <FormChips form={['S', 'N', 'U']} variant="letters" />
    </>
  );
}`;

export const tokensCss = `/* Schriftgrößen kommen aus den Tokens: --hoops-fs-h2 (Wert), --hoops-fs-h3 (kompakt), --hoops-fs-caption (Beschriftung und Buchstaben).
   Wer größere Werte will, ändert den Token oder überschreibt die Klasse in seinem Container. */
.verein-kopf .hoops-stats {
  gap: 1rem;                                           /* Abstand der Kacheln (Standard 0,75rem) */
}
.verein-kopf .hoops-stats .hoops-stat-value {
  font-size: var(--hoops-fs-hero);
}`;
