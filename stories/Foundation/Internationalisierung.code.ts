// Code-Beispiele und Daten der Seite „Internationalisierung“. Die Tests (tests/i18n-docs.test.ts) führen das Vanilla-Beispiel gegen das gebaute
// Bündel in jsdom aus, rendern das Svelte-Beispiel auf dem Server, übersetzen und rendern das React-Beispiel und prüfen Glossar und Zahlen gegen die Kataloge.
import en from '../../js/i18n/en.js';
import de from '../../js/i18n/de.js';

// ── Sprache einstellen ─────────────────────────────────────────────────────────────

export const einstellenVanilla = `<!doctype html>
<html lang="de">
<head>
  <link rel="stylesheet" href="/hoops/hoops.css" />
</head>
<body>
  <!-- Leer und mit hidden: initTheme setzt Symbole und Beschriftung (aus dem Katalog) -->
  <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" data-hoops="theme" hidden></button>

  <script type="module">
    import { initAll, setLocale, getLocale, t } from '/hoops/hoops.min.js';
    // Registriert den deutschen Katalog beim Import; liegt neben hoops.min.js und importiert es (eine Instanz des Kerns)
    import '/hoops/hoops-i18n-de.min.js';

    setLocale('de');                   // global, für die ganze Seite; ohne Aufruf gilt Englisch
    const ui = initAll(document);      // Reihenfolge egal: gestartete Bausteine folgen jedem späteren setLocale

    const sprache = getLocale();       // 'de'
    const knopf = t('theme.toggle');   // 'Dunkelmodus'
  </script>
</body>
</html>`;

export const einstellenSvelte = `<script>
  // Einmal beim Start der App, zum Beispiel im obersten Layout. Jeder spätere Aufruf von setLocale stellt alle Komponenten um.
  import '@hoopsfoundry/ui/i18n/de';             // registriert den deutschen Katalog (steht unter sideEffects)
  import { setLocale } from '@hoopsfoundry/ui/i18n';
  import Stepper from '@hoopsfoundry/ui/svelte/Stepper';

  setLocale('de');

  const schritte = [
    { id: 'team', label: 'Mannschaft', state: 'done' },
    { id: 'kader', label: 'Kader', state: 'current' },
    { id: 'pruefen', label: 'Prüfen', state: 'pending' },
  ];
</script>

<!-- Name der Liste „Fortschritt“, Zustände „erledigt“, „aktuell“, „ausstehend“ aus dem Katalog -->
<Stepper steps={schritte} />`;

export const einstellenReact = `import '@hoopsfoundry/ui/i18n/de';               // registriert den deutschen Katalog (steht unter sideEffects)
import { setLocale } from '@hoopsfoundry/ui/i18n';
import { HoopsProvider, Stepper, useLocale, type StepItem } from '@hoopsfoundry/ui/react';

setLocale('de');                                    // global, einmal beim Start (zum Beispiel in main.tsx)

const schritte: StepItem[] = [
  { id: 'team', label: 'Team', state: 'done' },
  { id: 'kader', label: 'Squad', state: 'current' },
  { id: 'pruefen', label: 'Review', state: 'pending' },
];

function Sprache() {
  return <p>Sprache hier: {useLocale()}</p>;        // 'de' außen, 'en' im Anbieter
}

export function App() {
  return (
    <>
      <Stepper steps={schritte} />
      {/* Ein Teilbaum in einer anderen Sprache; ändert den globalen Zustand nicht. documentLang beim Server-Rendern angeben */}
      <HoopsProvider locale="en" documentLang="de">
        <Stepper steps={schritte} />
        <Sprache />
      </HoopsProvider>
    </>
  );
}`;

// ── Texte überschreiben ────────────────────────────────────────────────────────────

