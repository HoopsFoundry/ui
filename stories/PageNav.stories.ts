import PageNavPlayground from './components/PageNavPlayground.svelte';
import PageNavExamples from './components/PageNavExamples.svelte';
import PageNavBackTop from './components/PageNavBackTop.svelte';

const t = (summary: string, def?: string) => ({ type: { summary }, ...(def ? { defaultValue: { summary: def } } : {}) });

export default {
  title: 'Components/PageNav',
  component: PageNavPlayground,
  argTypes: {
    sections: { control: { type: 'number', min: 1, max: 8, step: 1 }, description: 'Nur Demo: Anzahl der Abschnitte (Überschriften) der Beispielseite.', table: t('number', '5') },
    label: { control: 'text', description: '`label` von `initPageNav`: sichtbarer Text und Name der Navigation (`aria-labelledby`). Mehrere Navigationen auf einer Seite brauchen verschiedene Namen (axe: `landmark-unique`).', table: t('string', "'Auf dieser Seite'") },
    minHeadings: { control: { type: 'number', min: 1, max: 6, step: 1 }, description: '`minHeadings`: Mindestzahl der Einträge, ab der die Navigation erscheint.', table: t('number', '3') },
    skipSecond: { control: 'boolean', description: 'Nur Demo: die zweite Überschrift trägt `data-pagenav-skip` und fehlt in der Navigation.', table: t('boolean', 'false') },
    blockWithoutHeading: { control: 'boolean', description: 'Nur Demo: ein Block ohne Überschrift mit `data-pagenav="Kalender-Abo"` wird mit aufgenommen.', table: t('boolean', 'false') },
    observe: { control: 'boolean', description: '`observe`: nachgeladene Überschriften beobachten (Standard `true`).', table: t('boolean', 'true') },
  },
  args: { sections: 5, label: 'Auf dieser Seite', minHeadings: 3, skipSecond: false, blockWithoutHeading: false, observe: true },
};

export const Standard = { args: {} };

// Spielwiese für die Props-Tabelle (PageNav.mdx): echte Funktion, alle Optionen im Controls-Reiter schaltbar.
export const Spielwiese = { args: { sections: 6, blockWithoutHeading: true } };

// Beispiele für die Doku-Seite (PageNav.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: PageNavExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Aufbau     = { ...example('aufbau'), tags: ['!dev'] };
export const Bereiche   = { ...example('bereiche'), tags: ['!dev'] };
export const Nachladen  = { ...example('nachladen'), tags: ['!dev'] };
export const Optionen   = { ...example('optionen'), tags: ['!dev'] };
export const VanillaSeite = { ...example('vanilla'), tags: ['!dev'] };
export const Handy      = { ...example('handy'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const HandyDunkel = { ...example('handy-dunkel'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };

// Nach-oben-Knopf: eigene Seiten im Rahmen, weil er am Fenster hängt
export const NachOben = { render: () => ({ Component: PageNavBackTop, props: { bnav: false } }), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const NachObenBnav = { render: () => ({ Component: PageNavBackTop, props: { bnav: true } }), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoKurz         = { ...example('do-kurz'), tags: ['!dev'] };
export const DontKurz       = { ...example('dont-kurz'), tags: ['!dev'] };
export const DoNamen        = { ...example('do-namen'), tags: ['!dev'] };
export const DontNamen      = { ...example('dont-namen'), tags: ['!dev'] };
export const DoUeberschrift = { ...example('do-ueberschrift'), tags: ['!dev'] };
export const DontUeberschrift = { ...example('dont-ueberschrift'), tags: ['!dev'] };
