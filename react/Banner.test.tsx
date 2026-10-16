import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Banner } from './Banner';
import { expectNoA11yViolations } from './test-utils';

describe('Banner', () => {
  it('rendert info als Standard mit role=status', () => {
    render(<Banner>Geschätzte Dauer: 180 Minuten.</Banner>);
    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('hoops-banner', 'hoops-banner--info');
    expect(banner).toHaveTextContent('Geschätzte Dauer: 180 Minuten.');
  });

  it.each([
    ['ok', 'status'],
    ['warn', 'alert'],
    ['danger', 'alert'],
  ] as const)('severity %s hat role=%s', (severity, role) => {
    render(<Banner severity={severity}>Text</Banner>);
    expect(screen.getByRole(role)).toHaveClass(`hoops-banner--${severity}`);
  });

  it('erlaubt ein explizites role', () => {
    render(<Banner severity="warn" role="status">Text</Banner>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('rendert den Titel und ein dekoratives Icon', () => {
    const { container } = render(<Banner severity="warn" title="Hallenzeit knapp">Text</Banner>);
    expect(screen.getByText('Hallenzeit knapp')).toHaveClass('hoops-banner-title');
    expect(container.querySelector('svg.hoops-banner-icon')).toHaveAttribute('aria-hidden', 'true');
  });

  it('lässt das Icon mit icon={false} weg', () => {
    const { container } = render(<Banner icon={false}>Text</Banner>);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('merged className und reicht native Props durch', () => {
    render(<Banner className="extra" data-testid="b">Text</Banner>);
    expect(screen.getByTestId('b')).toHaveClass('extra', 'hoops-banner');
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<Banner severity="danger" title="Fehler">Export fehlgeschlagen</Banner>);
    await expectNoA11yViolations(container);
  });
});
