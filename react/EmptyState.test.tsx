import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from './EmptyState';
import { expectNoA11yViolations } from './test-utils';

describe('EmptyState', () => {
  it('rendert Titel und Text in neutraler Tonalität', () => {
    const { container } = render(<EmptyState title="Noch keine Spiele" body="Erzeuge zuerst einen Zeitplan." />);
    expect(container.firstElementChild).toHaveClass('hoops-empty', 'hoops-empty--neutral');
    expect(screen.getByRole('heading', { name: 'Noch keine Spiele', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Erzeuge zuerst einen Zeitplan.')).toBeInTheDocument();
  });

  it('setzt Tonalität und Überschriftenebene', () => {
    const { container } = render(<EmptyState tone="error" title="Fehler" titleAs="h2" />);
    expect(container.firstElementChild).toHaveClass('hoops-empty--error');
    expect(screen.getByRole('heading', { name: 'Fehler', level: 2 })).toBeInTheDocument();
  });

  it('zeigt einen CTA-Button, der onCta auslöst', () => {
    const onCta = vi.fn();
    render(<EmptyState tone="action" title="Zeitplan fehlt" cta="Zeitplan erzeugen" onCta={onCta} />);
    const button = screen.getByRole('button', { name: 'Zeitplan erzeugen' });
    expect(button).toHaveClass('hoops-btn', 'hoops-btn--amber');
    fireEvent.click(button);
    expect(onCta).toHaveBeenCalledTimes(1);
  });

  it('rendert beliebige Aktionen und Zusatz-Inhalt', () => {
    render(
      <EmptyState title="Keine Teams" actions={<a href="/demos">Demo ansehen</a>}>
        <span>Tipp</span>
      </EmptyState>,
    );
    expect(screen.getByRole('link', { name: 'Demo ansehen' })).toBeInTheDocument();
    expect(screen.getByText('Tipp')).toBeInTheDocument();
  });

  it('rendert ein Icon aus dem Sprite, wenn icon gesetzt ist', () => {
    const { container } = render(<EmptyState title="X" icon="stats" />);
    expect(container.querySelector('.hoops-empty-icon use')).toHaveAttribute('href', '#i-stats');
  });

  it('hat keine A11y-Verstöße', async () => {
    const { container } = render(<EmptyState tone="action" title="Zeitplan fehlt" body="Text" cta="Los" />);
    await expectNoA11yViolations(container);
  });
});
