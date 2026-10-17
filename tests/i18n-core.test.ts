// @vitest-environment node
// Kern der Internationalisierung (js/i18n/index.js, format.js): Standardsprache, Rückfallkette, Platzhalter, Mehrzahl, Abonnenten.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as i18n from '../js/i18n/index.js';
import { formatCoords, formatNumber } from '../js/i18n/format.js';

const { t, setLocale, getLocale, registerLocale, setTexts, subscribe, localeOf, availableLocales } = i18n;

beforeEach(() => {
  i18n.__resetForTests();
  registerLocale('en', { 'x.hello': 'Hello', 'x.only-en': 'Only English', 'x.name': 'Hi {name}, {name}!', 'x.items': { one: '{count} item', other: '{count} items' } });
  registerLocale('de', { 'x.hello': 'Hallo', 'x.base': 'Basis', 'x.items': { one: '{count} Eintrag', other: '{count} Einträge' } });
  registerLocale('de-AT', { 'x.hello': 'Servus' });
});
afterEach(() => vi.restoreAllMocks());

describe('Standardsprache und Auswahl', () => {
  it('Standard ist Englisch', () => {
    expect(getLocale()).toBe('en');
    expect(t('x.hello')).toBe('Hello');
  });
  it('setLocale schaltet auf einen registrierten Katalog', () => {
    setLocale('de');
    expect(getLocale()).toBe('de');
    expect(t('x.hello')).toBe('Hallo');
  });
  it('de-AT bleibt erhalten und gewinnt vor der Basissprache', () => {
    setLocale('de-AT');
    expect(getLocale()).toBe('de-AT');
    expect(t('x.hello')).toBe('Servus');
  });
  it('availableLocales nennt die registrierten Codes', () => {
    expect(availableLocales().sort()).toEqual(['de', 'de-AT', 'en']);
  });
  it('localeOf: Option vor globaler Sprache', () => {
    expect(localeOf()).toBe('en');
    expect(localeOf({})).toBe('en');
    setLocale('de');
    expect(localeOf()).toBe('de');
    expect(localeOf({ locale: 'en' })).toBe('en');
  });
});

describe('Rückfallkette', () => {
  it('Überschreibung je Aufruf schlägt alles', () => {
    setLocale('de-AT');
    setTexts({ 'x.hello': 'global' });
    expect(t('x.hello', undefined, { texts: { 'x.hello': 'lokal' } })).toBe('lokal');
  });
  it('globale Überschreibung schlägt den Katalog', () => {
    setLocale('de');
    setTexts({ 'x.hello': 'global' });
    expect(t('x.hello')).toBe('global');
  });
  it('Katalog der Sprache, dann Basissprache (de-AT → de), dann en', () => {
    setLocale('de-AT');
    expect(t('x.hello')).toBe('Servus');
    expect(t('x.base')).toBe('Basis');
    expect(t('x.only-en')).toBe('Only English');
  });
  it('options.locale wählt die Sprache für diesen Aufruf', () => {
    expect(t('x.hello', undefined, { locale: 'de' })).toBe('Hallo');
    expect(getLocale()).toBe('en');
  });
  it('unbekannte Sprache fällt auf en zurück', () => {
    setLocale('xx');
    expect(t('x.hello')).toBe('Hello');
  });
  it('setTexts({}) löscht die Überschreibungen, setTexts ersetzt die vorherigen', () => {
    setTexts({ 'x.hello': 'a' });
    setTexts({ 'x.base': 'b' });
    expect(t('x.hello')).toBe('Hello');
    setTexts({ 'x.hello': 'a' });
    setTexts({});
    expect(t('x.hello')).toBe('Hello');
  });
  it('Mehrzahlobjekte dürfen überschrieben werden', () => {
    setTexts({ 'x.items': { one: 'ein Ding', other: '{count} Dinge' } });
    expect(t('x.items', { count: 1 })).toBe('ein Ding');
    expect(t('x.items', { count: 3 })).toBe('3 Dinge');
  });
});

describe('fehlender Schlüssel', () => {
  it('gibt den Schlüssel zurück und warnt genau einmal je Schlüssel', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('x.missing')).toBe('x.missing');
    expect(t('x.missing')).toBe('x.missing');
    expect(warn).toHaveBeenCalledTimes(1);
    t('x.missing-two');
    expect(warn).toHaveBeenCalledTimes(2);
  });
  it('warnt in der Produktion nicht', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(t('x.missing-prod')).toBe('x.missing-prod');
    } finally {
      process.env.NODE_ENV = before;
    }
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('Platzhalter', () => {
  it('ersetzt jeden Vorkommen', () => {
    expect(t('x.name', { name: 'Ada' })).toBe('Hi Ada, Ada!');
  });
  it('fehlender Parameter lässt den Platzhalter stehen', () => {
    expect(t('x.name')).toBe('Hi {name}, {name}!');
    expect(t('x.name', { name: null as unknown as string })).toBe('Hi {name}, {name}!');
  });
  it('Zahlen werden zu Text', () => {
    registerLocale('en', { 'x.n': 'Value {n}' });
    expect(t('x.n', { n: 0 })).toBe('Value 0');
  });
});

