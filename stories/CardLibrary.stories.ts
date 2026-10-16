import CardLibraryDemo from './components/CardLibraryDemo.svelte';
import CardLibraryExamples from './components/CardLibraryExamples.svelte';
import CardLibraryPlayground from './components/CardLibraryPlayground.svelte';

export default {
  title: 'Components/Card Library',
  component: CardLibraryDemo,
  argTypes: {
    view: { control: 'inline-radio', options: ['match', 'player', 'empty', 'skeleton'], description: 'Nur Demo: welche Karten gezeigt werden', table: { type: { summary: "'match' | 'player' | 'empty' | 'skeleton'" }, defaultValue: { summary: "'match'" } } },
  },
  args: { view: 'match' },
};

export const MatchCards    = { args: { view: 'match' } };
export const PlayerCards   = { args: { view: 'player' } };
export const EmptyStates   = { args: { view: 'empty' } };
export const Skeletons     = { args: { view: 'skeleton' } };

// Spielwiesen für die Props-Tabellen (CardLibrary.mdx): echte Komponenten, alle Werte im Controls-Reiter schaltbar.
const hidden = { view: { table: { disable: true } } };
const render = (args: Record<string, unknown>) => ({ Component: CardLibraryPlayground, props: args });
const t = (summary: string, def?: string) => ({ type: { summary }, ...(def ? { defaultValue: { summary: def } } : {}) });
const interactive = { control: 'inline-radio', options: ['none', 'link', 'button'], description: 'Nur Demo: nicht klickbar, als Link (`href`) oder als Schalter (`onclick`)', table: t("'none' | 'link' | 'button'", "'none'") };

export const SpielkarteSpielwiese = {
  render,
  args: {
    kind: 'match', interactive: 'none', state: 'live', league: 'Bayernliga Süd', matchday: '17. Spieltag', date: 'Sa, 25. Mai', time: '19:30', venue: 'Nordhain-Halle',
    heim: { name: 'TSV Nordhain', short: 'TSV N.', score: 87 }, gast: { name: 'Lindenberg Hawks', short: 'Hawks', score: 64 }, period: 4, periods: 4, quarter: '', clock: '02:14',
    names: 'full', logos: false,
  },
  argTypes: {
    ...hidden,
    kind: { table: { disable: true } },
    interactive,
    state: { control: 'inline-radio', options: ['scheduled', 'live', 'finished'], description: 'Spielzustand: angesetzt, läuft oder beendet (Endstand, Verlierer gedimmt)', table: t("'scheduled' | 'live' | 'finished'", "'scheduled'") },
    league: { control: 'text', description: 'Liga, links im Kopf', table: t('string', "''") },
    matchday: { control: 'text', description: 'Spieltag, gedämpft hinter der Liga', table: t('string', "''") },
    date: { control: 'text', description: 'Datum, nur bei `scheduled`', table: t('string', "''") },
    time: { control: 'text', description: 'Anpfiff, nur bei `scheduled` hinter dem Datum', table: t('string', "''") },
    venue: { control: 'text', description: 'Halle, im Fuß der Karte', table: t('string', "''") },
    heim: { control: 'object', description: 'Heimmannschaft: `{ name, short?, logo?, score? }` (die Spielwiese ergänzt das Logo für TSV Nordhain und Lindenberg Hawks)', table: t('{ name: string; short?: string; logo?: string; score?: number }') },
    gast: { control: 'object', description: 'Gastmannschaft: `{ name, short?, logo?, score? }`', table: t('{ name: string; short?: string; logo?: string; score?: number }') },
    names: { control: 'inline-radio', options: ['full', 'short'], description: 'Voller Name oder Kurzname (`short`, falls vorhanden). Bis 640 px Fensterbreite erscheint der Kurzname automatisch.', table: t("'full' | 'short'", "'full'") },
    logos: { control: 'boolean', description: 'Logo (`logo`-URL) bzw. Initialen im Kreis vor dem Teamnamen', table: t('boolean', 'false') },
    period: { control: { type: 'number', min: 1, max: 10, step: 1 }, description: 'Spielabschnitt ab 1, nur bei `live`: „3. Viertel“, bei `periods` 8 „5. Achtel“, darüber „Verlängerung“, „2. Verlängerung“', table: t('number') },
    periods: { control: 'inline-radio', options: [4, 8], description: 'Anzahl der regulären Abschnitte: 4 Viertel (Standard) oder 8 Achtel (Mini-Basketball)', table: t('4 | 8', '4') },
    quarter: { control: 'text', description: 'Veraltet, nur bei `live`: freier Text; wird nur ohne `period` angezeigt, unverändert. Nutze `period`.', table: t('string', "''") },
    clock: { control: 'text', description: 'Spieluhr, nur bei `live`', table: t('string', "''") },
  },
};

