import TeamCardPlayground from './components/TeamCardPlayground.svelte';
import TeamCardExamples from './components/TeamCardExamples.svelte';

export default {
  title: 'Components/TeamCard',
  component: TeamCardPlayground,
};

// Spielwiese für die Props-Tabelle (TeamCard.mdx): echte Komponente, alle Werte im Controls-Reiter schaltbar.
const render = (args: Record<string, unknown>) => ({ Component: TeamCardPlayground, props: args });
const t = (summary: string, def?: string) => ({ type: { summary }, ...(def ? { defaultValue: { summary: def } } : {}) });
const interactive = { control: 'inline-radio', options: ['none', 'link', 'button'], description: 'Nur Demo: nicht klickbar, als Link (`href`) oder als Schalter (`onclick`)', table: t("'none' | 'link' | 'button'", "'none'") };

export const Spielwiese = {
  render,
  args: {
    interactive: 'none', size: 'standard', name: 'TSV Nordhain 1920', short: 'Nordhain', league: 'Bayernliga Süd', leagueHref: '', season: '2026/27',
    record: { w: 12, l: 3 }, rank: 3, rankOf: 12, points: 24,
    next: { date: 'Sa, 25.05.', time: '19:30', opponent: { name: 'Lindenberg Hawks', short: 'Hawks' }, at: 'heim', venue: 'Nordhain-Halle' },
    last: { date: 'Sa, 18.05.', opponent: { name: 'BG Seeberg', short: 'Seeberg' }, ownScore: 92, opponentScore: 79, at: 'gast' },
    squad: { players: 14, staff: 3 }, stats: { twoPtPct: 48.2, threePtPct: 36.5, trb: 41.3, to: 12.1 },
    names: 'full', logos: false,
  },
  argTypes: {
    interactive,
    size: { control: 'inline-radio', options: ['standard', 'compact'], description: 'Karte mit allen Blöcken oder Listenzeile (Logo, Name, Liga, Bilanz kurz, Platz)', table: t("'standard' | 'compact'", "'standard'") },
    name: { control: 'text', description: 'Name der Mannschaft (als einziges Feld Pflicht); die Spielwiese ergänzt das Logo für TSV Nordhain 1920', table: t('string') },
    short: { control: 'text', description: 'Kurzname: Anzeige bei `names="short"` und automatisch bis 640 px Fensterbreite', table: t('string') },
    names: { control: 'inline-radio', options: ['full', 'short'], description: 'Voller Name oder Kurzname (`short`, falls vorhanden), auch bei den Gegnern', table: t("'full' | 'short'", "'full'") },
    logos: { control: 'boolean', description: 'Logo bzw. Initialen vor dem Gegner in den Spielzeilen (das Logo im Kopf steht immer)', table: t('boolean', 'false') },
    league: { control: 'text', description: 'Liga, unter dem Namen', table: t('string', "''") },
    leagueHref: { control: 'text', description: 'Link der Liga; nur ohne `href`/`onclick` (eine Aktion je Karte). Leer: reiner Text', table: t('string') },
    season: { control: 'text', description: 'Saison, z. B. „2026/27“, neben der Liga', table: t('string', "''") },
    record: { control: 'object', description: 'Bilanz `{ w, l, d? }`: Siege, Niederlagen, optional Unentschieden („12–3“ bzw. „5–1–2“)', table: t('{ w: number; l: number; d?: number }') },
    rank: { control: 'number', description: 'Tabellenplatz (ganze Zahl ab 1)', table: t('number') },
    rankOf: { control: 'number', description: 'Teams in der Tabelle: „Platz von 12“', table: t('number') },
    points: { control: 'number', description: 'Tabellenpunkte', table: t('number') },
    next: { control: 'object', description: 'Nächstes Spiel `{ date?, time?, opponent: { name, short?, logo? }, at?, venue? }`; `at` `heim` zeigt „vs.“, `gast` „@“', table: t("{ date?: string; time?: string; opponent: TeamRef; at?: 'heim' | 'gast'; venue?: string }") },
    last: { control: 'object', description: 'Letztes Spiel `{ date?, opponent, ownScore, opponentScore, at? }` mit S/N/U-Chip aus dem Ergebnis', table: t("{ date?: string; opponent: TeamRef; ownScore: number; opponentScore: number; at?: 'heim' | 'gast' }") },
    squad: { control: 'object', description: 'Kader-Kurzliste `{ players, staff? }`: „14 Spieler · 3 Trainer“', table: t('{ players: number; staff?: number }') },
    stats: { control: 'object', description: 'Saison-Statistik `{ twoPtPct?, threePtPct?, trb?, to? }`; nur übergebene Felder erscheinen, ohne Feld entfällt der Block (kein Strich als Platzhalter)', table: t('{ twoPtPct?: number; threePtPct?: number; trb?: number; to?: number }') },
    titleAs: { control: 'inline-radio', options: ['h2', 'h3', 'h4', 'h5', 'h6'], description: 'Überschriftenebene des Namens in `standard`. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor `h3`. Die Größe hängt am Token `--hoops-card-title-size`, nicht an der Ebene. Eine Auswahl hier überstimmt ein umgebendes `HeadingLevel`; leer lassen, damit die Ebene gilt, die sich aus der Gliederung ergibt.', table: t("'h2' | 'h3' | 'h4' | 'h5' | 'h6'", "'h3'") },
  },
};


// Beispiele für die Doku-Seite (TeamCard.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: TeamCardExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Standard  = { ...example('standard'), tags: ['!dev'] };
export const Forfait   = { ...example('forfait'), tags: ['!dev'] };
export const Minimal   = { ...example('minimal'), tags: ['!dev'] };
export const Logos     = { ...example('logos'), tags: ['!dev'] };
export const Compact   = { ...example('compact'), tags: ['!dev'] };
export const Klickbar  = { ...example('klickbar'), tags: ['!dev'] };
export const Handy     = { ...example('handy'), tags: ['!dev'] };
export const Zustaende = { ...example('zustaende'), tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoStats    = { ...example('do-stats'), tags: ['!dev'] };
export const DontStats  = { ...example('dont-stats'), tags: ['!dev'] };
export const DoListe    = { ...example('do-liste'), tags: ['!dev'] };
export const DontListe  = { ...example('dont-liste'), tags: ['!dev'] };
export const DoAktion   = { ...example('do-aktion'), tags: ['!dev'] };
export const DontAktion = { ...example('dont-aktion'), tags: ['!dev'] };
