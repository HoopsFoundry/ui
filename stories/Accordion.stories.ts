import AccordionExamples from './components/AccordionExamples.svelte';
import AccordionPlayground from './components/AccordionPlayground.svelte';

const t = (summary: string, def?: string) => ({ type: { summary }, ...(def ? { defaultValue: { summary: def } } : {}) });

export default {
  title: 'Components/Accordion',
  component: AccordionPlayground,
  argTypes: {
    exclusive: { control: 'boolean', description: 'Nur ein Bereich gleichzeitig offen. Ein Öffnen schließt die anderen; „Alle öffnen/schließen“ entfällt.', table: t('boolean', 'false') },
    variant: { control: 'inline-radio', options: ['card', 'flat'], description: 'Karte (Rand, Radius, Schatten) oder flach (nur Trennlinien)', table: t("'card' | 'flat'", "'card'") },
    expandAll: { control: 'boolean', description: 'Zeigt „Alle öffnen“ und „Alle schließen“ mit Ansage per `aria-live`. Entsteht im Browser; bei `exclusive` nicht angeboten.', table: t('boolean', 'false') },
    nav: { control: 'boolean', description: 'Sprungleiste (`nav` „Bereiche“) mit Links auf die Bereiche; unter 640 px selbst einklappbar. Entsteht im Browser.', table: t('boolean', 'false') },
    navLabel: { control: 'text', description: 'Name der Sprungleiste: `aria-label` der Navigation und Text des Handy-Schalters. Mehrere Sprungleisten auf einer Seite brauchen verschiedene Namen (axe: `landmark-unique`).', table: t('string', "'Bereiche'") },
    sticky: { control: 'boolean', description: 'Kopf des offenen Bereichs klebt oben, solange sein Bereich im Bild ist. Abstand: `--dss-acc-sticky-top`.', table: t('boolean', 'false') },
    syncHash: { control: 'boolean', description: 'Deep-Link: ein passender `#id` öffnet den Bereich samt Eltern, ein Klick setzt den Anker. In der Bibliothek Standard `true`; die Spielwiese schaltet es aus, damit die Adresse der Doku unberührt bleibt.', table: t('boolean', 'true') },
    titleAs: { control: 'inline-radio', options: ['', 'h2', 'h3', 'h4', 'h5', 'h6'], description: 'Ebene der Bereichsüberschriften. Rangfolge: `titleAs` am Bereich vor `titleAs` der Gruppe vor der Ebene aus `HeadingLevel` vor `h3`. Leer: die Ebene ergibt sich aus der Gliederung.', table: t("'h2' | 'h3' | 'h4' | 'h5' | 'h6'", "'h3'") },
    count: { control: { type: 'number', min: 1, max: 8, step: 1 }, description: 'Nur Demo: Anzahl der Bereiche (ab 7 entfällt `role="region"`)', table: t('number', '4') },
    firstOpen: { control: 'boolean', description: 'Nur Demo: der erste Bereich ist beim Start offen (Svelte `open`, React `defaultOpen`)', table: t('boolean', 'true') },
    lockSecond: { control: 'boolean', description: 'Nur Demo: der zweite Bereich ist gesperrt (`disabled`)', table: t('boolean', 'false') },
    meta: { control: 'inline-radio', options: ['none', 'count', 'chip', 'live'], description: 'Nur Demo: Zusatzinfo im Kopf (`meta`): ohne, Zähler, Chip oder Live-Tag', table: t("'none' | 'count' | 'chip' | 'live'", "'count'") },
  },
  args: { exclusive: false, variant: 'card', expandAll: false, nav: false, sticky: false, navLabel: 'Bereiche', syncHash: false, titleAs: '', count: 4, firstOpen: true, lockSecond: false, meta: 'count' },
};

export const Standard = { args: {} };

// Spielwiese für die Props-Tabelle (Accordion.mdx): alle Werte im Controls-Reiter schaltbar.
export const Spielwiese = { args: { expandAll: true, nav: true, count: 5 } };

// Beispiele für die Doku-Seite (Accordion.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: AccordionExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Aufbau = { ...example('aufbau'), tags: ['!dev'] };
export const Varianten = { ...example('varianten'), tags: ['!dev'] };
export const Zusatzinfo = { ...example('meta'), tags: ['!dev'] };
export const Verschachtelt = { ...example('verschachtelt'), tags: ['!dev'] };
export const AlleOeffnen = { ...example('alle'), tags: ['!dev'] };
export const Exklusiv = { ...example('exklusiv'), tags: ['!dev'] };
export const DeepLink = { ...example('deeplink'), tags: ['!dev'] };
export const Sprungleiste = { ...example('nav'), tags: ['!dev'] };
export const KopfKlebt = { ...example('sticky'), tags: ['!dev'] };
export const VanillaButton = { ...example('vanilla'), tags: ['!dev'] };
export const VanillaDetails = { ...example('details'), tags: ['!dev'] };
export const Ebenen = { ...example('ebenen'), tags: ['!dev'] };
export const Zustaende = { ...example('zustaende'), tags: ['!dev'] };
export const LigaSeite = { ...example('liga'), tags: ['!dev'] };
export const Handy = { ...example('handy'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoKurz = { ...example('do-kurz'), tags: ['!dev'] };
export const DontKurz = { ...example('dont-kurz'), tags: ['!dev'] };
export const DoTiefe = { ...example('do-tiefe'), tags: ['!dev'] };
export const DontTiefe = { ...example('dont-tiefe'), tags: ['!dev'] };
export const DoWichtig = { ...example('do-wichtig'), tags: ['!dev'] };
export const DontWichtig = { ...example('dont-wichtig'), tags: ['!dev'] };
export const DoId = { ...example('do-id'), tags: ['!dev'] };
export const DontId = { ...example('dont-id'), tags: ['!dev'] };
