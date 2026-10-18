// Mutationstests der Grundlage in Svelte (svelte/i18n.js) und React (react/i18n.tsx): jede Regel muss rot werden, wenn die Quelle sie verletzt.
import { createElement, useLayoutEffect } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { flushSync, mount, unmount } from 'svelte';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetForTests, __subscriberCount, registerLocale, setLocale, setTexts } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';
import { mutantDir, writeMutant } from './helpers/mutant-file';

const work = mutantDir();
afterAll(() => work.drop());
let counter = 0;
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  __resetForTests();
  registerLocale('de', de);
  setLocale('en');
});
afterEach(() => {
  cleanup();
  __resetForTests();
  registerLocale('de', de);
  setLocale('de');
});

// ── Svelte ──────────────────────────────────────────────────
type Rule = (load: () => Promise<{ Probe: any; Host: any }>) => Promise<boolean>;
const span = (root: ParentNode, name: string) => root.querySelector(`[data-probe="${name}"]`)!;

const SVELTE: Record<string, Rule> = {
  'ein Sprachwechsel rendert Vorlage und $derived neu': async (load) => {
    const { Probe } = await load();
    const target = document.body.appendChild(document.createElement('div'));
    const app = mount(Probe, { target });
    flushSync();
    setLocale('de');
    flushSync();
    const ok = span(target, 'tpl').textContent === 'Schließen' && span(target, 'derived').textContent === 'Schließen';
    unmount(app);
    await settle();
    target.remove();
    return ok;
  },
  'nach dem Zerstören der Komponenten bleibt kein Abonnement': async (load) => {
    const { Probe } = await load();
    const target = document.body.appendChild(document.createElement('div'));
    const before = __subscriberCount();
    const app = mount(Probe, { target });
    flushSync();
    unmount(app);
    await settle();
    target.remove();
    return __subscriberCount() === before;
  },
  'der Anbieter überschreibt die Sprache im Teilbaum': async (load) => {
    const { Host } = await load();
    const target = document.body.appendChild(document.createElement('div'));
    const app = mount(Host, { target, props: { locale: 'de' } });
    flushSync();
    const ok = span(target, 'plural').textContent === '2 Spieler';
    unmount(app);
    await settle();
    target.remove();
    return ok;
  },
  'Texte der Komponente schlagen die des Anbieters': async (load) => {
    const { Host } = await load();
    const target = document.body.appendChild(document.createElement('div'));
    const app = mount(Host, { target, props: { locale: 'de', texts: { 'modal.close': 'Anbieter' }, probeTexts: { 'modal.close': 'Eigen' } } });
    flushSync();
    const ok = span(target, 'tpl').textContent === 'Eigen';
    unmount(app);
    await settle();
    target.remove();
    return ok;
  },
  'der innere Anbieter erbt die Texte des äußeren': async (load) => {
    const { Host } = await load();
    const target = document.body.appendChild(document.createElement('div'));
    const app = mount(Host, { target, props: { locale: 'de', texts: { 'modal.close': 'Außen' }, innerLocale: 'en' } });
    flushSync();
    const ok = span(target.querySelector('[data-host="inner"]')!, 'tpl').textContent === 'Außen';
    unmount(app);
    await settle();
    target.remove();
    return ok;
  },
  'lang nur bei abweichender Sprache': async (load) => {
    const { Probe } = await load();
    const target = document.body.appendChild(document.createElement('div'));
    document.documentElement.lang = 'de';
    const app = mount(Probe, { target });
    flushSync();
    const first = span(target, 'tpl').getAttribute('lang') === 'en';
    setLocale('de');
    flushSync();
    const ok = first && !span(target, 'tpl').hasAttribute('lang');
    document.documentElement.removeAttribute('lang');
    unmount(app);
    await settle();
    target.remove();
    return ok;
  },
};