export const ueberschreibenVanilla = `<script type="module">
  import { setLocale, setTexts } from '/hoops/hoops.min.js';
  import '/hoops/hoops-i18n-de.min.js';
  import { renderLeagueCard } from '/hoops/hoops-render.min.js';

  setLocale('de');
  // Global, für alle Bausteine und jede Sprache; ein zweiter Aufruf ersetzt die Liste, setTexts({}) löscht sie
  setTexts({ 'league.link': 'Alle Tabellen des Bezirks' });

  const liga = {
    title: 'Bezirksliga Nordhain',
    href: '/tabelle',
    teams: [
      { rank: 1, name: 'Lindenberg Hawks', played: 8, points: 14, zone: 'up' },
      { rank: 2, name: 'TSV Nordhain 1920', played: 8, points: 12, own: true },
      { rank: 3, name: 'BG Seeberg', played: 8, points: 10 },
    ],
  };

  // Nur für diesen Aufruf: options.texts schlägt setTexts, eine Eigenschaft wie linkLabel schlägt beides
  const eigen = renderLeagueCard(liga, { texts: { 'league.legend': 'Zeichenerklärung' } });
  const verlinkt = renderLeagueCard({ ...liga, linkLabel: 'Zur Tabelle' }, { texts: { 'league.link': 'wird nicht gezeigt' } });
  // Eine Sprache nur für diesen Aufruf (etwa beim Erzeugen statischer Seiten in Node); der globale Zustand bleibt 'de'
  const englisch = renderLeagueCard(liga, { locale: 'en' });
</script>`;

export const ueberschreibenSvelte = `<script>
  import { provideI18n } from '@hoopsfoundry/ui/svelte/i18n';
  import LeagueCard from '@hoopsfoundry/ui/svelte/LeagueCard';

  // Für alle Komponenten unter dieser (einmal beim Initialisieren aufrufen); der globale Zustand bleibt unberührt
  provideI18n(() => ({ texts: { 'league.link': 'Alle Tabellen des Bezirks' } }));

  const teams = [
    { rank: 1, name: 'Lindenberg Hawks', played: 8, points: 14, zone: 'up' },
    { rank: 2, name: 'TSV Nordhain 1920', played: 8, points: 12, own: true },
    { rank: 3, name: 'BG Seeberg', played: 8, points: 10 },
  ];
</script>

<!-- texts an der Komponente schlägt den Anbieter; eine Eigenschaft wie linkLabel schlüge beides -->
<LeagueCard title="Bezirksliga Nordhain" {teams} href="/tabelle" texts={{ 'league.legend': 'Zeichenerklärung' }} />`;

export const ueberschreibenReact = `import { HoopsProvider, LeagueCard, type LeagueTeam } from '@hoopsfoundry/ui/react';

const teams: LeagueTeam[] = [
  { rank: 1, name: 'Lindenberg Hawks', played: 8, points: 14, zone: 'up' },
  { rank: 2, name: 'TSV Nordhain 1920', played: 8, points: 12, own: true },
  { rank: 3, name: 'BG Seeberg', played: 8, points: 10 },
];

// Außerhalb der Komponente: ein stabiles Objekt (sonst rechnen alle Bausteine darunter bei jedem Rendern neu)
const bezirk = { 'league.link': 'Alle Tabellen des Bezirks' };

export function Tabelle() {
  return (
    <HoopsProvider texts={bezirk}>
      {/* texts an der Komponente schlägt den Anbieter; eine Eigenschaft wie linkLabel schlüge beides */}
      <LeagueCard title="Bezirksliga Nordhain" teams={teams} href="/tabelle" texts={{ 'league.legend': 'Zeichenerklärung' }} />
    </HoopsProvider>
  );
}`;

// ── Sprache ergänzen ───────────────────────────────────────────────────────────────

