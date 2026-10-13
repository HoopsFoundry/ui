// mountX: Markup per createContextualFragment (kein innerHTML), update mit Fokus und Zustand, Accordion-Anbindung, destroy ohne Reste.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountEmptyState } from '../js/render/empty-state.js';
import { mountLeagueCard } from '../js/render/league-card.js';
import { mountMatchCard } from '../js/render/match-card.js';
import { mountScheduleTable } from '../js/render/schedule.js';
import { mountTable } from '../js/render/table.js';
import { mountTeamCard } from '../js/render/team-card.js';
import { mountVenueCard } from '../js/render/venue-card.js';
import { mountStats } from '../js/render/stats.js';
import { mount } from '../js/render/mount.js';

const TEAMS = [
  { rank: 1, name: 'Lindenberg Hawks', href: '/teams/hawks', played: 11, points: 20 },
  { rank: 2, name: 'BG Seeberg', href: '/teams/seeberg', played: 11, points: 18 },
];
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
let host: HTMLElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
  window.history.replaceState(null, '', window.location.pathname); // ein Klick schreibt den Anker in die Adresse
});

/** Zählt offene Listener (add minus remove) je Ziel-Art und Ereignis; Fenster, Dokument und Elemente getrennt. */
function listenerLedger() {
  const live = new Map<string, number>();
  const proto = EventTarget.prototype;
  const add = proto.addEventListener;
  const remove = proto.removeEventListener;
  const key = (target: unknown, type: string) => `${target === window ? 'window' : target === document ? 'document' : 'element'} ${type}`;
  vi.spyOn(proto, 'addEventListener').mockImplementation(function (this: EventTarget, type: string, listener: never, options?: never) {
    live.set(key(this, type), (live.get(key(this, type)) ?? 0) + 1);
    return add.call(this, type, listener, options);
  } as never);
  vi.spyOn(proto, 'removeEventListener').mockImplementation(function (this: EventTarget, type: string, listener: never, options?: never) {
    live.set(key(this, type), (live.get(key(this, type)) ?? 0) - 1);
    return remove.call(this, type, listener, options);
  } as never);
  return { open: () => [...live].filter(([, n]) => n !== 0), total: () => [...live.values()].reduce((a, b) => a + Math.abs(b), 0) };
}

describe('mount: einsetzen', () => {
  it('setzt das Markup über createContextualFragment ein, nie über innerHTML', () => {
    const create = vi.spyOn(Range.prototype, 'createContextualFragment');
    const setter = vi.spyOn(Element.prototype, 'innerHTML', 'set');
    mountLeagueCard(host, { title: 'Oberliga', teams: TEAMS });
    expect(create).toHaveBeenCalledTimes(1);
    expect(setter).not.toHaveBeenCalled();
    expect(host.querySelector('h3.dss-league-title')?.textContent).toBe('Oberliga');
  });
  it('ersetzt den früheren Inhalt und stellt ihn bei destroy wieder her', () => {
    host.append(document.createRange().createContextualFragment('<p id="alt">Serverseitig gerendert</p>'));
    const handle = mountStats(host, { items: [{ label: 'Siege', value: 3 }] });
    expect(host.querySelector('#alt')).toBeNull();
    expect(host.querySelector('.dss-stat-value')?.textContent).toBe('3');
    handle.destroy();
    expect(host.querySelector('#alt')?.textContent).toBe('Serverseitig gerendert');
    expect(host.querySelector('.dss-stats')).toBeNull();
  });
  it('ein zweites mount auf demselben Element ersetzt das erste (ein Handler, keine Dopplung)', () => {
    const first = vi.fn();
    const second = vi.fn();
    mountEmptyState(host, { title: 'A', cta: 'Los' }, { onCta: first });
    mountEmptyState(host, { title: 'B', cta: 'Los' }, { onCta: second });
    click(host.querySelector('.dss-empty-actions button')!);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(host.querySelector('.dss-empty-title')?.textContent).toBe('B');
  });
  it('ohne Element, ohne document oder mit falscher Render-Funktion: ein Handle ohne Wirkung', () => {
    for (const handle of [mountStats(null as never, { items: [] }), mount(host, 'x' as never, {})]) {
      expect(() => handle.update({} as never)).not.toThrow();
      expect(() => handle.destroy()).not.toThrow();
    }
    expect(host.childNodes).toHaveLength(0);
  });
});

