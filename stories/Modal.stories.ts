import ModalDemo from './components/ModalDemo.svelte';
import ModalExamples from './components/ModalExamples.svelte';

export default {
  title: 'Components/Modal',
  component: ModalDemo,
  // Das Modal ist position: fixed. Auf der Doku-Seite bekommt die Inline-Vorschau eine feste Höhe, und
  // .storybook/storybook.css macht sie zum Bezugsrahmen für das Modal (sonst wird es in 64 px abgeschnitten).
  // Inline statt iframe, damit Marke und Hell/Dunkel aus der Werkzeugleiste ankommen.
  parameters: { layout: 'fullscreen', docs: { story: { height: '520px' } } },
  argTypes: {
    severity:       { control: 'inline-radio', options: ['default', 'danger', 'warn', 'ok', 'info'], description: 'Schweregrad: bei allem außer `default` steht ein getöntes Symbol im Kopf', table: { type: { summary: "'default' | 'danger' | 'warn' | 'ok' | 'info'" }, defaultValue: { summary: "'default'" } } },
    size:           { control: 'inline-radio', options: ['sm', 'md', 'wide', 'xwide'], description: 'Breite: 380, 480, 560 oder 720 px, nie breiter als der Bildschirm', table: { type: { summary: "'sm' | 'md' | 'wide' | 'xwide'" }, defaultValue: { summary: "'md'" } } },
    title:          { control: 'text', description: 'Titel im Kopf; benennt die Entscheidung, z. B. „Spielbericht senden?“', table: { type: { summary: 'string' }, defaultValue: { summary: "''" } } },
    titleAs:        { control: 'inline-radio', options: ['h2', 'h3', 'h4', 'h5', 'h6'], description: 'Ebene des Titels. Titelkomponenten im Inhalt bekommen die nächste Ebene (bei h2 also h3). Die Größe hängt am Token `--hoops-title-size`, nicht an der Ebene. Leer lassen: Standard h2.', table: { type: { summary: "'h2' | 'h3' | 'h4' | 'h5' | 'h6'" }, defaultValue: { summary: "'h2'" } } },
    subtitle:       { control: 'text', description: 'Kleine Zeile unter dem Titel (Kontext), in Großbuchstaben gesetzt', table: { type: { summary: 'string' }, defaultValue: { summary: "''" } } },
    closable:       { control: 'boolean', description: 'Zeigt den Schließen-Button und erlaubt Escape', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    body:           { control: 'text', description: 'Inhalt (Svelte: Kinder, React: `children`); scrollt bei viel Text, Kopf und Fuß bleiben stehen', table: { type: { summary: 'string' } } },
    cancelLabel:    { control: 'text', description: 'Beschriftung der sekundären Schaltfläche im Fuß (nur Demo)', table: { type: { summary: 'string' } } },
    confirmLabel:   { control: 'text', description: 'Beschriftung der Hauptaktion im Fuß, ein Verb (nur Demo)', table: { type: { summary: 'string' } } },
    confirmVariant: { control: 'inline-radio', options: ['primary', 'amber', 'danger'], description: 'Button-Variante der Hauptaktion; `danger` bei zerstörerischen Aktionen (nur Demo)', table: { type: { summary: "'primary' | 'amber' | 'danger'" }, defaultValue: { summary: "'primary'" } } },
    footer:         { control: false, description: 'Fußleiste mit Aktionen (Svelte: Snippet, React: ReactNode); ohne sie entfällt die Leiste', table: { type: { summary: 'Snippet' } } },
  },
  args: {
    title: 'Spielbericht freigeben',
    subtitle: 'BBL · 17. Spieltag · Heim 87 : 74',
    severity: 'default',
    size: 'md',
    closable: true,
    body: 'Nach Freigabe ist eine Korrektur nur noch über den Verband möglich. Schiedsrichter und beide Trainer müssen unterschrieben haben.',
    cancelLabel: 'Abbrechen',
    confirmLabel: 'Freigeben',
    confirmVariant: 'primary',
  },
};

export const Standard = {};
export const DangerSpielVerwerfen = { args: {
  severity: 'danger',
  title: 'Spielbericht endgültig verwerfen?',
  subtitle: 'Nicht wiederherstellbar',
  body: 'Alle erfassten Aktionen, Aufstellungen und Schiri-Lizenzen werden gelöscht. Diese Aktion lässt sich nicht rückgängig machen.',
  cancelLabel: 'Behalten',
  confirmLabel: 'Verwerfen',
  confirmVariant: 'danger',
}};
export const WarnAnwurfzeit = { args: {
  severity: 'warn',
  title: 'Anwurfzeit nach 22:00 Uhr',
  subtitle: 'Hallenordnung prüfen',
  body: 'Die Halle schließt um 23:00 — Spielzeit + Verlängerung evtl. nicht eingehalten.',
  cancelLabel: 'Zeit ändern',
  confirmLabel: 'Trotzdem ansetzen',
  confirmVariant: 'amber',
}};
export const OkSync = { args: {
  severity: 'ok',
  title: 'Spielbericht synchronisiert',
  subtitle: 'Verband BBV · gerade eben',
  size: 'sm',
  body: 'Alle 47 Aktionen wurden an den Verband übertragen.',
  cancelLabel: 'Schließen',
  confirmLabel: 'OK',
}};
export const InfoBonus = { args: {
  severity: 'info',
  title: 'Bonus-Status',
  subtitle: 'FIBA-Regel 35',
  size: 'wide',
  body: 'Ab dem 5. Mannschafts-Foul eines Viertels werden alle weiteren Fouls mit 2 Freiwürfen geahndet — unabhängig von der Foul-Situation.',
  cancelLabel: 'Schließen',
  confirmLabel: 'Verstanden',
}};

// Beispiele für die Doku-Seite (Modal.mdx). Die Steuerelemente passen hier nicht, daher aus.
// Die Vorschau-Höhe gilt je Story; Mehrfach-Vorschauen wachsen mit ihrem Inhalt.
const example = (name: string, height = '520px') => ({
  render: () => ({ Component: ModalExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'fullscreen', docs: { story: { height } } },
});

export const Anatomie     = { ...example('anatomie', '460px'), tags: ['!dev'] };
export const Schweregrade = { ...example('schweregrade', '420px'), tags: ['!dev'] };
export const Groessen     = { ...example('groessen', '340px'), tags: ['!dev'] };
export const Interaktiv   = { ...example('interaktiv', '460px'), tags: ['!dev'] };
export const Zustaende    = { ...example('zustaende', '320px'), tags: ['!dev'] };

// Vanilla: ausführbare Beispiele (initAll auf dem Markup aus dem Code-Beispiel) und Handy-Vorschauen (zwei verschiedene Beispiele)
export const VanillaDialog = { ...example('vanilla-dialog', '170px'), tags: ['!dev'] };
export const VanillaDiv    = { ...example('vanilla-div', '420px'), tags: ['!dev'] };
export const Handy         = { ...example('handy'), parameters: { controls: { disable: true }, layout: 'padded' }, tags: ['!dev'] };
export const HandyDunkel   = { ...example('handy-dunkel'), parameters: { controls: { disable: true }, layout: 'padded' }, tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoAktion     = { ...example('do-aktion', '420px'), tags: ['!dev'] };
export const DontAktion   = { ...example('dont-aktion', '420px'), tags: ['!dev'] };
export const DoDanger     = { ...example('do-danger', '420px'), tags: ['!dev'] };
export const DontDanger   = { ...example('dont-danger', '420px'), tags: ['!dev'] };
export const DoAusweg     = { ...example('do-ausweg', '420px'), tags: ['!dev'] };
export const DontAusweg   = { ...example('dont-ausweg', '420px'), tags: ['!dev'] };
export const DoSchwere    = { ...example('do-schwere', '420px'), tags: ['!dev'] };
export const DontSchwere  = { ...example('dont-schwere', '420px'), tags: ['!dev'] };
export const DoFokus      = { ...example('do-fokus', '400px'), tags: ['!dev'] };
export const DontFokus    = { ...example('dont-fokus', '400px'), tags: ['!dev'] };
