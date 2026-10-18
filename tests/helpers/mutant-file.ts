// Hilfe für Mutationstests an Quelldateien, die bare Importe haben oder Komponenten sind (Svelte, React): Kopie in einen eigenen Ordner unter tests/
// (gitignored, wird am Ende abgeräumt), Textstelle verfälschen, relative Importe auf die Originaldatei umbiegen.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { expect } from 'vitest';

const root = process.cwd();

/** Ein Arbeitsordner unter tests/ (`tests/.mutants-XXXX/`); `drop()` löscht ihn. */
export function mutantDir() {
  const dir = mkdtempSync(join(root, 'tests', '.mutants-'));
  return { dir, drop: () => rmSync(dir, { recursive: true, force: true }) };
}

/**
 * Schreibt eine Kopie von `source` (Pfad relativ zum Repository) nach `dir/name`. `edits` ersetzen je die erste Fundstelle (muss existieren);
 * relative Importe, die das Original aus seinem eigenen Ordner erreicht, zeigen danach auf die Originaldateien, außer sie stehen in `keep`
 * (zum Beispiel `./i18n.js`, damit eine Komponentenkopie die mutierte Grundlage im selben Ordner lädt).
 */
export function writeMutant(dir: string, name: string, source: string, edits: [string, string][] = [], keep: string[] = []) {
  let text = readFileSync(resolve(root, source), 'utf8');
  for (const [from, to] of edits) {
    expect(text.includes(from), `Textstelle nicht gefunden in ${source}: ${from}`).toBe(true);
    text = text.replace(from, () => to);
  }
  const base = dirname(resolve(root, source));
  text = text.replace(/(from\s+|import\s+)(['"])(\.{1,2}\/[^'"]+)\2/g, (whole, lead: string, quote: string, spec: string) =>
    keep.includes(spec) ? whole : `${lead}${quote}${resolve(base, spec)}${quote}`,
  );
  const target = join(dir, name);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
  return target;
}