export const ergaenzen = `import { registerLocale, setLocale, t } from '@hoopsfoundry/ui/i18n';   // Vanilla: dieselben Namen aus hoops.min.js
import '@hoopsfoundry/ui/i18n/de';

// Eine regionale Variante braucht nur die abweichenden Schlüssel: de-CH → de → en
registerLocale('de-CH', {
  'modal.close': 'Schliessen',
  'accordion.collapse-all': 'Alle schliessen',
});

// Eine neue Sprache: fehlende Schlüssel fallen auf Englisch zurück (vollständig ist besser, siehe Leitfaden)
registerLocale('fr', {
  'modal.close': 'Fermer',
  'league.summary.teams': { one: '{count} équipe', many: '{count} d’équipes', other: '{count} équipes' },
});

setLocale('de-CH');
const schliessen = t('modal.close');            // 'Schliessen' (de-CH)
const menue = t('appnav.menu');                 // 'Menü' (aus de)

setLocale('fr');
const teams = t('league.summary.teams', { count: 12 });   // '12 équipes'
const fallback = t('appnav.menu');              // 'Menu' (aus en)`;

export const pruefen = `// Eigener Katalog in der Anwendung: im eigenen Test gegen den englischen Bezug prüfen
import en from '@hoopsfoundry/ui/i18n/en';
import fr from './i18n/fr.js';

const fehlt = Object.keys(en).filter((key) => !(key in fr));
const zuviel = Object.keys(fr).filter((key) => !(key in en));
// fehlt und zuviel sollen leer sein; Platzhalter {name} müssen in beiden Fassungen gleich heißen

// Ein Katalog als Beitrag zum Paket liegt unter js/i18n/<code>.js; im Repository prüft:
//   node scripts/check-i18n.mjs --locale=fr`;

// ── Ereignis ───────────────────────────────────────────────────────────────────────

export const ereignis = `import { onLocaleChange, setLocale, setTexts, LOCALE_EVENT } from '/hoops/hoops.min.js';

// Empfohlen: onLocaleChange meldet jede Änderung (Sprache, neuer Katalog, setTexts), auch wenn kein Baustein läuft
const abmelden = onLocaleChange((locale) => {
  document.documentElement.lang = locale;        // zum Beispiel die Sprache der Seite mitführen
});

// Das DOM-Ereignis selbst (LOCALE_EVENT === 'hoops:localechange', detail: { locale }) auf document
document.addEventListener('hoops:localechange', (event) => console.log(event.detail.locale));

setLocale('en');                 // beide melden 'en'
setTexts({ 'modal.close': 'Done' });   // meldet erneut, detail.locale bleibt 'en'
abmelden();`;

// ── Glossar ────────────────────────────────────────────────────────────────────────

export interface GlossarEintrag {
  /** Katalogschlüssel */
  key: string;
  /** Wortlaut im deutschen Katalog (bei Mehrzahl die Form `form`) */
  de: string;
  /** Wortlaut im englischen Katalog */
  en: string;
  /** Mehrzahlform, deren Wortlaut hier steht (Standard: der Wert ist ein Text) */
  form?: 'one' | 'other';
  hinweis?: string;
}

/**
 * Fachbegriffe aus den Katalogen. Absichtlich ausgeschrieben, nicht aus den Katalogen gelesen: Ein Test vergleicht jeden Eintrag mit `en` und `de`,
 * so fällt eine Änderung eines Fachbegriffs im Katalog auf und wird bewusst ins Glossar übernommen.
 */
