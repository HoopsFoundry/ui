import MapExamples from './components/MapExamples.svelte';
import MapPlayground from './components/MapPlayground.svelte';

const t = (summary: string, def?: string) => ({ type: { summary }, ...(def ? { defaultValue: { summary: def } } : {}) });

export default {
  title: 'Components/Map',
  component: MapPlayground,
  argTypes: {
    label: { control: 'text', description: 'Name der Karte für Hilfstechnik (Region, Pflicht). Mehrere Karten auf einer Seite brauchen verschiedene Namen (axe: `landmark-unique`).', table: t('string') },
    count: { control: { type: 'number', min: 1, max: 3, step: 1 }, description: 'Nur Demo: Anzahl der Marker (`markers`). Ab zwei zählt die Karte von 1 an und passt den Ausschnitt allen Markern an.', table: t('number', '1') },
    ownFirst: { control: 'boolean', description: 'Nur Demo: der erste Marker ist der eigene Ort (`own: true`, Marker in Gold, Hinweis „Eigener Ort“).', table: t('boolean', 'true') },
    zoom: { control: { type: 'number', min: 3, max: 19, step: 1 }, description: 'Zoomstufe 3 bis 19. Ohne `center` und `zoom` passt sich der Ausschnitt allen Markern an; ein Marker: Standard 15.', table: t('number', '15') },
    height: { control: { type: 'number', min: 200, max: 600, step: 20 }, description: 'Höhe der Karte in Pixeln (mindestens 200).', table: t('number', '320') },
    interactive: { control: 'boolean', description: 'Gesten: Ziehen, Scrollzoom, Doppelklick, Pinch. Bei `false` bleiben Tasten (Pfeile, Plus, Minus) und die Zoom-Schaltflächen.', table: t('boolean', 'true') },
    load: { control: 'inline-radio', options: ['click', 'auto'], description: '`click`: Platzhalter, Kacheln erst nach „Karte laden“ (Standard, datenschutzfreundlich). `auto`: sofort laden, wenn die App eine Einwilligung hat oder einen eigenen Proxy nutzt.', table: t("'click' | 'auto'", "'click'") },
    tileUrl: { control: 'text', description: 'Adresse der Kacheln mit `{z}`, `{x}`, `{y}` (`{s}`, `{r}` erlaubt); nur `https:`, ein Pfad ab Wurzel oder `http://localhost`. Standard: `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (Demo und Entwicklung; produktiv ein eigener Proxy). In der Spielwiese lädt `demo` ein lokales Bild (kein Netzverkehr); `osm` nimmt den Standard.', table: t('string', "'https://tile.openstreetmap.org/{z}/{x}/{y}.png'") },
    attribution: { control: 'text', description: 'Text der Quellenangabe, verlinkt auf `https://www.openstreetmap.org/copyright`. Standard „© OpenStreetMap-Mitwirkende“. Es gibt kein Prop zum Ausblenden; ein leerer Text ergibt den Standard.', table: t('string', "'© OpenStreetMap-Mitwirkende'") },
    privacyNote: { control: 'text', description: 'Hinweis im Platzhalter. Standard: „Beim Laden der Karte erhält der Kartendienst deine IP-Adresse.“ Bei eigenem Proxy ein anderer Text.', table: t('string') },
    appLinks: { control: 'check', options: ['osm', 'geo', 'route'], description: 'Links je Ort in der Liste: `osm` („In OpenStreetMap öffnen“), `geo` („In Karten-App öffnen“, `geo:`-Link), `route` („Route planen“).', table: t("('osm' | 'geo' | 'route')[]", "['osm', 'route']") },
    showList: { control: 'boolean', description: 'Liste der Orte mit Koordinaten und Links sichtbar. Bei `false` nur für Hilfstechnik (ohne Links); beim Drucken erscheint sie immer.', table: t('boolean', 'true') },
    dimInDark: { control: 'boolean', description: 'Kacheln im Dunkelmodus abdunkeln (Filter nur auf der Kachelebene).', table: t('boolean', 'true') },
    darkTiles: { control: 'inline-radio', options: ['dim', 'invert'], description: 'Verfahren für die Kacheln im Dunkelmodus: `dim` dunkelt ab (Standard), `invert` invertiert und färbt um (Wasser und Straßen wirken fremd, die Karte wird wirklich dunkel). Wirkt nur mit `dimInDark`.', table: t("'dim' | 'invert'", "'dim'") },
    seat: { control: 'boolean', description: 'Nur Demo: Ein Vereinssitz (Marker-Art `kind: \'seat\'`, Haus-Symbol, ohne Nummer) kommt als letzter Marker dazu.', table: t('boolean', 'false') },
  },
  args: { label: 'Karte der Sporthalle Nordhain', count: 1, ownFirst: true, height: 320, interactive: true, load: 'click', tileUrl: 'demo', appLinks: ['osm', 'route'], showList: true, dimInDark: true, darkTiles: 'dim', seat: false },
};