describe('update', () => {
  it('ersetzt den Inhalt zu den neuen Eigenschaften', () => {
    const handle = mountStats(host, { items: [{ label: 'Siege', value: 1 }] });
    handle.update({ items: [{ label: 'Siege', value: 2 }, { label: 'Niederlagen', value: 0 }] });
    expect([...host.querySelectorAll('.dss-stat-value')].map((el) => el.textContent)).toEqual(['2', '0']);
    handle.update({ items: [] });
    expect(host.childNodes).toHaveLength(0);
  });
  it('hält den Fokus: ein Link in der Tabelle behält ihn über die Lage, der Rahmenkopf über seine id', () => {
    const handle = mountLeagueCard(host, { title: 'Oberliga', teams: TEAMS });
    const link = host.querySelectorAll<HTMLAnchorElement>('a.dss-league-link')[1];
    link.focus();
    expect(document.activeElement).toBe(link);
    handle.update({ title: 'Oberliga', teams: TEAMS.map((t) => ({ ...t, played: 12 })) });
    const now = host.querySelectorAll<HTMLAnchorElement>('a.dss-league-link')[1];
    expect(now).not.toBe(link);
    expect(document.activeElement).toBe(now);
    expect(now.getAttribute('href')).toBe('/teams/seeberg');

    handle.update({ title: 'Oberliga', teams: TEAMS, collapsible: true, id: 'oberliga', open: true });
    const trigger = host.querySelector<HTMLButtonElement>('#oberliga-trigger')!;
    trigger.focus();
    handle.update({ title: 'Oberliga', teams: TEAMS.map((t) => ({ ...t, points: 99 })), collapsible: true, id: 'oberliga', open: true });
    expect(document.activeElement?.id).toBe('oberliga-trigger');
    expect(document.activeElement).toBe(host.querySelector('#oberliga-trigger'));
  });
  it('update nach destroy tut nichts', () => {
    const handle = mountStats(host, { items: [{ label: 'a', value: 1 }] });
    handle.destroy();
    handle.update({ items: [{ label: 'b', value: 2 }] });
    expect(host.childNodes).toHaveLength(0);
    expect(() => handle.destroy()).not.toThrow();
  });
});

