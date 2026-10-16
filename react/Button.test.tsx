import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import { expectNoA11yViolations } from './test-utils';

describe('Button', () => {
  it('rendert primary/md als Standard mit type=button', () => {
    render(<Button>Speichern</Button>);
    const btn = screen.getByRole('button', { name: 'Speichern' });
    expect(btn).toHaveClass('hoops-btn', 'hoops-btn--primary', 'hoops-btn--md');
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('setzt Variante und Größe als Klassen', () => {
    render(<Button variant="danger" size="lg">Löschen</Button>);
    expect(screen.getByRole('button')).toHaveClass('hoops-btn--danger', 'hoops-btn--lg');
  });

  it('touch fügt is-touch hinzu', () => {
    render(<Button touch>2 Punkte</Button>);
    expect(screen.getByRole('button')).toHaveClass('is-touch');
  });

  it('erlaubt type=submit, merged className und reicht native Props durch', () => {
    render(<Button type="submit" className="extra" aria-label="Senden">OK</Button>);
    const btn = screen.getByRole('button', { name: 'Senden' });
    expect(btn).toHaveAttribute('type', 'submit');
    expect(btn).toHaveClass('extra', 'hoops-btn');
  });

  it('feuert onClick, aber nicht wenn disabled', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Button onClick={onClick}>Klick</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(<Button onClick={onClick} disabled>Klick</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('leitet die ref an das button-Element weiter', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<Button>Speichern</Button>);
    await expectNoA11yViolations(container);
  });
});
