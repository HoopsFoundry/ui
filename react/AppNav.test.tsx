import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AppNav, type AppNavItem } from './AppNav';
import { expectNoA11yViolations } from './test-utils';

const ITEMS: AppNavItem[] = [
  {
    id: 'prep',
    label: 'Vorbereiten',
    items: [
      { id: 'teams', label: 'Teams', href: '/teams' },
      { id: 'config', label: 'Konfiguration', href: '/konfiguration' },
    ],
  },
  {
    id: 'view',
    label: 'Ansehen',
    items: [{ id: 'schedule', label: 'Zeitplan', href: '/zeitplan', disabled: true, hint: 'Erst nach dem Zeitplan verfügbar' }],
  },
  { id: 'help', label: 'Anleitung', href: '/anleitung' },
];

describe('AppNav', () => {
  it('rendert eine benannte Navigation mit Link und Gruppen-Buttons', () => {
    render(<AppNav items={ITEMS} ariaLabel="Hauptnavigation" />);
    expect(screen.getByRole('navigation', { name: 'Hauptnavigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anleitung' })).toHaveAttribute('href', '/anleitung');
    expect(screen.getByRole('button', { name: 'Vorbereiten' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('markiert den aktuellen Link mit aria-current und die Gruppe als aktiv', () => {
    render(<AppNav items={ITEMS} currentHref="/teams" />);
    expect(screen.getByRole('button', { name: 'Vorbereiten' })).toHaveClass('is-active');
    fireEvent.click(screen.getByRole('button', { name: 'Vorbereiten' }));
    expect(screen.getByRole('link', { name: 'Teams' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Konfiguration' })).not.toHaveAttribute('aria-current');
  });

  it('öffnet und schließt eine Gruppe per Klick; es ist immer nur eine offen', () => {
    render(<AppNav items={ITEMS} />);
    const prep = screen.getByRole('button', { name: 'Vorbereiten' });
    const view = screen.getByRole('button', { name: 'Ansehen' });
    expect(screen.queryByRole('link', { name: 'Teams' })).toBeNull();
    fireEvent.click(prep);
    expect(prep).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Teams' })).toBeVisible();
    fireEvent.click(view);
    expect(prep).toHaveAttribute('aria-expanded', 'false');
    expect(view).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(view);
    expect(view).toHaveAttribute('aria-expanded', 'false');
  });

  it('schließt mit Esc und gibt den Fokus an den Auslöser zurück', () => {
    render(<AppNav items={ITEMS} />);
    const prep = screen.getByRole('button', { name: 'Vorbereiten' });
    fireEvent.click(prep);
    fireEvent.keyDown(screen.getByRole('link', { name: 'Teams' }), { key: 'Escape' });
    expect(prep).toHaveAttribute('aria-expanded', 'false');
    expect(prep).toHaveFocus();
  });

  it('schließt bei Klick außerhalb', () => {
    render(
      <div>
        <button type="button">Außen</button>
        <AppNav items={ITEMS} />
      </div>,
    );
    const prep = screen.getByRole('button', { name: 'Vorbereiten' });
    fireEvent.click(prep);
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Außen' }));
    expect(prep).toHaveAttribute('aria-expanded', 'false');
  });

  it('schließt nach Klick auf einen Link', () => {
    render(<AppNav items={ITEMS} />);
    const prep = screen.getByRole('button', { name: 'Vorbereiten' });
    fireEvent.click(prep);
    fireEvent.click(screen.getByRole('link', { name: 'Teams' }));
    expect(prep).toHaveAttribute('aria-expanded', 'false');
  });

  it('rendert gesperrte Einträge ohne Fokus mit Hinweis', () => {
    render(<AppNav items={ITEMS} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ansehen' }));
    const locked = screen.getByRole('link', { name: /Zeitplan/ });
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(locked).not.toHaveAttribute('href');
    expect(locked).not.toHaveAttribute('tabindex');
    expect(locked).toHaveAttribute('title', 'Erst nach dem Zeitplan verfügbar');
    expect(within(locked).getByText(/Erst nach dem Zeitplan verfügbar/)).toHaveClass('hoops-sr-only');
  });

  it('rendert eine gesperrte Gruppe als deaktivierten Button ohne Dropdown', () => {
    render(
      <AppNav
        items={[
          { id: 'report', label: 'Auswertung', disabled: true, hint: 'Erst nach Turnierende verfügbar', items: [] },
          { id: 'help', label: 'Hilfe', href: '/hilfe' },
        ]}
      />,
    );
    const group = screen.getByRole('button', { name: /Auswertung/ });
    expect(group).toBeDisabled();
    expect(group).toHaveClass('is-disabled');
    expect(group).not.toHaveAttribute('aria-expanded');
    expect(group).toHaveAttribute('title', 'Erst nach Turnierende verfügbar');
    expect(within(group).getByText(/Erst nach Turnierende verfügbar/)).toHaveClass('hoops-sr-only');
    expect(document.querySelector('.hoops-appnav-panel')).toBeNull();
  });

  it('nutzt renderLink für Router-Links', () => {
    const renderLink = vi.fn(({ item, className, ariaCurrent, onNavigate, children }) => (
      <a data-router href={item.href} className={className} aria-current={ariaCurrent} onClick={onNavigate}>
        {children}
      </a>
    ));
    render(<AppNav items={ITEMS} renderLink={renderLink} currentHref="/anleitung" />);
    const help = screen.getByRole('link', { name: 'Anleitung' });
    expect(help).toHaveAttribute('data-router');
    expect(help).toHaveAttribute('aria-current', 'page');
    expect(renderLink).toHaveBeenCalled();
  });

  it('steuert das mobile Menü über den Menü-Button', () => {
    const { container } = render(<AppNav items={ITEMS} menuLabel="Menü" />);
    const toggle = screen.getByRole('button', { name: 'Menü' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('nav')).toHaveClass('is-open');
    fireEvent.keyDown(toggle, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('setzt die Tonalität und rendert den Kontext-Slot', () => {
    const { container } = render(<AppNav items={ITEMS} tone="dark" context={<span>Turnier A</span>} />);
    expect(container.querySelector('nav')).toHaveClass('hoops-appnav--dark');
    expect(screen.getByText('Turnier A')).toBeInTheDocument();
  });

  it('hat keine A11y-Verstöße (geschlossen und geöffnet)', async () => {
    const { container } = render(<AppNav items={ITEMS} currentHref="/teams" />);
    await expectNoA11yViolations(container);
    fireEvent.click(screen.getByRole('button', { name: 'Ansehen' }));
    await expectNoA11yViolations(container);
  });

  it('setzt die Klasse für die begrenzte Inhaltsbreite mit contained', () => {
    const { container } = render(<AppNav items={ITEMS} contained />);
    expect(container.querySelector('nav')).toHaveClass('hoops-appnav--contained');
  });

  it('bildet gültige IDs für aria-controls auch bei Sonderzeichen in der Gruppen-ID', () => {
    render(<AppNav items={[{ id: 'a b/c', label: 'Gruppe', items: [{ id: 'x', label: 'Eins', href: '/1' }] }]} />);
    const controls = screen.getByRole('button', { name: 'Gruppe' }).getAttribute('aria-controls')!;
    expect(controls).not.toMatch(/\s/);
    expect(document.getElementById(controls)).toBeInTheDocument();
  });

  it('schließt das Dropdown, wenn der Fokus die Navigation verlässt', () => {
    render(
      <div>
        <AppNav items={ITEMS} />
        <button type="button">Außen</button>
      </div>,
    );
    const prep = screen.getByRole('button', { name: 'Vorbereiten' });
    fireEvent.click(prep);
    prep.focus();
    fireEvent.blur(prep, { relatedTarget: screen.getByRole('button', { name: 'Außen' }) });
    expect(prep).toHaveAttribute('aria-expanded', 'false');
  });

  it('lässt das Dropdown offen, wenn der Fokus innerhalb der Navigation wandert', () => {
    render(<AppNav items={ITEMS} />);
    const prep = screen.getByRole('button', { name: 'Vorbereiten' });
    fireEvent.click(prep);
    fireEvent.blur(prep, { relatedTarget: screen.getByRole('link', { name: 'Teams' }) });
    expect(prep).toHaveAttribute('aria-expanded', 'true');
  });
});
