import EmptyStateDemo from './components/EmptyStateDemo.svelte';
import EmptyStateExamples from './components/EmptyStateExamples.svelte';

export default {
  title: 'Components/EmptyState',
  component: EmptyStateDemo,
  argTypes: {
    tone:    { control: 'inline-radio', options: ['neutral', 'action', 'error'], description: 'Tonalität: `neutral` (keine Daten, Erstnutzung), `action` (etwas fehlt, behebbar, Amber) oder `error` (Laden fehlgeschlagen, Rot); bestimmt auch die Variante des Buttons (primary, amber, danger)', table: { type: { summary: "'neutral' | 'action' | 'error'" }, defaultValue: { summary: "'neutral'" } } },
    title:   { control: 'text', description: 'Überschrift, sagt in einem Satz, was los ist', table: { type: { summary: 'string' } } },
    body:    { control: 'text', description: 'Erklärung und Hinweis, was als Nächstes möglich ist', table: { type: { summary: 'string' }, defaultValue: { summary: "''" } } },
    cta:     { control: 'text', description: 'Beschriftung des Buttons für den nächsten Schritt; leer lässt ihn weg (Klick: `onclick`, React: `onCta`)', table: { type: { summary: 'string' }, defaultValue: { summary: "''" } } },
    titleAs: { control: 'inline-radio', options: ['h2', 'h3', 'h4', 'h5', 'h6'], description: 'Überschriftenebene des Titels, passend zur Gliederung der Seite. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor `h3`. Die Größe hängt am Token `--hoops-card-title-size`, nicht an der Ebene. Eine Auswahl hier überstimmt ein umgebendes `HeadingLevel`; leer lassen, damit die Ebene gilt, die sich aus der Gliederung ergibt.', table: { type: { summary: "'h2' | 'h3' | 'h4' | 'h5' | 'h6'" }, defaultValue: { summary: "'h3'" } } },
  },
  args: { tone: 'neutral' },
};

export const Neutral = { args: { tone: 'neutral', title: 'Noch keine Spiele', body: 'Sobald ein Spielplan existiert, erscheinen die Partien hier.', cta: 'Spielplan öffnen' } };
export const Action = { args: { tone: 'action', title: 'Zeitplan fehlt', body: 'Erzeuge zuerst einen Zeitplan, um Ergebnisse zu erfassen.', cta: 'Zeitplan erzeugen' } };
export const Error = { args: { tone: 'error', title: 'Laden fehlgeschlagen', body: 'Die Daten konnten nicht geladen werden.', cta: 'Erneut versuchen' } };

// Beispiele für die Doku-Seite (EmptyState.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: EmptyStateExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Tonalitaeten = { ...example('tonalitaeten'), tags: ['!dev'] };
export const Aktionen     = { ...example('aktionen'), tags: ['!dev'] };
export const Listenzustaende = { ...example('liste'), tags: ['!dev'] };
export const Zustaende    = { ...example('zustaende'), tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoSchritt     = { ...example('do-schritt'), tags: ['!dev'] };
export const DontSchritt   = { ...example('dont-schritt'), tags: ['!dev'] };
export const DoTon         = { ...example('do-ton'), tags: ['!dev'] };
export const DontTon       = { ...example('dont-ton'), tags: ['!dev'] };
export const DoAktion      = { ...example('do-aktion'), tags: ['!dev'] };
export const DontAktion    = { ...example('dont-aktion'), tags: ['!dev'] };
