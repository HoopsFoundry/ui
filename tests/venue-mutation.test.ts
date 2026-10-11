// @vitest-environment node
// Mutationstests der Hallenkarte: Jede Regel aus tests/helpers/venue-rules.ts muss kippen, wenn man den Quelltext gezielt verfälscht.
// Eine Mutation ersetzt eine Textstelle (js/venue.js, css/components.css, Svelte- und React-Datei) und prüft, dass die genannte Regel
// danach nicht mehr gilt, während sie am unveränderten Quelltext gilt. So fällt auf, wenn eine Aussage nichts mehr prüft.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cssRules, logicRules, sourceRules, type Rules } from './helpers/venue-rules';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const venueJs = read('js/venue.js');
const css = read('css/components.css');
const svelte = read('svelte/VenueCard.svelte');
const react = read('react/VenueCard.tsx');
const mapUrl = new URL('../js/map.js', import.meta.url).href;

/** js/venue.js als Modul aus einem Text laden (die Import-Zeile zeigt auf js/map.js im Repository). */
const loadLogic = async (source: string) => {
  const code = source.replace("from './map.js'", `from '${mapUrl}'`);
  const mod = await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  return logicRules(mod);
};

const mutate = (text: string, from: string, to: string, after = 0) => {
  const index = text.indexOf(from, after);
  expect(index, `Textstelle nicht gefunden: ${from}`).toBeGreaterThanOrEqual(0);
  const result = text.slice(0, index) + to + text.slice(index + from.length);
  expect(result).not.toBe(text);
  return result;
};
/** CSS: nur im Abschnitt der Hallenkarte verändern (gleiche Zeilen kommen auch in anderen Abschnitten vor). */
const sectionStart = css.indexOf('/* ── VenueCard');

type Mutation = { name: string; rule: string; from: string; to: string };

const LOGIC: Mutation[] = [
  { name: 'tel: Mindestzahl der Ziffern entfällt', rule: 'tel: mindestens drei Ziffern', from: 'if (digits.length < 3) return undefined;', to: '' },
  { name: 'tel: Buchstaben erlaubt', rule: 'tel: Buchstaben ergeben keinen Link', from: '/^\\+?[\\d ()./-]+$/', to: '/^\\+?[\\w ()./-]+$/' },
  { name: 'tel: Plus überall erlaubt', rule: 'tel: Plus nur am Anfang', from: '/^\\+?[\\d ()./-]+$/', to: '/^[\\d +()./-]+$/' },
  { name: 'tel: Plus geht verloren', rule: 'tel: nur Ziffern und ein führendes Plus', from: "raw.startsWith('+') ? '+' : ''", to: "''" },
  { name: 'mailto: Parameter erlaubt', rule: 'mailto: keine Parameter und Trenner', from: '\\.[A-Za-z]{2,}$/.test(raw)', to: '\\.[A-Za-z]{2,}/.test(raw)' },
  { name: 'mailto: Wortform erlaubt', rule: 'mailto: Wortform und Leerraum ergeben keinen Link', from: '/^[A-Za-z0-9._%+-]+@', to: '/^[A-Za-z0-9._%+() -]+@' },
  { name: 'Spiele: beendete bleiben', rule: 'Spiele: beendete und spielfreie entfallen', from: "g.state !== 'finished' && ", to: '' },
  { name: 'Spiele: spielfreie bleiben', rule: 'Spiele: beendete und spielfreie entfallen', from: " && g.state !== 'bye'", to: '' },
  { name: 'Spiele: Standard drei statt zwei', rule: 'Spiele: Standard höchstens zwei', from: 'export const DEFAULT_GAMES = 2;', to: 'export const DEFAULT_GAMES = 3;' },
  { name: 'Spiele: keine Obergrenze', rule: 'Spiele: limit gilt, höchstens fünf', from: 'return Math.min(limit, MAX_GAMES);', to: 'return limit;' },
  { name: 'Spiele: Zeichenkette als limit', rule: 'Spiele: ungültiges limit fällt auf zwei', from: 'if (!Number.isInteger(limit) || limit < 1) return DEFAULT_GAMES;', to: 'if (Number(limit) < 1) return DEFAULT_GAMES; limit = Number(limit);' },
  { name: 'Spiele: Zeilen ohne Mannschaft', rule: 'Spiele: ohne Mannschaft keine Zeile', from: ' && (g.heim?.name || g.gast?.name)', to: '' },
  { name: 'Spiele: Abgesagte entfallen', rule: 'Spiele: abgesagt und verschoben bleiben sichtbar', from: "g.state !== 'finished' &&", to: "g.state !== 'finished' && g.state !== 'cancelled' &&" },
  { name: 'Hallenseite: ungeprüftes Ziel', rule: 'Hallenseite: nur sichere Ziele', from: 'return safeHref(href);', to: 'return href;' },
  { name: 'Adresse: leere Teile bleiben', rule: 'Adresse: leere Teile entfallen', from: 'return [street, place].filter(Boolean);', to: 'return [street, place];' },
  { name: 'Karten-Links ohne Prüfung der Koordinaten', rule: 'Karten-Links nur mit gültigen Koordinaten', from: 'if (!isCoord(lat, lng)) return [];', to: '' },
  { name: 'Kartenname ohne Hallennamen', rule: 'Kartenname unterscheidet die Hallen', from: 'return n ? `${venueText.mapLabel}: ${n}` : venueText.mapLabel;', to: 'return venueText.mapLabel;' },
  { name: 'Kontakt: leerer Kontakt zählt', rule: 'Kontakt: ohne Angaben keiner', from: 'if (!name && !phone && !email) return null;', to: '' },
  { name: 'Zustand: Abgesagt grün', rule: 'Zustand: Live ok, Abgesagt err, Verschoben warn', from: "tone: 'err' }", to: "tone: 'ok' }" },
];

