import TablesDemo from './components/TablesDemo.svelte';
import TableExamples from './components/TableExamples.svelte';

export default {
  title: 'Components/Table',
  component: TablesDemo,
  argTypes: {
    preset:  { control: 'inline-radio', options: ['boxscore', 'roster', 'crew', 'density'], description: 'Nur Demo: welches Beispiel gezeigt wird (Boxscore, Kader, Kampfgericht oder alle vier Dichten)', table: { type: { summary: "'boxscore' | 'roster' | 'crew' | 'density'" }, defaultValue: { summary: "'boxscore'" } } },
    density: { control: 'inline-radio', options: ['touch', 'default', 'compact', 'dense'], description: 'Zeilenhöhe: `touch` 60 px, `default` 48 px, `compact` 40 px, `dense` 32 px (Zellhöhe, dazu 1 px Linie). Die Demo wendet sie nur auf den Boxscore an', table: { type: { summary: "'touch' | 'default' | 'compact' | 'dense'" }, defaultValue: { summary: "'default'" } } },
    collapsible: { control: 'boolean', description: 'Einklappbar: der Rahmenkopf wird zum Accordion-Kopf, die Tabelle zum Bereich. Die Demo zeigt sie geöffnet (`open`).', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    open: { control: 'boolean', description: 'Geöffnet (nur mit `collapsible`; Svelte `bind:open`, React `open` mit `onOpenChange`). Die Demo startet geöffnet.', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    id: { control: 'text', description: 'Anker für Deep-Link und Sprungleiste (nur mit `collapsible`); leer: kein Anker. Ein Klick schreibt `#id` in die Adresse.', table: { type: { summary: 'string' } } },
    dark:    { control: 'boolean', description: 'Dunkle Fläche (Kampfgericht-Tisch), auch im hellen Theme dunkel. Im Boxscore zeigt sie zusätzlich die Live-Marke', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
  },
  args: { preset: 'boxscore', density: 'compact', dark: false, collapsible: false, open: true, id: '' },
};

export const BoxscoreLight = { args: { preset: 'boxscore', density: 'compact', dark: false } };
export const BoxscoreDarkKampfgericht = { args: { preset: 'boxscore', density: 'compact', dark: true } };
export const TeamRosterTouch = { args: { preset: 'roster' } };
export const KampfgerichtCrew = { args: { preset: 'crew' } };
export const DensityVergleich = { args: { preset: 'density' } };

// Beispiele für die Doku-Seite (Table.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: TableExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Zellen      = { ...example('zellen'), tags: ['!dev'] };
export const Zahlen      = { ...example('zahlen'), tags: ['!dev'] };
export const Sortierung  = { ...example('sortierung'), tags: ['!dev'] };
export const Streifen    = { ...example('streifen'), tags: ['!dev'] };
export const Sticky      = { ...example('sticky'), tags: ['!dev'] };
export const Zustaende   = { ...example('zustaende'), tags: ['!dev'] };
export const Einklappbar = { ...example('einklappbar'), tags: ['!dev'] };
export const EinklappbarId = { ...example('einklappbar-id'), tags: ['!dev'] };
export const EinklappbarGruppe = { ...example('einklappbar-gruppe'), tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoZahlen    = { ...example('do-zahlen'), tags: ['!dev'] };
export const DontZahlen  = { ...example('dont-zahlen'), tags: ['!dev'] };
export const DoDichte    = { ...example('do-dichte'), tags: ['!dev'] };
export const DontDichte  = { ...example('dont-dichte'), tags: ['!dev'] };
export const DoSpalten   = { ...example('do-spalten'), tags: ['!dev'] };
export const DontSpalten = { ...example('dont-spalten'), tags: ['!dev'] };
export const DoSort      = { ...example('do-sort'), tags: ['!dev'] };
export const DontSort    = { ...example('dont-sort'), tags: ['!dev'] };
export const DoFarbe     = { ...example('do-farbe'), tags: ['!dev'] };
export const DontFarbe   = { ...example('dont-farbe'), tags: ['!dev'] };
export const DoOffen     = { ...example('do-offen'), tags: ['!dev'] };
export const DontZu      = { ...example('dont-zu'), tags: ['!dev'] };
