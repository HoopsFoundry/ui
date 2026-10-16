/**
 * Gemeinsame Ersetzungsregeln der Stufen K (CSS-Klassen) und D (data-Attribute, Ereignisse, Speicherschlüssel, Dateinamen, Paketname)
 * der Umbenennung von DSS auf HoopsFoundry UI. Genutzt vom Codemod (scripts/codemod-names.mjs), vom Migrationsskript für Konsumenten
 * (scripts/migrate-from-dss.mjs) und von den Tests. Reine Funktionen, keine Dateizugriffe.
 *
 * Regeln laufen der Reihe nach über den Text; Sonderfälle stehen vor der Familienregel. Wortgrenzen: vor dem Namen weder Wortzeichen noch
 * Bindestrich, damit Fremdklassen mit zufälligem Teilwort (`xdss-a`, `my-dss-b`, `--dss-token`) unberührt bleiben. Die Tokens (`--dss-…`) gehören
 * zur Stufe T und werden hier nie angefasst.
 */

/** Eine Regel: `muster` (global), `ersatz` (Zeichenkette mit $1 oder Funktion). */
const regel = (name, muster, ersatz) => ({ name, muster, ersatz });

/** Stufe K: Familienregel für Klassen (`dss-btn--sm` → `hoops-btn--sm`, auch `.dss-x`, `class:dss-x`, `dss-${…}`, `'dss-' + name`). */
export const REGELN_K = [
  regel('Klassenfamilie dss-* → hoops-*', /(?<![\w-])dss-/g, 'hoops-'),
];

/** Stufe D: Sonderfälle zuerst (Paketname, Release-Namen), dann data-Attribute, Ereignisse, Schlüssel, Dateinamen, Bezeichner. */
export const REGELN_D = [
  regel('Paketname @bbv/dss-design-system → @hoopsfoundry/ui', /@bbv\/dss-design-system(?![\w-])/g, '@hoopsfoundry/ui'),
  regel('Repository OliEder/dss-design-system → HoopsFoundry/ui', /OliEder\/dss-design-system(?![\w-])/g, 'HoopsFoundry/ui'),
  regel('Release-Tarball dss-vanilla- → hoops-ui-', /(?<![\w-])dss-vanilla-/g, 'hoops-ui-'),
  regel('data-dss, data-dss-* → data-hoops, data-hoops-*', /(?<![\w-])data-dss(?![A-Za-z0-9_])/g, 'data-hoops'),
  regel('dataset.dssX → dataset.hoopsX', /(\.dataset\.|dataset\[\s*['"])dss(?=[A-Z])/g, '$1hoops'),
  regel('Ereignisse dss:* → hoops:*', /(?<![\w-])dss:(?=[a-z])/g, 'hoops:'),
  regel('Schlüssel dss.registry, dss.render.counter', /(?<![\w.-])dss\.(?=registry(?![\w])|render\.counter)/g, 'hoops.'),
  regel('Bündel dss.css/.js/.min.js/.d.ts (und .map)', /(?<![\w-])dss(?=\.(?:css|js|min\.js|d\.ts|mjs)(?![\w]))/g, 'hoops'),
  regel('Ordner dss/ (Zielordner des Portals)', /(?<=^|[\s"'`(=/\\])dss(?=\\?\/)/gm, 'hoops'),
];

/** Alle Regeln der Stufen, in Anwendungsreihenfolge (D vor K: Sonderfälle vor der Familienregel). */
export const REGELSTUFEN = [
  ['D', 'data-Attribute, Ereignisse, Speicherschlüssel, Dateinamen, Paketname', REGELN_D],
  ['K', 'CSS-Klassen (Familienregel dss-* → hoops-*)', REGELN_K],
];

/** Wendet Regeln auf einen Text an; Rückgabe: Text und Treffer je gefundenem alten Wort. */
export function applyRules(text, regeln) {
  const hits = new Map();
  let out = text;
  for (const r of regeln) {
    out = out.replace(r.muster, (...args) => {
      const m = args[0];
      const key = r.name.startsWith('Klassenfamilie') ? `${m}*` : m;
      hits.set(key, (hits.get(key) ?? 0) + 1);
      return r.ersatz.replace('$1', typeof args[1] === 'string' ? args[1] : '');
    });
  }
  return { text: out, hits };
}
