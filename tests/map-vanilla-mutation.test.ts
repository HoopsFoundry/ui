// Mutationstests der Karte in Vanilla (unter jsdom): Jede Regel muss gelten (echter Quelltext) und kippen, wenn man den Quelltext gezielt verfälscht.
import { afterEach, describe, expect, it } from 'vitest';
import { mutate, read } from './helpers/mutation';
import { loadMap, mapRules, MAP_RULE_COUNT, type MapFile } from './helpers/map-vanilla-rules';

type Mutation = { name: string; file: MapFile; rule: string; from: string; to: string };
const V: MapFile = 'js/map-vanilla.js';
const L: MapFile = 'js/map-leaflet.js';

const MUTATIONS: Mutation[] = [
  { name: 'Platzhalter lädt ohne Klick', file: V, rule: 'Karte: ohne Klick wird nichts geladen', from: "let phase = props.load === 'auto' || (props.load === undefined && markupState === 'loading') ? 'loading' : 'idle';", to: "let phase = 'loading';" },
  { name: 'load auto wird ignoriert', file: V, rule: 'Karte: load auto startet ohne Klick', from: "let phase = props.load === 'auto' || (props.load === undefined && markupState === 'loading') ? 'loading' : 'idle';", to: "let phase = 'idle';" },
  { name: 'validTileUrl in paint entfällt', file: V, rule: 'Karte: ungültige Kachel-Adresse ergibt sofort den Fehlerzustand ohne Schaltfläche', from: 'const urlOk = validTileUrl(tileUrl);', to: 'const urlOk = true;' },
  { name: 'safeHref am Marker-Ziel entfällt', file: 'js/map.js', rule: 'Karte: Ziele laufen durch safeHref (Liste ohne Link)', from: 'href: safeHref(m.href),', to: 'href: typeof m.href === \'string\' ? m.href : undefined,' },
  { name: 'Klick-Listener bleibt nach destroy', file: V, rule: 'Karte: destroy entfernt die Listener', from: "root.removeEventListener('click', onClick);", to: '' },
  { name: 'ResizeObserver wird nicht getrennt', file: L, rule: 'Karte: destroy trennt den ResizeObserver', from: 'observer?.disconnect();', to: '' },
  { name: 'map.remove entfällt', file: L, rule: 'Karte: destroy baut die Leaflet-Karte ab (map.remove) und stellt den Behälter wieder her', from: 'try { map.remove(); }', to: 'try { void 0; }' },
  { name: 'Controller wird bei destroy nicht abgebaut', file: V, rule: 'Karte: destroy baut die Leaflet-Karte ab (map.remove) und stellt den Behälter wieder her', from: '    controller?.destroy();\n    controller = null;\n    root.removeEventListener', to: '    controller = null;\n    root.removeEventListener' },
  { name: 'darkTiles ohne Filter (Ansicht)', file: V, rule: 'Karte: darkTiles kennt nur dim und invert', from: "root.setAttribute('data-tiles', tilesMode(props.darkTiles));", to: "root.setAttribute('data-tiles', String(props.darkTiles));" },
  { name: 'darkTiles ohne Filter (tilesMode)', file: 'js/map.js', rule: 'Karte: darkTiles kennt nur dim und invert', from: "return value === 'invert' ? 'invert' : 'dim';", to: 'return value;' },
  { name: 'Sitz zählt in der Nummerierung', file: 'js/map.js', rule: 'Karte: Sitzmarker zählen in der Nummerierung nicht mit', from: 'if (!seat) running += 1;', to: 'running += 1;' },
  { name: 'Fehlerstatus leer', file: V, rule: 'Karte: der Fehler hat eine Statuszeile', from: "const status = state === 'error' ? mapText.error : state === 'loading' ? mapText.loading : '';", to: "const status = state === 'loading' ? mapText.loading : '';" },
  { name: 'Fehler baut die Karte nicht ab', file: V, rule: 'Karte: der Fehler baut die Karte ab', from: '        active = null;\n        controller.destroy();\n        controller = null;', to: '        active = null;\n        controller = null;' },
  { name: 'init nicht idempotent', file: V, rule: 'Karte: ein zweites init ersetzt das erste', from: '  registry.release(root);\n', to: '' },
  { name: 'loadLeaflet wird ignoriert', file: L, rule: 'Karte: loadLeaflet liefert Leaflet', from: "typeof hooks.loadLeaflet === 'function' ? hooks.loadLeaflet() :", to: 'false ? 0 :' },
  { name: 'Lader ohne Funktionsprüfung', file: L, rule: 'Karte: ein Lader, der keine Funktion ist, fällt auf den Standard zurück', from: "typeof hooks.loadLeaflet === 'function' ? hooks.loadLeaflet() :", to: 'hooks.loadLeaflet ? hooks.loadLeaflet() :' },
  { name: 'Lader ohne Leaflet wird als init gemeldet', file: L, rule: 'Karte: ein Lader ohne Leaflet ergibt den Fehlergrund import', from: "if (!L || typeof L.map !== 'function' || typeof L.tileLayer !== 'function') return fail('import', new Error('Leaflet fehlt: `map` oder `tileLayer` nicht gefunden'));", to: '' },
  { name: 'update erreicht die Karte nicht', file: V, rule: 'Karte: update erreicht die Karte (Marker entfallen und kommen hinzu)', from: 'if (controller && controller === had) controller.update(controllerOptions());', to: '' },
  { name: 'Marker werden bei jedem Update neu gebaut', file: L, rule: 'Karte: gleiche Marker-Identität über die id', from: 'if (entry && entry.sig === sig) {', to: 'if (false) {' },
  { name: 'Fehler bleibt nach neuer Adresse', file: V, rule: 'Karte: eine neue Kachel-Adresse versucht es erneut', from: 'if (tileUrlOf(props) !== before) failure = null;', to: '' },
  { name: 'Fokus bleibt auf dem Body', file: V, rule: 'Karte: nach „Karte laden“ liegt der Fokus auf der Kartenfläche', from: 'canvas.focus({ preventScroll: true });', to: '' },
  { name: 'Zoom ohne aria-disabled', file: V, rule: 'Karte: Zoom-Schaltfläche an der Grenze hat aria-disabled', from: 'if (zoomIn) setDisabled(zoomIn, !(zoomNow.zoom < zoomNow.max));', to: '' },
  { name: 'Karte nach Unmount im Import', file: L, rule: 'Karte: Unmount während des Imports baut keine Karte', from: '    if (destroyed) return;\n    try {\n      L = ', to: '    try {\n      L = ' },
  { name: 'Handler-Fehler kippen die Karte', file: V, rule: 'Karte: ein werfender Handler kippt die Karte nicht', from: "  try {\n    fn(arg);\n  } catch (error) {\n    devWarn('[hoops-map] Ein Ereignis-Handler hat einen Fehler geworfen.', error);\n  }", to: '  fn(arg);' },
  { name: 'Markup wird nicht wiederhergestellt', file: V, rule: 'Karte: initMap stellt das Markup bei destroy wieder her', from: '      root.replaceChildren(...pristine);', to: '' },
  { name: 'Kartenfläche nicht inert', file: V, rule: 'Karte: während des Ladens ist die Kartenfläche inert', from: "if (state === 'loading') canvas.setAttribute('inert', '');", to: '' },
  { name: 'Schaltfläche bleibt gesperrt', file: V, rule: 'Karte: initMap macht die gesperrte Schaltfläche der Hallenkarte bedienbar', from: "button?.removeAttribute('disabled');", to: '' },
  { name: 'VenueCard startet keine Karte', file: 'js/render/venue-card.js', rule: 'Karte: mountVenueCard startet die eingebettete Karte', from: '  start(obj(props));\n', to: '' },
  { name: 'VenueCard-Karte ist interaktiv', file: 'js/render/venue-card.js', rule: 'Karte: mountVenueCard startet die eingebettete Karte', from: 'markers: [{ id: \'halle\', lat, lng, label: title }], interactive: false,', to: 'markers: [{ id: \'halle\', lat, lng, label: title }], interactive: true,' },
  { name: 'VenueCard räumt die Karte nicht auf', file: 'js/render/venue-card.js', rule: 'Karte: mountVenueCard räumt die Karte bei destroy ab', from: '    live?.handle.destroy();\n    live = null;\n    inner.destroy();', to: '    inner.destroy();' },
  { name: 'VenueCard ersetzt die Karte bei jedem Update', file: 'js/render/venue-card.js', rule: 'Karte: mountVenueCard lässt die Karte beim Update stehen', from: 'const keep = live && live.key === keyOf(p) ? live : null;', to: 'const keep = null;' },
  { name: 'style bleibt Attribut im Markup', file: 'js/render/dom.js', rule: 'Karte: Styles gehen über das CSSOM, nie als style-Attribut im Markup', from: "export const deferStyles = (html) => html.replace(STYLE_ATTR, ' data-hoops-style=\"$1\"');", to: 'export const deferStyles = (html) => html;' },
  { name: 'beliebige Eigenschaften im CSSOM', file: 'js/render/dom.js', rule: 'Karte: nur bekannte Eigenschaften gelangen ins CSSOM', from: 'if (STYLE_PROPS.has(name) && ', to: 'if (' },
  { name: 'release erst nach dem Lesen des Stage', file: V, rule: 'Karte: zweimal initMap auf Server-Markup ergibt eine lebendige Karte im Dokument', from: "  registry.release(root);\n  const doc = root.ownerDocument;\n  const stage = root.querySelector('.hoops-map-stage');", to: "  const doc = root.ownerDocument;\n  const stage = root.querySelector('.hoops-map-stage');\n  registry.release(root);" },
  { name: 'update ersetzt alle Eigenschaften', file: V, rule: 'Karte: update mit Teilen behält Kachel-Adresse und Marker (kein Rückfall auf den Standardserver)', from: '      props = merged;', to: '      props = obj(next);' },
  { name: 'Server-Styles werden nicht über das CSSOM angewendet', file: V, rule: 'Karte: initMap wendet die style-Attribute von Server-Markup über das CSSOM an', from: '  if (restore) reapplyStyles(root);\n', to: '' },
  { name: 'data-hoops-options ohne Schlüsselfilter', file: 'js/vanilla-core.js', rule: 'Karte: data-hoops-options ohne Prototyp-Schlüssel', from: "filter(([key]) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype')", to: 'filter(() => true)' },
  { name: 'start wird als Option weitergegeben', file: 'js/vanilla-core.js', rule: 'Karte: initAll startet die Karte nur mit start und gibt start nicht weiter', from: "name === 'map' ? Object.fromEntries(Object.entries(shared).filter(([key]) => key !== 'start')) : shared", to: 'shared' },
];

const sources = Object.fromEntries([V, L, 'js/map.js', 'js/render/venue-card.js', 'js/render/dom.js', 'js/vanilla-core.js'].map((f) => [f, read(f)]));

afterEach(() => {
  document.body.replaceChildren();
});

describe('Mutationstests: Karte in Vanilla', () => {
  it('Ausgangslage: alle Aussagen gelten', async () => {
    const rules = await mapRules(await loadMap());
    expect(Object.entries(rules).filter(([, ok]) => !ok).map(([name]) => name)).toEqual([]);
    expect(Object.keys(rules)).toHaveLength(MAP_RULE_COUNT);
  });
  it('jede Regel ist durch mindestens eine Verfälschung abgesichert', async () => {
    const rules = Object.keys(await mapRules(await loadMap()));
    const covered = new Set(MUTATIONS.map((m) => m.rule));
    expect(rules.filter((r) => !covered.has(r))).toEqual([]);
  });
  it.each(MUTATIONS)('$name', async ({ file, rule, from, to }) => {
    const mutated = await mapRules(await loadMap({ file, source: mutate(sources[file], from, to) }));
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});
