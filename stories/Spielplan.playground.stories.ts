import SpielplanPlayground from './components/SpielplanPlayground.svelte';

const cat = (category: string) => ({ category });
const bool = (description: string, category: string) => ({ control: 'boolean', description, table: cat(category) });

// Spielwiese: alle Werte lassen sich im Controls-Reiter schalten, gezeigt werden die echten Komponenten.
const testgame = (withLayout: boolean) => ({
  state: {
    control: 'select',
    options: ['scheduled', 'live', 'finished', 'cancelled', 'postponed', 'bye'],
    description: 'Zustand des Testspiels (erste Zeile)',
    table: cat('Testspiel'),
  },
  provisional: bool('Ergebnis vorläufig', 'Testspiel'),
  scoreHeim: { control: { type: 'number', min: 0, max: 200, step: 1 }, description: 'Punkte Heim (bei Mannschaft: eigene)', table: cat('Testspiel') },
  scoreGast: { control: { type: 'number', min: 0, max: 200, step: 1 }, description: 'Punkte Gast (bei Mannschaft: Gegner)', table: cat('Testspiel') },
  note: { control: 'text', description: 'Notiz zum Spiel', table: cat('Testspiel') },
  own: {
    ...bool('Eigene Mannschaft hervorheben', 'Testspiel'),
    ...(withLayout ? { if: { arg: 'layout', neq: 'opponent' } } : {}),
  },
  placeholder: bool('Gegner ist ein Platzhalter („Erster Gruppe A“)', 'Testspiel'),
});

export default {
  title: 'Components/Spielplan/Spielwiese',
  component: SpielplanPlayground,
  parameters: { layout: 'fullscreen' },
};

export const Tabelle = {
  args: {
    kind: 'table',
    layout: 'opponent',
    density: 'auto',
    names: 'full',
    logos: 'auto',
    state: 'live',
    provisional: false,
    scoreHeim: 52,
    scoreGast: 48,
    note: '',
    showLeague: false,
    showVenue: false,
    showField: false,
    own: false,
    placeholder: false,
    outcome: 'auto',
    showNotice: false,
    editableTime: false,
    collapsible: false,
  },
  argTypes: {
    collapsible: bool('Prop collapsible: der Rahmenkopf wird zum Accordion-Kopf, die Tabelle zum Bereich (die Spielwiese zeigt sie geöffnet)', 'Optionen'),
    kind: { table: { disable: true } },
    halls: { table: { disable: true } },
    showBreak: { table: { disable: true } },
    showBye: { table: { disable: true } },
    showEmptyCell: { table: { disable: true } },
    layout: { control: 'inline-radio', options: ['versus', 'opponent', 'columns'], description: 'versus: Liga/Halle, opponent: Mannschaft, columns: Turnier', table: cat('Layout') },
    density: { control: 'inline-radio', options: ['auto', 'touch', 'default', 'compact'], description: 'auto: Standard des Layouts', table: cat('Layout') },
    names: {
      control: 'inline-radio',
      options: ['full', 'short'],
      description: 'Prop names: voller Name oder Kurzname (falls vorhanden). Bis 640 px Fensterbreite erscheint der Kurzname automatisch.',
      table: { category: 'Namen und Logos', defaultValue: { summary: 'full' } },
    },
    logos: {
      control: 'inline-radio',
      options: ['auto', 'on', 'off'],
      description: 'Prop logos: auto lässt die Prop weg (Tabelle opponent: Logos an, sonst aus; Raster: aus), on = true, off = false.',
      table: { category: 'Namen und Logos', defaultValue: { summary: 'auto' } },
    },
    ...testgame(true),
    showLeague: { ...bool('Liga-Unterzeile anzeigen', 'Optionen'), if: { arg: 'layout', neq: 'columns' } },
    showVenue: bool('Halle anzeigen', 'Optionen'),
    showField: { ...bool('Feld anzeigen (Spalte)', 'Optionen'), if: { arg: 'layout', eq: 'columns' } },
    outcome: {
      control: 'inline-radio',
      options: ['auto', 'S', 'N', 'U'],
      description: 'Bewertung erzwingen (Zustand beendet)',
      table: cat('Testspiel'),
      if: { arg: 'layout', eq: 'opponent' },
    },
    showNotice: { ...bool('Snippet notice: Chip „Sperrzeit“ (Spalte Hinweis)', 'Optionen'), if: { arg: 'layout', eq: 'columns' } },
    editableTime: bool('Snippet time: Eingabefeld für die Zeit des Testspiels', 'Optionen'),
  },
};

export const Zeitraster = {
  args: {
    kind: 'grid',
    density: 'default',
    names: 'full',
    logos: 'auto',
    halls: 3,
    showBreak: true,
    showBye: true,
    showEmptyCell: true,
    state: 'live',
    provisional: false,
    scoreHeim: 18,
    scoreGast: 20,
    note: '',
    own: true,
    placeholder: false,
    collapsible: false,
  },
  argTypes: {
    collapsible: bool('Prop collapsible: der Rahmenkopf wird zum Accordion-Kopf, das Zeitraster zum Bereich (die Spielwiese zeigt sie geöffnet)', 'Optionen'),
    kind: { table: { disable: true } },
    layout: { table: { disable: true } },
    outcome: { table: { disable: true } },
    showLeague: { table: { disable: true } },
    showVenue: { table: { disable: true } },
    showField: { table: { disable: true } },
    showNotice: { table: { disable: true } },
    editableTime: { table: { disable: true } },
    density: { control: 'inline-radio', options: ['default', 'compact', 'touch'], description: 'Zeilendichte', table: cat('Layout') },
    halls: { control: { type: 'number', min: 1, max: 5, step: 1 }, description: 'Anzahl Hallen (1 bis 5)', table: cat('Layout') },
    showBreak: bool('Pause zeigen', 'Optionen'),
    showBye: bool('Freilos zeigen', 'Optionen'),
    showEmptyCell: bool('Eine Zelle ohne Spiel', 'Optionen'),
    names: {
      control: 'inline-radio',
      options: ['full', 'short'],
      description: 'Prop names: voller Name oder Kurzname (falls vorhanden). Bis 640 px Fensterbreite erscheint der Kurzname automatisch.',
      table: { category: 'Namen und Logos', defaultValue: { summary: 'full' } },
    },
    logos: {
      control: 'inline-radio',
      options: ['auto', 'on', 'off'],
      description: 'Prop logos: auto lässt die Prop weg (Tabelle opponent: Logos an, sonst aus; Raster: aus), on = true, off = false.',
      table: { category: 'Namen und Logos', defaultValue: { summary: 'auto' } },
    },
    ...testgame(false),
  },
};
