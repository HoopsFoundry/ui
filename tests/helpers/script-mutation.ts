// Hilfe der Mutationstests für Node-Skripte (scripts/*.mjs): Kopie der Skripte in einen Arbeitsordner, Textstelle verfälschen, Modul laden.
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect } from 'vitest';

let counter = 0;

/** Kopiert scripts/ in einen eigenen Ordner, ersetzt in `file` (relativ zu scripts/) die erste Fundstelle von `from` durch `to` und lädt `entry`. */
export async function loadMutated(entry: string, file: string, from: string, to: string) {
  const dir = mkdtempSync(join(tmpdir(), `hoops-mut-${process.pid}-${counter++}-`));
  cpSync(resolve(process.cwd(), 'scripts'), join(dir, 'scripts'), { recursive: true });
  const path = join(dir, 'scripts', file);
  const text = readFileSync(path, 'utf8');
  expect(text.includes(from), `Textstelle nicht gefunden in ${file}: ${from}`).toBe(true);
  writeFileSync(path, text.replace(from, () => to));
  return import(/* @vite-ignore */ pathToFileURL(join(dir, 'scripts', entry)).href);
}
