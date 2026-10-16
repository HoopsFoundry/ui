import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './Checkbox';
import { expectNoA11yViolations } from './test-utils';

describe('Checkbox', () => {
  it('ist über das Label als checkbox auffindbar und schaltet per Klick', () => {
    const onChange = vi.fn();
    render(<Checkbox label="Mit Rückspiel" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Mit Rückspiel' });
    expect(box).not.toBeChecked();
    fireEvent.click(screen.getByText('Mit Rückspiel'));
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('ist kontrolliert über checked', () => {
    const { rerender } = render(<Checkbox label="A" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    rerender(<Checkbox label="A" checked onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('verknüpft den Hinweistext per aria-describedby', () => {
    render(<Checkbox label="Mit Rückspiel" hint="Jede Paarung wird zweimal gespielt." />);
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Jede Paarung wird zweimal gespielt.');
  });

  it('setzt Dichte- und Disabled-Klassen', () => {
    const { container } = render(<Checkbox label="A" density="compact" disabled />);
    expect(container.querySelector('label')).toHaveClass('hoops-check', 'hoops-check--compact', 'is-disabled');
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('reicht die ref an das input durch', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox label="A" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('checkbox'));
  });

  it('hat keine A11y-Verstöße', async () => {
    const { container } = render(<Checkbox label="Mit Rückspiel" hint="Hinweis" />);
    await expectNoA11yViolations(container);
  });
});
