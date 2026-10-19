// Regeln von js/i18n/lang.js (lang-Attribut) mit Mutationen. Das Modul wird aus Text geladen (eigene Instanz des Sprachkerns).
import { describe, expect, it } from 'vitest';
import { loadModule, mutate, read } from './helpers/mutation';

const source = read('js/i18n/lang.js');
type Lang = { langFor: (o?: Record<string, unknown>) => string };
const load = async (text: string) => (await loadModule(text, 'js/i18n')) as Lang;

const RULES: Record<string, (m: Lang) => boolean> = {
  'ausdrücklich undefined heißt: das Dokument fragen': (m) => {
    document.documentElement.lang = 'de';
    try {
      return m.langFor({ locale: 'en', documentLang: undefined }) === 'en' && m.langFor({ locale: 'de', documentLang: undefined }) === '';
    } finally {
      document.documentElement.removeAttribute('lang');
    }
  },
  'documentLang als Zeichenkette gewinnt, leer heißt unbekannt': (m) => m.langFor({ locale: 'en', documentLang: 'de' }) === 'en' && m.langFor({ locale: 'en', documentLang: '' }) === '',
  // de-AT hat keinen eigenen Katalog (Texte aus de); die Seite ist de-CH: gleiche Basissprache, kein lang
  'gleiche Basissprache braucht kein lang': (m) => m.langFor({ locale: 'de-AT', documentLang: 'de-CH' }) === '',
  // I4: lang folgt dem Katalog, der die Texte liefert (resolvedLocale); fr ohne Katalog zeigt englische Texte
  'Sprache ohne Katalog: lang des Rückfalls': (m) =>
    m.langFor({ locale: 'fr', documentLang: 'de' }) === 'en' && m.langFor({ locale: 'fr', documentLang: 'en' }) === '' && m.langFor({ locale: 'de-AT', documentLang: 'en' }) === 'de',
};
const MUTATIONS = [
  { name: 'Schlüssel „documentLang in options“ zählt', rule: 'ausdrücklich undefined heißt: das Dokument fragen', from: "const given = options && typeof options.documentLang === 'string';", to: "const given = options && 'documentLang' in options;" },
  { name: 'documentLang wird ignoriert', rule: 'documentLang als Zeichenkette gewinnt, leer heißt unbekannt', from: "let page = given ? options.documentLang : '';", to: "let page = '';" },
  { name: 'lang nimmt den gesetzten Code statt der Katalogsprache', rule: 'Sprache ohne Katalog: lang des Rückfalls', from: 'const code = resolvedLocale(localeOf(options));', to: 'const code = localeOf(options);' },
  { name: 'Basissprache wird nicht verglichen', rule: 'gleiche Basissprache braucht kein lang', from: 'return base(page) === base(code) ? \'\' : code;', to: "return page === code ? '' : code;" },
];

describe('lang.js', () => {
  it('Ausgangslage', async () => {
    const m = await load(source);
    expect(Object.entries(RULES).filter(([, r]) => !r(m)).map(([n]) => n)).toEqual([]);
  });
  it.each(MUTATIONS)('$name', async ({ rule, from, to }) => {
    expect(RULES[rule](await load(mutate(source, from, to))), rule).toBe(false);
  });
});
