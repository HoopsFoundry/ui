// Svelte-Grundlage der Internationalisierung (I3): svelte/i18n.js folgt dem Kern, Anbieter überschreiben im Teilbaum, keine Lecks.
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetForTests, __subscriberCount, registerLocale, setLocale, setTexts } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';
import Probe from './helpers/I18nProbe.svelte';
import Host from './helpers/I18nProviderHost.svelte';

let target: HTMLElement;
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const probe = (name: string, root: ParentNode = target) => root.querySelector(`[data-probe="${name}"]`)!.textContent;

beforeEach(() => {
  __resetForTests();
  registerLocale('de', de);
  setLocale('en');
  target = document.createElement('div');
  document.body.replaceChildren(target);
});
afterEach(() => {
  document.documentElement.removeAttribute('lang');
  __resetForTests();
  registerLocale('de', de);
  setLocale('de');
});

describe('svelte/i18n.js: Sprachwechsel zur Laufzeit', () => {
  it('Vorlage und $derived folgen setLocale, setTexts und registerLocale', async () => {
    const app = mount(Probe, { target });
    flushSync();
    expect(probe('tpl')).toBe('Close');
    expect(probe('derived')).toBe('Close');
    expect(probe('plural')).toBe('2 players');
    setLocale('de');
    flushSync();
    expect(probe('tpl')).toBe('Schließen');
    expect(probe('derived')).toBe('Schließen');
    expect(probe('plural')).toBe('2 Spieler');
    expect(probe('locale')).toBe('de');
    setTexts({ 'modal.close': 'Zu' });
    flushSync();
    expect(probe('tpl')).toBe('Zu');
    expect(probe('derived')).toBe('Zu');
    setTexts({});
    registerLocale('de', { ...de, 'modal.close': 'Dicht' });
    flushSync();
    expect(probe('derived')).toBe('Dicht');
    unmount(app);
    await settle();
  });
  it('die Texte der Komponente (texts) schlagen globale Überschreibungen', async () => {
    setTexts({ 'modal.close': 'Global' });
    const app = mount(Probe, { target, props: { texts: { 'modal.close': 'Eigen' } } });
    flushSync();
    expect(probe('tpl')).toBe('Eigen');
    expect(probe('derived')).toBe('Eigen');
    unmount(app);
    await settle();
  });
});

describe('svelte/i18n.js: Anbieter (provideI18n)', () => {
  it('Sprache und Texte gelten im Teilbaum, ohne den globalen Zustand zu ändern', async () => {
    const app = mount(Host, { target, props: { locale: 'de', texts: { 'modal.close': 'Zumachen' } } });
    flushSync();
    expect(probe('tpl')).toBe('Zumachen');
    expect(probe('plural')).toBe('2 Spieler');
    const { getLocale, getTexts } = await import('../js/i18n/index.js');
    expect(getLocale()).toBe('en');
    expect(getTexts()).toEqual({});
    unmount(app);
    await settle();
  });
  it('Vorrang: Texte der Komponente vor Texte des Anbieters vor globale Texte vor Katalog', async () => {
    setTexts({ 'modal.close': 'Global', 'tabs.label': 'Reiter global' });
    const app = mount(Host, { target, props: { locale: 'de', texts: { 'modal.close': 'Anbieter' }, probeTexts: { 'modal.close': 'Eigen' } } });
    flushSync();
    expect(probe('tpl')).toBe('Eigen');
    unmount(app);
    const app2 = mount(Host, { target, props: { locale: 'de', texts: { 'modal.close': 'Anbieter' } } });
    flushSync();
    expect(probe('tpl')).toBe('Anbieter');
    unmount(app2);
    const app3 = mount(Host, { target, props: { locale: 'de' } });
    flushSync();
    expect(probe('tpl')).toBe('Global');
    unmount(app3);
    await settle();
  });
  it('geschachtelte Anbieter: der innere gilt innen, außen bleibt unberührt', async () => {
    const app = mount(Host, { target, props: { locale: 'de', innerLocale: 'en', texts: { 'modal.close': 'Außen' } } });
    flushSync();
    const outer = target.querySelector('[data-host="outer"]')!;
    const inner = target.querySelector('[data-host="inner"]')!;
    expect(probe('tpl', outer)).toBe('Außen');
    expect(probe('tpl', inner)).toBe('Außen'); // Texte des äußeren Anbieters gelten weiter, die Sprache ist innen en
    expect(probe('plural', inner)).toBe('2 players');
    expect(probe('plural', outer)).toBe('2 Spieler');
    unmount(app);
    await settle();
  });
  it('Änderung der Eigenschaften des Anbieters wirkt zur Laufzeit', async () => {
    const app = mount(Host, { target, props: { locale: 'en' } }) as unknown as { set: (l: string) => void };
    flushSync();
    expect(probe('plural')).toBe('2 players');
    app.set('de');
    flushSync();
    expect(probe('plural')).toBe('2 Spieler');
    unmount(app);
    await settle();
  });
});

describe('svelte/i18n.js: lang', () => {
  it('weicht die Sprache von der Seite ab, bekommt die Wurzel lang; sonst nicht', async () => {
    document.documentElement.lang = 'de';
    const app = mount(Probe, { target });
    flushSync();
    expect(target.querySelector('[data-probe="tpl"]')!.getAttribute('lang')).toBe('en');
    setLocale('de');
    flushSync();
    expect(target.querySelector('[data-probe="tpl"]')!.hasAttribute('lang')).toBe(false);
    unmount(app);
    await settle();
  });
  it('documentLang des Anbieters gilt statt des Dokuments', async () => {
    document.documentElement.lang = 'de';
    const app = mount(Host, { target, props: { locale: 'en', documentLang: 'en' } });
    flushSync();
    expect(target.querySelector('[data-probe="tpl"]')!.hasAttribute('lang')).toBe(false);
    unmount(app);
    await settle();
  });
});

describe('svelte/i18n.js: Abonnement ohne Leck', () => {
  it('lebt nur, solange eine Komponente lebt; 50 Wiederholungen ohne Zuwachs', async () => {
    const before = __subscriberCount();
    for (let i = 0; i < 50; i++) {
      const a = mount(Probe, { target });
      const b = mount(Probe, { target });
      flushSync();
      expect(__subscriberCount()).toBe(before + 1);
      unmount(a);
      unmount(b);
      await settle();
    }
    expect(__subscriberCount()).toBe(before);
  });
  it('ohne Komponente kein Abonnement (der Import allein abonniert nichts)', async () => {
    expect(__subscriberCount()).toBe(0);
    const app = mount(Probe, { target });
    flushSync();
    unmount(app);
    await settle();
    expect(__subscriberCount()).toBe(0);
  });
});
