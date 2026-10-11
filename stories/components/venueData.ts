// Demo-Daten der Hallenkarten-Doku (nur Storybook): erfundene Hallen mit frei erfundenen Adressen, Rufnummern und Koordinaten in einem
// Waldgebiet. Es sind keine realen Gebäude, Adressen oder Personen; Rufnummern aus dem Bereich für Fiktion, E-Mail-Adressen unter example.org.
import type { ScheduleGame } from '../../js/schedule.js';
import type { VenueAddress, VenueContact } from '../../js/venue.js';
import nordhainLogo from '../assets/logos/nordhain.svg';
import hawksLogo from '../assets/logos/hawks.svg';
import seebergLogo from '../assets/logos/seeberg.svg';
import elbachLogo from '../assets/logos/elbach.svg';

export type DemoVenue = { name: string; address: VenueAddress; lat: number; lng: number; info: string; contact: VenueContact; href: string };

/**
 * Erfundene Hallen. Jede Karte auf einer Doku-Seite bekommt eine eigene Halle, weil die Karte eine benannte Region ist
 * („Karte: <Name>“); gleiche Namen verletzen axe `landmark-unique`. Tests: tests/venue-code.test.ts.
 */
export const HALLEN: DemoVenue[] = [
  { name: 'Sporthalle Nordhain', address: { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }, lat: 49.3, lng: 7.9, info: 'Zwei Spielfelder, Zugang über den Haupteingang. Parkplätze am Sportpark.', contact: { name: 'Hallenwart Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' }, href: '#halle-nordhain' },
  { name: 'Mehrzweckhalle Seeberg', address: { street: 'Seeweg 12', zip: '12346', city: 'Seeberg' }, lat: 49.3055, lng: 7.912, info: 'Ein Spielfeld mit Tribüne für 200 Plätze.', contact: { name: 'Lena Brandt', phone: '030 23125 101', email: 'brandt@example.org' }, href: '#halle-seeberg' },
  { name: 'Gymnasium Kiefernau', address: { street: 'Schulstraße 3', zip: '12347', city: 'Kiefernau' }, lat: 49.2955, lng: 7.8905, info: 'Turnhalle des Gymnasiums, Eingang an der Westseite.', contact: { name: 'Sekretariat', phone: '030 23125 102', email: 'sekretariat@example.org' }, href: '#halle-kiefernau' },
  { name: 'Dreifachhalle Elbach', address: { street: 'Flussallee 21', zip: '12348', city: 'Elbach' }, lat: 49.31, lng: 7.885, info: 'Drei Felder, die Halle ist teilbar.', contact: { name: 'Mara Linde', phone: '030 23125 103', email: 'linde@example.org' }, href: '#halle-elbach' },
  { name: 'Auenlandhalle', address: { street: 'Wiesenweg 8', zip: '12349', city: 'Auenland' }, lat: 49.288, lng: 7.915, info: 'Barrierefreier Zugang an der Südseite.', contact: { name: 'Tom Arnd', phone: '030 23125 104', email: 'arnd@example.org' }, href: '#halle-auenland' },
  { name: 'Waldmarkhalle', address: { street: 'Tannenring 2', zip: '12350', city: 'Waldmark' }, lat: 49.322, lng: 7.905, info: 'Kleine Halle, Umkleiden im Untergeschoss.', contact: { name: 'Ina Frost', phone: '030 23125 105', email: 'frost@example.org' }, href: '#halle-waldmark' },
  { name: 'Sonnentalhalle', address: { street: 'Sonnenhang 7', zip: '12351', city: 'Sonnental' }, lat: 49.279, lng: 7.893, info: 'Ein Spielfeld, Kiosk im Foyer.', contact: { name: 'Piet Holm', phone: '030 23125 106', email: 'holm@example.org' }, href: '#halle-sonnental' },
  { name: 'Hafenhalle Moorberg', address: { street: 'Kaistraße 15', zip: '12352', city: 'Moorberg' }, lat: 49.315, lng: 7.925, info: 'Zwei Felder, Zugang über den Hof.', contact: { name: 'Eva Rinde', phone: '030 23125 107', email: 'rinde@example.org' }, href: '#halle-moorberg' },
  { name: 'Felsenauhalle', address: { street: 'Steinbruchweg 1', zip: '12353', city: 'Felsenau' }, lat: 49.27, lng: 7.905, info: 'Ein Spielfeld, Parkplätze begrenzt.', contact: { name: 'Karl Pfeil', phone: '030 23125 108', email: 'pfeil@example.org' }, href: '#halle-felsenau' },
  { name: 'Rotbachhalle', address: { street: 'Mühlgasse 9', zip: '12354', city: 'Rotbach' }, lat: 49.33, lng: 7.92, info: 'Zwei Felder, Eingang an der Mühlgasse.', contact: { name: 'Anke Seidel', phone: '030 23125 109', email: 'seidel@example.org' }, href: '#halle-rotbach' },
  { name: 'Lindenberghalle', address: { street: 'Lindenallee 30', zip: '12355', city: 'Lindenberg' }, lat: 49.34, lng: 7.88, info: 'Ein Spielfeld, Tribüne für 120 Plätze.', contact: { name: 'Hans Wirth', phone: '030 23125 110', email: 'wirth@example.org' }, href: '#halle-lindenberg' },
  { name: 'Eichenhalle', address: { street: 'Eichenstraße 5', zip: '12356', city: 'Eichstedt' }, lat: 49.265, lng: 7.875, info: 'Zwei Felder, Zugang über die Schule.', contact: { name: 'Uta Kern', phone: '030 23125 111', email: 'kern@example.org' }, href: '#halle-eichen' },
  { name: 'Birkenhalle', address: { street: 'Birkenweg 6', zip: '12357', city: 'Birkenau' }, lat: 49.35, lng: 7.9, info: 'Ein Spielfeld, kleiner Parkplatz.', contact: { name: 'Olaf Berg', phone: '030 23125 112', email: 'berg@example.org' }, href: '#halle-birken' },
  { name: 'Buchenhalle', address: { street: 'Buchenplatz 1', zip: '12358', city: 'Buchwald' }, lat: 49.26, lng: 7.93, info: 'Zwei Felder, barrierefrei.', contact: { name: 'Rita Falk', phone: '030 23125 113', email: 'falk@example.org' }, href: '#halle-buchen' },
  { name: 'Ahornhalle', address: { street: 'Ahornweg 11', zip: '12359', city: 'Ahornau' }, lat: 49.36, lng: 7.86, info: 'Ein Spielfeld.', contact: { name: 'Jan Sorge', phone: '030 23125 114', email: 'sorge@example.org' }, href: '#halle-ahorn' },
  { name: 'Kastanienhalle', address: { street: 'Kastanienallee 2', zip: '12360', city: 'Kastanienbach' }, lat: 49.25, lng: 7.89, info: 'Zwei Felder, Foyer mit Kiosk.', contact: { name: 'Nele Arndt', phone: '030 23125 115', email: 'arndt@example.org' }, href: '#halle-kastanien' },
  { name: 'Ulmenhalle', address: { street: 'Ulmenstraße 14', zip: '12361', city: 'Ulmenau' }, lat: 49.37, lng: 7.91, info: 'Ein Spielfeld.', contact: { name: 'Bernd Voss', phone: '030 23125 116', email: 'voss@example.org' }, href: '#halle-ulmen' },
  { name: 'Weidenhalle', address: { street: 'Weidenweg 4', zip: '12362', city: 'Weidenfeld' }, lat: 49.245, lng: 7.9, info: 'Zwei Felder, Zugang über den Sportplatz.', contact: { name: 'Gerda Lohr', phone: '030 23125 117', email: 'lohr@example.org' }, href: '#halle-weiden' },
  { name: 'Pappelhalle', address: { street: 'Pappelring 8', zip: '12363', city: 'Pappelau' }, lat: 49.38, lng: 7.87, info: 'Ein Spielfeld.', contact: { name: 'Max Eder', phone: '030 23125 118', email: 'eder@example.org' }, href: '#halle-pappel' },
  { name: 'Erlenhalle', address: { street: 'Erlenstieg 3', zip: '12364', city: 'Erlenbruch' }, lat: 49.24, lng: 7.92, info: 'Zwei Felder, Tribüne für 250 Plätze.', contact: { name: 'Sonja Reuter', phone: '030 23125 119', email: 'reuter@example.org' }, href: '#halle-erlen' },
  { name: 'Haselhalle', address: { street: 'Haselgang 9', zip: '12365', city: 'Haselhain' }, lat: 49.39, lng: 7.9, info: 'Ein Spielfeld.', contact: { name: 'Till Wagner', phone: '030 23125 120', email: 'wagner@example.org' }, href: '#halle-hasel' },
  { name: 'Lärchenhalle', address: { street: 'Lärchenweg 5', zip: '12366', city: 'Lärchental' }, lat: 49.235, lng: 7.88, info: 'Zwei Felder.', contact: { name: 'Vera Kunz', phone: '030 23125 121', email: 'kunz@example.org' }, href: '#halle-laerchen' },
  { name: 'Tannenhalle', address: { street: 'Tannenhof 1', zip: '12367', city: 'Tannau' }, lat: 49.4, lng: 7.89, info: 'Ein Spielfeld.', contact: { name: 'Paul Meier', phone: '030 23125 122', email: 'meier@example.org' }, href: '#halle-tannen' },
  { name: 'Fichtenhalle', address: { street: 'Fichtenweg 7', zip: '12368', city: 'Fichtenau' }, lat: 49.23, lng: 7.91, info: 'Zwei Felder.', contact: { name: 'Elke Baum', phone: '030 23125 123', email: 'baum@example.org' }, href: '#halle-fichten' },
];

