import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, type TabItem } from './Tabs';
import { expectNoA11yViolations } from './test-utils';

const ITEMS: TabItem[] = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'roster', label: 'Aufstellung', count: 12 },
  { id: 'locked', label: 'Gesperrt', disabled: true },
  { id: 'box', label: 'Boxscore', icon: 'stats' },
];

describe('Tabs (single)', () => {
  it('rendert tablist/tab und wählt standardmäßig den ersten Tab', () => {
    render(<Tabs items={ITEMS} ariaLabel="Bereiche" />);
    expect(screen.getByRole('tablist', { name: 'Bereiche' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Übersicht' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Aufstellung/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('zeigt Count, Icon und deaktiviert Tabs', () => {
    const { container } = render(<Tabs items={ITEMS} />);
    expect(container.querySelector('.hoops-tab-count')).toHaveTextContent('12');
    expect(container.querySelector('svg.hoops-tab-ic')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Gesperrt' })).toBeDisabled();
  });

  it('wechselt per Klick (unkontrolliert) und meldet onValueChange', () => {
    const onValueChange = vi.fn();
    render(<Tabs items={ITEMS} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('tab', { name: /Aufstellung/ }));
    expect(screen.getByRole('tab', { name: /Aufstellung/ })).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange).toHaveBeenCalledWith('roster');
  });

  it('ist kontrolliert über value', () => {
    const { rerender } = render(<Tabs items={ITEMS} value="roster" />);
    expect(screen.getByRole('tab', { name: /Aufstellung/ })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Übersicht' }));
    expect(screen.getByRole('tab', { name: /Aufstellung/ })).toHaveAttribute('aria-selected', 'true');
    rerender(<Tabs items={ITEMS} value="overview" />);
    expect(screen.getByRole('tab', { name: 'Übersicht' })).toHaveAttribute('aria-selected', 'true');
  });

  it('Roving-Tabindex: nur der aktive Tab ist per Tab erreichbar', () => {
    render(<Tabs items={ITEMS} />);
    expect(screen.getByRole('tab', { name: 'Übersicht' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: /Aufstellung/ })).toHaveAttribute('tabindex', '-1');
  });

  it('Pfeiltasten wechseln, überspringen deaktivierte Tabs und laufen um', () => {
    render(<Tabs items={ITEMS} defaultValue="roster" />);
    const roster = screen.getByRole('tab', { name: /Aufstellung/ });
    fireEvent.keyDown(roster, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: /Boxscore/ })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: /Boxscore/ }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Übersicht' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Übersicht' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: /Boxscore/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('vertical nutzt ArrowDown/ArrowUp und aria-orientation', () => {
    render(<Tabs items={ITEMS} variant="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Übersicht' }), { key: 'ArrowDown' });
    expect(screen.getByRole('tab', { name: /Aufstellung/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('setzt Variante und Größe als Klassen', () => {
    render(<Tabs items={ITEMS} variant="segmented" size="lg" />);
    expect(screen.getByRole('tablist')).toHaveClass('hoops-tabs', 'hoops-tabs--segmented', 'hoops-tabs--lg');
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<Tabs items={ITEMS} ariaLabel="Bereiche" />);
    await expectNoA11yViolations(container);
  });
});

describe('Tabs (multi)', () => {
  it('nutzt group + aria-pressed und toggelt mehrere aktive Einträge', () => {
    const onActiveIdsChange = vi.fn();
    render(<Tabs items={ITEMS} multi variant="pills" onActiveIdsChange={onActiveIdsChange} ariaLabel="Filter" />);
    expect(screen.getByRole('group', { name: 'Filter' })).toBeInTheDocument();

    const overview = screen.getByRole('button', { name: 'Übersicht' });
    fireEvent.click(overview);
    fireEvent.click(screen.getByRole('button', { name: /Aufstellung/ }));
    expect(overview).toHaveAttribute('aria-pressed', 'true');
    expect(onActiveIdsChange).toHaveBeenLastCalledWith(['overview', 'roster']);

    fireEvent.click(overview);
    expect(overview).toHaveAttribute('aria-pressed', 'false');
    expect(onActiveIdsChange).toHaveBeenLastCalledWith(['roster']);
  });

  it('lässt alle Buttons natürlich per Tab erreichbar (kein Roving-Tabindex)', () => {
    render(<Tabs items={ITEMS} multi variant="pills" />);
    expect(screen.getByRole('button', { name: 'Übersicht' })).not.toHaveAttribute('tabindex');
  });
});
