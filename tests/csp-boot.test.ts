// @vitest-environment node
// Lückenplan 2.2: Das CSP-Rezept der Doku (Hash des Boot-Skripts) liefert genau den Hash, den der Browser erwartet. Der Browserlauf mit
// Hash, meta, nonce und Gegenproben steht in scripts/check-csp-boot.mjs (nicht Teil von npm test).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { themeBootScript } from '../js/theme.js';
import { cspHeader as darkHeader } from '../stories/Foundation/DarkMode.code';
import { cspHeader as vanillaHeader } from '../stories/Foundation/Vanilla.code';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sha = (text: string) => createHash('sha256').update(text, 'utf8').digest('base64');

/** Die zwei Zeilen des Rezepts (printf … \ und | openssl …), so wie sie in der Doku stehen. */
const recipe = (header: string) => {
  const lines = header.split('\n');
  const i = lines.findIndex((l) => l.startsWith('printf '));
  expect(i, 'printf-Zeile').toBeGreaterThan(-1);
  expect(lines[i].endsWith('\\')).toBe(true);
  return `${lines[i]}\n${lines[i + 1]}`;
};
const hasOpenssl = (() => { try { execFileSync('openssl', ['version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

describe('CSP-Rezept für das Boot-Skript', () => {
  it('beide Doku-Seiten nennen dasselbe Rezept', () => {
    expect(recipe(vanillaHeader)).toBe(recipe(darkHeader));
    for (const h of [darkHeader, vanillaHeader]) {
      expect(h).toMatch(/script-src 'self' 'sha256-</);
      expect(h).toMatch(/script-src 'self' 'nonce-<zufällig je Antwort>'/);
      expect(h).toMatch(/<script nonce="<zufällig je Antwort>">/);
      // eigene Optionen gehören in den node -e-Aufruf (Review K7)
      expect(h).toContain("m.themeBootScript({ defaultMode: 'dark', storageKey: 'mein-theme' })");
    }
  });

  it.skipIf(!hasOpenssl)('das Rezept (printf | openssl, ausgeführt in der Shell) ergibt den Hash von themeBootScript()', () => {
    const out = execFileSync('sh', ['-c', recipe(darkHeader)], { cwd: ROOT, encoding: 'utf8' }).trim();
    expect(out).toBe(sha(themeBootScript()));
    expect(out).toMatch(/^[A-Za-z0-9+/]{43}=$/);
  });

  it('das Rezept nimmt printf ohne Zeilenumbruch: ein angehängter Zeilenumbruch gäbe einen anderen Hash (Regression gegen echo)', () => {
    expect(recipe(darkHeader)).toMatch(/^printf '%s' /);
    expect(sha(`${themeBootScript()}\n`)).not.toBe(sha(themeBootScript()));
  });

  it('der Hash hängt an den Optionen: andere Optionen, anderer Hash', () => {
    expect(sha(themeBootScript({ defaultMode: 'dark' }))).not.toBe(sha(themeBootScript()));
    expect(sha(themeBootScript({ storageKey: 'x' }))).not.toBe(sha(themeBootScript()));
  });

  it('das Browserskript deckt Hash, meta, nonce und die Gegenproben ab', () => {
    const script = read('scripts/check-csp-boot.mjs');
    for (const name of ['hash:', 'meta:', 'nonce:', 'ohne:', "'falsche-nonce':", "'hash-andere-optionen':"]) expect(script, name).toContain(name);
    expect(script).toContain('stories/Foundation/DarkMode.code.ts');
    expect(script).toContain('securitypolicyviolation');
  });
});
