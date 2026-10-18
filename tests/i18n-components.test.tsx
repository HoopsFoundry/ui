// Komponenten mit den bisher offenen Schlüsseln (Modal, Tabs, AppNav, BottomNav, Breadcrumbs, Stepper, Skeleton, PlayByPlay, PlayerCard, Accordion):
// Texte in en und de (de Zeichen für Zeichen wie vorher), Vorrang der Überschreib-Eigenschaften, Sprachwechsel zur Laufzeit ohne Zustandsverlust,
// und zwar in Svelte und React. Die Prüfung der übrigen Komponenten steht in tests/parity-i18n.test.ts.
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { flushSync, mount, unmount } from 'svelte';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetForTests, registerLocale, setLocale, setTexts } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';
import { Accordion } from '../react/Accordion';
import { AccordionItem } from '../react/AccordionItem';
import { AppNav } from '../react/AppNav';
import { BottomNav } from '../react/BottomNav';
import { Breadcrumbs } from '../react/Breadcrumbs';
import { Modal } from '../react/Modal';
import { PlayByPlay } from '../react/PlayByPlay';
import { PlayerCard } from '../react/PlayerCard';
import { Skeleton } from '../react/Skeleton';
import { Stepper } from '../react/Stepper';
import { Tabs } from '../react/Tabs';
import Host from './helpers/I18nComponents.svelte';

const STEPS = [{ id: 'a', label: 'Eins', state: 'done' as const }, { id: 'b', label: 'Zwei', state: 'current' as const }, { id: 'c', label: 'Drei', state: 'pending' as const }];
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

// Erwartete Texte je Sprache (de wie vor der Umstellung, en aus dem Katalog)
const TEXT = {
  en: { close: 'Close', tabs: 'Tabs', nav: 'Main navigation', menu: 'Menu', crumbs: 'Breadcrumb', progress: 'Progress', loading: 'Loading …', pbp: 'Play-by-play · newest first', home: 'Home:', score: 'Score 2 to 0', captain: 'Captain', height: '188 cm', done: '(done)', current: '(current)', pending: '(pending)', step: '1. Eins', expand: 'Expand all', collapse: 'Collapse all', sections: 'Sections' },
  de: { close: 'Schließen', tabs: 'Tabs', nav: 'Hauptnavigation', menu: 'Menü', crumbs: 'Breadcrumb', progress: 'Fortschritt', loading: 'Lädt …', pbp: 'Play-by-Play · neueste oben', home: 'Heim:', score: 'Spielstand 2 zu 0', captain: 'Kapitän', height: '188 cm', done: '(erledigt)', current: '(aktuell)', pending: '(ausstehend)', step: '1. Eins', expand: 'Alle öffnen', collapse: 'Alle schließen', sections: 'Bereiche' },
} as const;

beforeEach(() => {
  __resetForTests();
  registerLocale('de', de);
  setLocale('en');
  document.body.replaceChildren();
});
afterEach(() => {
  cleanup();
  __resetForTests();
  registerLocale('de', de);
  setLocale('de');
});

const label = (name: string) => document.querySelector(`[aria-label="${name}"]`);
const labelsOf = () => [...document.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label'));
const textOf = () => document.body.textContent ?? '';

function ReactPage({ over = {} as Record<string, string>, withModal = true }) {
  return createElement('div', null,
    withModal ? createElement(Modal, { open: true, onOpenChange: () => {}, title: 'Titel', closeLabel: over.closeLabel }, 'Inhalt') : null,
    createElement(Tabs, { items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], defaultValue: 'b', ariaLabel: over.tabs }),
    createElement(Stepper, { steps: STEPS, onStep: () => {}, ariaLabel: over.stepper }),
    createElement(Accordion, { expandAll: true, nav: true, navLabel: over.accordion }, createElement(AccordionItem, { id: 'x', title: 'X', defaultOpen: true }, 'Text'), createElement(AccordionItem, { id: 'y', title: 'Y' }, 'Text')),
    createElement(AppNav, { items: [{ id: 'a', label: 'A', href: '/a' }], ariaLabel: over.appnav, menuLabel: over.menu }),
    createElement(BottomNav, { items: [{ id: 'a', label: 'A', href: '/a' }], ariaLabel: over.bottomnav }),
    createElement(Breadcrumbs, { items: [{ label: 'A', href: '/a' }, { label: 'B' }], ariaLabel: over.breadcrumbs }),
    createElement(Skeleton, { label: over.skeleton }),
    createElement(PlayByPlay, { events: [{ id: 1, time: '9:12', team: 'heim', title: 'Korb', score: { heim: 2, gast: 0 } }], title: over.pbp }),
    createElement(PlayerCard, { jersey: 7, name: 'Pat', captain: true, heightCm: '188' }),
  );
}