describe('einklappbarer Rahmen: Accordion-Anbindung', () => {
  const props = { title: 'Oberliga', teams: TEAMS, collapsible: true, id: 'oberliga' };
  it('legt eine Gruppe an, öffnet und schließt per Klick und hält den Zustand bei update', () => {
    const handle = mountLeagueCard(host, props);
    const group = host.querySelector('.dss-acc');
    expect(group).not.toBeNull();
    const trigger = () => host.querySelector<HTMLButtonElement>('#oberliga-trigger')!;
    const panel = () => host.querySelector<HTMLElement>('#oberliga-panel')!;
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(panel().hidden).toBe(true);
    expect(panel().hasAttribute('inert')).toBe(true);
    click(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(panel().hidden).toBe(false);
    expect(host.querySelector('.dss-league')?.classList.contains('is-open')).toBe(true);
    // gleiche `open`-Eingabe: der Zustand im Dokument bleibt
    handle.update({ ...props, played: 5 } as never);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    // geänderte `open`-Eingabe: sie gilt
    handle.update({ ...props, open: false });
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    handle.update({ ...props, open: true });
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });
  it('steht el in einer Gruppe des Aufrufers, legt mount keine eigene an', () => {
    host.className = 'dss-acc';
    const a = document.createElement('div');
    const b = document.createElement('div');
    host.append(a, b);
    const one = mountTable(a, { title: 'Eins', collapsible: true, id: 'eins', rows: [['x']] });
    const two = mountTable(b, { title: 'Zwei', collapsible: true, id: 'zwei', rows: [['y']] });
    expect(host.querySelectorAll('.dss-acc')).toHaveLength(0); // keine zusätzliche Gruppe: el ist selbst eine
    expect(a.querySelector('.dss-acc')).toBeNull();
    one.destroy();
    two.destroy();
  });
  it('nicht einklappbar: keine Gruppe, kein Accordion-Zustand', () => {
    mountLeagueCard(host, { title: 'Oberliga', teams: TEAMS });
    expect(host.querySelector('.dss-acc')).toBeNull();
    expect(host.querySelector('.dss-acc-trigger')).toBeNull();
  });
  it('destroy räumt Gruppe und Listener auf', () => {
    const ledger = listenerLedger();
    const handle = mountLeagueCard(host, props);
    handle.update({ ...props, played: 3 } as never);
    expect(ledger.open().length).toBeGreaterThan(0); // das Verhalten hängt Listener an (Klick, Taste, hashchange)
    handle.destroy();
    expect(ledger.open()).toEqual([]);
    expect(host.querySelector('.dss-acc')).toBeNull();
  });
});

describe('Ereignisse', () => {
  it('EmptyState: onCta kommt vom Button, nach destroy nicht mehr', () => {
    const onCta = vi.fn();
    const handle = mountEmptyState(host, { title: 'Leer', cta: 'Los' }, { onCta });
    const button = host.querySelector('button')!;
    click(button);
    expect(onCta).toHaveBeenCalledTimes(1);
    handle.destroy();
    click(button);
    expect(onCta).toHaveBeenCalledTimes(1);
  });
  it('MatchCard: onClick macht die Karte zum Button; mit href bleibt es ein Link mit Handler', () => {
    const onClick = vi.fn();
    mountMatchCard(host, { heim: { name: 'A' }, gast: { name: 'B' } }, { onClick });
    const card = host.querySelector('.dss-match')!;
    expect(card.tagName).toBe('BUTTON');
    click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
    mountMatchCard(host, { heim: { name: 'A' }, gast: { name: 'B' }, href: '/spiele/1' }, { onClick });
    host.addEventListener('click', (event) => event.preventDefault()); // jsdom navigiert nicht
    expect(host.querySelector('.dss-match')?.tagName).toBe('A');
    click(host.querySelector('.dss-match')!);
    expect(onClick).toHaveBeenCalledTimes(2);
  });
  it('TeamCard: onClick macht den Namen zum Button', () => {
    const onClick = vi.fn();
    mountTeamCard(host, { name: 'Hawks' }, { onClick });
    const button = host.querySelector<HTMLButtonElement>('button.dss-team-link')!;
    expect(button.type).toBe('button');
    click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('weitere Funktionen', () => {
  it('mountScheduleTable reicht time und notice an die Render-Funktion', () => {
    mountScheduleTable(host, { games: [{ id: 'a', state: 'scheduled', time: '17:30', heim: { name: 'A' }, gast: { name: 'B' } }], layout: 'columns' }, {
      time: (g: { time?: string }) => `ab ${g.time}`, notice: () => 'Konflikt',
    } as never);
    expect(host.querySelector('.dss-sch-time')?.textContent).toBe('ab 17:30');
    expect(host.querySelector('.dss-sch-notice')?.textContent).toBe('Konflikt');
  });
  it('mountVenueCard zeigt den Platzhalter der Karte ohne Netz: kein img, kein Kachelbild, Schaltfläche bleibt', () => {
    mountVenueCard(host, { name: 'Halle', lat: 49.3, lng: 7.9, address: { street: 'Weg 1', city: 'Ort' } });
    expect(host.querySelector('.dss-map[data-state="idle"] .dss-map-load')?.textContent).toBe('Karte laden');
    expect(host.querySelector('.dss-map-canvas')).toBeNull();
    expect(host.querySelector('.dss-map img')).toBeNull();
    expect(host.querySelector('address')?.textContent).toBe('Weg 1Ort');
  });
});