const CSS: Mutation[] = [
  { name: 'Breakpoint 600 statt 640', rule: 'Container-Abfrage bei 640 px', from: '@container dss-venue (max-width: 640px)', to: '@container dss-venue (max-width: 600px)' },
  { name: 'Karte 30 % statt 40 %', rule: 'Karte etwa 40 %, mindestens 224 px', from: '.dss-venue--map .dss-venue-in { grid-template-columns: minmax(224px, 40%)', to: '.dss-venue--map .dss-venue-in { grid-template-columns: minmax(224px, 30%)' },
  { name: 'Karte mindestens 160 px', rule: 'Karte etwa 40 %, mindestens 224 px', from: 'minmax(224px, 40%)', to: 'minmax(160px, 40%)' },
  { name: 'schmal: kein Format 16:9', rule: 'schmal: eine Spalte, Karte oben im Format 16:9', from: 'aspect-ratio: 16 / 9;', to: 'aspect-ratio: 4 / 3;' },
  { name: 'Kartenrahmen behält die Mindestbreite', rule: 'Kartenrahmen ohne Mindestbreite 240', from: '.dss-venue-map .dss-map-frame { display: flex; min-width: 0; }', to: '.dss-venue-map .dss-map-frame { display: flex; }' },
  { name: 'Titel mit festem Wert', rule: 'Titel hängt an den Überschriften-Tokens', from: 'font-size: var(--dss-card-title-size, var(--dss-title-size, var(--fs-h3)));', to: 'font-size: 20px;' },
  { name: 'Link zur Hallenseite 40 px', rule: 'Zielgröße: Link zur Hallenseite 48 px, compact 44 px', from: '.dss-venue-more { display: inline-flex; align-items: center; min-height: 48px;', to: '.dss-venue-more { display: inline-flex; align-items: center; min-height: 40px;' },
  { name: 'Links unter der Karte 30 px', rule: 'Zielgröße: Links unter der Karte 44 px', from: '.dss-venue-maplinks .dss-link { display: inline-flex; align-items: center; min-height: 44px;', to: '.dss-venue-maplinks .dss-link { display: inline-flex; align-items: center; min-height: 30px;' },
  { name: 'Kontaktlinks 20 px', rule: 'Zielgröße: Kontaktlinks mindestens 32 px, schmal 44 px', from: '.dss-venue-contact .dss-link { display: inline-flex; align-items: center; min-height: 32px; }', to: '.dss-venue-contact .dss-link { display: inline-flex; align-items: center; min-height: 20px; }' },
  { name: 'Trikotpunkt ohne Rand', rule: 'Trikotpunkt mit Rand in --dss-mute', from: 'border: 1px solid var(--dss-mute); border-radius: 50%;', to: 'border-radius: 50%;' },
  { name: 'festes Hex im Abschnitt', rule: 'kein festes Hex', from: '.dss-venue-when { color: var(--dss-fg); }', to: '.dss-venue-when { color: #111111; }' },
  { name: 'Elementselektor für Überschriften', rule: 'keine Elementselektoren für Überschriften', from: '.dss-venue-title {', to: 'h3.dss-venue-title, .dss-venue h3 {' },
  { name: 'Adresse kursiv', rule: 'Adresse ohne Kursivschrift', from: 'font-style: normal;', to: 'font-style: italic;' },
];

