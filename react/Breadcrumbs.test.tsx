import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';
import { expectNoA11yViolations } from './test-utils';

const ITEMS: BreadcrumbItem[] = [
  { label: 'Vereine', href: '/vereine', tag: 'Admin' },
  { label: 'TSV Nordhain', href: '/vereine/tsv' },
  { label: 'Teams' },
];

describe('Breadcrumbs', () => {
  it('rendert eine benannte Navigation mit Links und aktueller Seite', () => {
    render(<Breadcrumbs items={ITEMS} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vereine' })).toHaveAttribute('href', '/vereine');
    expect(screen.getByRole('link', { name: 'TSV Nordhain' })).toHaveAttribute('href', '/vereine/tsv');
    const current = screen.getByText('Teams');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('is-current');
    expect(screen.queryByRole('link', { name: 'Teams' })).toBeNull();
  });

  it('setzt die Variantenklasse und blendet Tags nur in tagged ein', () => {
    const { container, rerender } = render(<Breadcrumbs items={ITEMS} />);
    expect(container.firstElementChild).toHaveClass('hoops-crumbs', 'hoops-crumbs--plain');
    expect(container.querySelector('.hoops-crumbs-tag')).toBeNull();
    rerender(<Breadcrumbs items={ITEMS} variant="tagged" />);
    expect(container.firstElementChild).toHaveClass('hoops-crumbs--tagged');
    expect(container.querySelector('.hoops-crumbs-tag')).toHaveTextContent('Admin');
  });

  it('rendert die Chip-Variante mit Chip-Klassen', () => {
    const { container } = render(<Breadcrumbs items={ITEMS} variant="chip" />);
    expect(container.querySelectorAll('.hoops-crumbs-chip')).toHaveLength(3);
    expect(container.querySelector('.hoops-crumbs-chip.is-current')).toHaveTextContent('Teams');
  });

  it('versteckt die Trennzeichen vor Screenreadern', () => {
    const { container } = render(<Breadcrumbs items={ITEMS} />);
    const seps = container.querySelectorAll('.hoops-crumbs-sep');
    expect(seps).toHaveLength(2);
    seps.forEach((sep) => expect(sep).toHaveAttribute('aria-hidden', 'true'));
  });

  it('rendert einen Zwischenschritt ohne href als Text', () => {
    render(<Breadcrumbs items={[{ label: 'Start', href: '/' }, { label: 'Ohne Link' }, { label: 'Ziel' }]} />);
    expect(screen.queryByRole('link', { name: 'Ohne Link' })).toBeNull();
    expect(screen.getByText('Ohne Link')).toBeInTheDocument();
  });

  it('hat keine A11y-Verstöße', async () => {
    const { container } = render(<Breadcrumbs items={ITEMS} variant="tagged" />);
    await expectNoA11yViolations(container);
  });
});
