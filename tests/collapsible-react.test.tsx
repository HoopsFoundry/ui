// Einklappbare Rahmen in React (Table, ScheduleTable, ScheduleGrid, LeagueCard): Öffnen und Schließen, defaultOpen, kontrolliert,
// id + Anker, Gruppe (Sprungleiste, Alle öffnen, exclusive), Tastatur, Ebene, ohne title, axe.
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { createElement, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { Accordion, AccordionItem } from '../react/Accordion';
import { HeadingLevel } from '../react/HeadingLevel';
import { Table } from '../react/Table';
import { ScheduleTable } from '../react/ScheduleTable';
import { ScheduleGrid } from '../react/ScheduleGrid';
import { LeagueCard } from '../react/LeagueCard';
import { EmptyState } from '../react/EmptyState';

const games = [{ id: 'g1', state: 'scheduled', time: '19:00', heim: { name: 'Team A' }, gast: { name: 'Team B' } }] as never[];
const rasterGames = [{ id: 'r1', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'Team A' }, gast: { name: 'Team B' } }] as never[];
const teams = [{ rank: 1, name: 'Hawks', played: 1, points: 2 }];

type Frame = (props: Record<string, unknown>) => ReturnType<typeof createElement>;
const FRAMES: [string, Frame][] = [
  ['Table', (p) => <Table collapsible columns={[{ key: 'a', label: 'A' }]} {...p}><tr><td>x</td></tr></Table>],
  ['ScheduleTable', (p) => <ScheduleTable collapsible games={games} {...p} />],
  ['ScheduleGrid', (p) => <ScheduleGrid collapsible games={rasterGames} columns={[{ id: 'h1', label: 'Halle 1' }]} {...p} />],
  ['LeagueCard', (p) => <LeagueCard collapsible teams={teams} {...p} />],
];
const setHash = (h: string) => window.history.replaceState(null, '', h ? `/${h}` : '/');
const wait = (ms = 0) => act(() => new Promise<void>((r) => setTimeout(r, ms)));
const trig = (c: ParentNode, id: string) => c.querySelector<HTMLButtonElement>(`[id="${id}-trigger"]`)!;
const panel = (c: ParentNode, id: string) => c.querySelector<HTMLElement>(`[id="${id}-panel"]`)!;
const open = (c: ParentNode, id: string) => trig(c, id).getAttribute('aria-expanded') === 'true';

beforeEach(() => setHash(''));
afterEach(() => {
  cleanup();
  setHash('');
  vi.restoreAllMocks();
});

