import AppNavDemo from './components/AppNavDemo.svelte';
import AppNavExamples from './components/AppNavExamples.svelte';

export default {
  title: 'Components/AppNav',
  component: AppNavDemo,
  argTypes: {
    tone:        { control: 'inline-radio', options: ['light', 'dark'], description: 'Fläche: `light` folgt dem Theme (hell oder dunkel), `dark` ist immer dunkel, z. B. unter der TopBar', table: { type: { summary: "'light' | 'dark'" }, defaultValue: { summary: "'light'" } } },
    currentHref: { control: 'text', description: 'Pfad der aktuellen Seite: der Link mit genau diesem `href` ist aktiv (`aria-current="page"`), seine Gruppe wird mit markiert. Ohne Angabe ist nichts aktiv', table: { type: { summary: 'string' }, defaultValue: { summary: "''" } } },
    items:       { control: false, description: 'Einträge: Link `{ id, label, href, disabled?, hint? }` oder Gruppe `{ id, label, items: Link[], disabled?, hint? }`. Gruppen haben genau eine Ebene; `disabled` sperrt, `hint` erklärt warum', table: { type: { summary: '(AppNavLink | AppNavGroup)[]' } } },
    ariaLabel:   { control: 'text', description: 'Name der Navigation (Landmark)', table: { type: { summary: 'string' }, defaultValue: { summary: "'Hauptnavigation'" } } },
    menuLabel:   { control: false, description: 'Beschriftung des Menü-Buttons unter 720 px', table: { type: { summary: 'string' }, defaultValue: { summary: "'Menü'" } } },
    context:     { control: false, description: 'Platz rechts in der Leiste, z. B. für einen Turnierumschalter (Svelte: Snippet, React: ReactNode)', table: { type: { summary: 'Snippet' } } },
    contained:   { control: false, description: 'Begrenzt den Inhalt auf `--hoops-shell-max` (64 rem), der Hintergrund bleibt voll breit', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    renderLink:  { control: false, description: 'Nur React: eigene Link-Darstellung, z. B. für einen Router. Du bekommst `item`, `className`, `ariaCurrent`, `onNavigate` und `children`', table: { type: { summary: '(props: AppNavLinkRenderProps) => ReactNode' } } },
  },
  args: { tone: 'light', currentHref: '/ergebnisse' },
};

export const Hell = { args: { tone: 'light', ariaLabel: 'Hauptnavigation, hell' } };
export const Dunkel = { args: { tone: 'dark', ariaLabel: 'Hauptnavigation, dunkel' } };

// Beispiele für die Doku-Seite (AppNav.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: AppNavExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const MobilGeschlossen = { ...example('mobil-geschlossen'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const MobilOffen = { ...example('mobil-offen'), parameters: { controls: { disable: true }, layout: 'fullscreen' }, tags: ['!dev'] };
export const Zustaende = { ...example('zustaende'), tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoGruppe     = { ...example('do-gruppe'), tags: ['!dev'] };
export const DontGruppe   = { ...example('dont-gruppe'), tags: ['!dev'] };
export const DoAktuell    = { ...example('do-aktuell'), tags: ['!dev'] };
export const DontAktuell  = { ...example('dont-aktuell'), tags: ['!dev'] };
export const DoGesperrt   = { ...example('do-gesperrt'), tags: ['!dev'] };
export const DontGesperrt = { ...example('dont-gesperrt'), tags: ['!dev'] };
export const DoWenige     = { ...example('do-wenige'), tags: ['!dev'] };
export const DontWenige   = { ...example('dont-wenige'), tags: ['!dev'] };
