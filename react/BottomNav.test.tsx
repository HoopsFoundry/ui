import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav, type BottomNavItem } from './BottomNav';
import { expectNoA11yViolations } from './test-utils';

const ITEMS: BottomNavItem[] = [
  { id: 'overview', label: 'Übersicht', icon: 'home' },
  { id: 'roster', label: 'Roster', icon: 'roster' },
  { id: 'score', label: 'Erfassen', icon: 'plus', fab: true },
  { id: 'foul', label: 'Fouls', icon: 'foul-p', badge: 3 },
];

describe('BottomNav', () => {
  it('rendert eine benannte Navigation mit Buttons', () => {
    render(<BottomNav items={ITEMS} ariaLabel="Spielbereiche" />);
    expect(screen.getByRole('navigation', { name: 'Spielbereiche' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Übersicht' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Roster' })).toBeInTheDocument();
  });

  it('wählt standardmäßig den ersten Nicht-FAB-Eintrag und markiert ihn mit aria-current', () => {
    render(<BottomNav items={ITEMS} />);
    const first = screen.getByRole('button', { name: 'Übersicht' });
    expect(first).toHaveAttribute('aria-current', 'page');
    expect(first).toHaveClass('is-active');
    expect(screen.getByRole('button', { name: 'Roster' })).not.toHaveAttribute('aria-current');
  });

  it('wechselt per Klick (unkontrolliert) und meldet onValueChange', () => {
    const onValueChange = vi.fn();
    render(<BottomNav items={ITEMS} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Roster' }));
    expect(screen.getByRole('button', { name: 'Roster' })).toHaveAttribute('aria-current', 'page');
    expect(onValueChange).toHaveBeenCalledWith('roster');
  });

  it('FAB-Klick lässt die Auswahl unverändert und meldet kein onValueChange', () => {
    const onValueChange = vi.fn();
    render(<BottomNav items={ITEMS} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Erfassen' }));
    expect(screen.getByRole('button', { name: 'Übersicht' })).toHaveAttribute('aria-current', 'page');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('FAB meldet sich über onAction mit seiner ID (Button und Link)', () => {
    const onAction = vi.fn();
    const { rerender } = render(<BottomNav items={ITEMS} onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Erfassen' }));
    expect(onAction).toHaveBeenCalledWith('score');
    onAction.mockClear();
    const withHref = ITEMS.map((item) => (item.fab ? { ...item, href: '#erfassen' } : item));
    rerender(<BottomNav items={withHref} onAction={onAction} />);
    fireEvent.click(screen.getByRole('link', { name: 'Erfassen' }));
    expect(onAction).toHaveBeenCalledWith('score');
    expect(screen.getByRole('button', { name: 'Übersicht' })).toHaveAttribute('aria-current', 'page');
  });

  it('ist kontrolliert über value', () => {
    render(<BottomNav items={ITEMS} value="roster" />);
    fireEvent.click(screen.getByRole('button', { name: 'Übersicht' }));
    expect(screen.getByRole('button', { name: 'Roster' })).toHaveAttribute('aria-current', 'page');
  });

  it('zeigt das Badge und den FAB mit zugänglichem Namen', () => {
    const { container } = render(<BottomNav items={ITEMS} />);
    expect(container.querySelector('.hoops-bnav-badge')).toHaveTextContent('3');
    const fab = screen.getByRole('button', { name: 'Erfassen' });
    expect(fab).toHaveClass('hoops-bnav-fab');
    expect(fab).not.toHaveAttribute('aria-current');
  });

  it('rendert Einträge mit href als Links', () => {
    render(<BottomNav items={[{ id: 'a', label: 'Start', href: '/start' }, { id: 'b', label: 'Team', href: '/team' }]} value="b" />);
    expect(screen.getByRole('link', { name: 'Team' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Start' })).toHaveAttribute('href', '/start');
  });

  it('hat keine A11y-Verstöße', async () => {
    const { container } = render(<BottomNav items={ITEMS} />);
    await expectNoA11yViolations(container);
  });
});