const SOURCE: { name: string; rule: string; svelte: [string, string]; react: [string, string] }[] = [
  { name: 'Karte interaktiv', rule: 'Karte ist nicht interaktiv', svelte: ['interactive={false}', 'interactive={true}'], react: ['interactive={false}', 'interactive={true}'] },
  { name: 'Karte mit eigener Liste', rule: 'Karte ohne eigene Liste (Adresse steht im Text)', svelte: ['showList={false}', 'showList={true}'], react: ['showList={false}', 'showList={true}'] },
  { name: 'Kartenname ohne Halle', rule: 'Kartenname je Halle', svelte: ['label={venueMapLabel(name)}', 'label="Karte"'], react: ['label={venueMapLabel(name)}', 'label="Karte"'] },
  { name: 'feste Überschrift h3', rule: 'kein fester Überschriftenname', svelte: ['<svelte:element this={heading.tag} class="dss-venue-title">{name}</svelte:element>', '<h3 class="dss-venue-title">{name}</h3>'], react: ['<Heading className="dss-venue-title">{name}</Heading>', '<h3 className="dss-venue-title">{name}</h3>'] },
  { name: 'Adresse als div', rule: 'Adresse als address-Element', svelte: ['<address class="dss-venue-address">', '<div class="dss-venue-address">'], react: ['<address className="dss-venue-address">', '<div className="dss-venue-address">'] },
  { name: 'Spiele auch in compact', rule: 'Spiele nur in standard', svelte: ["size === 'compact' ? [] :", ''], react: ["size === 'compact' ? [] :", ''] },
  { name: 'Karte ohne Koordinatenprüfung', rule: 'ohne Koordinaten keine Karte', svelte: ['isCoord(lat, lng)', 'true'], react: ['isCoord(lat, lng)', 'true'] },
  { name: 'Link zur Hallenseite ohne Hallennamen', rule: 'Link zur Hallenseite nennt die Halle', svelte: ['{linkLabel}<span class="dss-sr-only">, {name}</span>', '{linkLabel}'], react: ['{linkLabel}\n              <span className="dss-sr-only">, {name}</span>', '{linkLabel}'] },
  { name: 'Standard load="auto"', rule: 'Standardwerte', svelte: ["load = 'click'", "load = 'auto'"], react: ["load = 'click'", "load = 'auto'"] },
];

describe('Mutationstests: venue.js', () => {
  it('Ausgangslage: alle Aussagen gelten am unveränderten Quelltext', async () => {
    const base = await loadLogic(venueJs);
    expect(Object.entries(base).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(LOGIC)('$name', async ({ rule, from, to }) => {
    const base = await loadLogic(venueJs);
    expect(base[rule], `Regel fehlt: ${rule}`).toBe(true);
    const mutated = await loadLogic(mutate(venueJs, from, to));
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});

describe('Mutationstests: CSS', () => {
  it('Ausgangslage: alle Aussagen gelten', () => {
    expect(Object.entries(cssRules(css)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(CSS)('$name', ({ rule, from, to }) => {
    const base: Rules = cssRules(css);
    expect(base[rule], `Regel fehlt: ${rule}`).toBe(true);
    expect(cssRules(mutate(css, from, to, sectionStart))[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});

describe('Mutationstests: Komponenten', () => {
  it('Ausgangslage: alle Aussagen gelten', () => {
    expect(Object.entries(sourceRules(svelte, react)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(SOURCE)('$name (Svelte und React einzeln)', ({ rule, svelte: s, react: r }) => {
    expect(sourceRules(svelte, react)[rule], `Regel fehlt: ${rule}`).toBe(true);
    expect(sourceRules(mutate(svelte, s[0], s[1]), react)[rule], `Svelte: Regel kippt nicht: ${rule}`).toBe(false);
    expect(sourceRules(svelte, mutate(react, r[0], r[1]))[rule], `React: Regel kippt nicht: ${rule}`).toBe(false);
  });
  it('ein <style> in der Svelte-Datei kippt die Regel', () => {
    expect(sourceRules(`${svelte}\n<style>.x{}</style>`, react)['kein style in der Svelte-Datei']).toBe(false);
  });
});
