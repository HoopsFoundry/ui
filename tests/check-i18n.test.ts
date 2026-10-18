// @vitest-environment node
// Prüfskript scripts/check-i18n.mjs: künstliche Kataloge, Zulassungsliste, Aufruf über die Befehlszeile, Mutationstests.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkAllowlist, checkCatalogs, loadCatalogs, unusedKeys, usageSources } from '../scripts/check-i18n.mjs';
import { loadMutated } from './helpers/script-mutation';

const en = { 'a.one': 'One', 'a.name': 'Hi {name}', 'a.n': { one: '{count} item', other: '{count} items' } };

describe('checkCatalogs', () => {
  it('ein gleicher Katalog ist fehlerfrei', () => {
    expect(checkCatalogs({ en, de: { ...en } })).toEqual([]);
  });
  it('meldet fehlende und überzählige Schlüssel', () => {
    const de = { 'a.one': 'Eins', 'a.name': 'Hallo {name}', 'a.extra': 'x' };
    const errors = checkCatalogs({ en, de });
    expect(errors.some((e) => e.includes('Schlüssel fehlt: a.n'))).toBe(true);
    expect(errors.some((e) => e.includes('überzählig') && e.includes('a.extra'))).toBe(true);
  });
  it('meldet abweichende Platzhalter', () => {
    const errors = checkCatalogs({ en, de: { ...en, 'a.name': 'Hallo {nom}' } });
    expect(errors.some((e) => e.includes('Platzhalter weichen ab') && e.includes('a.name'))).toBe(true);
  });
  it('meldet unvollständige Mehrzahl nach Intl.PluralRules (Polnisch braucht few und many)', () => {
    const errors = checkCatalogs({ en, pl: { ...en } });
    expect(errors.some((e) => e.includes('pl: a.n') && e.includes('few') && e.includes('many'))).toBe(true);
    const ok = checkCatalogs({ en, pl: { ...en, 'a.n': { one: '{count} a', few: '{count} b', many: '{count} c', other: '{count} d' } } });
    expect(ok).toEqual([]);
  });
  it('meldet Mehrzahl statt Text und leere Werte', () => {
    expect(checkCatalogs({ en, de: { ...en, 'a.one': { one: 'x', other: 'y' } } }).some((e) => e.includes('Art weicht'))).toBe(true);
    expect(checkCatalogs({ en, de: { ...en, 'a.one': ' ' } }).some((e) => e.includes('leerer Wert'))).toBe(true);
  });
  it('--locale beschränkt auf eine Sprache', () => {
    const catalogs = { en, de: { 'a.one': 'x' }, nl: { ...en } };
    expect(checkCatalogs(catalogs, 'nl')).toEqual([]);
    expect(checkCatalogs(catalogs, 'de').length).toBeGreaterThan(0);
  });
});

describe('Zulassungsliste für unbenutzte Schlüssel', () => {
  it('Schlüssel in Quellen gelten als verwendet', () => {
    expect(unusedKeys(['a.one', 'b.two'], [`t('a.one')`])).toEqual(['b.two']);
  });
  it('verwendeter Schlüssel in der Liste ist ein Fehler, unverwendeter außerhalb auch', () => {
    expect(checkAllowlist(['a.one'], { 'a.one': 'I2' }, [`t('a.one')`]).length).toBe(1);
    expect(checkAllowlist(['a.one'], {}, ['nichts']).length).toBe(1);
    expect(checkAllowlist(['a.one'], { 'a.one': 'I2' }, ['nichts'])).toEqual([]);
    expect(checkAllowlist(['a.one'], { 'a.one': 'I2', 'x.y': 'I3' }, ['nichts']).length).toBe(1);
  });
  it('im Bestand: die Liste ist genau die Menge der unverwendeten Schlüssel (sie schrumpft, nie unbemerkt)', async () => {
    const catalogs = await loadCatalogs();
    const allowlist = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts/i18n-unused-allowlist.json'), 'utf8'));
    expect(checkAllowlist(Object.keys(catalogs.en), allowlist, usageSources())).toEqual([]);
    // Nach I3 ist jeder Schlüssel verdrahtet: die Liste ist leer (ein neuer, noch unverwendeter Schlüssel müsste hier mit Grund stehen)
    expect(allowlist).toEqual({});
  });
});

describe('Befehlszeile', () => {
  const run = (...args: string[]) => spawnSync(process.execPath, ['scripts/check-i18n.mjs', ...args], { cwd: process.cwd(), encoding: 'utf8' });
  it('en und de sind fehlerfrei (Exit 0)', () => {
    const r = run();
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('Kataloge in Ordnung');
    expect(run('--unused').status).toBe(0);
    expect(run('--locale=de').status).toBe(0);
  });
  it('unbekannte Sprache ergibt Exit 1', () => {
    expect(run('--locale=xx').status).toBe(1);
  });
});

describe('Mutationen des Prüfskripts', () => {
  const cases: [string, string, string][] = [
    ['fehlende Schlüssel', 'if (!(key in catalog)) errors.push(`${code}: Schlüssel fehlt: ${key}`);', ''],
    ['überzählige Schlüssel', 'if (!(key in base)) errors.push(`${code}: Schlüssel überzählig (nicht in en): ${key}`);', ''],
    ['Platzhalter', '} else if (holders(text) !== want) {', '} else if (false) {'],
    ['Mehrzahlkategorien', "const missing = categories.filter((c) =>", "const missing = ['other'].filter((c) =>"],
  ];
  for (const [name, from, to] of cases) {
    it(`kippt: ${name}`, async () => {
      const mod = await loadMutated('check-i18n.mjs', 'check-i18n.mjs', from, to);
      const broken = {
        en,
        de: { 'a.one': 'Eins', 'a.name': 'Hallo {nom}', 'a.extra': 'x' },
        pl: { ...en },
      };
      const before = (await import('../scripts/check-i18n.mjs')).checkCatalogs(broken).length;
      expect(mod.checkCatalogs(broken).length).toBeLessThan(before);
    });
  }
  it('kippt: Zulassungsliste ignoriert verwendete Schlüssel', async () => {
    const mod = await loadMutated('check-i18n.mjs', 'check-i18n.mjs', 'if (!unused.has(key) && key in allowlist)', 'if (false)');
    expect(mod.checkAllowlist(['a.one'], { 'a.one': 'I2' }, [`t('a.one')`])).toEqual([]);
  });
});
