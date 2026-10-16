import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';
import { expectNoA11yViolations } from './test-utils';

const OPTIONS = [
  { value: 'rr', label: 'Jeder gegen Jeden' },
  { value: 'swiss', label: 'Schweizer System' },
  { value: 'ko', label: 'K.-o.-Runde', disabled: true },
];

describe('Select', () => {
  it('rendert ein natives select mit Label und Optionen', () => {
    render(<Select label="Turniermodus" options={OPTIONS} defaultValue="rr" />);
    const select = screen.getByRole('combobox', { name: 'Turniermodus' });
    expect(select).toBeInstanceOf(HTMLSelectElement);
    expect(select).toHaveClass('hoops-select');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Jeder gegen Jeden',
      'Schweizer System',
      'K.-o.-Runde',
    ]);
    expect(screen.getByRole('option', { name: 'K.-o.-Runde' })).toBeDisabled();
  });

  it('akzeptiert stattdessen children', () => {
    render(
      <Select label="Feld" defaultValue="2">
        <option value="1">1 Feld</option>
        <option value="2">2 Felder</option>
      </Select>,
    );
    expect(screen.getByRole('combobox', { name: 'Feld' })).toHaveValue('2');
  });

  it('meldet Änderungen und funktioniert kontrolliert', () => {
    const onChange = vi.fn();
    render(<Select label="Modus" options={OPTIONS} value="rr" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'swiss' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('compact setzt hoops-select--compact', () => {
    render(<Select label="Modus" options={OPTIONS} density="compact" />);
    expect(screen.getByRole('combobox')).toHaveClass('hoops-select--compact');
  });

  it('error-Zustand und Hilfetext', () => {
    render(<Select label="Modus" options={OPTIONS} state="error" help="Bitte wählen" />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAttribute('aria-describedby', screen.getByText('Bitte wählen').id);
    expect(document.querySelector('.hoops-field')).toHaveClass('is-error');
  });

  it('übernimmt id, disabled und leitet die ref weiter', () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select ref={ref} id="tourney-mode" label="Modus" options={OPTIONS} disabled />);
    expect(screen.getByLabelText('Modus')).toHaveAttribute('id', 'tourney-mode');
    expect(screen.getByLabelText('Modus')).toBeDisabled();
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<Select label="Modus" options={OPTIONS} help="Hinweis" required />);
    await expectNoA11yViolations(container);
  });
});
