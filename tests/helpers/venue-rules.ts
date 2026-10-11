// Regeln der Hallenkarte als prüfbare Aussagen. Die Tests prüfen, dass alle Aussagen für den echten Quelltext gelten (tests/venue.test.ts,
// tests/venue-css.test.ts) und dass jede Aussage durch eine gezielte Verfälschung des Quelltexts kippt (tests/venue-mutation.test.ts).
export type Rules = Record<string, boolean>;

type Venue = {
  telHref: (v: unknown) => string | undefined;
  mailHref: (v: unknown) => string | undefined;
  venueHref: (v: unknown) => string | undefined;
  venueGames: (games: unknown, limit?: unknown) => { id: string }[];
  addressLines: (a: unknown) => string[];
  venueMapLinks: (o: unknown) => unknown[];
  venueMapLabel: (n: unknown) => string;
  contactInfo: (c: unknown) => unknown;
  gameState: (g: unknown) => { text: string; tone: string } | undefined;
  gamesLimit: (n: unknown) => number;
};

const game = (id: string, state = 'scheduled', extra: Record<string, unknown> = {}) => ({ id, state, heim: { name: `H${id}` }, gast: { name: `G${id}` }, ...extra });

/** Eine Funktion, die wirft, gilt als falsche Antwort (so fällt eine Verfälschung auf, statt den Test abzubrechen). */
const guarded = (m: Venue): Venue => {
  const wrap = (fn: (...args: never[]) => unknown) => (...args: never[]) => {
    try {
      return fn(...args);
    } catch {
      return Symbol('wirft');
    }
  };
  return Object.fromEntries(Object.entries(m).map(([key, value]) => [key, typeof value === 'function' ? wrap(value as never) : value])) as unknown as Venue;
};

