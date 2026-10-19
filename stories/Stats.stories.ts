import StatsPlayground from './components/StatsPlayground.svelte';
import StatsExamples from './components/StatsExamples.svelte';

const t = (summary: string, def?: string) => ({ type: { summary }, ...(def ? { defaultValue: { summary: def } } : {}) });

export default {
  title: 'Components/Kennzahlen',
  component: StatsPlayground,
  argTypes: {
    count: { control: { type: 'number', min: 1, max: 6, step: 1 }, description: 'Nur Demo: Anzahl der Kennzahlen (`items`).', table: t('number', '4') },
    compact: { control: 'boolean', description: 'Ohne Kacheln, in einer Zeile (`compact` an `StatGrid`, Klasse `hoops-stats--compact`).', table: t('boolean', 'false') },
    missing: { control: 'boolean', description: 'Nur Demo: der letzte Wert fehlt (`value: null`): Gedankenstrich mit versteckter Beschriftung „keine Angabe“.', table: t('boolean', 'false') },
    variant: { control: 'inline-radio', options: ['dots', 'letters'], description: 'Form: Punkte (Sieg gefüllt, Niederlage Quadrat, Unentschieden Ring) oder Marken mit S, N, U (`variant` an `FormChips`).', table: t("'dots' | 'letters'", "'dots'") },
    formLength: { control: { type: 'number', min: 0, max: 7, step: 1 }, description: 'Nur Demo: Länge der übergebenen Form. Angezeigt werden höchstens die letzten fünf; ohne gültigen Eintrag erscheint nichts.', table: t('number', '5') },
  },
  args: { count: 4, compact: false, missing: false, variant: 'dots', formLength: 5 },
};

export const Standard = { args: {} };

// Spielwiese für die Props-Tabelle (Stats.mdx): echte Komponenten, alle Werte im Controls-Reiter schaltbar.
export const Spielwiese = { args: { count: 5, missing: true } };

// Beispiele für die Doku-Seite (Stats.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: StatsExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Aufbau     = { ...example('aufbau'), tags: ['!dev'] };
export const Kompakt    = { ...example('kompakt'), tags: ['!dev'] };
export const Form       = { ...example('form'), tags: ['!dev'] };
export const Tabelle    = { ...example('tabelle'), tags: ['!dev'] };
export const VanillaMarkup = { ...example('vanilla'), tags: ['!dev'] };
export const Handy      = { ...example('handy'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const HandyKompakt = { ...example('handy-kompakt'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoFarbe    = { ...example('do-farbe'), tags: ['!dev'] };
export const DontFarbe  = { ...example('dont-farbe'), tags: ['!dev'] };
export const DoWenige   = { ...example('do-wenige'), tags: ['!dev'] };
export const DontWenige = { ...example('dont-wenige'), tags: ['!dev'] };
export const DoKurz     = { ...example('do-kurz'), tags: ['!dev'] };
export const DontKurz   = { ...example('dont-kurz'), tags: ['!dev'] };