describe('Mehrzahl', () => {
  it('en: one und other', () => {
    expect(t('x.items', { count: 1 })).toBe('1 item');
    expect(t('x.items', { count: 0 })).toBe('0 items');
    expect(t('x.items', { count: 2 })).toBe('2 items');
  });
  it('de: one und other', () => {
    setLocale('de');
    expect(t('x.items', { count: 1 })).toBe('1 Eintrag');
    expect(t('x.items', { count: 5 })).toBe('5 Einträge');
  });
  it('Katalog mit few (Polnisch)', () => {
    registerLocale('pl', { 'x.items': { one: '{count} rzecz', few: '{count} rzeczy', many: '{count} rzeczy (many)', other: '{count} rzeczy (other)' } });
    setLocale('pl');
    expect(t('x.items', { count: 1 })).toBe('1 rzecz');
    expect(t('x.items', { count: 3 })).toBe('3 rzeczy');
    expect(t('x.items', { count: 5 })).toBe('5 rzeczy (many)');
    expect(t('x.items', { count: 1.5 })).toBe('1.5 rzeczy (other)');
  });
  it('fehlende Kategorie gilt als other', () => {
    registerLocale('pl', { 'x.items': { one: '{count} rzecz', other: '{count} rzeczy' } });
    expect(t('x.items', { count: 3 }, { locale: 'pl' })).toBe('3 rzeczy');
  });
  it('ohne Zahl gilt other', () => {
    expect(t('x.items')).toBe('{count} items');
  });
});

describe('Abonnenten', () => {
  it('subscribe ruft bei setLocale, registerLocale und setTexts und meldet sich ab', () => {
    const fn = vi.fn();
    const off = subscribe(fn);
    setLocale('de');
    expect(fn).toHaveBeenLastCalledWith('de');
    registerLocale('fr', { 'x.hello': 'Bonjour' });
    expect(fn).toHaveBeenCalledTimes(2);
    setTexts({ 'x.hello': 'a' });
    expect(fn).toHaveBeenCalledTimes(3);
    off();
    setLocale('en');
    setTexts({});
    expect(fn).toHaveBeenCalledTimes(3);
  });
  it('ein Abonnent, der sich im Aufruf abmeldet, stört die anderen nicht', () => {
    const second = vi.fn();
    const off = subscribe(() => off());
    subscribe(second);
    setLocale('de');
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('Formatierung', () => {
  it('formatNumber folgt der Sprache', () => {
    expect(formatNumber(1234.5)).toBe('1,234.5');
    setLocale('de');
    expect(formatNumber(1234.5)).toBe('1.234,5');
    expect(formatNumber(1234.5, undefined, { locale: 'en' })).toBe('1,234.5');
    expect(formatNumber(0.5, { style: 'percent' }, { locale: 'en' })).toBe('50%');
  });
  it('formatCoords: Richtungen aus dem Katalog, Zahlformat aus der Sprache', () => {
    registerLocale('en', { 'common.direction.n': 'N', 'common.direction.e': 'E', 'common.direction.s': 'S', 'common.direction.w': 'W' });
    registerLocale('de', { 'common.direction.n': 'N', 'common.direction.e': 'O', 'common.direction.s': 'S', 'common.direction.w': 'W' });
    expect(formatCoords(49.4875, 8.466)).toBe('49.4875° N, 8.4660° E');
    expect(formatCoords(-33.5, -70.25, { locale: 'de' })).toBe('33,5000° S, 70,2500° W');
    expect(formatCoords(49.4875, 8.466, { locale: 'de' })).toBe('49,4875° N, 8,4660° O');
  });
  it('formatCoords: Null und −0 sind N und E, ungültig ergibt leer', () => {
    registerLocale('en', { 'common.direction.n': 'N', 'common.direction.e': 'E', 'common.direction.s': 'S', 'common.direction.w': 'W' });
    expect(formatCoords(0, -0)).toBe('0.0000° N, 0.0000° E');
    expect(formatCoords(-0.00001, 0)).toBe('0.0000° N, 0.0000° E');
    expect(formatCoords(91, 0)).toBe('');
    expect(formatCoords(NaN, 0)).toBe('');
  });
});
