import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopBar } from './TopBar';
import { expectNoA11yViolations } from './test-utils';

describe('TopBar', () => {
  it('rendert Marke und Namen, die Marke ist dekorativ', () => {
    const { container } = render(<TopBar brand="Turnier-Manager" mark="T" />);
    expect(container.firstElementChild).toHaveClass('hoops-topbar', 'hoops-topbar--dark');
    expect(screen.getByText('Turnier-Manager')).toBeInTheDocument();
    expect(container.querySelector('.hoops-topbar-mark')).toHaveAttribute('aria-hidden', 'true');
  });

  it('zeigt im Live-Kontext Spielstand und Uhr', () => {
    const { container } = render(<TopBar context="live" matchLabel="17. Spieltag" score="87 : 64" clock="Q4 · 02:14" />);
    expect(container.querySelector('.hoops-topbar-live')).toHaveTextContent('Live');
    expect(screen.getByText('87 : 64')).toBeInTheDocument();
    expect(screen.getByText('Q4 · 02:14')).toBeInTheDocument();
  });

  it('zeigt im Admin-Kontext nur das Label', () => {
    render(<TopBar context="admin" matchLabel="Vereinsregister" />);
    expect(screen.getByText('Vereinsregister')).toBeInTheDocument();
    expect(screen.queryByText('Live')).toBeNull();
  });

  it('rendert Slots und Nutzer-Chip', () => {
    render(
      <TopBar
        leading={<span>Vorne</span>}
        center={<span>Mitte</span>}
        actions={<button type="button">Aktion</button>}
        user="Sven R."
        userInitials="SR"
      />,
    );
    expect(screen.getByText('Vorne')).toBeInTheDocument();
    expect(screen.getByText('Mitte')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aktion' })).toBeInTheDocument();
    expect(screen.getByText('Sven R.')).toBeInTheDocument();
    expect(screen.getByText('SR')).toHaveClass('hoops-topbar-av');
  });

  it('kann als header-Element gerendert werden (banner-Landmark)', () => {
    render(<TopBar as="header" brand="X" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('hat keine A11y-Verstöße', async () => {
    const { container } = render(<TopBar as="header" brand="Turnier-Manager" mark="T" user="Anna" userInitials="A" />);
    await expectNoA11yViolations(container);
  });

  it('setzt die Klasse für die begrenzte Inhaltsbreite mit contained', () => {
    const { container } = render(<TopBar contained />);
    expect(container.firstElementChild).toHaveClass('hoops-topbar--contained');
  });
});
