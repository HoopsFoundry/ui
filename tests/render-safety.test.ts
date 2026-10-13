// Sicherheit der Render-Funktionen: Schadtext in jedem Text-, jedem Link- und jedem Aufzählungsfeld ergibt nie ausführbares Markup;
// geprüft am geparsten DOM (keine Ereignis-Attribute, keine Skripte, keine `javascript:`-Ziele, kein freies CSS), nicht nur am Text.
import { describe, expect, it } from 'vitest';
import { attr, esc } from '../js/render/escape.js';
import { safeHref } from '../js/url.js';
import { FIXTURES, fn, poison } from './helpers/render-fixtures';

const ALLOWED_TAGS = new Set([
  'div', 'span', 'a', 'p', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'caption', 'button', 'small', 'svg', 'path', 'rect', 'circle', 'use', 'img', 'address',
]);
const STYLE = /^(--dss-map-h:\d+(\.\d+)?px|width: \d{1,4}(\.\d{1,3})?(px|%|rem|em|ch|vw);|left:[\d.]+%;top:[\d.]+%)$/;

/** Markup in ein Fragment parsen und auf Gefährliches prüfen; gibt die Verstöße zurück. */
function violations(html: string): string[] {
  const out: string[] = [];
  const range = document.createRange();
  range.selectNodeContents(document.body);
  const fragment = range.createContextualFragment(html);
  for (const el of fragment.querySelectorAll('*')) {
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) out.push(`Element ${tag}`);
    for (const attribute of el.attributes) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.replace(/[\u0000-\u0020\u007f-\u00a0]/g, '').toLowerCase();
      if (name.startsWith('on')) out.push(`Ereignis-Attribut ${name}`);
      if (['srcdoc', 'formaction', 'action', 'xlink:href'].includes(name)) out.push(`Attribut ${name}`);
      if ((name === 'href' || name === 'src') && /^(javascript|data|vbscript):/.test(value)) out.push(`${name}=${value.slice(0, 30)}`);
      if (name === 'href' && !value.startsWith('#') && safeHref(attribute.value) === undefined) out.push(`unsicherer href ${value.slice(0, 30)}`);
      if (name === 'style' && !STYLE.test(attribute.value)) out.push(`style=${attribute.value.slice(0, 50)}`);
    }
  }
  return out;
}

const PAYLOADS: Record<string, string> = {
  'Attribut ausbrechen': '"><img src=x onerror=alert(1)>',
  'Skript schließen': '</script><script>alert(1)</script>',
  'Apostroph und Ereignis': `' onmouseover='alert(1)`,
  Steuerzeichen: 'a\u0000b\u0001c\u0008d\u001fe\u007ff<b>',
  'Entitäten': '&lt;script&gt; &#60; &amp;',
  'Kommentar und CDATA': '<!-- x --><![CDATA[y]]>',
};

describe('esc und attr', () => {
  it('maskieren & < > " \' und entfernen Steuerzeichen', () => {
    expect(esc('<a href="x" onclick=\'y\'>&</a>')).toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    expect(esc('a\u0000b\u0008c\u007fd\te\nf')).toBe('abcd\te\nf');
    expect(attr('"x"')).toBe('&quot;x&quot;');
  });
  it('Nicht-Text ergibt leer, Zahlen werden Text', () => {
    for (const v of [null, undefined, {}, [], () => 1, Symbol('x'), true, Number.NaN, Infinity]) expect(esc(v)).toBe('');
    expect(esc(12.5)).toBe('12.5');
    expect(esc(0)).toBe('0');
  });
  it('lange Eingabe wird nicht gekürzt', () => {
    expect(esc('a'.repeat(100000))).toHaveLength(100000);
  });
});

