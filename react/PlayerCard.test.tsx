import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerCard } from './PlayerCard';
import { expectNoA11yViolations } from './test-utils';

const VITALS = [
  { label: 'PTS', value: 22, accent: true },
  { label: 'REB', value: 6 },
  { label: 'AST', value: 4 },
  { label: 'FG%', value: '48' },
];

describe('PlayerCard', () => {
  it('rendert compact als div mit Trikot, Name, Position und Statistik', () => {
    const { container } = render(
      <PlayerCard size="compact" jersey={4} name="J. Tanner" position="PG" captain playerRole="Spielmacher" stat={22} statLabel="PTS" />,
    );
    expect(container.firstElementChild?.tagName).toBe('DIV');
    expect(container.firstElementChild).toHaveClass('hoops-pc-row');
    expect(screen.getByText('J. Tanner (C)')).toBeInTheDocument();
    expect(container.querySelector('.hoops-tn')).toHaveClass('heim', 'small', 'captain');
    expect(container.querySelector('.hoops-pos')).toHaveClass('pg');
    expect(container.querySelector('.hoops-pos')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('wird compact mit onClick zum Button', () => {
    const onClick = vi.fn();
    render(<PlayerCard size="compact" jersey={7} name="M. Okafor" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: /M. Okafor/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('rendert standard mit Überschrift, Kapitän-Marke, Alter, Größe und Kennzahlen', () => {
    const { container } = render(
      <PlayerCard size="standard" jersey={13} name="K. Vogler" position="PF" team="gast" captain age="24 J." heightCm="198" vitals={VITALS} />,
    );
    expect(container.firstElementChild).toHaveClass('hoops-pc-card');
    expect(screen.getByRole('heading', { name: 'K. Vogler', level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Kapitän')).toHaveClass('hoops-pc-cap');
    expect(screen.getByText('198 cm')).toBeInTheDocument();
    expect(container.querySelector('.hoops-tn')).toHaveClass('gast', 'large');
    expect(container.querySelectorAll('.hoops-pc-vitals .hoops-pc-v')).toHaveLength(4);
    expect(container.querySelector('.hoops-pc-v--amber')).toHaveTextContent('22');
  });

  it('rendert hero mit großer Trikotnummer und wählbarer Überschriftenebene', () => {
    const { container } = render(<PlayerCard size="hero" jersey={9} name="H. Lorenz" titleAs="h2" vitals={VITALS} />);
    expect(container.firstElementChild).toHaveClass('hoops-pc-hero');
    expect(container.querySelector('.hoops-tn')).toHaveClass('hero');
    expect(screen.getByRole('heading', { name: 'H. Lorenz', level: 2 })).toBeInTheDocument();
  });

  it('lässt Kennzahlen weg, wenn keine übergeben werden', () => {
    const { container } = render(<PlayerCard jersey={1} name="X" />);
    expect(container.querySelector('.hoops-pc-vitals')).toBeNull();
  });

  it.each(['compact', 'standard', 'hero'] as const)('hat in %s keine A11y-Verstöße', async (size) => {
    const { container } = render(<PlayerCard size={size} jersey={4} name="J. Tanner" position="PG" vitals={VITALS} stat={22} statLabel="PTS" />);
    await expectNoA11yViolations(container);
  });

  describe('Foto', () => {
    it('ohne photo bleibt das Markup unverändert (Trikotmarke, kein Bild, kein Badge)', () => {
      const { container } = render(<PlayerCard size="compact" jersey={4} name="J. Tanner" />);
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('.hoops-pc-av')).toBeNull();
      expect(container.querySelector('.hoops-tn')).toHaveClass('small');
    });

    it.each(['compact', 'standard', 'hero'] as const)('%s: Foto mit leerem alt (dekorativ), lazy, async, quadratische Maße; Trikotnummer als Badge', (size) => {
      const { container } = render(<PlayerCard size={size} jersey={4} name="J. Tanner" photo="/players/jt.jpg" />);
      const img = container.querySelector('img')!;
      expect(img).toHaveAttribute('src', '/players/jt.jpg');
      expect(img).toHaveAttribute('alt', '');
      expect(img).toHaveAttribute('loading', 'lazy');
      expect(img).toHaveAttribute('decoding', 'async');
      expect(img.getAttribute('width')).toBe(img.getAttribute('height'));
      expect(container.querySelector('.hoops-tn--badge')).toHaveTextContent('4');
      expect(container.querySelector('.hoops-tn.small, .hoops-tn.large, .hoops-tn.hero')).toBeNull();
    });

    it('photoAlt wird als alt übernommen', () => {
      const { container } = render(<PlayerCard size="standard" jersey={4} name="J. Tanner" photo="/p.jpg" photoAlt="Porträt von J. Tanner" />);
      expect(container.querySelector('img')).toHaveAttribute('alt', 'Porträt von J. Tanner');
    });

    it('hero mit Foto bekommt den Modifikator hoops-pc-hero--photo', () => {
      const { container } = render(<PlayerCard size="hero" jersey={4} name="J. Tanner" photo="/p.jpg" />);
      expect(container.firstElementChild).toHaveClass('hoops-pc-hero--photo');
    });

    it.each(['compact', 'standard', 'hero'] as const)('%s: leeres photo zeigt die Trikotmarke', (size) => {
      const { container } = render(<PlayerCard size={size} jersey={4} name="J. Tanner" photo="" />);
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('.hoops-tn--badge')).toBeNull();
    });

    it.each(['compact', 'standard', 'hero'] as const)('%s: Ladefehler fällt auf die Trikotmarke zurück', (size) => {
      const { container } = render(<PlayerCard size={size} jersey={4} name="J. Tanner" photo="/kaputt.jpg" />);
      fireEvent.error(container.querySelector('img')!);
      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('.hoops-tn--badge')).toBeNull();
      expect(container.querySelector('.hoops-tn')).toHaveClass(size === 'compact' ? 'small' : size === 'standard' ? 'large' : 'hero');
    });

    it('eine neue URL nach einem Fehler wird wieder geladen', () => {
      const { container, rerender } = render(<PlayerCard size="compact" jersey={4} name="X" photo="/kaputt.jpg" />);
      fireEvent.error(container.querySelector('img')!);
      rerender(<PlayerCard size="compact" jersey={4} name="X" photo="/gut.jpg" />);
      expect(container.querySelector('img')).toHaveAttribute('src', '/gut.jpg');
    });

    it('der Name wird mit Foto genau einmal angesagt, das Bild trägt keinen Namen', () => {
      render(<PlayerCard size="standard" jersey={4} name="J. Tanner" photo="/p.jpg" />);
      expect(screen.getAllByText('J. Tanner')).toHaveLength(1);
      expect(screen.queryByRole('img')).toBeNull();
    });

    it.each(['compact', 'standard', 'hero'] as const)('%s mit Foto hat keine A11y-Verstöße', async (size) => {
      const { container } = render(<PlayerCard size={size} jersey={4} name="J. Tanner" position="PG" vitals={VITALS} stat={22} statLabel="PTS" photo="/p.jpg" />);
      await expectNoA11yViolations(container);
    });
  });
});