export const SpielerkarteSpielwiese = {
  render,
  args: {
    kind: 'player', interactive: 'none', size: 'standard', jersey: '4', name: 'J. Tanner', position: 'PG', team: 'heim', captain: true, age: '24 J.', height_cm: '188', role: '',
    vitals: [{ label: 'PPG', value: '17.4', accent: true }, { label: 'APG', value: '6.2' }, { label: 'RPG', value: '3.1' }, { label: 'EFF', value: '22.8' }],
    stat: 22, statLabel: 'PTS', photo: '', photoAlt: '',
  },
  argTypes: {
    ...hidden,
    kind: { table: { disable: true } },
    interactive: { ...interactive, options: ['none', 'button'], description: 'Nur Demo: bei `compact` als Schalter (`onclick`) oder nicht klickbar', table: t("'none' | 'button'", "'none'") },
    size: { control: 'inline-radio', options: ['compact', 'standard', 'hero'], description: 'Maßstab: Listenzeile, Karte mit Kennzahlen oder dunkle Großkarte', table: t("'compact' | 'standard' | 'hero'", "'standard'") },
    jersey: { control: 'text', description: 'Trikotnummer', table: t('string | number') },
    name: { control: 'text', description: 'Name des Spielers', table: t('string') },
    position: { control: 'select', options: ['', 'PG', 'SG', 'SF', 'PF', 'C'], description: 'Position; färbt die Marke (`dss-pos`)', table: t('string', "''") },
    team: { control: 'inline-radio', options: ['heim', 'gast'], description: 'Mannschaftsfarbe der Trikotnummer', table: t("'heim' | 'gast'", "'heim'") },
    captain: { control: 'boolean', description: 'Kapitän: Ring um die Trikotnummer, „(C)“ bzw. Kennzeichen „Kapitän“', table: t('boolean', 'false') },
    age: { control: 'text', description: 'Alter, nur `standard` und `hero`', table: t('string', "''") },
    height_cm: { control: 'text', description: 'Größe in cm, nur `standard` und `hero` (React: `heightCm`)', table: t('string', "''") },
    role: { control: 'text', description: 'Rolle im Team, nur in `compact` hinter der Position (React: `playerRole`)', table: t('string', "''") },
    vitals: { control: 'object', description: 'Vier Kennzahlen `{ label, value, accent? }`, nur `standard` und `hero`; `accent` hebt den Wert in Amber hervor', table: t('{ label: string; value: string | number; accent?: boolean }[]', '[]') },
    stat: { control: 'text', description: 'Hauptstatistik der `compact`-Zeile', table: t('string | number | null', 'null') },
    statLabel: { control: 'text', description: 'Beschriftung der Hauptstatistik', table: t('string', "''") },
    photo: { control: 'select', options: ['', 'tanner', 'okafor', 'vogler', 'hollis', 'mertens', 'sorell'], description: 'Foto-URL; ersetzt die Trikotmarke, die Trikotnummer bleibt als Badge. In der Spielwiese wählst du eines der Demo-Fotos (`tanner` …), im Code übergibst du die URL. Leer oder bei Ladefehler: Trikotmarke.', table: t('string', "''") },
    titleAs: { control: 'inline-radio', options: ['h2', 'h3', 'h4', 'h5', 'h6'], description: 'Überschriftenebene des Namens in standard und hero. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor `h3`. Die Größe hängt am Token `--hoops-card-title-size`, nicht an der Ebene. Eine Auswahl hier überstimmt ein umgebendes `HeadingLevel`; leer lassen, damit die Ebene gilt, die sich aus der Gliederung ergibt.', table: t("'h2' | 'h3' | 'h4' | 'h5' | 'h6'", "'h3'") },
    photoAlt: { control: 'text', description: 'Alternativtext des Fotos. Standard leer (dekorativ, der Name steht daneben); nur füllen, wenn das Bild eine Information trägt, die nicht im Text steht.', table: t('string', "''") },
  },
};