describe.each(Object.keys(FIXTURES))('%s: Sicherheit', (name) => {
  const render = fn(name);
  it('Ausgangslage: die Beispieleingabe ist sauber', () => {
    const html = render(FIXTURES[name]);
    expect(html.length).toBeGreaterThan(40);
    expect(violations(html)).toEqual([]);
  });
  it.each(Object.entries(PAYLOADS))('Schadtext in jedem Textfeld: %s', (_label, payload) => {
    const html = render(poison(FIXTURES[name], payload, 'javascript:alert(1)'));
    expect(violations(html)).toEqual([]);
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('\u0000');
    expect(html).not.toMatch(/javascript:/i);
  });
  it.each(['javascript:alert(1)', ' javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x', '//evil.example/x'.replace('//', 'javascript://')])(
    'Link %j wird nicht ausgegeben',
    (link) => {
      const html = render(poison(FIXTURES[name], 'Text', link));
      expect(violations(html)).toEqual([]);
      expect(html.toLowerCase()).not.toContain('javascript:');
      expect(html.toLowerCase()).not.toContain('vbscript:');
      expect(html.toLowerCase()).not.toContain('data:text');
    },
  );
  it('100 000 Zeichen in jedem Text- und Linkfeld: fertig, ohne Verstöße', () => {
    const long = 'x'.repeat(100000);
    const html = render(poison(FIXTURES[name], long, `/${long}`));
    // die Form kennt nur S, N und U: ein langer Text ist dort keine Eingabe und ergibt nichts
    expect(html.length).toBeGreaterThanOrEqual(name === 'renderFormChips' ? 0 : 100000);
    expect(violations(html)).toEqual([]);
  });
  it('Prototyp-Schlüssel und -Werte: kein Fehler, nichts Undefiniertes im Markup', () => {
    const hostile = poison(FIXTURES[name], '__proto__', '/x');
    const withKeys = JSON.parse(JSON.stringify(hostile), (_k, v) => v);
    Object.assign(withKeys, JSON.parse('{"__proto__": {"title": "geerbt", "name": "geerbt"}, "constructor": {"prototype": {"polluted": true}}}'));
    for (const props of [hostile, withKeys, JSON.parse('{"__proto__": {"title": "x"}}')]) {
      const html = render(props);
      expect(html).not.toMatch(/undefined|\[object|function|NaN/);
      expect(violations(html)).toEqual([]);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it('kaputte Eingaben (null, Zahl, Liste, Text) werfen nicht', () => {
    for (const props of [undefined, null, 0, 'x', [], [1, 2], true, () => 1]) expect(() => render(props)).not.toThrow();
    const deep = poison(FIXTURES[name], 1, 1) as Record<string, unknown>;
    expect(() => render(deep)).not.toThrow();
    expect(() => render(Object.fromEntries(Object.keys(FIXTURES[name]).map((k) => [k, { x: [null, 1, {}] }])))).not.toThrow();
    expect(() => render(Object.fromEntries(Object.keys(FIXTURES[name]).map((k) => [k, [null, 'x', 5, { name: 5, id: {}, heim: 'x', opponent: [] }]])))).not.toThrow();
  });
});

describe('Aufzählungen: nur bekannte Werte erreichen das Markup', () => {
  it('Ton, Zustand, Größe, Dichte, Ebene und Namen aus Daten werden nicht in Klassen oder Elementnamen übernommen', () => {
    const bad = '"><x onload=1> constructor';
    const html = [
      fn('renderEmptyState')({ tone: bad, title: 'x', titleAs: bad }),
      fn('renderMatchCard')({ state: bad, names: bad, heim: { name: 'a' }, gast: { name: 'b' } }),
      fn('renderTable')({ density: bad, titleAs: bad, title: 'x', columns: [{ key: 'a', label: 'a', align: bad, sort: bad }] }),
      fn('renderLeagueCard')({ title: 'x', teams: [{ rank: 1, name: 'a', zone: bad }], size: bad, names: bad, columns: [bad, 'constructor'] }),
      fn('renderScheduleTable')({ games: [{ id: 'a', state: bad, at: bad, outcome: bad, heim: { name: 'a' }, gast: { name: 'b' } }], layout: bad, density: bad }),
      fn('renderTeamCard')({ name: 'x', size: bad, next: { opponent: { name: 'b' }, at: bad } }),
      fn('renderVenueCard')({ name: 'x', size: bad, load: bad }),
      fn('renderFormChips')({ form: ['S'], variant: bad }),
    ].join('');
    expect(html).not.toContain('onload');
    expect(html).not.toContain('<x ');
    expect(html).not.toContain('constructor');
    expect(violations(html)).toEqual([]);
  });
  it('titleAs: nur h2 bis h6; h1 und alles andere wird h3', () => {
    for (const [titleAs, tag] of [['h2', 'h2'], ['h6', 'h6'], ['h1', 'h3'], ['h7', 'h3'], ['div', 'h3'], [3, 'h3'], [undefined, 'h3']] as const) {
      const html = fn('renderEmptyState')({ title: 'x', titleAs });
      expect(html).toContain(`<${tag} class="dss-empty-title">`);
    }
  });
});
