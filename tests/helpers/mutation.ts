// Gemeinsame Hilfen der Mutationstests (Vanilla-Paket V1): Textstelle verfälschen, Modul aus einem Text laden, CSS-Abschnitt lesen.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'vitest';

export type Rules = Record<string, boolean>;

/** Datei aus dem Repository lesen (unabhängig von der Test-Umgebung: kein `new URL`, das unter jsdom abweicht). */
export const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

/** Ersetzt die erste Fundstelle ab `after`; die Stelle muss existieren und der Text sich ändern. */
export function mutate(text: string, from: string, to: string, after = 0) {
  const index = text.indexOf(from, after);
  expect(index, `Textstelle nicht gefunden: ${from}`).toBeGreaterThanOrEqual(0);
  const result = text.slice(0, index) + to + text.slice(index + from.length);
  expect(result).not.toBe(text);
  return result;
}

/** Lädt Quelltext als ES-Modul; relative Importe (`from './x.js'`) werden auf Dateien in js/ umgebogen. */
export async function loadModule(source: string, dir = 'js') {
  const code = source.replace(/from '\.\/([\w-]+\.js)'/g, (_m, file: string) => `from '${resolve(process.cwd(), dir, file).replace(/^/, 'file://')}'`);
  return import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

/** Text eines CSS-Abschnitts: ab dem Kopf `/* ── <name>` bis zum nächsten Abschnittskopf. */
export function cssSection(css: string, name: string) {
  const start = css.indexOf(`/* ── ${name}`);
  if (start < 0) return '';
  const next = css.indexOf('\n/* ── ', start + 10);
  return css.slice(start, next < 0 ? undefined : next);
}

/** Alle Regeln als [Selektor, Rumpf] (Kommentare entfernt, Leerraum normalisiert); Regeln in @media zählen einzeln. */
export const rulesOf = (text: string): [string, string][] =>
  [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim().replace(/\s+/g, ' '), m[2]]);

/** Rumpf aller Regeln mit genau diesem Selektor, zusammengefügt. */
export const bodyOf = (rules: [string, string][], selector: string) => rules.filter(([s]) => s === selector).map(([, b]) => b).join(';');

/**
 * Fängt Ausnahmen aus Ereignis-Listenern ab (jsdom meldet sie als `error` am Fenster, vitest zählt sie sonst als unbehandelten Fehler):
 * Eine verfälschte Quelle, die im Listener wirft, verletzt damit die Regel, statt den Testlauf zu stören.
 * `stop()` baut den Fang ab und gibt die gefangenen Meldungen zurück.
 */
export function trapErrors() {
  const errors: string[] = [];
  const handler = (event: Event) => {
    errors.push(String((event as ErrorEvent).message ?? event));
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  window.addEventListener('error', handler, true);
  return {
    errors,
    stop() {
      window.removeEventListener('error', handler, true);
      return errors;
    },
  };
}
