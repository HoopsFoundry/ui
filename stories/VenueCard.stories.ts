import VenueCardPlayground from './components/VenueCardPlayground.svelte';
import VenueCardExamples from './components/VenueCardExamples.svelte';
import { HALLEN } from './components/venueData';

export default {
  title: 'Components/VenueCard',
  component: VenueCardPlayground,
};

// Spielwiese für die Props-Tabelle (VenueCard.mdx): echte Komponente, alle Werte im Controls-Reiter schaltbar.
const render = (args: Record<string, unknown>) => ({ Component: VenueCardPlayground, props: args });
const t = (summary: string, def?: string) => ({ type: { summary }, ...(def ? { defaultValue: { summary: def } } : {}) });
const hall = HALLEN[0];

export const Spielwiese = {
  render,
  args: {
    name: hall.name, address: hall.address, lat: hall.lat, lng: hall.lng, info: hall.info, contact: hall.contact,
    gameCount: 4, limit: 2, href: hall.href,
    names: 'full', logos: true, size: 'standard', load: 'click', tileUrl: 'demo', mapHeight: 250,
  },
  argTypes: {
    name: { control: 'text', description: 'Name der Halle; die Überschrift der Karte und Teil des Namens der Karte („Karte: Name“). Pflicht', table: t('string') },
    address: { control: 'object', description: 'Adresse als `{ street?, zip?, city? }`; erscheint als `<address>` in höchstens zwei Zeilen. Leere Teile entfallen', table: t('VenueAddress') },
    lat: { control: 'number', description: 'Breite der Halle (−90 bis 90). Ohne gültiges Paar `lat`/`lng` entfällt die Karte', table: t('number') },
    lng: { control: 'number', description: 'Länge der Halle (−180 bis 180)', table: t('number') },
    info: { control: 'text', description: 'Kurzinfo, zum Beispiel Felder, Zugang, Parken', table: t('string') },
    contact: { control: 'object', description: 'Ansprechperson `{ name, phone?, email? }`; Telefon und E-Mail werden zu `tel:`- und `mailto:`-Links, wenn sie gültig sind', table: t('VenueContact') },
    gameCount: { control: { type: 'number', min: 0, max: 4 }, description: 'Nur Demo: Anzahl der Demo-Spiele, die als `games` übergeben werden (Demo-Logos für vier Vereine). `games` im Controls-Reiter überschreibt sie', table: t('number', '4') },
    games: { control: 'object', description: 'Spiele in der Halle (`ScheduleGame[]`, mit `heim` und `gast`). Gezeigt werden die nächsten `limit`; beendete und spielfreie Einträge entfallen. In `compact` entfällt der Block', table: t('ScheduleGame[]') },
    limit: { control: { type: 'number', min: 1, max: 5 }, description: 'Höchstzahl der Spiele, 1 bis 5', table: t('number', '2') },
    gamesLabel: { control: 'text', description: 'Beschriftung der Spieleliste (Überschrift des Blocks und Name der Liste)', table: t('string', "'Nächste Spiele in der Halle'") },
    href: { control: 'text', description: 'Seite der Halle; leer oder unsicheres Ziel: kein Link', table: t('string') },
    linkLabel: { control: 'text', description: 'Text des Links; der Name der Halle hängt als versteckte Ergänzung an', table: t('string', "'Zur Hallenseite'") },
    names: { control: 'inline-radio', options: ['full', 'short'], description: 'Voller Name oder Kurzname (`short`, falls vorhanden) der Mannschaften; bis 640 px erscheint der Kurzname automatisch', table: t("'full' | 'short'", "'full'") },
    logos: { control: 'boolean', description: 'Logo bzw. Initialen vor den Mannschaften der Spiele', table: t('boolean', 'false') },
    size: { control: 'inline-radio', options: ['standard', 'compact'], description: 'Karte etwa 40 % mit Spielen oder kleinere Karte (etwa 30 %) ohne Spiele', table: t("'standard' | 'compact'", "'standard'") },
    titleAs: { control: 'inline-radio', options: [undefined, 'h2', 'h3', 'h4', 'h5', 'h6'], description: 'Überschriftenebene des Namens. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor `h3`. Die Größe hängt am Token `--hoops-card-title-size`, nicht an der Ebene', table: t("'h2' | 'h3' | 'h4' | 'h5' | 'h6'", "'h3'") },
    load: { control: 'inline-radio', options: ['click', 'auto'], description: '`click`: Platzhalter, Kacheln erst nach „Karte laden“ (Standard). `auto`: sofort laden, nur mit Einwilligung oder eigenem Proxy', table: t("'click' | 'auto'", "'click'") },
    tileUrl: { control: 'text', description: 'Kachel-Adresse der Karte (siehe Map). In der Spielwiese lädt `demo` ein lokales Bild (kein Netzverkehr); `osm` nimmt den Standard der Karte', table: t('string', "'https://tile.openstreetmap.org/{z}/{x}/{y}.png'") },
    privacyNote: { control: 'text', description: 'Hinweis im Platzhalter der Karte; Standard: „Beim Laden der Karte erhält der Kartendienst deine IP-Adresse.“', table: t('string') },
    mapHeight: { control: { type: 'number', min: 200, max: 500, step: 20 }, description: 'Mindesthöhe der Karte in Pixeln (mindestens 200). Die Karte wächst mit den Daten daneben; schmal (Karte bis 640 px breit) gilt 16:9, mindestens 224 px', table: t('number', '250') },
  },
};

// Beispiele für die Doku-Seite (VenueCard.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: VenueCardExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Aufbau     = { ...example('aufbau'), tags: ['!dev'] };
export const Geladen    = { ...example('geladen'), tags: ['!dev'] };
export const Minimal    = { ...example('minimal'), tags: ['!dev'] };
export const OhneKarte  = { ...example('ohne-karte'), tags: ['!dev'] };
export const Kontakt    = { ...example('kontakt'), tags: ['!dev'] };
export const Spiele     = { ...example('spiele'), tags: ['!dev'] };
export const Compact    = { ...example('compact'), tags: ['!dev'] };
export const Handy      = { ...example('handy'), tags: ['!dev'] };
export const HandyAndereHallen = { ...example('handy-andere-hallen'), tags: ['!dev'] };
export const Zustaende  = { ...example('zustaende'), tags: ['!dev'] };
// Vanilla: mountVenueCard mit initMap (ohne Framework); die Handy-Vorschauen zeigen andere Hallen als die Svelte-Vorschauen
export const VanillaKarte      = { ...example('vanilla'), tags: ['!dev'] };
export const VanillaHandy      = { ...example('vanilla-handy'), tags: ['!dev'] };
export const VanillaHandyKompakt = { ...example('vanilla-handy-kompakt'), tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoAdresse        = { ...example('do-adresse'), tags: ['!dev'] };
export const DontAdresse      = { ...example('dont-adresse'), tags: ['!dev'] };
export const DoSpiele         = { ...example('do-spiele'), tags: ['!dev'] };
export const DontSpiele       = { ...example('dont-spiele'), tags: ['!dev'] };
export const DoKontakt        = { ...example('do-kontakt'), tags: ['!dev'] };
export const DontKontakt      = { ...example('dont-kontakt'), tags: ['!dev'] };
export const DoDatenschutz    = { ...example('do-datenschutz'), tags: ['!dev'] };
export const DontDatenschutz  = { ...example('dont-datenschutz'), tags: ['!dev'] };