export const LadezustandSpielwiese = {
  render,
  args: { kind: 'skeleton', variant: 'row', count: 2, width: 'auto', height: 'auto', rounded: '6px', label: 'Lädt …' },
  argTypes: {
    ...hidden,
    kind: { table: { disable: true } },
    variant: { control: 'inline-radio', options: ['line', 'block', 'circle', 'row', 'match'], description: 'Baustein: `line`, `block`, `circle` (Primitive) oder `row`, `match` (fertige Muster)', table: t("'line' | 'block' | 'circle' | 'row' | 'match'", "'line'") },
    count: { control: { type: 'number', min: 1, max: 8, step: 1 }, description: 'Anzahl der Wiederholungen (nicht bei `match`)', table: t('number', '1') },
    width: { control: 'text', description: 'Breite von `line`, `block`, `circle` (CSS-Wert), z. B. `80%`; mit `auto` hat der Baustein keine Breite', table: t('string', "'auto'") },
    height: { control: 'text', description: 'Höhe von `line`, `block`, `circle` (CSS-Wert), z. B. `22px`; mit `auto` hat der Baustein keine Höhe und bleibt unsichtbar', table: t('string', "'auto'") },
    rounded: { control: 'text', description: 'Eckenradius (beim Kreis ohne Wirkung)', table: t('string', "'6px'") },
    label: { control: 'text', description: 'Text für Screenreader, wird einmal angesagt; leer lässt ihn weg', table: t('string', "'Lädt …'") },
  },
};

// Beispiele für die Doku-Seite (CardLibrary.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: CardLibraryExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Spielkarten    = { ...example('spiel'), tags: ['!dev'] };
export const Spielabschnitte = { ...example('abschnitte'), tags: ['!dev'] };
export const KartenNamen    = { ...example('namen'), tags: ['!dev'] };
export const KartenLogos    = { ...example('logos'), tags: ['!dev'] };
export const KartenNamenHandy = { ...example('namen-handy'), tags: ['!dev'] };
export const Spielerkarten  = { ...example('spieler'), tags: ['!dev'] };
export const SpielerkartenFoto = { ...example('spieler-foto'), tags: ['!dev'] };
export const SpielerkartenFotoHandy = { ...example('spieler-foto-handy'), tags: ['!dev'] };
export const SpielerkartenFotoFallback = { ...example('spieler-foto-fallback'), tags: ['!dev'] };
export const Ladezustaende  = { ...example('skeleton'), tags: ['!dev'] };
export const Zustaende      = { ...example('zustaende'), tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoSkeleton    = { ...example('do-skeleton'), tags: ['!dev'] };
export const DontSkeleton  = { ...example('dont-skeleton'), tags: ['!dev'] };
export const DoPlatzhalter = { ...example('do-platzhalter'), tags: ['!dev'] };
export const DontPlatzhalter = { ...example('dont-platzhalter'), tags: ['!dev'] };
export const DoStatus      = { ...example('do-status'), tags: ['!dev'] };
export const DontStatus    = { ...example('dont-status'), tags: ['!dev'] };
export const DoFotoAlt     = { ...example('do-foto-alt'), tags: ['!dev'] };
export const DontFotoAlt   = { ...example('dont-foto-alt'), tags: ['!dev'] };
export const DoFotoAusschnitt = { ...example('do-foto-ausschnitt'), tags: ['!dev'] };
export const DontFotoAusschnitt = { ...example('dont-foto-ausschnitt'), tags: ['!dev'] };
export const DoZeile       = { ...example('do-zeile'), tags: ['!dev'] };
export const DontZeile     = { ...example('dont-zeile'), tags: ['!dev'] };