type Fassung = { name: string; mount: (over?: Record<string, string>, withModal?: boolean) => { root: ParentNode; stop: () => Promise<void>; flush: () => Promise<void>; tabValue: () => string | null } };
const FASSUNGEN: Fassung[] = [
  {
    name: 'React',
    mount: (over, withModal = true) => {
      const view = render(createElement(ReactPage, { over, withModal }));
      return { root: document, stop: async () => view.unmount(), flush: async () => {}, tabValue: () => document.querySelector('[role=tab][aria-selected=true]')?.textContent?.trim() ?? null };
    },
  },
  {
    name: 'Svelte',
    mount: (over, withModal = true) => {
      const target = document.body.appendChild(document.createElement('div'));
      const app = mount(Host, { target, props: { over, withModal } });
      flushSync();
      return { root: document, stop: async () => { unmount(app); await settle(); }, flush: async () => { flushSync(); await settle(); }, tabValue: () => document.querySelector('[role=tab][aria-selected=true]')?.textContent?.trim() ?? null };
    },
  },
];

describe.each(FASSUNGEN)('$name: Texte der Bausteine mit den bisher offenen Schlüsseln', (fassung) => {
  for (const code of ['en', 'de'] as const) {
    it(`${code}: alle Texte stehen im Katalog (de wie vorher)`, async () => {
      setLocale(code);
      const t = TEXT[code];
      const page = fassung.mount();
      expect(label(t.close), 'Modal schließen').not.toBeNull();
      expect(label(t.tabs), 'Tabs').not.toBeNull();
      expect(label(t.nav), 'Hauptnavigation').not.toBeNull();
      expect(labelsOf().filter((l) => l === t.nav)).toHaveLength(2); // AppNav und BottomNav
      expect(label(t.crumbs), 'Breadcrumb').not.toBeNull();
      expect(label(t.progress), 'Stepper').not.toBeNull();
      expect(label(t.step), 'Schritt').not.toBeNull();
      expect(label(t.pbp), 'Play-by-Play').not.toBeNull();
      expect(label(t.sections), 'Sprungleiste').not.toBeNull();
      const all = textOf();
      for (const word of [t.menu, t.loading, t.home, t.score, t.captain, t.height, t.done, t.current, t.pending, t.expand, t.collapse]) expect(all, word).toContain(word);
      await page.stop();
    });
  }

  it('Überschreib-Eigenschaften haben Vorrang vor Katalog, texts und setTexts', async () => {
    setLocale('de');
    setTexts({ 'modal.close': 'Global', 'tabs.label': 'Global', 'appnav.label': 'Global', 'appnav.menu': 'Global', 'bottomnav.label': 'Global', 'breadcrumbs.label': 'Global', 'stepper.label': 'Global', 'skeleton.loading': 'Global', 'playbyplay.title': 'Global', 'accordion.nav': 'Global' });
    const over = { closeLabel: 'Zu', tabs: 'Reiter', appnav: 'Haupt', menu: 'Mehr', bottomnav: 'Unten', breadcrumbs: 'Pfad', stepper: 'Schritte', skeleton: 'Warten', pbp: 'Ticker', accordion: 'Teile' };
    const page = fassung.mount(over);
    for (const text of ['Zu', 'Reiter', 'Haupt', 'Unten', 'Pfad', 'Schritte', 'Ticker', 'Teile']) expect(label(text), text).not.toBeNull();
    expect(textOf()).toContain('Mehr');
    expect(textOf()).toContain('Warten');
    expect(textOf()).not.toContain('Global');
    expect(labelsOf()).not.toContain('Global');
    await page.stop();
  });

  it('globale Texte (setTexts) schlagen den Katalog', async () => {
    setTexts({ 'modal.close': 'Dicht' });
    const page = fassung.mount();
    expect(label('Dicht')).not.toBeNull();
    await page.stop();
  });

  it('Sprachwechsel zur Laufzeit ändert die Beschriftungen und behält Auswahl, offene Zustände und Fokus', async () => {
    const page = fassung.mount(undefined, false);
    const tabB = [...document.querySelectorAll<HTMLElement>('[role=tab]')].find((el) => el.textContent?.trim() === 'B')!;
    tabB.focus();
    const trigger = document.querySelector<HTMLButtonElement>('[id="x-trigger"]')!;
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const statusBefore = document.querySelector('[aria-live]')?.textContent ?? '';

    act(() => setLocale('de'));
    await page.flush();

    expect(label('Fortschritt')).not.toBeNull();
    expect(label('Bereiche')).not.toBeNull();
    expect(textOf()).toContain('Alle öffnen');
    // nichts wurde zurückgesetzt: gleiche Elemente, gleiche Auswahl, derselbe offene Bereich, derselbe Fokus
    expect(document.querySelector('[id="x-trigger"]')).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(page.tabValue()).toBe('B');
    expect(document.activeElement).toBe(tabB);
    // keine Ansage: der Text der Live-Region ändert sich nicht
    expect(document.querySelector('[aria-live]')?.textContent ?? '').toBe(statusBefore);

    act(() => setLocale('en'));
    await page.flush();
    expect(label('Progress')).not.toBeNull();
    expect(page.tabValue()).toBe('B');
    expect(document.activeElement).toBe(tabB);
    await page.stop();
  });

  it('Modal: Sprachwechsel lässt es offen, der Fokus bleibt im Dialog und der Name des Schließen-Knopfs folgt', async () => {
    const page = fassung.mount();
    const close = () => document.querySelector<HTMLElement>('.hoops-m-close')!;
    const button = close();
    button.focus();
    expect(document.activeElement).toBe(button);
    act(() => setLocale('de'));
    await page.flush();
    expect(close()).toBe(button);
    expect(button.getAttribute('aria-label')).toBe('Schließen');
    expect(document.activeElement).toBe(button);
    expect(document.querySelector('.hoops-modal')).not.toBeNull();
    act(() => setLocale('en'));
    await page.flush();
    expect(button.getAttribute('aria-label')).toBe('Close');
    await page.stop();
  });

  it('Bedienung nach dem Sprachwechsel: Klick auf „Alle schließen“ meldet in der neuen Sprache', async () => {
    setLocale('de');
    const page = fassung.mount(undefined, false);
    act(() => setLocale('en'));
    await page.flush();
    const button = [...document.querySelectorAll('button')].find((b) => b.textContent === 'Collapse all')!;
    await act(async () => { fireEvent.click(button); });
    await page.flush();
    expect(document.querySelector('[aria-live]')?.textContent).toBe('All sections closed');
    await page.stop();
  });
});

