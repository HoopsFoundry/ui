// formatPlain (js/i18n/format.js): schreibt wie String(n), nur das Dezimalzeichen wechselt; Mutationen müssen die Regeln kippen.
import { describe, expect, it } from 'vitest';
import { loadModule, mutate, read } from './helpers/mutation';

const source = read('js/i18n/format.js');
type Fmt = { formatPlain: (n: number, o?: { locale?: string }) => string };
const load = async (text: string) => (await loadModule(text, 'js/i18n')) as Fmt;
const RULES: Record<string, (m: Fmt) => boolean> = {
  'negative Null ist 0': (m) => m.formatPlain(-0, { locale: 'de' }) === '0',
  'Exponentialwerte bleiben wie String(n)': (m) => m.formatPlain(1e-7, { locale: 'en' }) === '1e-7' && m.formatPlain(1e21, { locale: 'de' }) === '1e+21' && m.formatPlain(5e-324, { locale: 'de' }) === '5e-324',
  'Dezimalzeichen der Sprache': (m) => m.formatPlain(12.5, { locale: 'de' }) === '12,5' && m.formatPlain(12.5, { locale: 'en' }) === '12.5',
  'keine Tausendertrennung, keine Rundung': (m) => m.formatPlain(1234567.891, { locale: 'de' }) === '1234567,891' && m.formatPlain(0.1 + 0.2, { locale: 'en' }) === '0.30000000000000004',
};
const MUTATIONS = [
  { name: 'Intl formatiert die Zahl', rule: 'negative Null ist 0', from: 'return String(n).replace(', to: 'return new Intl.NumberFormat(localeOf(localeOptions)).format(n).replace(' },
  { name: 'Intl formatiert die Zahl (Exponent)', rule: 'Exponentialwerte bleiben wie String(n)', from: 'return String(n).replace(', to: 'return new Intl.NumberFormat(localeOf(localeOptions), { maximumFractionDigits: 20 }).format(n).replace(' },
  { name: 'Punkt bleibt', rule: 'Dezimalzeichen der Sprache', from: ".replace('.', decimalOf(localeOf(localeOptions)))", to: '' },
  { name: 'Tausendertrennung', rule: 'keine Tausendertrennung, keine Rundung', from: 'return String(n).replace(', to: 'return new Intl.NumberFormat(localeOf(localeOptions)).format(n).replace(' },
];
describe('formatPlain', () => {
  it('Ausgangslage', async () => {
    const m = await load(source);
    expect(Object.entries(RULES).filter(([, r]) => !r(m)).map(([n]) => n)).toEqual([]);
  });
  it.each(MUTATIONS)('$name', async ({ rule, from, to }) => {
    expect(RULES[rule](await load(mutate(source, from, to))), rule).toBe(false);
  });
});
