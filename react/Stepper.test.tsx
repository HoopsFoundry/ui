import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Stepper, type StepItem } from './Stepper';
import { expectNoA11yViolations } from './test-utils';

const STEPS: StepItem[] = [
  { id: 'r1', label: 'Runde 1', state: 'done' },
  { id: 'r2', label: 'Runde 2', description: 'läuft', state: 'current' },
  { id: 'r3', label: 'Runde 3', state: 'pending' },
];

describe('Stepper', () => {
  it('rendert eine geordnete Liste mit aria-current auf dem aktuellen Schritt', () => {
    render(<Stepper steps={STEPS} ariaLabel="Turnierrunden" />);
    expect(screen.getByRole('list', { name: 'Turnierrunden' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('sagt den Zustand jedes Schritts für Screenreader an', () => {
    render(<Stepper steps={STEPS} />);
    expect(screen.getByText('(erledigt)')).toHaveClass('hoops-sr-only');
    expect(screen.getByText('(aktuell)')).toBeInTheDocument();
    expect(screen.getByText('(ausstehend)')).toBeInTheDocument();
  });

  it('setzt Zustandsklassen', () => {
    const { container } = render(<Stepper steps={STEPS} />);
    const items = container.querySelectorAll('.hoops-step-item');
    expect(items[0]).toHaveClass('is-done');
    expect(items[1]).toHaveClass('is-current');
    expect(items[2]).toHaveClass('is-pending');
  });

  it('rendert ohne onStep keine Buttons', () => {
    render(<Stepper steps={STEPS} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('rendert mit onStep Buttons für erledigte und aktuelle Schritte, nicht für ausstehende', () => {
    const onStep = vi.fn();
    render(<Stepper steps={STEPS} onStep={onStep} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: '1. Runde 1' }));
    expect(onStep).toHaveBeenCalledWith('r1');
  });

  it('zeigt in der kompakten Variante Fortschritt und Namen', () => {
    const { container } = render(<Stepper steps={STEPS} variant="compact" />);
    expect(container.querySelector('.hoops-step--c')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('Runde 2')).toBeInTheDocument();
  });

  it('rendert die vertikale Variante mit Beschreibung', () => {
    const { container } = render(<Stepper steps={STEPS} variant="vertical" />);
    expect(container.querySelector('.hoops-step--v')).toBeInTheDocument();
    expect(screen.getByText('läuft')).toBeInTheDocument();
  });

  it('rendert die kompakte Variante ohne Schritte ohne NaN-Breite', () => {
    const { container } = render(<Stepper steps={[]} variant="compact" />);
    expect(container.querySelector('.hoops-step-fill')).toHaveStyle({ width: '0%' });
  });

  it.each(['horizontal', 'compact', 'vertical'] as const)('hat in %s keine A11y-Verstöße', async (variant) => {
    const { container } = render(<Stepper steps={STEPS} variant={variant} onStep={() => {}} />);
    await expectNoA11yViolations(container);
  });
});
