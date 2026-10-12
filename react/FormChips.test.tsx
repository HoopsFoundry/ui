import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormChips } from './FormChips';
import { expectNoA11yViolations } from './test-utils';

describe('FormChips', () => {
  it('Zeichen sind aria-hidden, der Text sagt Sieg, Niederlage, Unentschieden (nie nur Farbe)', () => {
    const { container } = render(<FormChips form={['S', 'N', 'U']} />);
    expect(container.querySelector('.dss-form-list')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Form: Sieg, Niederlage, Unentschieden')).toHaveClass('dss-sr-only');
    expect(container.querySelectorAll('.dss-form-item')).toHaveLength(3);
  });
  it('höchstens die letzten fünf, neueste zuletzt', () => {
    const { container } = render(<FormChips form={['N', 'S', 'S', 'N', 'U', 'S']} />);
    expect([...container.querySelectorAll('.dss-form-item')].map((el) => el.className.split('--')[1])).toEqual(['s', 's', 'n', 'u', 's']);
  });
  it('letters setzt die Variante, className wird angehängt', () => {
    const { container } = render(<FormChips form={['S']} variant="letters" className="mein" />);
    expect(container.firstElementChild).toHaveClass('dss-form', 'dss-form--letters', 'mein');
  });
  it('ohne gültigen Eintrag erscheint nichts', () => {
    const { container } = render(<FormChips form={['x', 1, null] as never} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('keine Verstöße gegen die Barrierefreiheit (in einer Tabellenzelle)', async () => {
    const { container } = render(<table><caption>Test</caption><thead><tr><th>Form</th></tr></thead><tbody><tr><td><FormChips form={['S', 'N']} /></td></tr></tbody></table>);
    await expectNoA11yViolations(container);
  });
});