const SVELTE_MUTATIONS: { name: string; rule: string; from: string; to: string }[] = [
  { name: 'Komponente liest den Zähler nicht (keine Abhängigkeit)', rule: 'ein Sprachwechsel rendert Vorlage und $derived neu', from: '    track();\n    const provided', to: '    const provided' },
  { name: 'Abonnement wird nie abgemeldet', rule: 'nach dem Zerstören der Komponenten bleibt kein Abonnement', from: 'subscribe(() => update())', to: '(subscribe(() => update()), undefined)' },
  { name: 'Anbieter ignoriert die Sprache', rule: 'der Anbieter überschreibt die Sprache im Teilbaum', from: 'locale: own.locale || parent.locale', to: 'locale: parent.locale' },
  { name: 'Anbieter-Texte schlagen Texte der Komponente', rule: 'Texte der Komponente schlagen die des Anbieters', from: 'texts: own ? { ...(provided.texts || {}), ...own } : provided.texts', to: 'texts: own ? { ...own, ...(provided.texts || {}) } : provided.texts' },
  { name: 'innerer Anbieter verwirft die äußeren Texte', rule: 'der innere Anbieter erbt die Texte des äußeren', from: 'const texts = { ...(parent.texts || {}), ...(own.texts || {}) };', to: 'const texts = { ...(own.texts || {}) };' },
  { name: 'lang wird immer gesetzt', rule: 'lang nur bei abweichender Sprache', from: 'return langFor(read()) || undefined;', to: 'return localeOf(read());' },
];

function svelteLoader(edit?: [string, string]) {
  return async () => {
    const dir = `s${counter++}`;
    writeMutant(work.dir, `${dir}/i18n.js`, 'svelte/i18n.js', edit ? [edit] : []);
    // Sonde und Anbieter laden die Kopie der Grundlage im selben Ordner
    for (const name of ['I18nProbe', 'I18nProviderHost', 'I18nInner']) {
      writeMutant(work.dir, `${dir}/${name}.svelte`, `tests/helpers/${name}.svelte`, [["'../../svelte/i18n.js'", "'./i18n.js'"]], ['./i18n.js', './I18nProbe.svelte', './I18nInner.svelte']);
    }
    const [probe, host] = await Promise.all([import(/* @vite-ignore */ `${work.dir}/${dir}/I18nProbe.svelte`), import(/* @vite-ignore */ `${work.dir}/${dir}/I18nProviderHost.svelte`)]);
    return { Probe: probe.default, Host: host.default };
  };
}

describe('svelte/i18n.js (Mutationen)', () => {
  it('Ausgangslage: alle Regeln gelten', async () => {
    const failed: string[] = [];
    for (const [name, rule] of Object.entries(SVELTE)) {
      beforeEachReset();
      if (!(await rule(svelteLoader()))) failed.push(name);
    }
    expect(failed).toEqual([]);
  });
  it.each(SVELTE_MUTATIONS)('$name', async ({ rule, from, to }) => {
    expect(await SVELTE[rule](svelteLoader([from, to])), rule).toBe(false);
  });
});

// ── React ───────────────────────────────────────────────────
type ReactModule = { HoopsProvider: any; useT: any; useLocale: any };
type ReactRule = (m: ReactModule) => boolean | Promise<boolean>;

function probeOf(m: ReactModule, name = 'probe') {
  return function Probe({ texts }: { texts?: Record<string, string> }) {
    const { t, lang } = m.useT(texts);
    return createElement('span', { 'data-name': name, lang }, `${t('modal.close')}|${t('team.squad.players', { count: 2 })}`);
  };
}
const out = (name = 'probe') => document.querySelector(`[data-name="${name}"]`)?.textContent;

