import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';
import { ICON_NAMES, SPRITE } from '../icons/sprite';
import { expectNoA11yViolations } from './test-utils';

describe('Icon', () => {
  it('ist ohne title dekorativ (aria-hidden)', () => {
    const { container } = render(<Icon name="trophy" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('aria-label');
    expect(svg.querySelector('use')).toHaveAttribute('href', '#i-trophy');
  });

  it('wird mit title zum beschrifteten Bild', () => {
    render(<Icon name="warn" title="Warnung" />);
    expect(screen.getByRole('img', { name: 'Warnung' })).toBeInTheDocument();
  });

  it('übernimmt size und className', () => {
    const { container } = render(<Icon name="home" size={16} className="extra" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('width', '16');
    expect(svg).toHaveAttribute('height', '16');
    expect(svg).toHaveClass('hoops-icon', 'extra');
  });

  it('fügt den Sprite genau einmal ein und parst alle Symbole', () => {
    render(
      <>
        <Icon name="home" />
        <Icon name="trophy" />
      </>,
    );
    expect(document.querySelectorAll('#hoops-icon-sprite')).toHaveLength(1);
    // Fängt kaputtes XML ab: bei einem Parse-Fehler gäbe es kein einziges <symbol>.
    expect(document.querySelectorAll('#hoops-icon-sprite symbol')).toHaveLength(ICON_NAMES.length);
  });

  it('hat für jeden Namen ein Symbol im Sprite', () => {
    for (const name of ICON_NAMES) {
      expect(SPRITE, `Symbol i-${name}`).toContain(`id="i-${name}"`);
    }
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<Icon name="trophy" title="Pokal" />);
    await expectNoA11yViolations(container);
  });
});
