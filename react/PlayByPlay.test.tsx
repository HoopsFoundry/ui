import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayByPlay, type PbpEvent } from './PlayByPlay';
import { expectNoA11yViolations } from './test-utils';

const EVENTS: PbpEvent[] = [
  { id: 1, time: '02:14', quarter: 'Q4', team: 'heim', kind: 'score-3p', titleBold: 'Drei-Punkte-Wurf', title: 'M. Okafor #7', detail: 'Assist · K. Vogler #13', score: { heim: 87, gast: 64 } },
  { id: 2, time: '03:05', quarter: 'Q4', team: 'gast', kind: 'foul', title: '5. Foul · H. Lorenz #23', score: { heim: 84, gast: 64 } },
  { id: 3, time: '04:45', quarter: 'Q4', team: 'none', kind: 'sub', title: 'Auswechslung' },
];

describe('PlayByPlay', () => {
  it('rendert Titel als Überschrift und den Feed als benanntes Log', () => {
    render(<PlayByPlay events={EVENTS} title="Spielverlauf" />);
    expect(screen.getByRole('heading', { name: 'Spielverlauf', level: 3 })).toBeInTheDocument();
    const log = screen.getByRole('log', { name: 'Spielverlauf' });
    expect(log).toHaveAttribute('tabindex', '0');
  });

  it('rendert jedes Ereignis mit Zeit, Viertel, fettem Titelteil und Detail', () => {
    const { container } = render(<PlayByPlay events={EVENTS} />);
    expect(container.querySelectorAll('.hoops-pbp-event')).toHaveLength(3);
    expect(screen.getByText('02:14')).toBeInTheDocument();
    expect(screen.getByText('Drei-Punkte-Wurf').tagName).toBe('B');
    expect(screen.getByText('Assist · K. Vogler #13')).toHaveClass('hoops-pbp-detail');
  });

  it('setzt die Ereignisart als Klasse und die Teamfarbe am Streifen', () => {
    const { container } = render(<PlayByPlay events={EVENTS} />);
    const events = container.querySelectorAll('.hoops-pbp-event');
    expect(events[1]).toHaveClass('hoops-pbp-event--foul');
    expect(events[2]).toHaveClass('hoops-pbp-event--sub');
    const strips = container.querySelectorAll('.hoops-pbp-strip');
    expect(strips[0]).toHaveClass('hoops-pbp-strip--heim');
    expect(strips[1]).toHaveClass('hoops-pbp-strip--gast');
    expect(strips[2]).toHaveClass('hoops-pbp-strip--none');
    strips.forEach((strip) => expect(strip).toHaveAttribute('aria-hidden', 'true'));
  });

  it('sagt die Mannschaft per Screenreader-Text an', () => {
    render(<PlayByPlay events={EVENTS} />);
    expect(screen.getAllByText('Heim:')[0]).toHaveClass('hoops-sr-only');
    expect(screen.getAllByText('Gast:')[0]).toHaveClass('hoops-sr-only');
  });

  it('beschriftet den Spielstand zusammenhängend und lässt ihn ohne Score weg', () => {
    const { container } = render(<PlayByPlay events={EVENTS} />);
    expect(screen.getByText('Spielstand 87 zu 64')).toHaveClass('hoops-sr-only');
    const visible = container.querySelector('.hoops-pbp-score [aria-hidden="true"]');
    expect(visible).toHaveTextContent('87:64');
    expect(container.querySelectorAll('.hoops-pbp-score')).toHaveLength(2);
  });

  it('zeigt Live-Marke, Meta und dunkle Fläche', () => {
    const { container } = render(<PlayByPlay events={EVENTS} live meta="Q4" dark />);
    expect(container.firstElementChild).toHaveClass('hoops-pbp-frame', 'hoops-pbp-frame--dark');
    expect(container.querySelector('.hoops-pbp-live')).toHaveTextContent('Live');
    expect(container.querySelector('.hoops-pbp-meta')).toHaveTextContent('Q4');
  });

  it('blendet die Live-Marke aus, wenn live false ist', () => {
    const { container } = render(<PlayByPlay events={EVENTS} live={false} />);
    expect(container.querySelector('.hoops-pbp-live')).toBeNull();
  });

  it('hat keine A11y-Verstöße', async () => {
    const { container } = render(<PlayByPlay events={EVENTS} />);
    await expectNoA11yViolations(container);
  });

  describe('Spielabschnitt (period, periods, quarter)', () => {
    const chip = (events: PbpEvent[], periods?: 4 | 8) => {
      const { container } = render(<PlayByPlay events={events} periods={periods} />);
      return container.querySelector('.hoops-pbp-q');
    };
    const ev = (extra: Partial<PbpEvent>): PbpEvent[] => [{ id: 1, time: '02:14', title: 'x', ...extra }];

    it.each([
      [{ period: 1 }, undefined, 'V1', '1. Viertel'],
      [{ period: 4 }, 4, 'V4', '4. Viertel'],
      [{ period: 5 }, 8, 'A5', '5. Achtel'],
      [{ period: 8 }, 8, 'A8', '8. Achtel'],
      [{ period: 5 }, 4, 'VL', 'Verlängerung'],
      [{ period: 6 }, 4, 'VL2', '2. Verlängerung'],
      [{ period: 9 }, 8, 'VL', 'Verlängerung'],
    ] as const)('%j (periods %s): Chip %s, Screenreader %s', (extra, periods, short, label) => {
      const q = chip(ev(extra), periods)!;
      expect(q.querySelector('[aria-hidden="true"]')).toHaveTextContent(short);
      expect(q.querySelector('.hoops-sr-only')).toHaveTextContent(label);
    });

    it('Alias quarter wird unverändert angezeigt, ohne Zusatztext', () => {
      const q = chip(ev({ quarter: 'Q4' }))!;
      expect(q).toHaveTextContent(/^Q4$/);
      expect(q.querySelector('.hoops-sr-only')).toBeNull();
    });

    it('period gewinnt gegen quarter', () => {
      expect(chip(ev({ period: 2, quarter: 'Q4' }))).toHaveTextContent('V22. Viertel');
    });

    it.each([0, -1, 2.5, Number.NaN])('ungültiges period %s: kein Chip', (period) => {
      expect(chip(ev({ period }))).toBeNull();
    });

    it('der Chip ist nicht doppelt: sichtbarer Text aria-hidden, voller Text einmal für Screenreader', () => {
      render(<PlayByPlay events={ev({ period: 3 })} />);
      expect(screen.getAllByText('3. Viertel')).toHaveLength(1);
    });
  });
});