describe.each(FASSUNGEN)('$name: Modal trägt lang bei abweichender Sprache', (fassung) => {
  it('lang am Dialog nur, wenn die Sprache der Seite eine andere ist', async () => {
    document.documentElement.lang = 'de';
    const page = fassung.mount();
    const dialog = document.querySelector('.hoops-modal')!;
    const holder = dialog.closest('[lang]');
    expect(holder?.getAttribute('lang')).toBe('en');
    act(() => setLocale('de'));
    await page.flush();
    expect(document.querySelector('.hoops-modal')!.closest('[lang]')?.getAttribute('lang') === 'en').toBe(false);
    document.documentElement.removeAttribute('lang');
    await page.stop();
  });
});

describe('React: lang an der Wurzel bei abweichender Sprache', () => {
  it('Stepper und Skeleton setzen lang, wenn die Seite eine andere Sprache hat', () => {
    document.documentElement.lang = 'de';
    render(createElement('div', null, createElement(Stepper, { steps: STEPS }), createElement(Skeleton, {})));
    expect(document.querySelector('ol.hoops-step')!.getAttribute('lang')).toBe('en');
    expect(document.querySelector('[role=status]')!.getAttribute('lang')).toBe('en');
    cleanup();
    act(() => setLocale('de'));
    render(createElement(Stepper, { steps: STEPS }));
    expect(document.querySelector('ol.hoops-step')!.hasAttribute('lang')).toBe(false);
    document.documentElement.removeAttribute('lang');
  });
});
