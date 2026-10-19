// @vitest-environment node
// `resolvedLocale` (I4): `lang` an den Wurzeln der Bausteine folgt dem Katalog, der die Texte tatsächlich liefert (WCAG 3.1.2). `setLocale('fr')` ohne
// französischen Katalog zeigt englische Texte, also `lang="en"`, nicht `lang="fr"`; `getLocale()`, `Intl` und `detail.locale` bleiben beim Code.
// Dazu Parität: Svelte-SSR, React-SSR und `renderLeagueCard` geben bei unbekannter Sprache dasselbe Markup mit `lang="en"` aus. Mutationsprobe am Kern.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetForTests, getLocale, registerLocale, resolvedLocale, setLocale, t } from '../js/i18n/index.js';
import { langFor } from '../js/i18n/lang.js';
import { formatNumber } from '../js/i18n/format.js';
import de from '../js/i18n/de.js';
import { loadModule, mutate, read } from './helpers/mutation';
import { useParity } from './helpers/render-parity';

const p = useParity();
const teams = [
  { rank: 1, name: 'Lindenberg Hawks', played: 8, points: 14, zone: 'up' },
  { rank: 2, name: 'TSV Nordhain 1920', played: 8, points: 12, own: true },
];

beforeEach(() => {
  __resetForTests();
  registerLocale('de', de);
});
afterEach(() => {
  vi.unstubAllGlobals();
  __resetForTests();
  registerLocale('de', de);
  setLocale('de');
});

describe('resolvedLocale', () => {
  it('erster registrierter Katalog aus [Code, Basissprache], sonst en; ohne Code die globale Sprache', () => {
    expect(resolvedLocale('de')).toBe('de');
    expect(resolvedLocale('de-AT')).toBe('de');
    expect(resolvedLocale('fr')).toBe('en');
    expect(resolvedLocale('xx!!')).toBe('en');
    setLocale('fr');
    expect(resolvedLocale()).toBe('en');
    registerLocale('fr', { 'modal.close': 'Fermer' });
    expect(resolvedLocale()).toBe('fr');
    registerLocale('de-AT', { 'modal.close': 'Schließen' });
    expect(resolvedLocale('de-AT')).toBe('de-AT');
  });
  it('ohne den deutschen Katalog liefert setLocale("de") englische Texte und lang="en"', () => {
    __resetForTests();
    setLocale('de');
    expect(t('modal.close')).toBe('Close');
    expect(langFor({ documentLang: 'fr' })).toBe('en');
    expect(langFor({ documentLang: 'en' })).toBe('');
  });
  it('getLocale, Intl und das Ereignis behalten den Code', () => {
    setLocale('fr');
    expect(getLocale()).toBe('fr');
    expect(formatNumber(1.5)).toBe('1,5');
    expect(langFor({ documentLang: 'de' })).toBe('en');
  });
  it('Mutationsprobe: ohne Rückfall auf en (Code selbst zurückgegeben) wird die Regel rot', async () => {
    const source = read('js/i18n/index.js');
    const mutant = (await loadModule(mutate(source, '  return DEFAULT_LOCALE;\n}\n\n/** Registrierte Sprachcodes. */', '  return wanted;\n}\n\n/** Registrierte Sprachcodes. */'), 'js/i18n')) as { resolvedLocale: (c?: string) => string };
    expect(mutant.resolvedLocale('fr')).toBe('fr');
    const basis = (await loadModule(mutate(source, 'for (const c of [wanted, wanted.split(\'-\')[0]])', 'for (const c of [wanted])'), 'js/i18n')) as { resolvedLocale: (c?: string) => string };
    expect(basis.resolvedLocale('de-AT')).toBe('en');
  });
});

describe('Parität bei unbekannter Sprache (Seite deutsch, Sprache fr ohne Katalog)', () => {
  it('Svelte-SSR, React-SSR und renderLeagueCard: dasselbe Markup, englische Texte, lang="en"', async () => {
    vi.stubGlobal('document', { documentElement: { lang: 'de' } });
    p.locale('fr');
    const props = { title: 'Bezirksliga Nordhain', teams, href: '/tabelle' };
    const svelte = await p.svelte('LeagueCard', props);
    const react = await p.react('LeagueCard', props);
    const vanilla = await p.vanilla('js/render/league-card.js', 'renderLeagueCard', props);
    for (const html of [svelte, react, vanilla]) {
      expect(html).toContain('lang="en"');
      expect(html).not.toContain('lang="fr"');
      expect(html).toContain('Full standings and schedule');
    }
    expect(react).toBe(svelte);
    expect(vanilla).toBe(svelte);
    p.locale('de');
  });
});
