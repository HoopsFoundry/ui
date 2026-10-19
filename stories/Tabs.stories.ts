import TabsDemo from './components/TabsDemo.svelte';
import TabsExamples from './components/TabsExamples.svelte';

export default {
  title: 'Components/Tabs',
  component: TabsDemo,
  argTypes: {
    variant:   { control: 'inline-radio', options: ['underline', 'segmented', 'pills', 'vertical'], description: 'Stil: `underline` für Seiten-Ansichten, `segmented` für Umschalter im Panel, `pills` für Filterleisten, `vertical` für Einstellungen', table: { type: { summary: "'underline' | 'segmented' | 'pills' | 'vertical'" }, defaultValue: { summary: "'underline'" } } },
    size:      { control: 'inline-radio', options: ['sm', 'md', 'lg'], description: 'Höhe eines Tabs: 36, 44 oder 56 px', table: { type: { summary: "'sm' | 'md' | 'lg'" }, defaultValue: { summary: "'md'" } } },
    items:     { control: false, description: 'Die Tabs: `{ id, label, icon?, count?, disabled? }`; `icon` ist eine Sprite-ID wie `i-calendar` (React: ein Icon-Name), `count` ein Zähler hinter dem Label', table: { type: { summary: 'TabItem[]' } } },
    value:     { control: 'text', description: 'Id des gewählten Tabs (Einzelauswahl). Svelte: `bind:value`; ohne Angabe ist der erste Tab gewählt. React: `value` (kontrolliert) oder `defaultValue`', table: { type: { summary: 'string' }, defaultValue: { summary: "''" } } },
    multi:     { control: 'boolean', description: 'Mehrfachauswahl für Pills als Filter: die Leiste ist eine Gruppe, jeder Tab ein Schalter mit `aria-pressed`', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    activeIds: { control: 'object', description: 'Gewählte Ids bei `multi`. Svelte: `bind:activeIds`; React: `activeIds` oder `defaultActiveIds` mit `onActiveIdsChange`', table: { type: { summary: 'string[]' }, defaultValue: { summary: '[]' } } },
    ariaLabel: { control: false, description: 'Zugänglicher Name der Leiste', table: { type: { summary: 'string' }, defaultValue: { summary: "'Tabs'" } } },
    onchange:  { control: false, description: 'Wird bei jeder Auswahl mit der Tab-Id aufgerufen (React: `onValueChange`, bei `multi` `onActiveIdsChange`)', table: { type: { summary: '(id: string) => void' } } },
    preset:    { control: 'select', options: ['page', 'density', 'quarters', 'filters', 'settings'], description: 'Nur Demo: welche Beispiel-Tabs gezeigt werden', table: { type: { summary: "'page' | 'density' | 'quarters' | 'filters' | 'settings'" }, defaultValue: { summary: "'page'" } } },
    sidebar:   { control: 'boolean', description: 'Nur Demo: stellt die Leiste neben ein Inhaltsfeld (für `vertical`)', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
  },
  args: { variant: 'underline', size: 'md', preset: 'page', value: 'overview' },
};

export const UnderlineSeitenTabs = { args: { variant: 'underline', preset: 'page', value: 'overview' } };
export const SegmentedDichte     = { args: { variant: 'segmented', preset: 'density', value: 'default' } };
export const SegmentedViertel    = { args: { variant: 'segmented', size: 'lg', preset: 'quarters', value: 'q2' } };
export const PillsFilterStrip    = { args: { variant: 'pills', preset: 'filters', multi: true, activeIds: ['a', 'c'] } };
export const VerticalSidebar     = { args: { variant: 'vertical', preset: 'settings', value: 'team', sidebar: true } };

// Beispiele für die Doku-Seite (Tabs.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: TabsExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Varianten = { ...example('varianten'), tags: ['!dev'] };
export const Groessen  = { ...example('groessen'), tags: ['!dev'] };
export const Bausteine = { ...example('bausteine'), tags: ['!dev'] };
export const Bedienung = { ...example('bedienung'), tags: ['!dev'] };
export const Zustaende = { ...example('zustaende'), tags: ['!dev'] };

// Vanilla: ausführbare Beispiele (initAll auf dem Markup aus dem Code-Beispiel) und Vorschauen in Gerätebreite (zwei verschiedene Beispiele, als Iframe)
export const VanillaRegister = { ...example('vanilla'), tags: ['!dev'] };
export const VanillaFilter   = { ...example('vanilla-filter'), tags: ['!dev'] };
export const Handy           = { ...example('handy'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const HandyVerein     = { ...example('handy-verein'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoAnsichten   = { ...example('do-ansichten'), tags: ['!dev'] };
export const DontAnsichten = { ...example('dont-ansichten'), tags: ['!dev'] };
export const DoWenige      = { ...example('do-wenige'), tags: ['!dev'] };
export const DontWenige    = { ...example('dont-wenige'), tags: ['!dev'] };
export const DoZahl        = { ...example('do-zahl'), tags: ['!dev'] };
export const DontZahl      = { ...example('dont-zahl'), tags: ['!dev'] };
export const DoMulti       = { ...example('do-multi'), tags: ['!dev'] };
export const DontMulti     = { ...example('dont-multi'), tags: ['!dev'] };
export const DoPanels      = { ...example('do-panels'), tags: ['!dev'] };
export const DontPanels    = { ...example('dont-panels'), tags: ['!dev'] };
