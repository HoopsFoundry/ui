import LeagueCardPlayground from './components/LeagueCardPlayground.svelte';
import LeagueCardExamples from './components/LeagueCardExamples.svelte';
import { demoTable } from './components/leagueData';

export default {
  title: 'Components/LeagueCard',
  component: LeagueCardPlayground,
};

// Spielwiese für die Props-Tabelle (LeagueCard.mdx): echte Komponente, alle Werte im Controls-Reiter schaltbar.
const render = (args: Record<string, unknown>) => ({ Component: LeagueCardPlayground, props: args });
const t = (summary: string, def?: string) => ({ type: { summary }, ...(def ? { defaultValue: { summary: def } } : {}) });

export const Spielwiese = {
  render,
  args: {
    title: 'Oberliga Nordhain Männer', teams: demoTable(0, { links: true }), ownRank: 0, zones: false,
    teamCount: 12, played: 66, total: 132, columns: [], limit: 3, href: '#tabelle', linkLabel: 'Komplette Tabelle und Spielplan', live: 0,
    names: 'full', logos: false, size: 'standard', collapsible: false, open: true, id: '',
  },
  argTypes: {
    title: { control: 'text', description: 'Name der Liga; die Überschrift der Karte', table: t('string') },
    teams: { control: 'object', description: 'Tabelle als Liste von `{ rank, name, short?, logo?, href?, played, points, won?, lost?, diff?, form?, own?, zone? }`. Die Karte zeigt davon einen Ausschnitt', table: t('LeagueTeam[]') },
    ownRank: { control: { type: 'number', min: 0, max: 12 }, description: 'Nur Demo: Platz der eigenen Mannschaft (setzt `own: true` an diese Zeile); 0 = keine eigene Mannschaft, dann zeigt die Karte die ersten `limit` Plätze', table: t('number', '0') },
    zones: { control: 'boolean', description: 'Nur Demo: setzt `zone` (Platz 1 Aufstieg, 10 Relegation, 11 und 12 Abstieg); die Legende erscheint, wenn eine Zone in den gezeigten Zeilen vorkommt', table: t('boolean', 'false') },
    teamCount: { control: 'number', description: 'Teams der ganzen Liga (Untertitel „12 Teams“), falls `teams` nur einen Teil enthält; sonst die Länge der Liste', table: t('number') },
    played: { control: 'number', description: 'Gespielte Spiele der Saison, im Untertitel „66 von 132 Spielen gespielt“', table: t('number') },
    total: { control: 'number', description: 'Alle Spiele der Saison', table: t('number') },
    columns: { control: 'check', options: ['won', 'lost', 'diff', 'form'], description: 'Zusätzliche Spalten: Siege (S), Niederlagen (N), Korbdifferenz (Diff), Form (letzte fünf Spiele). Bis 640 px Breite entfallen sie', table: t("('won' | 'lost' | 'diff' | 'form')[]", '[]') },
    limit: { control: { type: 'number', min: 1, max: 12 }, description: 'Zeilen ohne eigene Mannschaft (die ersten Plätze). Mit eigener Mannschaft erscheinen vier: zwei davor, die eigene, eine dahinter', table: t('number', '3') },
    href: { control: 'text', description: 'Ziel des Links unter der Tabelle; leer: kein Link', table: t('string') },
    linkLabel: { control: 'text', description: 'Text des Links; der Titel der Liga hängt als versteckte Ergänzung an', table: t('string', "'Komplette Tabelle und Spielplan'") },
    live: { control: 'number', description: 'Laufende Spiele: Zahl („2 Spiele laufen“); `true` zeigt nur „Live“; 0 oder `false`: nichts', table: t('number | boolean', 'false') },
    names: { control: 'inline-radio', options: ['full', 'short'], description: 'Voller Name oder Kurzname (`short`, falls vorhanden); bis 640 px erscheint der Kurzname automatisch', table: t("'full' | 'short'", "'full'") },
    logos: { control: 'boolean', description: 'Logo bzw. Initialen vor dem Namen (die Spielwiese ergänzt Demo-Logos für vier Vereine)', table: t('boolean', 'false') },
    size: { control: 'inline-radio', options: ['standard', 'compact'], description: 'Zeilen 60 px mit Untertitel oder Zeilen 40 px ohne Untertitel (Seitenleiste)', table: t("'standard' | 'compact'", "'standard'") },
    collapsible: { control: 'boolean', description: 'Einklappbar: der Kopf (Titel, Untertitel, Live) wird zum Accordion-Kopf, Tabelle, Legende und Link sind der Bereich. Die Spielwiese zeigt sie geöffnet (`open`)', table: t('boolean', 'false') },
    open: { control: 'boolean', description: 'Geöffnet (nur mit `collapsible`; Svelte `bind:open`, React `open` mit `onOpenChange`). Die Spielwiese startet geöffnet', table: t('boolean', 'false') },
    id: { control: 'text', description: 'Anker für Deep-Link und Sprungleiste (nur mit `collapsible`); leer: kein Anker', table: t('string') },
    titleAs: { control: 'inline-radio', options: [undefined, 'h2', 'h3', 'h4', 'h5', 'h6'], description: 'Überschriftenebene des Titels. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor `h3`. Die Größe hängt am Token `--hoops-card-title-size`, nicht an der Ebene. Leer lassen, damit die Ebene gilt, die sich aus der Gliederung ergibt', table: t("'h2' | 'h3' | 'h4' | 'h5' | 'h6'", "'h3'") },
  },
};

// Beispiele für die Doku-Seite (LeagueCard.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: LeagueCardExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Standard  = { ...example('standard'), tags: ['!dev'] };
export const Minimal   = { ...example('minimal'), tags: ['!dev'] };
export const Spalten   = { ...example('spalten'), tags: ['!dev'] };
export const Ausschnitt = { ...example('ausschnitt'), tags: ['!dev'] };
export const Logos     = { ...example('logos'), tags: ['!dev'] };
export const Zonen     = { ...example('zonen'), tags: ['!dev'] };
export const Live      = { ...example('live'), tags: ['!dev'] };
export const Compact   = { ...example('compact'), tags: ['!dev'] };
export const Handy     = { ...example('handy'), tags: ['!dev'] };
export const Zustaende = { ...example('zustaende'), tags: ['!dev'] };
export const Einklappbar = { ...example('einklappbar'), tags: ['!dev'] };
export const EinklappbarId = { ...example('einklappbar-id'), tags: ['!dev'] };
export const EinklappbarGruppe = { ...example('einklappbar-gruppe'), tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoAusschnitt   = { ...example('do-ausschnitt'), tags: ['!dev'] };
export const DontAusschnitt = { ...example('dont-ausschnitt'), tags: ['!dev'] };
export const DoZonen        = { ...example('do-zonen'), tags: ['!dev'] };
export const DontZonen      = { ...example('dont-zonen'), tags: ['!dev'] };
export const DoForm         = { ...example('do-form'), tags: ['!dev'] };
export const DontForm       = { ...example('dont-form'), tags: ['!dev'] };
export const DoZeilen       = { ...example('do-zeilen'), tags: ['!dev'] };
export const DontZeilen     = { ...example('dont-zeilen'), tags: ['!dev'] };
export const DoOffen        = { ...example('do-offen'), tags: ['!dev'] };
export const DontZu         = { ...example('dont-zu'), tags: ['!dev'] };
