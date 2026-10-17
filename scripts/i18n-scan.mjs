// Sammelt Zeichenketten und Textknoten aus Quelldateien (JS, TS, TSX, Svelte) über den Syntaxbaum; Kommentare zählen nicht.
// Genutzt vom Verbotstest tests/i18n-hardcoded.test.ts (Messung) und für die Pflege des Inventars.
import ts from 'typescript';
import { parse } from 'svelte/compiler';

const lineOf = (source, offset) => source.slice(0, offset).split('\n').length;

/** Zeichenketten aus TS/TSX/JS: Literale, Schablonen-Teile, JSX-Text. */
function scanScript(source, name, base = 0, whole = source) {
  const kind = /\.tsx$/.test(name) ? ts.ScriptKind.TSX : /\.tsx?$/.test(name) ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const file = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, kind);
  const out = [];
  const add = (node, text, how) => {
    if (typeof text !== 'string' || !text.trim()) return;
    out.push({ line: lineOf(whole, base + node.getStart(file)), text, how });
  };
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!ts.isImportDeclaration(node.parent) && !ts.isExportDeclaration(node.parent)) add(node, node.text, 'string');
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) add(node, node.text, 'template');
    else if (ts.isJsxText(node)) add(node, node.text.replace(/\s+/g, ' '), 'jsx');
    ts.forEachChild(node, visit);
  };
  visit(file);
  return out;
}

/** Zeichenketten aus einer Svelte-Datei: Textknoten und Attributtexte der Vorlage, Literale im Skript. */
function scanSvelte(source, name) {
  const root = parse(source, { modern: true });
  const out = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.type === 'Text' && typeof node.data === 'string' && node.data.trim()) out.push({ line: lineOf(source, node.start), text: node.data.replace(/\s+/g, ' '), how: 'text' });
    else if (node.type === 'Literal' && typeof node.value === 'string' && node.value.trim()) out.push({ line: lineOf(source, node.start), text: node.value, how: 'string' });
    else if (node.type === 'TemplateElement' && node.value?.cooked?.trim()) out.push({ line: lineOf(source, node.start), text: node.value.cooked, how: 'template' });
    for (const key of Object.keys(node)) if (key !== 'loc' && key !== 'parent') walk(node[key]);
  };
  walk(root.fragment);
  if (root.instance) walk(root.instance.content);
  if (root.module) walk(root.module.content);
  return out;
}

/** Alle Zeichenketten einer Quelldatei als `{ line, text, how }`. */
export function scanSource(source, name) {
  return name.endsWith('.svelte') ? scanSvelte(source, name) : scanScript(source, name);
}

// ── Kandidaten für feste Texte ──────────────────────────────────────────────────────────
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Quellordner, in denen feste Texte der Komponenten stehen (ohne Tests und Typdateien). */
export const SOURCE_DIRS = ['svelte', 'svelte/internal', 'react', 'react/internal', 'js', 'js/render'];

// Kleingeschriebene deutsche Einzelwörter lassen sich nicht an der Schreibweise erkennen; sie stehen hier ausdrücklich.
const LOWER_WORDS = new Set(['abgesagt', 'verschoben', 'frei', 'gegen', 'aktuell', 'erledigt', 'ausstehend', 'gespielt', 'insgesamt', 'von', 'bis', 'zu', 'vs.']);
// Tastennamen, Markennamen und Ereignisse sind keine Texte
const NOT_TEXT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'Enter', 'Home', 'End', 'Tab', 'BUTTON', 'DETAILS', 'DOMContentLoaded', 'HoopsFoundry UI', 'Hoops']);
// Entwickler-Warnungen bleiben deutsch und sind keine Texte für Endnutzer
const DEV_PREFIX = /^(\[(hoops-map|HoopsFoundry UI)\]|HoopsFoundry UI(:| Modal)|Leaflet fehlt)/;

/** Entfernt Markup (Tags, Attribute) aus einem Quelltext-Stück, übrig bleibt der sichtbare oder vorgelesene Text. */
export function cleanText(text) {
  return text
    .replace(/<\/?[A-Za-z][^<>]*>?/g, ' ')
    .replace(/[\w:-]+="[^"]*"?/g, ' ')
    .replace(/[">=]/g, ' ')
    .replace(/(^|\s)#(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Sieht der Text nach einem Wort oder Satz in natürlicher Sprache aus (und nicht nach Code, Namen oder Pfad)? */
export function isTextLike(text) {
  if (!text || NOT_TEXT.has(text)) return false;
  if (/[(){};=<>$]/.test(text)) return false;
  if (/^[a-z][a-z0-9]*([A-Z][a-z0-9]*)+$/.test(text) || /^\.{0,2}\//.test(text) || /^hoops\./.test(text)) return false;
  if (LOWER_WORDS.has(text)) return true;
  return /[A-ZÄÖÜ][a-zäöüß]{2,}/.test(text) || /[äöüß]/.test(text);
}

/** Beginnt der Text mit dem Kennzeichen einer Entwickler-Warnung? */
const isDev = (raw) => DEV_PREFIX.test(raw.trim());

/**
 * Alle Quelldateien unter `root` durchsuchen. Ergebnis: `texts` (feste Texte, `{ file, line, text }`) und `warnings`
 * (Anfänge von Entwickler-Warnungen, `{ file, line, text }`; alles in ihrer Zeile zählt zur Warnung). Kommentare zählen nicht (Syntaxbaum).
 */
export function scanTree(root) {
  const texts = [];
  const warnings = [];
  for (const dir of SOURCE_DIRS) {
    for (const name of readdirSync(join(root, dir)).sort()) {
      if (!/\.(svelte|tsx?|js)$/.test(name) || /\.test\.|\.d\.ts$/.test(name)) continue;
      const file = `${dir}/${name}`;
      const items = scanSource(readFileSync(join(root, file), 'utf8'), name);
      const devLines = new Set(items.filter((i) => isDev(i.text)).map((i) => i.line));
      for (const item of items) {
        if (isDev(item.text)) warnings.push({ file, line: item.line, text: item.text });
        // Teilstücke einer Warnung (Schablonen) und alles in derselben Zeile gehören zur Warnung
        if (devLines.has(item.line)) continue;
        const text = cleanText(item.text);
        if (isTextLike(text)) texts.push({ file, line: item.line, text });
      }
    }
  }
  return { texts, warnings };
}