describe.each(FRAMES)('%s einklappbar', (name, Frame) => {
  it('Kopf: Überschrift mit Button (aria-expanded, aria-controls), Bereich geschlossen hidden und inert', () => {
    const { container } = render(<Frame id="x" title="Titel" />);
    const t = trig(container, 'x');
    expect(t.parentElement!.tagName).toBe('H3');
    expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(t.getAttribute('aria-controls')).toBe('x-panel');
    const p = panel(container, 'x');
    expect(p.hasAttribute('hidden')).toBe(true);
    expect(p.hasAttribute('inert')).toBe(true);
    expect(p.getAttribute('role')).toBeNull();
    expect(container.querySelector('#x')!.className).toContain('is-collapsible');
  });
  it('Klick öffnet und schließt; Anker wird gesetzt und wieder entfernt', () => {
    const { container } = render(<Frame id="x" title="Titel" />);
    fireEvent.click(trig(container, 'x'));
    expect(open(container, 'x')).toBe(true);
    expect(panel(container, 'x').hasAttribute('hidden')).toBe(false);
    expect(panel(container, 'x').hasAttribute('inert')).toBe(false);
    expect(window.location.hash).toBe('#x');
    expect(container.querySelector('#x')!.className).toContain('is-open');
    fireEvent.click(trig(container, 'x'));
    expect(open(container, 'x')).toBe(false);
    expect(window.location.hash).toBe('');
  });
  it('defaultOpen: startet offen, unkontrolliert bedienbar', () => {
    const { container } = render(<Frame id="x" title="Titel" defaultOpen />);
    expect(open(container, 'x')).toBe(true);
    fireEvent.click(trig(container, 'x'));
    expect(open(container, 'x')).toBe(false);
  });
  it('kontrolliert: open + onOpenChange, ohne Zustandsänderung bleibt der Rahmen stehen', () => {
    const change = vi.fn();
    const { container, rerender } = render(<Frame id="x" title="Titel" open={false} onOpenChange={change} />);
    fireEvent.click(trig(container, 'x'));
    expect(change).toHaveBeenCalledWith(true);
    expect(open(container, 'x')).toBe(false);
    rerender(<Frame id="x" title="Titel" open onOpenChange={change} />);
    expect(open(container, 'x')).toBe(true);
  });
  it('Anker beim Laden öffnet den Rahmen, hashchange auch', async () => {
    setHash('#x');
    const { container } = render(<Frame id="x" title="Titel" />);
    await wait(10);
    expect(open(container, 'x')).toBe(true);
    fireEvent.click(trig(container, 'x'));
    setHash('#x');
    act(() => {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(open(container, 'x')).toBe(true);
  });
  it('ohne id: kein Anker, kein id-Attribut, ids von Kopf und Bereich bleiben verbunden', () => {
    const { container } = render(<Frame title="Titel" />);
    const t = container.querySelector<HTMLButtonElement>('.dss-acc-trigger')!;
    fireEvent.click(t);
    expect(window.location.hash).toBe('');
    expect(container.querySelector('.is-collapsible')!.hasAttribute('id')).toBe(false);
    expect(document.getElementById(t.getAttribute('aria-controls')!)).not.toBeNull();
  });
  it('ohne title: wirkungslos mit Warnung nur in der Entwicklung (einmal)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Frame id="x" />);
    expect(container.querySelector('.dss-acc-trigger')).toBeNull();
    expect(container.querySelector('.is-collapsible')).toBeNull();
    expect(warn.mock.calls.length).toBeLessThanOrEqual(1);
  });
  it('Ebene: titleAs, HeadingLevel und Inhalt eine Ebene tiefer', () => {
    const { container } = render(
      <HeadingLevel level={2}>
        <Frame id="x" title="Titel" defaultOpen />
      </HeadingLevel>,
    );
    expect(trig(container, 'x').parentElement!.tagName).toBe('H2');
    const own = render(<Frame id="y" title="Titel" titleAs="h5" />);
    expect(trig(own.container, 'y').parentElement!.tagName).toBe('H5');
  });
  it('Inhalt bekommt Titelebene + 1 (EmptyState im Bereich)', () => {
    const Inner = (p: Record<string, unknown>) =>
      name === 'Table' ? <Table collapsible id="z" title="Titel" columns={[{ key: 'a', label: 'A' }]} defaultOpen {...p}><tr><td><EmptyState title="leer" /></td></tr></Table> : null;
    if (name !== 'Table') return;
    const { container } = render(<Inner titleAs="h3" />);
    expect(container.querySelector('#z-panel h4')).not.toBeNull();
  });
  it('einzelner Rahmen in einem AccordionItem zählt die Ebene hoch', () => {
    const { container } = render(
      <AccordionItem id="item" title="Außen" defaultOpen>
        <Frame id="in" title="Innen" defaultOpen />
      </AccordionItem>,
    );
    expect(container.querySelector('[id="item-trigger"]')!.parentElement!.tagName).toBe('H3');
    expect(trig(container, 'in').parentElement!.tagName).toBe('H4');
  });
  it('keine Verstöße: heading-order, aria-valid-attr-value, aria-allowed-attr, nested-interactive, landmark-unique', async () => {
    const { container } = render(
      <main>
        <h1>Seite</h1>
        <h2>Abschnitt</h2>
        <Frame id="x" title="Titel A" meta="Info" defaultOpen />
        <Frame id="y" title="Titel B" />
      </main>,
    );
    const result = await axe.run(container, { runOnly: ['heading-order', 'aria-valid-attr-value', 'aria-allowed-attr', 'nested-interactive', 'landmark-unique', 'aria-required-attr'] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 80)).join(' | ')}`)).toEqual([]);
  });
});

describe('Rahmen in einer Accordion-Gruppe', () => {
  const Group = (p: Record<string, unknown>) => (
    <Accordion syncHash={false} {...p}>
      <Table collapsible id="t1" title="Eins" columns={[{ key: 'a', label: 'A' }]}><tr><td>x</td></tr></Table>
      <LeagueCard collapsible id="t2" title="Zwei" teams={teams} />
      <AccordionItem id="t3" title="Drei">Text</AccordionItem>
      <ScheduleGrid collapsible title="Vier ohne id" games={rasterGames} columns={[{ id: 'h1', label: 'Halle 1' }]} />
    </Accordion>
  );
  it('Sprungleiste: Links nur für Rahmen und Bereiche mit id; Klick öffnet und fokussiert den Kopf', async () => {
    const { container } = render(<Group nav />);
    await wait(10);
    const links = [...container.querySelectorAll('.dss-acc-nav-link')].map((a) => a.textContent);
    expect(links).toEqual(['Eins', 'Zwei', 'Drei']);
    fireEvent.click(container.querySelector<HTMLAnchorElement>('a[href="#t2"]')!);
    await wait(10);
    expect(open(container, 't2')).toBe(true);
    expect(document.activeElement).toBe(trig(container, 't2'));
    expect(container.querySelector('a[href="#t2"]')!.getAttribute('aria-current')).toBe('true');
  });
  it('Alle öffnen und Alle schließen betreffen Rahmen und Bereiche (auch ohne id)', async () => {
    const { container, getByText } = render(<Group expandAll />);
    await wait(10);
    fireEvent.click(getByText('Alle öffnen'));
    expect(open(container, 't1') && open(container, 't2') && open(container, 't3')).toBe(true);
    expect([...container.querySelectorAll('.dss-acc-trigger')].every((b) => b.getAttribute('aria-expanded') === 'true')).toBe(true);
    fireEvent.click(getByText('Alle schließen'));
    expect([...container.querySelectorAll('.dss-acc-trigger')].every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
  });
  it('exclusive: ein Öffnen schließt die anderen, gemischt mit AccordionItem', async () => {
    const { container } = render(<Group exclusive />);
    await wait(10);
    fireEvent.click(trig(container, 't1'));
    fireEvent.click(trig(container, 't3'));
    expect(open(container, 't1')).toBe(false);
    expect(open(container, 't3')).toBe(true);
    fireEvent.click(trig(container, 't2'));
    expect(open(container, 't3')).toBe(false);
    expect(open(container, 't2')).toBe(true);
  });
  it('Anker öffnet den Rahmen in der Gruppe', async () => {
    setHash('#t2');
    const { container } = render(<Group syncHash />);
    await wait(10);
    expect(open(container, 't2')).toBe(true);
  });
  it('Tastatur: Pfeile, Pos1 und Ende springen zwischen Rahmen- und Bereichsköpfen', async () => {
    const { container } = render(<Group />);
    await wait(10);
    const heads = [...container.querySelectorAll<HTMLButtonElement>('.dss-acc-trigger')];
    expect(heads).toHaveLength(4);
    heads[0].focus();
    fireEvent.keyDown(heads[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(heads[1]);
    fireEvent.keyDown(heads[1], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(heads[2]);
    fireEvent.keyDown(heads[2], { key: 'End' });
    expect(document.activeElement).toBe(heads[3]);
    fireEvent.keyDown(heads[3], { key: 'Home' });
    expect(document.activeElement).toBe(heads[0]);
    fireEvent.keyDown(heads[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(heads[0]);
  });
  it('titleAs der Gruppe gilt für die Rahmen', async () => {
    const { container } = render(<Group titleAs="h4" />);
    expect(trig(container, 't1').parentElement!.tagName).toBe('H4');
    expect(trig(container, 't2').parentElement!.tagName).toBe('H4');
  });
  it('einzelner Rahmen im Bereich schließt bei exclusive nicht seinen Elternbereich', async () => {
    const { container } = render(
      <Accordion syncHash={false} exclusive>
        <AccordionItem id="p" title="Eltern" defaultOpen>
          <Table collapsible id="k" title="Kind" columns={[{ key: 'a', label: 'A' }]}><tr><td>x</td></tr></Table>
        </AccordionItem>
        <AccordionItem id="q" title="Anderer">x</AccordionItem>
      </Accordion>,
    );
    await wait(10);
    fireEvent.click(trig(container, 'k'));
    expect(open(container, 'k')).toBe(true);
    expect(open(container, 'p')).toBe(true);
    // Pfeil im Kind springt nicht in die Gruppe der Eltern
    const heads = [...container.querySelectorAll('.dss-acc-trigger')].filter((b) => b.id.startsWith('p') || b.id.startsWith('q'));
    expect(heads.map((b) => b.id)).toEqual(['p-trigger', 'q-trigger']);
  });
  it('Anker auf einen Rahmen im geschlossenen Bereich öffnet die Eltern', async () => {
    setHash('#k');
    const { container } = render(
      <AccordionItem id="p" title="Eltern">
        <Table collapsible id="k" title="Kind" columns={[{ key: 'a', label: 'A' }]}><tr><td>x</td></tr></Table>
      </AccordionItem>,
    );
    await wait(10);
    expect(open(container, 'k')).toBe(true);
    expect(open(container, 'p')).toBe(true);
  });
  it('zeigt eine eigene Gruppe in einem Rahmen als verschachtelt', async () => {
    const { container } = render(
      <Table collapsible id="o" title="Außen" defaultOpen columns={[{ key: 'a', label: 'A' }]}>
        <tr><td><Accordion syncHash={false}><AccordionItem id="n1" title="Innen">x</AccordionItem></Accordion></td></tr>
      </Table>,
    );
    expect(container.querySelector('.dss-acc--nested')).not.toBeNull();
  });
});

describe('kontrollierte Nutzung mit useState', () => {
  it('Zustand von außen lesen und setzen', () => {
    const Demo = () => {
      const [o, setO] = useState(false);
      return (
        <>
          <button onClick={() => setO(true)}>auf</button>
          <span data-testid="state">{String(o)}</span>
          <Table collapsible id="s" title="Titel" open={o} onOpenChange={setO} columns={[{ key: 'a', label: 'A' }]}><tr><td>x</td></tr></Table>
        </>
      );
    };
    const { container, getByText, getByTestId } = render(<Demo />);
    fireEvent.click(getByText('auf'));
    expect(open(container, 's')).toBe(true);
    fireEvent.click(trig(container, 's'));
    expect(getByTestId('state').textContent).toBe('false');
  });
});
