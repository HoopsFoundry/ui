import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { StatGrid } from './StatGrid';
import { expectNoA11yViolations } from './test-utils';

describe('StatGrid', () => {
  it('Beschreibungsliste: Beschriftung als dt, Wert als dd, Zahlen mit Dezimalkomma', () => {
    const { container } = render(<StatGrid items={[{ label: 'Siege', value: 12 }, { label: 'Punkte pro Spiel', value: 82.4 }]} />);
    const dl = container.querySelector('dl')!;
    expect(dl).toHaveClass('dss-stats');
    expect(dl.querySelectorAll('dt')).toHaveLength(2);
    expect(within(dl).getByText('82,4').tagName).toBe('DD');
  });
  it('compact', () => {
    const { container } = render(<StatGrid compact items={[{ label: 'A', value: 1 }]} />);
    expect(container.querySelector('dl')).toHaveClass('dss-stats', 'dss-stats--compact');
  });
  it('fehlender Wert: Gedankenstrich ist aria-hidden, versteckter Text „keine Angabe“', () => {
    render(<StatGrid items={[{ label: 'Rebounds', value: null }]} />);
    expect(screen.getByText('–')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('keine Angabe')).toHaveClass('dss-sr-only');
  });
  it('Texte sind nie HTML', () => {
    const { container } = render(<StatGrid items={[{ label: '<b>x</b>', value: '<img src=x onerror=alert(1)>' }]} />);
    expect(container.querySelector('b, img')).toBeNull();
  });
  it('ohne gültige Einträge nichts', () => {
    const { container } = render(<StatGrid items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('keine Verstöße gegen die Barrierefreiheit', async () => {
    const { container } = render(<StatGrid items={[{ label: 'Siege', value: 12 }, { label: 'Niederlagen', value: 3 }]} />);
    await expectNoA11yViolations(container);
  });
});
