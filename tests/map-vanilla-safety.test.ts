// @vitest-environment jsdom
// Sicherheit der Karte im DOM (mountMap, initMap, update): Schadtext in jedem Freitextfeld, Schadwerte in jedem Aufzählungsfeld und
// unsichere Ziele ergeben nie ausführbares Markup; geprüft am lebenden DOM nach Aufbau, Laden und Aktualisieren. Leaflet ist gespielt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initMap, mountMap } from '../js/map-vanilla.js';
import { safeHref } from '../js/url.js';
import { FIXTURES, poison, poisonEnums } from './helpers/render-fixtures';
import { reset, state } from './helpers/leaflet-mock';

const ALLOWED_TAGS = new Set(['div', 'span', 'a', 'p', 'ol', 'li', 'button', 'svg', 'path', 'circle', 'text']);
const BASE = FIXTURES.renderMap;
const PAYLOADS = ['"><img src=x onerror=alert(1)>', '</script><script>alert(1)</script>', `' onmouseover='alert(1)`, 'a\u0000b\u0001<b>', '<!-- x --><![CDATA[y]]>', '__proto__', 'constructor'];
const GEO = /^geo:-?\d+(\.\d+)?,-?\d+(\.\d+)?\?q=-?\d+(\.\d+)?,-?\d+(\.\d+)?(\((%[0-9A-F]{2}|[A-Za-z0-9._~-])*\))?$/;

/** Verstöße im lebenden DOM: fremde Elemente, Ereignis-Attribute, gefährliche Ziele, freie Styles. */
function violations(root: Element): string[] {
  const out: string[] = [];
  for (const el of root.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) out.push(`Element ${tag}`);
    for (const a of el.attributes) {
      const name = a.name.toLowerCase();
      const value = a.value.replace(/[\u0000- \u007f- ]/g, '').toLowerCase();
      if (name.startsWith('on')) out.push(`Ereignis-Attribut ${name}`);
      if (['srcdoc', 'formaction', 'action', 'xlink:href', 'data-dss-style'].includes(name)) out.push(`Attribut ${name}`);
      if ((name === 'href' || name === 'src') && /^(javascript|data|vbscript):/.test(value)) out.push(`${name}=${value.slice(0, 30)}`);
      if (name === 'href' && !a.value.startsWith('#') && !GEO.test(a.value) && safeHref(a.value) === undefined) out.push(`unsicherer href ${value.slice(0, 30)}`);
    }
  }
  return out;
}
const ok = (root: Element) => expect(violations(root)).toEqual([]);

