import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { ComponentType } from 'react';
import { HeadingLevel, useHeadingLevel } from './HeadingLevel';
import { Modal } from './Modal';
import { Table } from './Table';
import { EmptyState } from './EmptyState';
import { ScheduleTable } from './ScheduleTable';
import { ScheduleGrid } from './ScheduleGrid';
import { PlayerCard } from './PlayerCard';
import { PlayByPlay } from './PlayByPlay';
import { TeamCard } from './TeamCard';
import { LeagueCard } from './LeagueCard';
import { VenueCard } from './VenueCard';
import { TITLE_CASES } from '../tests/helpers/title-cases';

const COMPONENTS: Record<string, ComponentType<never>> = { ScheduleTable, ScheduleGrid, Table, PlayerCard, EmptyState, PlayByPlay, TeamCard, LeagueCard, VenueCard } as never;
const CASES = TITLE_CASES.filter((c) => !c.name.includes('compact'));

/** Elementname der Komponentenüberschrift (erste Überschrift mit der Titelklasse). */
function titleTag(container: Element, cls: string): string {
  const el = container.querySelector(`.${cls}`);
  expect(el, cls).not.toBeNull();
  return el!.tagName.toLowerCase();
}
const draw = (c: (typeof CASES)[number], extra: Record<string, unknown> = {}) => {
  const Comp = COMPONENTS[c.reactName] as ComponentType<Record<string, unknown>>;
  return <Comp {...c.reactProps()} {...extra} />;
};

describe.each(CASES.map((c) => [c.name, c] as const))('%s: Rangfolge titleAs > HeadingLevel > h3', (_name, c) => {
  it('ohne HeadingLevel und ohne titleAs: h3', () => {
    const { container } = render(draw(c));
    expect(titleTag(container, c.titleClass)).toBe('h3');
  });
  it('mit HeadingLevel level={4}: h4', () => {
    const { container } = render(<HeadingLevel level={4}>{draw(c)}</HeadingLevel>);
    expect(titleTag(container, c.titleClass)).toBe('h4');
  });
  it('titleAs gewinnt gegen HeadingLevel', () => {
    const { container } = render(<HeadingLevel level={5}>{draw(c, { titleAs: 'h2' })}</HeadingLevel>);
    expect(titleTag(container, c.titleClass)).toBe('h2');
  });
  it.each(['h2', 'h3', 'h4', 'h5', 'h6'] as const)('titleAs=%s ohne HeadingLevel', (tag) => {
    const { container } = render(draw(c, { titleAs: tag }));
    expect(titleTag(container, c.titleClass)).toBe(tag);
  });
});

