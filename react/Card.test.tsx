import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';
import { expectNoA11yViolations } from './test-utils';

describe('Card', () => {
  it('rendert default/md mit Body', () => {
    const { container } = render(<Card>Inhalt</Card>);
    const card = container.firstElementChild!;
    expect(card).toHaveClass('hoops-card', 'hoops-card--default', 'hoops-card--pad-md');
    expect(card.querySelector('.hoops-card-body')).toHaveTextContent('Inhalt');
  });

  it('setzt variant und padding', () => {
    const { container } = render(<Card variant="elevated" padding="lg">X</Card>);
    expect(container.firstElementChild).toHaveClass('hoops-card--elevated', 'hoops-card--pad-lg');
  });

  it('rendert header und footer in ihren Bereichen', () => {
    const { container } = render(<Card header="Titel" footer="Fuß">Body</Card>);
    expect(container.querySelector('.hoops-card-head')).toHaveTextContent('Titel');
    expect(container.querySelector('.hoops-card-foot')).toHaveTextContent('Fuß');
  });

  it('wird mit href zum Link', () => {
    render(<Card href="/teams/1">Team</Card>);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/teams/1');
  });

  it('rendert as=article', () => {
    render(<Card as="article">Beitrag</Card>);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('klickbares div: role=button, tabIndex=0, Enter und Space lösen onClick aus', () => {
    const onClick = vi.fn();
    render(<Card variant="hoverable" onClick={onClick}>Klick</Card>);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabindex', '0');

    fireEvent.click(card);
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    fireEvent.keyDown(card, { key: 'a' });
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it.each([['Enter', 'Enter'], ['Space', ' ']])(
    'löst die Karte nicht aus, wenn %s auf einem Button innerhalb gedrückt wird',
    (_name, key) => {
      const onClick = vi.fn();
      render(
        <Card variant="hoverable" onClick={onClick}>
          <button type="button">Innen</button>
        </Card>,
      );
      const notPrevented = fireEvent.keyDown(screen.getByText('Innen'), { key });
      expect(onClick).not.toHaveBeenCalled();
      expect(notPrevented).toBe(true);
    },
  );

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<Card header="Titel" footer="Fuß">Body</Card>);
    await expectNoA11yViolations(container);
  });
});