/** Aussagen über die reinen Funktionen (js/venue.js). */
export function logicRules(mod: Venue): Rules {
  const m = guarded(mod);
  const games = ['1', '2', '3', '4', '5', '6', '7'].map((id) => game(id));
  const ids = (list: { id: string }[]) => list.map((g) => g.id).join(',');
  return {
    'tel: nur Ziffern und ein führendes Plus': m.telHref('+49 30 23125 100') === 'tel:+493023125100' && m.telHref('030 23125 100') === 'tel:03023125100' && m.telHref('(030) 231-25100') === 'tel:03023125100',
    'tel: Buchstaben ergeben keinen Link': m.telHref('nur vormittags') === undefined && m.telHref('0301234abc') === undefined && m.telHref('030 23125 100 (Mo bis Fr)') === undefined,
    'tel: mindestens drei Ziffern': m.telHref('12') === undefined && m.telHref('112') === 'tel:112' && m.telHref('+') === undefined,
    'tel: Plus nur am Anfang': m.telHref('030+123456') === undefined,
    'mailto: gültige Adresse': m.mailHref('hallenwart@example.org') === 'mailto:hallenwart@example.org' && m.mailHref('a.b+c@mail.example.org') === 'mailto:a.b+c@mail.example.org',
    'mailto: keine Parameter und Trenner': m.mailHref('a@example.org?bcc=x@example.org') === undefined && m.mailHref('a@example.org&x=1') === undefined && m.mailHref('a@example.org,b@example.org') === undefined,
    'mailto: Wortform und Leerraum ergeben keinen Link': m.mailHref('a (at) example.org') === undefined && m.mailHref(' a b@example.org') === undefined && m.mailHref('a@example') === undefined,
    'Spiele: beendete und spielfreie entfallen': ids(m.venueGames([game('1', 'finished'), game('2', 'bye'), game('3'), game('4', 'live')])) === '3,4',
    'Spiele: Standard höchstens zwei': ids(m.venueGames(games)) === '1,2',
    'Spiele: limit gilt, höchstens fünf': ids(m.venueGames(games, 3)) === '1,2,3' && m.venueGames(games, 99).length === 5 && m.venueGames(games, 1).length === 1,
    'Spiele: ungültiges limit fällt auf zwei': m.gamesLimit(0) === 2 && m.gamesLimit(-1) === 2 && m.gamesLimit(1.5) === 2 && m.gamesLimit('3') === 2 && m.gamesLimit(undefined) === 2,
    'Spiele: ohne Mannschaft keine Zeile': m.venueGames([{ id: 'x', state: 'scheduled' }, game('1')]).length === 1 && m.venueGames('x').length === 0 && m.venueGames(undefined).length === 0,
    'Spiele: abgesagt und verschoben bleiben sichtbar': ids(m.venueGames([game('1', 'cancelled'), game('2', 'postponed')])) === '1,2',
    'Hallenseite: nur sichere Ziele': m.venueHref('javascript:alert(1)') === undefined && m.venueHref(' /x') === undefined && m.venueHref('/hallen/nordhain') === '/hallen/nordhain' && m.venueHref('https://example.org/h') === 'https://example.org/h',
    'Adresse: leere Teile entfallen': JSON.stringify(m.addressLines({ street: ' ', zip: '12345', city: '' })) === '["12345"]' && JSON.stringify(m.addressLines({ street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' })) === '["Am Sportpark 4","12345 Nordhain"]' && m.addressLines(undefined).length === 0 && m.addressLines({}).length === 0,
    'Karten-Links nur mit gültigen Koordinaten': m.venueMapLinks({ lat: Number.NaN, lng: 1 }).length === 0 && m.venueMapLinks({ lat: 91, lng: 1 }).length === 0 && m.venueMapLinks({ lat: 49.3, lng: 7.9, name: 'A' }).length === 2,
    'Kartenname unterscheidet die Hallen': m.venueMapLabel('A') !== m.venueMapLabel('B') && m.venueMapLabel('Sporthalle Nordhain') === 'Karte: Sporthalle Nordhain',
    'Kontakt: ohne Angaben keiner': m.contactInfo({ name: ' ' }) === null && m.contactInfo(undefined) === null && m.contactInfo({ name: 'A' }) !== null,
    'Zustand: Live ok, Abgesagt err, Verschoben warn': m.gameState({ state: 'live' })?.tone === 'ok' && m.gameState({ state: 'cancelled' })?.tone === 'err' && m.gameState({ state: 'postponed' })?.tone === 'warn' && m.gameState({ state: 'scheduled' }) === undefined,
  };
}

const section = (css: string) => {
  const start = css.indexOf('/* ── VenueCard');
  if (start < 0) return '';
  const next = css.indexOf('\n/* ── ', start + 10);
  return css.slice(start, next < 0 ? undefined : next);
};
const rulesOf = (text: string): [string, string][] => [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim().replace(/\s+/g, ' '), m[2]]);

/** Aussagen über den CSS-Abschnitt der Hallenkarte. */
export function cssRules(css: string): Rules {
  const text = section(css);
  const rules = rulesOf(text);
  const body = (selector: string) => rules.filter(([s]) => s === selector).map(([, b]) => b).join(';');
  const container = text.slice(text.indexOf('@container dss-venue (max-width: 640px)'));
  const minHeight = (selector: string) => Number(body(selector).match(/min-height:\s*(\d+)px/)?.[1] ?? 0);
  return {
    'Abschnitt vorhanden': text.length > 0,
    'Container-Abfrage bei 640 px': /@container dss-venue \(max-width: 640px\)/.test(text) && /container:\s*dss-venue \/ inline-size/.test(body('.dss-venue')),
    'Karte etwa 40 %, mindestens 224 px': /grid-template-columns:\s*minmax\(224px, 40%\) minmax\(0, 1fr\)/.test(body('.dss-venue--map .dss-venue-in')),
    'compact: Karte etwa 30 %': /grid-template-columns:\s*minmax\(224px, 30%\) minmax\(0, 1fr\)/.test(body('.dss-venue--map.dss-venue--compact .dss-venue-in')),
    'schmal: eine Spalte, Karte oben im Format 16:9': /\.dss-venue--map \.dss-venue-in[^{]*\{\s*grid-template-columns:\s*minmax\(0, 1fr\)/.test(container) && /aspect-ratio:\s*16 \/ 9/.test(container) && /min-height:\s*224px/.test(container),
    'Kartenrahmen ohne Mindestbreite 240': /\.dss-venue-map \.dss-map-frame \{[^}]*min-width:\s*0/.test(text),
    'Titel hängt an den Überschriften-Tokens': /font-size:\s*var\(--dss-card-title-size, var\(--dss-title-size, var\(--fs-h3\)\)\)/.test(body('.dss-venue-title')) && /font-size:\s*var\(--dss-card-title-size, var\(--dss-title-size, var\(--fs-body-lg\)\)\)/.test(body('.dss-venue--compact .dss-venue-title')),
    'keine Elementselektoren für Überschriften': rules.every(([s]) => !/(^|[\s>+~,])h[1-6](?![-\w])/.test(s)),
    'kein festes Hex': !/#[0-9a-fA-F]{3,8}\b/.test(text),
    'Zielgröße: Link zur Hallenseite 48 px, compact 44 px': minHeight('.dss-venue-more') === 48 && minHeight('.dss-venue--compact .dss-venue-more') === 44,
    'Zielgröße: Links unter der Karte 44 px': minHeight('.dss-venue-maplinks .dss-link') === 44,
    'Zielgröße: Kontaktlinks mindestens 32 px, schmal 44 px': minHeight('.dss-venue-contact .dss-link') >= 32 && /\.dss-venue-contact \.dss-link \{[^}]*min-height:\s*44px/.test(container),
    'Karte wie die anderen Karten: Rand, Radius 16 px, Fläche': /border:\s*1px solid var\(--dss-line\)/.test(body('.dss-venue')) && /border-radius:\s*16px/.test(body('.dss-venue')) && /background:\s*var\(--dss-surface\)/.test(body('.dss-venue')),
    'Trikotpunkt mit Rand in --dss-mute': /border:\s*1px solid var\(--dss-mute\)/.test(body('.dss-venue-dot')),
    'Adresse ohne Kursivschrift': /font-style:\s*normal/.test(body('.dss-venue-address')),
    'Druck: eine Spalte ohne Links unter der Karte': /@media print \{[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\)[\s\S]*\.dss-venue-maplinks \{ display: none; \}/.test(text),
  };
}

/** Aussagen über die Quelltexte der Komponenten (Svelte und React). */
export function sourceRules(svelte: string, react: string): Rules {
  const both = (test: (source: string) => boolean) => test(svelte) && test(react);
  return {
    'Karte ist nicht interaktiv': both((s) => /interactive=\{false\}/.test(s)),
    'Karte ohne eigene Liste (Adresse steht im Text)': both((s) => /showList=\{false\}/.test(s)),
    'Karte ohne App-Links (die Karte hat eigene darunter)': both((s) => /appLinks=\{\[\]\}/.test(s)),
    'Kartenname je Halle': both((s) => s.includes('venueMapLabel(name)')),
    'Titelebene über useHeadingTag': both((s) => /useHeadingTag\(/.test(s)),
    'kein fester Überschriftenname': both((s) => !/<h[1-6][\s>]|<\/h[1-6]>/.test(s)),
    'Adresse als address-Element': both((s) => s.includes('<address')),
    'Kontakt als Definitionsliste': both((s) => s.includes('<dl') && s.includes('<dt>') && s.includes('<dd>')),
    'Spieleliste mit Namen': both((s) => s.includes('aria-label={gamesLabel}')),
    'Link zur Hallenseite nennt die Halle': both((s) => /dss-link dss-venue-more[^>]*>\s*\{linkLabel\}\s*<span[^>]*dss-sr-only[^>]*>, \{name\}<\/span>/.test(s)),
    'Standardwerte': both((s) => /size = 'standard'/.test(s) && /load = 'click'/.test(s) && /mapHeight = 250/.test(s) && /logos = false/.test(s) && /names = 'full'/.test(s)),
    'Spiele nur in standard': both((s) => /size === 'compact' \? \[\]/.test(s)),
    'ohne Koordinaten keine Karte': both((s) => /isCoord\(lat, lng\)/.test(s)),
    'kein style in der Svelte-Datei': !svelte.includes('<style'),
  };
}
