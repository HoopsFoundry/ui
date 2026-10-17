// @vitest-environment node
// Mutationstests des i18n-Kerns: Jede Regel muss kippen, wenn man js/i18n/index.js gezielt verfälscht.
import { describe, expect, it, vi } from 'vitest';
import { loadModule, mutate, read, type Rules } from './helpers/mutation';

const source = read('js/i18n/index.js');

/** Prüft die Regeln am Modul aus einem (verfälschten) Quelltext. */
async function rules(text: string): Promise<Rules> {
  const mod = await loadModule(text, 'js/i18n');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  mod.__resetForTests();
  mod.registerLocale('en', { 'a.k': 'EN', 'a.only-en': 'EN only', 'a.n': { one: '{count} one', other: '{count} other' } });
  mod.registerLocale('de', { 'a.k': 'DE', 'a.base': 'BASE', 'a.n': { one: '{count} eins', other: '{count} mehr' } });
  mod.registerLocale('de-AT', { 'a.k': 'AT' });
  const result: Rules = {};
  result['Standardsprache ist en'] = mod.getLocale() === 'en' && mod.t('a.k') === 'EN';
  mod.setLocale('de-AT');
  result['Basissprache als Rückfall'] = mod.t('a.base') === 'BASE';
  result['en als letzter Rückfall'] = mod.t('a.only-en') === 'EN only';
  result['Sprachcode bleibt erhalten'] = mod.getLocale() === 'de-AT' && mod.t('a.k') === 'AT';
  mod.setTexts({ 'a.k': 'GLOBAL' });
  result['globale Überschreibung vor Katalog'] = mod.t('a.k') === 'GLOBAL';
  result['Überschreibung je Aufruf vor global'] = mod.t('a.k', undefined, { texts: { 'a.k': 'LOKAL' } }) === 'LOKAL';
  mod.setTexts({});
  result['setTexts({}) löscht'] = mod.t('a.k') === 'AT';
  result['Mehrzahl wählt one'] = mod.t('a.n', { count: 1 }, { locale: 'en' }) === '1 one';
  result['Mehrzahl wählt other'] = mod.t('a.n', { count: 2 }, { locale: 'en' }) === '2 other';
  mod.registerLocale('pl', { 'a.n': { one: '{count} eins', other: 'ANDERE {count}' } });
  result['Mehrzahl ohne Kategorie fällt auf other'] = mod.t('a.n', { count: 3 }, { locale: 'pl' }) === 'ANDERE 3';
  result['Platzhalter bleibt ohne Parameter'] = mod.t('a.n', {}, { locale: 'en' }) === '{count} other';
  let calls = 0;
  const off = mod.subscribe(() => calls++);
  mod.setLocale('en');
  off();
  mod.setLocale('de');
  result['Abmelden wirkt'] = calls === 1;
  const warn = console.warn as unknown as ReturnType<typeof vi.fn>;
  warn.mockClear();
  mod.t('a.nope');
  mod.t('a.nope');
  result['Warnung genau einmal'] = warn.mock.calls.length === 1;
  result['fehlender Schlüssel gibt Schlüssel'] = mod.t('a.nope') === 'a.nope';
  vi.restoreAllMocks();
  return result;
}

type Mutation = { name: string; rule: string; from: string; to: string };
const MUTATIONS: Mutation[] = [
  { name: 'Standardsprache de', rule: 'Standardsprache ist en', from: "const DEFAULT_LOCALE = 'en'", to: "const DEFAULT_LOCALE = 'de'" },
  { name: 'Basissprache entfernt', rule: 'Basissprache als Rückfall', from: 'const chain = [code, code.split(\'-\')[0], DEFAULT_LOCALE]', to: 'const chain = [code, DEFAULT_LOCALE]' },
  { name: 'en-Rückfall entfernt', rule: 'en als letzter Rückfall', from: 'const chain = [code, code.split(\'-\')[0], DEFAULT_LOCALE]', to: 'const chain = [code, code.split(\'-\')[0]]' },
  { name: 'Sprachcode wird gekürzt', rule: 'Sprachcode bleibt erhalten', from: 'locale = normalize(code);\n  notify();', to: "locale = normalize(code).split('-')[0];\n  notify();" },
  { name: 'Vorrang vertauscht: Katalog vor global', rule: 'globale Überschreibung vor Katalog', from: 'if (Object.prototype.hasOwnProperty.call(overrides, key)) return overrides[key];\n  const chain', to: 'const chain' },
  { name: 'Vorrang vertauscht: global vor Aufruf', rule: 'Überschreibung je Aufruf vor global', from: 'if (own !== undefined) return own;\n  if (Object.prototype.hasOwnProperty.call(overrides, key)) return overrides[key];', to: 'if (Object.prototype.hasOwnProperty.call(overrides, key)) return overrides[key];\n  if (own !== undefined) return own;' },
  { name: 'setTexts löscht nicht', rule: 'setTexts({}) löscht', from: "overrides = texts && typeof texts === 'object' ? { ...texts } : {};", to: "overrides = texts && typeof texts === 'object' ? { ...overrides, ...texts } : overrides;" },
  { name: 'Mehrzahl immer other', rule: 'Mehrzahl wählt one', from: "category = new Intl.PluralRules(code).select(count);", to: "category = 'other';" },
  { name: 'Mehrzahl immer one', rule: 'Mehrzahl wählt other', from: "category = new Intl.PluralRules(code).select(count);", to: "category = 'one';" },
  { name: 'other-Rückfall entfernt', rule: 'Mehrzahl ohne Kategorie fällt auf other', from: 'const text = value[category] ?? value.other;', to: 'const text = value[category];' },
  { name: 'Platzhalter wird leer', rule: 'Platzhalter bleibt ohne Parameter', from: 'return value === undefined || value === null ? whole : String(value);', to: "return value === undefined || value === null ? '' : String(value);" },
  { name: 'Abmelden ohne Wirkung', rule: 'Abmelden wirkt', from: 'listeners.delete(fn);', to: '' },
  { name: 'Warnung bei jedem Aufruf', rule: 'Warnung genau einmal', from: 'if (!warned.has(key)) {', to: 'if (true) {' },
  { name: 'Schlüssel nicht zurückgegeben', rule: 'fehlender Schlüssel gibt Schlüssel', from: '    return key;\n  }\n  const text', to: "    return '';\n  }\n  const text" },
];

describe('i18n-Kern: Mutationen', () => {
  it('der unveränderte Quelltext erfüllt alle Regeln', async () => {
    const result = await rules(source);
    for (const [name, ok] of Object.entries(result)) expect(ok, name).toBe(true);
  });
  it('jede Regel wird von mindestens einer Mutation verletzt', () => {
    const covered = new Set(MUTATIONS.map((m) => m.rule));
    return rules(source).then((r) => {
      for (const name of Object.keys(r)) expect(covered.has(name), `ohne Mutation: ${name}`).toBe(true);
    });
  });
  for (const m of MUTATIONS) {
    it(`kippt: ${m.name}`, async () => {
      const result = await rules(mutate(source, m.from, m.to));
      expect(result[m.rule], m.rule).toBe(false);
    });
  }
});