const REACT: Record<string, ReactRule> = {
  'ein Sprachwechsel rendert neu': (m) => {
    const Probe = probeOf(m);
    render(createElement(Probe));
    act(() => setLocale('de'));
    return out() === 'Schließen|2 Spieler';
  },
  'der Anbieter überschreibt die Sprache im Teilbaum': (m) => {
    const Probe = probeOf(m);
    render(createElement(m.HoopsProvider, { locale: 'de' }, createElement(Probe)));
    return out() === 'Schließen|2 Spieler';
  },
  'nach dem Entfernen bleibt kein Abonnement': (m) => {
    const Probe = probeOf(m);
    const before = __subscriberCount();
    const view = render(createElement(Probe));
    view.unmount();
    return __subscriberCount() === before;
  },
  'Texte der Komponente schlagen die des Anbieters': (m) => {
    const Probe = probeOf(m);
    render(createElement(m.HoopsProvider, { texts: { 'modal.close': 'Anbieter' } }, createElement(Probe, { texts: { 'modal.close': 'Eigen' } })));
    return out()?.startsWith('Eigen|') ?? false;
  },
  'der innere Anbieter erbt die Texte des äußeren': (m) => {
    const Probe = probeOf(m);
    render(createElement(m.HoopsProvider, { texts: { 'modal.close': 'Außen' } }, createElement(m.HoopsProvider, { locale: 'de' }, createElement(Probe))));
    return out()?.startsWith('Außen|') ?? false;
  },
  'Änderungen des Kerns erreichen die Komponente (Katalog, Texte)': (m) => {
    const Probe = probeOf(m);
    render(createElement(Probe));
    act(() => setTexts({ 'modal.close': 'Zu' }));
    return out()?.startsWith('Zu|') ?? false;
  },
  'eine Änderung vor dem Abonnieren geht nicht verloren': (m) => {
    const Probe = probeOf(m);
    // der Nachbar ändert die Sprache in seinem Layout-Effekt, also nach dem Rendern und vor dem Abonnieren der Sonde (passiver Effekt)
    const Changer = () => {
      useLayoutEffect(() => setLocale('de'), []);
      return null;
    };
    render(createElement('div', null, createElement(Probe), createElement(Changer)));
    return out() === 'Schließen|2 Spieler';
  },
  'lang nur bei abweichender Sprache': (m) => {
    const Probe = probeOf(m);
    document.documentElement.lang = 'de';
    render(createElement(Probe));
    const first = document.querySelector('[data-name="probe"]')!.getAttribute('lang') === 'en';
    act(() => setLocale('de'));
    const second = !document.querySelector('[data-name="probe"]')!.hasAttribute('lang');
    document.documentElement.removeAttribute('lang');
    return first && second;
  },
};

const REACT_MUTATIONS: { name: string; rule: string; from: string; to: string }[] = [
  { name: 'Komponente abonniert den Kern nicht', rule: 'ein Sprachwechsel rendert neu', from: '  useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);\n', to: '' },
  { name: 'Anbieter ignoriert die Sprache', rule: 'der Anbieter überschreibt die Sprache im Teilbaum', from: 'locale: locale || outer.locale', to: 'locale: outer.locale' },
  { name: 'Abonnement wird nie abgemeldet', rule: 'nach dem Entfernen bleibt kein Abonnement', from: '      stop();\n', to: '' },
  { name: 'Anbieter-Texte schlagen Texte der Komponente', rule: 'Texte der Komponente schlagen die des Anbieters', from: 'const texts = own ? { ...(context.texts ?? {}), ...own } : context.texts;', to: 'const texts = own ? { ...own, ...(context.texts ?? {}) } : context.texts;' },
  { name: 'innerer Anbieter verwirft die äußeren Texte', rule: 'der innere Anbieter erbt die Texte des äußeren', from: 'texts: { ...(outer.texts ?? {}), ...(texts ?? {}) }', to: 'texts: { ...(texts ?? {}) }' },
  { name: 'Änderungen werden nicht gemeldet', rule: 'Änderungen des Kerns erreichen die Komponente (Katalog, Texte)', from: '      for (const fn of [...callbacks]) fn();\n', to: '' },
  { name: 'Zähler steigt beim ersten Abonnieren nicht', rule: 'eine Änderung vor dem Abonnieren geht nicht verloren', from: '  if (callbacks.size === 1) {\n    version += 1;', to: '  if (callbacks.size === 1) {' },
  { name: 'lang wird immer gesetzt', rule: 'lang nur bei abweichender Sprache', from: 'lang: langFor(options) || undefined,', to: 'lang: localeOf(options),' },
];

async function reactModule(edit?: [string, string]): Promise<ReactModule> {
  const dir = `r${counter++}`;
  const file = writeMutant(work.dir, `${dir}/i18n.tsx`, 'react/i18n.tsx', edit ? [edit] : []);
  return (await import(/* @vite-ignore */ file)) as ReactModule;
}

describe('react/i18n.tsx (Mutationen)', () => {
  it('Ausgangslage: alle Regeln gelten', async () => {
    const m = await reactModule();
    const failed: string[] = [];
    for (const [name, rule] of Object.entries(REACT)) {
      beforeEachReset();
      if (!(await rule(m))) failed.push(name);
      cleanup();
    }
    expect(failed).toEqual([]);
  });
  it.each(REACT_MUTATIONS)('$name', async ({ rule, from, to }) => {
    const m = await reactModule([from, to]);
    beforeEachReset();
    expect(await REACT[rule](m), rule).toBe(false);
  });
});

function beforeEachReset() {
  __resetForTests();
  registerLocale('de', de);
  setLocale('en');
  document.body.replaceChildren();
}
