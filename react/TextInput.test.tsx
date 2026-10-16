import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextInput } from './TextInput';
import { expectNoA11yViolations } from './test-utils';

describe('TextInput', () => {
  it('verknüpft Label und Eingabefeld', () => {
    render(<TextInput label="Name" />);
    expect(screen.getByLabelText('Name')).toBeInstanceOf(HTMLInputElement);
  });

  it('übernimmt eine übergebene id für die Label-Verknüpfung', () => {
    render(<TextInput id="team-name" label="Name" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('id', 'team-name');
  });

  it('markiert Pflichtfelder: required am Input, Stern nur visuell', () => {
    render(<TextInput label="Name" required />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toBeRequired();
    expect(document.querySelector('.req')).toHaveAttribute('aria-hidden', 'true');
  });

  it('zeigt optional-Hinweis im Label-Bereich', () => {
    render(<TextInput label="Kürzel" optional="optional" />);
    expect(document.querySelector('.opt')).toHaveTextContent('optional');
  });

  it('verbindet Hilfetext per aria-describedby', () => {
    render(<TextInput label="Name" help="Mindestens 2 Zeichen" />);
    const input = screen.getByLabelText('Name');
    const help = screen.getByText('Mindestens 2 Zeichen');
    expect(input).toHaveAttribute('aria-describedby', help.id);
    expect(help).toHaveClass('hoops-field-help');
  });

  it('error-Zustand: aria-invalid, is-error am Wrapper, Hilfetext-Modifier', () => {
    render(<TextInput label="Name" state="error" help="Pflichtfeld" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(document.querySelector('.hoops-field')).toHaveClass('is-error');
    expect(screen.getByText('Pflichtfeld')).toHaveClass('hoops-field-help--err');
  });

  it('Dichte: default → hoops-input--default, compact → hoops-input--compact, touch → keine', () => {
    const { rerender } = render(<TextInput label="A" />);
    expect(screen.getByLabelText('A')).toHaveClass('hoops-input', 'hoops-input--default');
    rerender(<TextInput label="A" density="compact" />);
    expect(screen.getByLabelText('A')).toHaveClass('hoops-input--compact');
    rerender(<TextInput label="A" density="touch" />);
    expect(screen.getByLabelText('A')).not.toHaveClass('hoops-input--default', 'hoops-input--compact');
  });

  it('rendert prefix und suffix als Addons', () => {
    render(<TextInput label="Betrag" prefix="€" suffix="netto" />);
    expect(screen.getByText('€')).toHaveClass('hoops-addon');
    expect(screen.getByText('netto')).toHaveClass('hoops-addon', 'hoops-addon--right');
  });

  it('className geht an das Input, fieldClassName an den Wrapper', () => {
    render(<TextInput label="A" className="on-input" fieldClassName="on-field" />);
    expect(screen.getByLabelText('A')).toHaveClass('on-input');
    expect(document.querySelector('.hoops-field')).toHaveClass('on-field');
  });

  it('funktioniert kontrolliert und leitet die ref weiter', () => {
    const onChange = vi.fn();
    const ref = createRef<HTMLInputElement>();
    render(<TextInput ref={ref} label="Name" value="Alt" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Neu' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('reicht aria-label ohne sichtbares Label durch', () => {
    render(<TextInput aria-label="Suche" />);
    expect(screen.getByLabelText('Suche')).toBeInTheDocument();
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<TextInput label="Name" help="Hinweis" required />);
    await expectNoA11yViolations(container);
  });
});