describe('HeadingLevel', () => {
  const Probe = () => <output>{useHeadingLevel()}</output>;
  const level = (ui: React.ReactElement) => render(ui).container.querySelector('output')!.textContent;

  it('Hook ohne HeadingLevel: 3 (Standard der Komponenten)', () => {
    expect(level(<Probe />)).toBe('3');
  });
  it('level ist absolut', () => {
    expect(level(<HeadingLevel level={5}><Probe /></HeadingLevel>)).toBe('5');
  });
  it('by ohne Vorfahr zählt von der Ausgangsebene 2 aus', () => {
    expect(level(<HeadingLevel><Probe /></HeadingLevel>)).toBe('3');
    expect(level(<HeadingLevel by={2}><Probe /></HeadingLevel>)).toBe('4');
    expect(level(<HeadingLevel by={0}><Probe /></HeadingLevel>)).toBe('2');
  });
  it('by ist relativ zum Vorfahren und lässt sich verschachteln', () => {
    expect(level(<HeadingLevel level={3}><HeadingLevel><Probe /></HeadingLevel></HeadingLevel>)).toBe('4');
    expect(level(<HeadingLevel level={2}><HeadingLevel by={2}><HeadingLevel><Probe /></HeadingLevel></HeadingLevel></HeadingLevel>)).toBe('5');
    expect(level(<HeadingLevel by={1}><HeadingLevel by={1}><HeadingLevel by={1}><Probe /></HeadingLevel></HeadingLevel></HeadingLevel>)).toBe('5');
  });
  it('level gewinnt gegen by', () => {
    expect(level(<HeadingLevel level={3}><HeadingLevel level={6} by={-1}><Probe /></HeadingLevel></HeadingLevel>)).toBe('6');
  });
  it('level als Ziffern-Zeichenkette gilt wie die Zahl', () => {
    expect(level(<HeadingLevel level="4"><Probe /></HeadingLevel>)).toBe('4');
  });
  it('begrenzt auf 2 bis 6', () => {
    expect(level(<HeadingLevel level={9 as never}><Probe /></HeadingLevel>)).toBe('6');
    expect(level(<HeadingLevel level={1 as never}><Probe /></HeadingLevel>)).toBe('2');
    expect(level(<HeadingLevel level={6}><HeadingLevel by={3}><Probe /></HeadingLevel></HeadingLevel>)).toBe('6');
    expect(level(<HeadingLevel level={2}><HeadingLevel by={-4}><Probe /></HeadingLevel></HeadingLevel>)).toBe('2');
  });
  it('ein Vorfahr wirkt auf mehrere Geschwister und ein inneres HeadingLevel nur auf seinen Teil', () => {
    const { container } = render(
      <HeadingLevel level={2}>
        <EmptyState title="A" />
        <HeadingLevel>
          <EmptyState title="B" />
        </HeadingLevel>
        <EmptyState title="C" />
      </HeadingLevel>,
    );
    expect([...container.querySelectorAll('.hoops-empty-title')].map((e) => e.tagName.toLowerCase())).toEqual(['h2', 'h3', 'h2']);
  });
  it('Gliederung der App: Abschnitt h2, Karten darunter h3 (Beispiel der Doku)', () => {
    const { container } = render(
      <HeadingLevel level={3}>
        <TeamCard name="TSV Nordhain" />
        <PlayerCard jersey="4" name="J. Tanner" />
      </HeadingLevel>,
    );
    expect([...container.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((e) => e.tagName.toLowerCase())).toEqual(['h3', 'h3']);
  });
});

describe('Modal und die Ebenen im Inhalt', () => {
  const table = <Table title="Spieler" columns={[{ key: 'a', label: 'A' }]}><tr><td>x</td></tr></Table>;
  const headings = () => [...document.querySelectorAll('[role="dialog"] h1, [role="dialog"] h2, [role="dialog"] h3, [role="dialog"] h4, [role="dialog"] h5, [role="dialog"] h6')].map((e) => `${e.tagName.toLowerCase()}:${e.textContent}`);

  it('Titel ist h2, eine Tabelle im Modal bekommt h3 (Radix-Portal behält den Kontext)', () => {
    render(<Modal open onOpenChange={() => {}} title="Kader">{table}</Modal>);
    expect(document.querySelector('[role="dialog"]')!.parentElement!.parentElement).toBe(document.body);
    expect(headings()).toEqual(['h2:Kader', 'h3:Spieler']);
  });
  it('der Titel bleibt der Name des Dialogs', () => {
    render(<Modal open onOpenChange={() => {}} title="Kader" titleAs="h4">x</Modal>);
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-labelledby')).toBe(document.querySelector('.hoops-m-title')!.id);
    expect(document.querySelector('.hoops-m-title')!.id).not.toBe('');
  });
  it.each([['h2', 'h3'], ['h3', 'h4'], ['h4', 'h5'], ['h5', 'h6'], ['h6', 'h6']] as const)('titleAs=%s: Inhalt bekommt %s', (titleAs, child) => {
    render(<Modal open onOpenChange={() => {}} title="Kader" titleAs={titleAs}>{table}</Modal>);
    expect(headings()).toEqual([`${titleAs}:Kader`, `${child}:Spieler`]);
  });
  it('der Footer bekommt dieselbe Ebene wie der Inhalt', () => {
    render(<Modal open onOpenChange={() => {}} title="Kader" footer={<EmptyState title="Leer" />}>x</Modal>);
    expect(headings()).toEqual(['h2:Kader', 'h3:Leer']);
  });
  it('titleAs an der Komponente und ein eigenes HeadingLevel im Inhalt gewinnen', () => {
    render(
      <Modal open onOpenChange={() => {}} title="Kader">
        <EmptyState title="A" titleAs="h6" />
        <HeadingLevel level={5}><EmptyState title="B" /></HeadingLevel>
      </Modal>,
    );
    expect(headings()).toEqual(['h2:Kader', 'h6:A', 'h5:B']);
  });
  it('das Modal ignoriert ein HeadingLevel außerhalb für den eigenen Titel (Standard h2), der Inhalt zählt ab dem Titel', () => {
    render(<HeadingLevel level={5}><Modal open onOpenChange={() => {}} title="Kader">{table}</Modal></HeadingLevel>);
    expect(headings()).toEqual(['h2:Kader', 'h3:Spieler']);
  });
  it('ungültiges titleAs: Rückfall auf h2', () => {
    render(<Modal open onOpenChange={() => {}} title="Kader" titleAs={'h1' as never}>{table}</Modal>);
    expect(headings()).toEqual(['h2:Kader', 'h3:Spieler']);
  });
});