export const Standard = { args: {} };

// Spielwiese für die Props-Tabelle (Map.mdx): alle Werte im Controls-Reiter schaltbar.
export const Spielwiese = { args: { count: 3, load: 'auto', appLinks: ['osm', 'geo', 'route'], label: 'Spielwiese: Hallenkarte' } };

// Beispiele für die Doku-Seite (Map.mdx). Die Steuerelemente passen hier nicht, daher aus.
const example = (name: string) => ({
  render: () => ({ Component: MapExamples, props: { example: name } }),
  parameters: { controls: { disable: true }, layout: 'padded' },
});

export const Aufbau       = { ...example('aufbau'), tags: ['!dev'] };
export const EigenerProxy = { ...example('proxy'), tags: ['!dev'] };
export const Geladen      = { ...example('geladen'), tags: ['!dev'] };
export const MehrereMarker = { ...example('mehrere'), tags: ['!dev'] };
export const Vereinssitz  = { ...example('sitz'), tags: ['!dev'] };
export const SitzMarker   = { ...example('sitz-pins'), tags: ['!dev'] };
export const DunkleKacheln = { ...example('dunkle-kacheln'), tags: ['!dev'] };
export const Ausschnitt   = { ...example('ausschnitt'), tags: ['!dev'] };
export const Statisch     = { ...example('statisch'), tags: ['!dev'] };
export const KartenApp    = { ...example('karten-app'), tags: ['!dev'] };
export const Fehler       = { ...example('fehler'), tags: ['!dev'] };
export const Handy        = { ...example('handy'), tags: ['!dev'] };
export const Zustaende    = { ...example('zustaende'), tags: ['!dev'] };
// Vanilla: mountMap in einen Behälter (ohne Framework); Handy-Vorschauen mit anderen Hallen als die Svelte-Fassung
export const VanillaKarte     = { ...example('vanilla'), tags: ['!dev'] };
export const VanillaGeladen   = { ...example('vanilla-geladen'), tags: ['!dev'] };
export const VanillaHandy     = { ...example('vanilla-handy'), tags: ['!dev'] };
export const VanillaHandyDunkel = { ...example('vanilla-handy-dunkel'), tags: ['!dev'] };

// Dos und Don'ts: nur in der Doku. Der Tag steht als Literal an jeder Story (der Indexer liest keine Funktionsrückgaben).
export const DoAdresse       = { ...example('do-adresse'), tags: ['!dev'] };
export const DontAdresse     = { ...example('dont-adresse'), tags: ['!dev'] };
export const DoDatenschutz   = { ...example('do-datenschutz'), tags: ['!dev'] };
export const DontDatenschutz = { ...example('dont-datenschutz'), tags: ['!dev'] };
export const DoListe         = { ...example('do-liste'), tags: ['!dev'] };
export const DontListe       = { ...example('dont-liste'), tags: ['!dev'] };
export const DoQuelle        = { ...example('do-quelle'), tags: ['!dev'] };
export const DontQuelle      = { ...example('dont-quelle'), tags: ['!dev'] };
export const DoSitz          = { ...example('do-sitz'), tags: ['!dev'] };
export const DontSitz        = { ...example('dont-sitz'), tags: ['!dev'] };
export const DoLokal         = { ...example('do-lokal'), tags: ['!dev'] };
export const DontLokal       = { ...example('dont-lokal'), tags: ['!dev'] };