let host: HTMLElement;
beforeEach(() => {
  reset();
  host = document.createElement('div');
  document.body.append(host);
  window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('mountMap: Schadtext in jedem Textfeld', () => {
  it.each(PAYLOADS)('Platzhalter, Laden und Aktualisieren bleiben sauber: %j', async (payload) => {
    const props = poison({ ...BASE, load: 'auto' }, payload, 'javascript:alert(1)') as Record<string, unknown>;
    const handle = mountMap(host, props as never, { uid: payload as never });
    ok(host);
    await vi.waitFor(() => expect(state.maps.length + (host.querySelector('.dss-map')!.getAttribute('data-state') === 'error' ? 1 : 0)).toBeGreaterThan(0));
    ok(host);
    handle.update(poison({ ...BASE, markers: [{ id: 'z', lat: 49.4, lng: 8, label: payload, href: 'javascript:alert(1)', kind: 'place' }] }, payload, 'javascript:alert(1)') as never);
    ok(host);
    // geprüft wird am DOM: die Zeichen stehen als Text oder Attributwert da, es entstehen keine Elemente
    expect(document.querySelectorAll('script, img')).toHaveLength(0);
    handle.destroy();
  });
  it('Marker mit javascript:- und data:-Zielen: kein Link in der Liste, am Marker kein Ziel', async () => {
    const markers = [
      { id: 'a', lat: 49.3, lng: 7.9, label: 'A', href: 'javascript:alert(1)' },
      { id: 'b', lat: 49.31, lng: 7.91, label: 'B', href: ' javascript:alert(1)' },
      { id: 'c', lat: 49.32, lng: 7.92, label: 'C', href: 'data:text/html,<script>1</script>' },
      { id: 'd', lat: 49.33, lng: 7.93, label: 'D', href: 'java\tscript:alert(1)' },
    ];
    mountMap(host, { label: 'K', markers, load: 'auto' } as never);
    await vi.waitFor(() => expect(state.markers).toHaveLength(4));
    expect(host.querySelectorAll('.dss-map-name a')).toHaveLength(0);
    ok(host);
  });
});

describe('Aufzählungsfelder mit Schadwert', () => {
  const BAD = ['"><img src=x onerror=alert(1)>', 'constructor', '__proto__', 'toString', 'hasOwnProperty'];
  it.each(BAD)('Schadwert %j: nur bekannte Werte erreichen Attribute und Klassen', async (bad) => {
    const props = poisonEnums({ ...BASE, load: 'click', markers: BASE.markers }, bad) as Record<string, unknown>;
    const handle = mountMap(host, props as never);
    const root = host.querySelector('.dss-map')!;
    expect(root.getAttribute('data-state')).toBe('idle');
    expect(root.getAttribute('data-tiles')).toBe('dim');
    expect(['true', 'false']).toContain(root.getAttribute('data-dim'));
    ok(host);
    expect(document.querySelectorAll('img')).toHaveLength(0);
    handle.update(poisonEnums({ ...BASE, load: 'auto' }, bad) as never);
    expect(root.getAttribute('data-tiles')).toBe('dim');
    expect(root.getAttribute('data-state')).toBe('idle');
    ok(host);
    // `appLinks` mit Schadwerten: keine App-Links
    expect(host.querySelectorAll('.dss-map-links a')).toHaveLength(0);
    for (const cls of root.className.split(/\s+/)) expect(cls).toMatch(/^[\w-]+$/);
  });
  it('kind mit Schadwert ergibt einen Ort (keine Klasse, kein Haus)', () => {
    mountMap(host, { label: 'K', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: 'A', kind: 'constructor' }, { id: 'b', lat: 49.31, lng: 7.91, label: 'B' }] } as never);
    expect(host.querySelectorAll('.dss-map-num.is-seat')).toHaveLength(0);
    expect([...host.querySelectorAll('.dss-map-num')].map((n) => n.textContent)).toEqual(['1', '2']);
  });
  it('className mit Schadtext bleibt eine Klasse: keine Elemente, keine Attribute', () => {
    const handle = mountMap(host, { label: 'K', markers: [], className: '"><img src=x onerror=1> a b' } as never);
    const root = host.querySelector('.dss-map')!;
    expect(root.querySelector('img')).toBeNull();
    expect(root.hasAttribute('onerror')).toBe(false);
    handle.update({ label: 'K', markers: [], className: ' ' } as never);
    expect(root.className).toBe('dss-map');
    handle.destroy();
  });
});

describe('Eingaben, die keine sind', () => {
  it('null, Zahl, Liste, Text als Eigenschaften und Optionen werfen nicht', () => {
    for (const props of [undefined, null, 0, 'x', [], [1, 2], true, () => 1]) {
      const el = document.createElement('div');
      document.body.append(el);
      expect(() => mountMap(el, props as never, props as never).destroy()).not.toThrow();
      const markup = document.createElement('div');
      document.body.append(markup);
      expect(() => initMap(markup, props as never).destroy()).not.toThrow();
    }
  });
  it('verschachtelte Unsinnswerte in markers werfen nicht', () => {
    const markers = [null, 1, 'x', [], {}, { lat: '49', lng: '7' }, { lat: Number.NaN, lng: 7 }, { id: {}, lat: 49, lng: 7, label: { a: 1 }, href: 5, number: '3', own: 'ja', kind: [] }];
    expect(() => mountMap(host, { label: 'K', markers } as never)).not.toThrow();
    expect(host.querySelectorAll('.dss-map-item')).toHaveLength(1);
    expect(host.querySelector('.dss-map-name')!.textContent).toBe('');
    ok(host);
  });
  it('Prototyp-Schlüssel in den Eigenschaften verschmutzen nichts', () => {
    const hostile = JSON.parse('{"__proto__": {"load": "auto", "polluted": true}, "constructor": {"prototype": {"polluted": true}}, "label": "K", "markers": [{"id": "a", "lat": 49.3, "lng": 7.9, "label": "H", "__proto__": {"href": "javascript:1"}}]}');
    const handle = mountMap(host, hostile);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('idle');
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    ok(host);
    handle.destroy();
  });
  it('100 000 Zeichen in jedem Feld: fertig, sauber', () => {
    const long = 'x'.repeat(100000);
    const props = poison(BASE, long, `/${long}`) as Record<string, unknown>;
    mountMap(host, props as never);
    ok(host);
    expect(host.querySelector('.dss-map-text')).not.toBeNull();
  });
});