export const LOGO: Record<string, string> = {
  'TSV Nordhain 1920': nordhainLogo,
  'Lindenberg Hawks': hawksLogo,
  'BG Seeberg': seebergLogo,
  'TSV Elbach': elbachLogo,
};

const team = (name: string, short?: string, logos = true) => ({ name, ...(short ? { short } : {}), ...(logos && LOGO[name] ? { logo: LOGO[name] } : {}) });

/** Spiele der Demo-Halle (Termine im Herbst 2026): vier Stück, damit die Begrenzung auf zwei sichtbar wird. */
export function demoGames(options: { logos?: boolean; states?: boolean } = {}): ScheduleGame[] {
  const { logos = true, states = false } = options;
  const games: ScheduleGame[] = [
    { id: 'v1', state: 'scheduled', date: 'Sa, 17.10.2026', time: '17:30', league: { name: 'Oberliga Nordhain Männer' }, field: 'Feld 1', heim: team('TSV Nordhain 1920', 'Nordhain', logos), gast: team('Lindenberg Hawks', 'Hawks', logos) },
    { id: 'v2', state: 'scheduled', date: 'So, 18.10.2026', time: '14:00', league: { name: 'Landesliga Ost' }, field: 'Feld 2', heim: team('BG Seeberg', 'Seeberg', logos), gast: team('TSV Elbach', 'Elbach', logos) },
    { id: 'v3', state: 'scheduled', date: 'Sa, 24.10.2026', time: '19:00', league: { name: 'Oberliga Nordhain Männer' }, heim: team('SV Kiefernau', 'Kiefernau', logos), gast: team('TSV Nordhain 1920', 'Nordhain', logos) },
    { id: 'v4', state: 'scheduled', date: 'So, 25.10.2026', time: '11:00', league: { name: 'Bezirksliga Süd' }, heim: team('TuS Waldmark', 'Waldmark', logos), gast: team('BC Sonnental', 'Sonnental', logos) },
  ];
  if (states) {
    games[0] = { ...games[0], state: 'live' };
    games[1] = { ...games[1], state: 'postponed' };
  }
  return games;
}

/** Eigenschaften einer Demo-Halle für die Komponente (Index in HALLEN). */
export function venueProps(index: number, extra: Record<string, unknown> = {}) {
  const v = HALLEN[index];
  return { name: v.name, address: v.address, lat: v.lat, lng: v.lng, info: v.info, contact: v.contact, href: v.href, ...extra };
}