export const glossar: GlossarEintrag[] = [
  { key: 'common.home', de: 'Heim', en: 'Home' },
  { key: 'common.away', de: 'Gast', en: 'Away' },
  { key: 'common.outcome.win', de: 'Sieg', en: 'Win' },
  { key: 'common.outcome.loss', de: 'Niederlage', en: 'Loss' },
  { key: 'common.outcome.draw', de: 'Unentschieden', en: 'Draw' },
  { key: 'common.outcome-letter.win', de: 'S', en: 'W', hinweis: 'Buchstabe der Formleiste (data-letter); ebenso N/L und U/D' },
  { key: 'common.live', de: 'Live', en: 'Live' },
  { key: 'schedule.bye-none', de: 'Spielfrei', en: 'No game', hinweis: 'Freilos-Zeile ohne Notiz' },
  { key: 'schedule.bye', de: '{team} hat Freilos', en: '{team} has a bye', hinweis: 'Satz mit Markup-Platzhalter; die Wortstellung gehört der Sprache' },
  { key: 'schedule.state.cancelled', de: 'abgesagt', en: 'canceled', hinweis: 'amerikanische Schreibweise mit einem l' },
  { key: 'schedule.state.postponed', de: 'verschoben', en: 'postponed' },
  { key: 'schedule.provisional', de: 'vorläufig', en: 'provisional', hinweis: 'Ergebnis noch nicht bestätigt' },
  { key: 'schedule.table-label', de: 'Spielplan', en: 'Schedule' },
  { key: 'schedule.col.opponent', de: 'Gegner', en: 'Opponent' },
  { key: 'schedule.col.venue', de: 'Halle', en: 'Venue' },
  { key: 'schedule.col.field', de: 'Feld', en: 'Court' },
  { key: 'league.table', de: 'Tabelle', en: 'Standings', hinweis: 'Ligatabelle; die Datentabelle heißt table.label (Tabelle/Table)' },
  { key: 'league.col.rank', de: 'Platz', en: 'Rank' },
  { key: 'league.col.team', de: 'Mannschaft', en: 'Team' },
  { key: 'league.col.played-short', de: 'SP', en: 'GP', hinweis: 'Spiele / games played' },
  { key: 'league.col.points-short', de: 'PKT', en: 'PTS' },
  { key: 'league.col.diff', de: 'Korbdifferenz', en: 'Point difference' },
  { key: 'league.zone.up.legend', de: 'Aufstieg', en: 'Promotion' },
  { key: 'league.zone.down.legend', de: 'Abstieg', en: 'Relegation', hinweis: 'Falscher Freund: englisch „Relegation“ ist der Abstieg' },
  { key: 'league.zone.playoff.legend', de: 'Relegation', en: 'Play-off', hinweis: 'Deutsch „Relegation“ ist das Entscheidungsspiel, englisch „Play-off“' },
  { key: 'match.final', de: 'Endstand', en: 'Final score' },
  { key: 'periods.label.quarter', de: '{number}. Viertel', en: 'Quarter {number}', hinweis: 'Ordnungszahl vor dem Wort im Deutschen, Zahl danach im Englischen' },
  { key: 'periods.short.quarter', de: 'V{number}', en: 'Q{number}' },
  { key: 'periods.label.eighth', de: '{number}. Achtel', en: 'Period {number}', hinweis: 'Spiele mit acht Abschnitten (Jugend)' },
  { key: 'periods.label.overtime', de: 'Verlängerung', en: 'Overtime' },
  { key: 'periods.short.overtime', de: 'VL', en: 'OT' },
  { key: 'team.record.label', de: 'S–N', en: 'W–L', hinweis: 'Bilanz Siege–Niederlagen' },
  { key: 'team.stat.two-pt', de: '2PP %', en: '2P %', hinweis: 'Trefferquote Zweier' },
  { key: 'team.stat.three-pt', de: '3PP %', en: '3P %', hinweis: 'Trefferquote Dreier' },
  { key: 'team.stat.rebounds', de: 'TRB', en: 'REB' },
  { key: 'team.stat.turnovers', de: 'TO', en: 'TO', hinweis: 'Ballverluste' },
  { key: 'team.squad.staff', de: '{count} Trainer', en: '{count} coach', form: 'one' },
  { key: 'player.captain', de: 'Kapitän', en: 'Captain' },
  { key: 'team.season-stats', de: 'Saison-Statistik', en: 'Season stats' },
];

/**
 * Begriffe, die die Bausteine nicht selbst ausgeben: Die Texte der Spielereignisse (PlayByPlay, Feld `title`) liefert die Anwendung als Daten.
 * Die Art (`kind`) wählt nur Farbe und Symbol. Empfohlene Übersetzungen, kein Katalog; ein Test prüft, dass es die Arten gibt und sie nicht im Katalog stehen.
 */
