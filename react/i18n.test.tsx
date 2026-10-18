import { act, cleanup, render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetForTests, __subscriberCount, getLocale, getTexts, registerLocale, setLocale, setTexts } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';
import { HoopsProvider, useLocale } from './i18n';
import { useT } from './i18n';

// Sonde: liest Text, Mehrzahl und Sprache über die Hilfen der Grundlage
function Probe({ texts, name = 'probe' }: { texts?: Record<string, string>; name?: string }) {
  const { t, lang } = useT(texts);
  const locale = useLocale();
  return (
    <span data-name={name} lang={lang}>
      {t('modal.close')}|{t('team.squad.players', { count: 2 })}|{locale}
    </span>
  );
}
const text = (name = 'probe') => document.querySelector(`[data-name="${name}"]`)!.textContent;

beforeEach(() => {
  __resetForTests();
  registerLocale('de', de);
  setLocale('en');
});
afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('lang');
  __resetForTests();
  registerLocale('de', de);
  setLocale('de');
});

describe('HoopsProvider und useLocale', () => {
  it('ohne Anbieter gilt die globale Sprache und ein Sprachwechsel rendert neu', () => {
    render(<Probe />);
    expect(text()).toBe('Close|2 players|en');
    act(() => setLocale('de'));
    expect(text()).toBe('Schließen|2 Spieler|de');
  });
  it('Katalog und globale Texte lösen ebenfalls ein neues Rendern aus', () => {
    render(<Probe />);
    act(() => setTexts({ 'modal.close': 'Zu' }));
    expect(text()).toBe('Zu|2 players|en');
    act(() => {
      setTexts({});
      registerLocale('en', { 'modal.close': 'Shut', 'team.squad.players': { one: '{count} p', other: '{count} ps' } });
    });
    expect(text()).toBe('Shut|2 ps|en');
  });
  it('der Anbieter gilt im Teilbaum und ändert den globalen Zustand nicht', () => {
    render(
      <>
        <HoopsProvider locale="de" texts={{ 'modal.close': 'Zumachen' }}>
          <Probe name="drin" />
        </HoopsProvider>
        <Probe name="draussen" />
      </>,
    );
    expect(text('drin')).toBe('Zumachen|2 Spieler|de');
    expect(text('draussen')).toBe('Close|2 players|en');
    expect(getLocale()).toBe('en');
    expect(getTexts()).toEqual({});
  });
  it('Vorrang: Texte der Komponente vor Anbieter vor setTexts vor Katalog', () => {
    setTexts({ 'modal.close': 'Global' });
    render(
      <HoopsProvider locale="de" texts={{ 'modal.close': 'Anbieter' }}>
        <Probe name="eigen" texts={{ 'modal.close': 'Eigen' }} />
        <Probe name="anbieter" />
      </HoopsProvider>,
    );
    expect(text('eigen')).toMatch(/^Eigen\|/);
    expect(text('anbieter')).toMatch(/^Anbieter\|/);
    cleanup();
    render(
      <HoopsProvider locale="de">
        <Probe />
      </HoopsProvider>,
    );
    expect(text()).toMatch(/^Global\|/);
  });
  it('geschachtelte Anbieter: der innere gilt innen, Texte der äußeren gelten weiter', () => {
    render(
      <HoopsProvider locale="de" texts={{ 'modal.close': 'Außen' }}>
        <Probe name="aussen" />
        <HoopsProvider locale="en">
          <Probe name="innen" />
        </HoopsProvider>
        <HoopsProvider texts={{ 'modal.close': 'Innen' }}>
          <Probe name="nur-texte" />
        </HoopsProvider>
      </HoopsProvider>,
    );
    expect(text('aussen')).toBe('Außen|2 Spieler|de');
    expect(text('innen')).toBe('Außen|2 players|en');
    expect(text('nur-texte')).toBe('Innen|2 Spieler|de');
  });
  it('geänderte Eigenschaften des Anbieters wirken sofort', () => {
    const { rerender } = render(
      <HoopsProvider locale="en">
        <Probe />
      </HoopsProvider>,
    );
    expect(text()).toBe('Close|2 players|en');
    rerender(
      <HoopsProvider locale="de">
        <Probe />
      </HoopsProvider>,
    );
    expect(text()).toBe('Schließen|2 Spieler|de');
  });
});

describe('lang', () => {
  it('weicht die Sprache von der Seite ab, bekommt die Wurzel lang; sonst nicht', () => {
    document.documentElement.lang = 'de';
    render(<Probe />);
    expect(document.querySelector('[data-name="probe"]')!.getAttribute('lang')).toBe('en');
    act(() => setLocale('de'));
    expect(document.querySelector('[data-name="probe"]')!.hasAttribute('lang')).toBe(false);
  });
  it('documentLang des Anbieters gilt statt des Dokuments', () => {
    document.documentElement.lang = 'de';
    render(
      <HoopsProvider locale="en" documentLang="en">
        <Probe />
      </HoopsProvider>,
    );
    expect(document.querySelector('[data-name="probe"]')!.hasAttribute('lang')).toBe(false);
  });
});

describe('Abonnement ohne Leck', () => {
  it('nur solange eine Komponente lebt; 50 Wiederholungen ohne Zuwachs', () => {
    const before = __subscriberCount();
    for (let i = 0; i < 50; i++) {
      const a = render(<Probe />);
      const b = render(<Probe name="zwei" />);
      expect(__subscriberCount()).toBe(before + 1);
      a.unmount();
      expect(__subscriberCount()).toBe(before + 1);
      b.unmount();
      expect(__subscriberCount()).toBe(before);
    }
  });
  it('Server-Rendern abonniert nichts und liefert die Sprache des Anbieters', () => {
    const before = __subscriberCount();
    const html = renderToString(
      <HoopsProvider locale="de" documentLang="en">
        <Probe />
      </HoopsProvider>,
    );
    expect(html).toContain('Schließen');
    expect(html).toContain('lang="de"');
    expect(__subscriberCount()).toBe(before);
  });
  it('ein Sprachwechsel zwischen Rendern und Abonnieren geht nicht verloren', () => {
    const view = render(<Probe />);
    view.unmount();
    setLocale('de');
    render(<Probe />);
    expect(text()).toBe('Schließen|2 Spieler|de');
  });
});
