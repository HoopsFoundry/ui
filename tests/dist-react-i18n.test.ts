// @vitest-environment node
// Am GEBAUTEN React-Bündel (gleiche Bauweise wie `npm run build:react`, gebaut von tests/helpers/bundle-setup.ts): Es bringt eine eigene Kopie des Sprachkerns mit.
// Sprache, Kataloge, Überschreibungen und Abonnenten müssen trotzdem mit dem Kern aus dem Quelltext (`@hoopsfoundry/ui/i18n`) geteilt werden, sonst wirkt
// `setLocale('de')` der Anwendung nicht auf die ausgelieferten Komponenten. Dazu das Gegenstück für das Vanilla-Bündel `hoops.js` und `hoops-i18n-de.js`.
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetForTests, __subscriberCount, getLocale, registerLocale, setLocale, setTexts, t } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';
import { bundleDir } from './helpers/bundle-dir';
import { loadModule, read } from './helpers/mutation';

const STEPS = [{ id: 'a', label: 'Eins', state: 'done' as const }, { id: 'b', label: 'Zwei', state: 'pending' as const }];
type React = { Stepper: unknown; HoopsProvider: unknown; Skeleton: unknown };
const load = async () => (await import(/* @vite-ignore */ `${bundleDir}react/index.js`)) as React;
const stepper = (m: React, extra?: Record<string, unknown>) => createElement(m.Stepper as never, { steps: STEPS, ...extra });

beforeEach(() => {
  __resetForTests();
  setLocale('en');
});

describe('gebautes dist/react teilt den Sprachzustand mit dem Quelltext-Kern', () => {
  it('setLocale und der deutsche Katalog aus dem Quelltext wirken auf die Komponenten des Bündels', async () => {
    const m = await load();
    expect(renderToString(stepper(m))).toContain('aria-label="Progress"');
    registerLocale('de', de);
    setLocale('de');
    const html = renderToString(stepper(m));
    expect(html).toContain('aria-label="Fortschritt"');
    expect(html).toContain('erledigt');
  });
  it('HoopsProvider locale="de" findet den Katalog, den die Anwendung registriert hat', async () => {
    const m = await load();
    registerLocale('de', de);
    const html = renderToString(createElement(m.HoopsProvider as never, { locale: 'de' }, stepper(m)));
    expect(html).toContain('aria-label="Fortschritt"');
    expect(renderToString(stepper(m))).toContain('aria-label="Progress"'); // außerhalb gilt die globale Sprache
    expect(getLocale()).toBe('en');
  });
  it('globale Texte (setTexts) und die Skelett-Meldung kommen aus dem geteilten Zustand', async () => {
    const m = await load();
    setTexts({ 'skeleton.loading': 'Bitte warten' });
    expect(renderToString(createElement(m.Skeleton as never, {}))).toContain('Bitte warten');
  });
  it('die Abonnements des Bündels erscheinen im Zähler des Quelltext-Kerns (Server-Rendern abonniert nichts)', async () => {
    const m = await load();
    const before = __subscriberCount();
    renderToString(stepper(m));
    expect(__subscriberCount()).toBe(before);
  });
});

describe('Vanilla-Bündel hoops.js und Quelltext-Kern teilen den Zustand', () => {
  it('Sprache, Katalog aus hoops-i18n-de.js und Texte', async () => {
    const core = (await import(/* @vite-ignore */ `${bundleDir}hoops.js`)) as { getLocale: () => string; setLocale: (c: string) => void; t: typeof t; setTexts: typeof setTexts };
    await import(/* @vite-ignore */ `${bundleDir}hoops-i18n-de.js`); // registriert de im geteilten Zustand
    setLocale('de');
    expect(core.getLocale()).toBe('de');
    expect(t('modal.close')).toBe('Schließen');
    core.setLocale('en');
    expect(getLocale()).toBe('en');
    expect(core.t('modal.close', undefined, { locale: 'de' })).toBe('Schließen');
    setTexts({ 'modal.close': 'Zu' });
    expect(core.t('modal.close')).toBe('Zu');
  });
});

describe('Zustand des Kerns unter globalThis[Symbol.for(\'hoops.i18n\')]', () => {
  const key = Symbol.for('hoops.i18n');
  type Core = { getLocale: () => string; setLocale: (c: string) => void };
  const copy = async () => (await loadModule(read('js/i18n/index.js'), 'js/i18n')) as Core;

  it('mehrere Kopien des Kerns teilen ihn', async () => {
    const a = await copy();
    const b = await copy();
    a.setLocale('de');
    expect(b.getLocale()).toBe('de');
    expect(getLocale()).toBe('de');
  });
  it('ein fremder Wert unter dem Schlüssel (andere Version oder Gestalt) wird nicht übernommen und nicht überschrieben', async () => {
    const holder = globalThis as unknown as Record<symbol, unknown>;
    const saved = holder[key];
    const foreign = { version: 99, locale: 'fr' };
    holder[key] = foreign;
    try {
      const a = await copy();
      expect(a.getLocale()).toBe('en');
      a.setLocale('de');
      expect(holder[key]).toBe(foreign);
      expect(foreign.locale).toBe('fr');
    } finally {
      holder[key] = saved;
    }
  });
  // Dass der Import nichts auf globalThis schreibt, prüft tests/side-effects.test.ts
});