export const datenBegriffe: { kind: string; de: string; en: string }[] = [
  { kind: 'foul', de: 'Foul', en: 'Foul' },
  { kind: 'ft', de: 'Freiwurf', en: 'Free throw' },
  { kind: 'timeout', de: 'Auszeit', en: 'Timeout' },
  { kind: 'sub', de: 'Wechsel', en: 'Substitution' },
  { kind: 'turnover', de: 'Ballverlust', en: 'Turnover' },
  { kind: 'score-2p', de: 'Zwei-Punkte-Wurf', en: 'Two-point field goal' },
  { kind: 'score-3p', de: 'Drei-Punkte-Wurf', en: 'Three-point field goal' },
];

// ── Zahlen aus den Katalogen (gemessen, nicht geschätzt) ────────────────────────────

type Wert = string | Record<string, string>;
const texte = (value: Wert) => (typeof value === 'string' ? [value] : Object.values(value));
const zeichen = (catalog: Record<string, Wert>) => Object.values(catalog).reduce((sum, value) => sum + texte(value).reduce((s, text) => s + [...text].length, 0), 0);

export const katalog = {
  schluessel: Object.keys(en).length,
  mehrzahl: Object.values(en).filter((value) => typeof value !== 'string').length,
  platzhalter: Object.values(en).filter((value) => texte(value as Wert).some((text) => /\{[A-Za-z_][A-Za-z0-9_]*\}/.test(text))).length,
  bausteine: new Set(Object.keys(en).map((key) => key.split('.')[0])).size,
  zeichenEn: zeichen(en as Record<string, Wert>),
  zeichenDe: zeichen(de as Record<string, Wert>),
};

/** Schlüssel, deren deutscher Text am stärksten länger ist als der englische (Zeichen, Mehrzahl: Form `other`). */
export const laengsteDe = Object.keys(en)
  .map((key) => {
    const pickOther = (value: Wert) => (typeof value === 'string' ? value : value.other);
    const e = pickOther((en as Record<string, Wert>)[key]);
    const d = pickOther((de as Record<string, Wert>)[key]);
    return { key, en: e, de: d, mehr: [...d].length - [...e].length };
  })
  .sort((a, b) => b.mehr - a.mehr || a.key.localeCompare(b.key))
  .slice(0, 5);

// ── Migration ──────────────────────────────────────────────────────────────────────

/** Zeilen der Migrationstabelle: Änderung, was zu tun ist, ob das Migrationsskript es erledigt. */
export const migration: { aenderung: string; tun: string; skript: string }[] = [
  {
    aenderung: 'Standardsprache ist Englisch (Vanilla, render*, init*, mount*, Karte, Svelte, React)',
    tun: "Einmal den deutschen Katalog laden und setLocale('de') aufrufen: ohne Build import './hoops-i18n-de.min.js' neben hoops.min.js; mit Bündler import '@hoopsfoundry/ui/i18n/de'.",
    skript: 'nein, von Hand',
  },
  {
    aenderung: 'statEmptyText (js/stats.js) entfernt',
    tun: 'statEmptyLabel(options) aufrufen; liefert den Text der wirksamen Sprache.',
    skript: 'nein, von Hand',
  },
  {
    aenderung: 'THEME_LABEL (js/theme.js, Vanilla-Bündel) entfernt',
    tun: "t('theme.toggle') aufrufen; eigener Text über die Option label oder setTexts.",
    skript: 'nein, von Hand',
  },
  {
    aenderung: 'hoops-map.js, hoops-render.js und hoops-i18n-de.js importieren den Kern aus hoops.js',
    tun: 'hoops.js (bzw. hoops.min.js zu den .min.js-Dateien) in denselben Ordner legen; beim Kopieren von dist/vanilla ist es dabei.',
    skript: 'nein, von Hand',
  },
  {
    aenderung: 'Formbuchstaben über data-letter',
    tun: 'Von Hand geschriebenes Markup der Formleiste (hoops-form--letters) braucht data-letter an jedem hoops-form-item; render* und die Komponenten setzen es selbst.',
    skript: 'nein, von Hand',
  },
];
