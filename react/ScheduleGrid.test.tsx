import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ScheduleGrid } from './ScheduleGrid';
import type { ScheduleGame, ScheduleGridColumn } from './schedule-types';
import { expectNoA11yViolations } from './test-utils';

const COLUMNS: ScheduleGridColumn[] = [
  { id: 'f1', label: 'Sporthalle Nordhain' },
  { id: 'f2', label: 'Feld 2' },
];

const GAMES: ScheduleGame[] = [
  {
    id: 'a', state: 'finished', nr: '#1', section: 'Gruppe A', time: '09:00', column: 'f1',
    heim: { name: 'TSV Nordhain', score: 42, own: true }, gast: { name: 'Lindenberg Hawks', score: 31 },
  },
  {
    id: 'b', state: 'live', nr: '#2', section: 'Gruppe A', time: '09:00', column: 'f2',
    heim: { name: 'BG Seeberg', score: 12 }, gast: { name: 'TV Elbach', score: 10 },
  },
  {
    id: 'c', state: 'cancelled', nr: '#3', time: '09:30', column: 'f1', note: 'Rückzug TV Elbach',
    heim: { name: 'TSV Nordhain' }, gast: { name: 'TV Elbach' },
  },
  {
    id: 'd', state: 'scheduled', nr: '#9', section: 'Halbfinale', time: '11:00', column: 'f1',
    heim: { name: 'Erster Gruppe A', placeholder: true }, gast: { name: 'Zweiter Gruppe B', placeholder: true },
  },
  { id: 'e', state: 'bye', time: '09:30', heim: { name: 'MTV Bergfeld' } },
];

describe('ScheduleGrid', () => {
  it('zeigt Zeit als Zeilenkopf und freie Hallennamen als Spaltenköpfe', () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} />);
    expect([...container.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Zeit', 'Sporthalle Nordhain', 'Feld 2',
    ]);
    const rowHeads = [...container.querySelectorAll('tbody th[scope="row"]')].map((th) => th.textContent);
    expect(rowHeads).toEqual(['09:00', '09:30', '09:30', '11:00']);
  });

  it('setzt die Spiele in die richtige Spalte und zeigt leere Zellen als "frei"', () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} />);
    const firstRow = container.querySelector('tbody tr') as HTMLElement;
    const cells = firstRow.querySelectorAll('td.hoops-sg-cell');
    expect(within(cells[0] as HTMLElement).getByText('TSV Nordhain')).toBeInTheDocument();
    expect(within(cells[1] as HTMLElement).getByText('BG Seeberg')).toBeInTheDocument();
    const emptyCells = container.querySelectorAll('td.hoops-sg-cell.is-empty');
    expect(emptyCells.length).toBeGreaterThan(0);
    expect(within(emptyCells[0] as HTMLElement).getByText('frei')).toHaveClass('hoops-sg-empty');
  });

  it('trägt den Spaltennamen als data-label für die Handy-Ansicht', () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} />);
    const cells = container.querySelectorAll('tbody tr:first-child td.hoops-sg-cell');
    expect(cells[0]).toHaveAttribute('data-label', 'Sporthalle Nordhain');
    expect(cells[1]).toHaveAttribute('data-label', 'Feld 2');
  });

  it('zeigt Zustände in der Zelle: live, Ergebnis, abgesagt, Platzhalter, Meta', () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} />);
    expect(container.querySelector('.hoops-sg-game.is-own')).toBeInTheDocument();
    expect(container.querySelector('.hoops-sg-game.is-live .hoops-match-live')).toHaveTextContent('Live');
    expect(screen.getByText('Heim 42, Gast 31')).toHaveClass('hoops-sr-only');
    expect(screen.getByText('Heim 12, Gast 10, läuft')).toBeInTheDocument();
    expect(container.querySelector('.hoops-sg-game.is-cancelled')).toBeInTheDocument();
    expect(screen.getByText('Rückzug TV Elbach')).toHaveClass('hoops-sch-note');
    expect(screen.getByText('Erster Gruppe A')).toHaveClass('hoops-sch-ph');
    expect(screen.getByText('#1 · Gruppe A')).toHaveClass('hoops-sg-meta');
  });

  it('zeigt Pausen und Freilose als Zeile über alle Spalten', () => {
    const { container } = render(
      <ScheduleGrid games={GAMES} columns={COLUMNS} breaks={[{ time: '10:00', label: 'Mittagspause' }]} />,
    );
    const pause = container.querySelector('tr.hoops-sg-break td') as HTMLElement;
    expect(pause).toHaveAttribute('colspan', '2');
    expect(pause).toHaveTextContent('Mittagspause');
    const bye = container.querySelector('tr.hoops-sg-bye td') as HTMLElement;
    expect(bye).toHaveTextContent('MTV Bergfeld hat Freilos');
    const order = [...container.querySelectorAll('tbody tr')].map((tr) => tr.className || 'slot');
    expect(order).toEqual(['slot', 'slot', 'hoops-sg-bye', 'hoops-sg-break', 'slot']);
  });

  it('nutzt eigenen Text für leere Zellen und rendert den Slot notice', () => {
    const { container } = render(
      <ScheduleGrid
        games={GAMES}
        columns={COLUMNS}
        emptyLabel="–"
        renderNotice={(g) => (g.id === 'a' ? <span className="hoops-chip hoops-chip--warn">Sperrzeit</span> : null)}
      />,
    );
    expect(screen.getByText('Sperrzeit')).toBeInTheDocument();
    expect(container.querySelector('.hoops-sg-empty')).toHaveTextContent('–');
  });

  it('druckt kein "undefined" bei beendetem Spiel mit nur opponent und ownScore', () => {
    const perspective: ScheduleGame = {
      id: 'p', state: 'finished', time: '09:00', column: 'f1',
      opponent: { name: 'Lindenberg Hawks', score: 31 }, ownScore: 42,
    };
    const { container } = render(<ScheduleGrid games={[perspective]} columns={COLUMNS} />);
    expect(container.textContent).not.toContain('undefined');
    expect(container.querySelector('.hoops-sg-result')).toBeNull();
  });

  it('druckt kein "undefined" bei gemischtem Spiel (heim/gast ohne Ergebnis plus Perspektive)', () => {
    const mixed: ScheduleGame = {
      id: 'm', state: 'finished', time: '09:00', column: 'f1',
      heim: { name: 'A' }, gast: { name: 'B' },
      opponent: { name: 'C', score: 31 }, ownScore: 42,
    };
    const { container } = render(<ScheduleGrid games={[mixed]} columns={COLUMNS} />);
    expect(container.textContent).not.toContain('undefined');
    expect(container.querySelector('.hoops-sg-result')).toBeNull();
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} caption="Zeitraster" />);
    await expectNoA11yViolations(container);
  });
});

describe('ScheduleGrid · Zustand als Text', () => {
  const base: ScheduleGame = {
    id: 's', state: 'scheduled', time: '09:00', column: 'f1', heim: { name: 'A' }, gast: { name: 'B' },
  };
  const srTexts = (container: HTMLElement) =>
    [...container.querySelectorAll('.hoops-sr-only')].map((el) => el.textContent?.trim());

  it('macht abgesagte Spiele hörbar, als erstes Kind von hoops-sg-teams', () => {
    const { container } = render(<ScheduleGrid games={[{ ...base, state: 'cancelled' }]} columns={COLUMNS} />);
    const span = container.querySelector('.hoops-sg-teams > .hoops-sr-only') as HTMLElement;
    expect(span).toHaveTextContent('abgesagt');
    expect(span).toBe(container.querySelector('.hoops-sg-teams')?.firstElementChild);
  });

  it('macht verschobene Spiele hörbar', () => {
    const { container } = render(<ScheduleGrid games={[{ ...base, state: 'postponed' }]} columns={COLUMNS} />);
    expect(container.querySelector('.hoops-sg-teams > .hoops-sr-only')).toHaveTextContent('verschoben');
  });

  it('sagt bei angesetzten und beendeten Spielen nichts', () => {
    const finished: ScheduleGame = {
      ...base, id: 'f', state: 'finished', heim: { name: 'A', score: 1 }, gast: { name: 'B', score: 2 },
    };
    const { container } = render(<ScheduleGrid games={[base, finished]} columns={COLUMNS} />);
    expect(srTexts(container)).not.toContain('abgesagt');
    expect(srTexts(container)).not.toContain('verschoben');
  });
});

describe('ScheduleGrid · weitere Fälle', () => {
  const game = (extra: Partial<ScheduleGame> & { id: string }): ScheduleGame => ({
    state: 'scheduled', time: '09:00', column: 'f1', heim: { name: 'A' }, gast: { name: 'B' }, ...extra,
  });

  it('zeigt Kopf mit Titel und Meta, Überschriftenebene über titleAs', () => {
    const { container } = render(
      <ScheduleGrid games={GAMES} columns={COLUMNS} title="Turnier" meta="Stand 08.10." titleAs="h2" />,
    );
    const head = container.querySelector('.hoops-frame-head') as HTMLElement;
    expect(head).toBeInTheDocument();
    expect(within(head).getByRole('heading', { level: 2 })).toHaveTextContent('Turnier');
    expect(head.querySelector('.hoops-frame-meta')).toHaveTextContent('Stand 08.10.');
  });

  it('hat ohne Titel und Meta keinen Kopf', () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} />);
    expect(container.querySelector('.hoops-frame-head')).toBeNull();
  });

  it('zeigt bei vorgegebenen slots auch leere Zeilen mit "frei"', () => {
    const { container } = render(
      <ScheduleGrid games={[game({ id: 'x' })]} columns={COLUMNS} slots={['09:00', '10:00']} />,
    );
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[1].querySelector('th')).toHaveTextContent('10:00');
    const cells = rows[1].querySelectorAll('td.hoops-sg-cell.is-empty');
    expect(cells).toHaveLength(2);
    cells.forEach((cell) => expect(cell).toHaveTextContent('frei'));
  });

  it('nutzt renderLink für Teamnamen mit href', () => {
    const { container } = render(
      <ScheduleGrid
        games={[game({ id: 'l', heim: { name: 'TSV Nordhain', href: '/teams/troester' } })]}
        columns={COLUMNS}
        renderLink={({ href, className, children }) => (
          <a data-router="1" href={href} className={className}>
            {children}
          </a>
        )}
      />,
    );
    const link = container.querySelector('a[data-router="1"]') as HTMLElement;
    expect(link).toHaveAttribute('href', '/teams/troester');
    expect(link).toHaveClass('hoops-link');
    expect(link).toHaveTextContent('TSV Nordhain');
  });

  it('stapelt mehrere Spiele in einer Zelle', () => {
    const { container } = render(
      <ScheduleGrid
        games={[
          game({ id: 'one', heim: { name: 'Eins' } }),
          game({ id: 'two', heim: { name: 'Zwei' } }),
        ]}
        columns={COLUMNS}
      />,
    );
    const cell = container.querySelector('td.hoops-sg-cell') as HTMLElement;
    const games = cell.querySelectorAll('.hoops-sg-game');
    expect(games).toHaveLength(2);
    expect(games[0]).toHaveTextContent('Eins');
    expect(games[1]).toHaveTextContent('Zwei');
    expect(cell).not.toHaveClass('is-empty');
  });

  it('zeigt Spiele mit unbekannter Spalte oder ohne Zeit nicht an', () => {
    const { container } = render(
      <ScheduleGrid
        games={[
          game({ id: 'ok', heim: { name: 'Sichtbar' } }),
          game({ id: 'col', column: 'gibtsnicht', heim: { name: 'UnbekannteSpalte' } }),
          game({ id: 'time', time: undefined, heim: { name: 'OhneZeit' } }),
        ]}
        columns={COLUMNS}
      />,
    );
    expect(container).toHaveTextContent('Sichtbar');
    expect(container).not.toHaveTextContent('UnbekannteSpalte');
    expect(container).not.toHaveTextContent('OhneZeit');
    expect(container.querySelectorAll('.hoops-sg-game')).toHaveLength(1);
  });

  it('markiert verschobene Spiele', () => {
    const { container } = render(<ScheduleGrid games={[game({ id: 'pp', state: 'postponed' })]} columns={COLUMNS} />);
    expect(container.querySelector('.hoops-sg-game.is-postponed')).toBeInTheDocument();
  });

  it('zeigt "vorläufig" klein und sagt es im gesprochenen Ergebnis', () => {
    const { container } = render(
      <ScheduleGrid
        games={[game({ id: 'pv', state: 'finished', provisional: true, heim: { name: 'A', score: 10 }, gast: { name: 'B', score: 8 } })]}
        columns={COLUMNS}
      />,
    );
    const small = container.querySelector('.hoops-sg-result small') as HTMLElement;
    expect(small).toHaveTextContent('vorläufig');
    expect(small).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.hoops-sg-result .hoops-sr-only')?.textContent).toContain('vorläufig');
  });

  it('setzt die Dichte als Klasse', () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} density="compact" />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--compact');
  });

  it('hat standardmäßig die Dichte "default"', () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--default');
  });

  it('rendert caption als unsichtbare Tabellenbeschriftung', () => {
    const { container } = render(<ScheduleGrid games={GAMES} columns={COLUMNS} caption="Zeitraster Samstag" />);
    const caption = container.querySelector('caption') as HTMLElement;
    expect(caption).toHaveClass('hoops-sr-only');
    expect(caption).toHaveTextContent('Zeitraster Samstag');
  });

  it('nutzt "frei" als Standardtext für leere Zellen', () => {
    const { container } = render(<ScheduleGrid games={[game({ id: 'only' })]} columns={COLUMNS} />);
    expect(container.querySelector('.hoops-sg-empty')).toHaveTextContent(/^frei$/);
  });

  it('sagt bei einem Freilos ohne Zeit "Zeit offen"', () => {
    const { container } = render(
      <ScheduleGrid games={[game({ id: 'g' }), { id: 'by', state: 'bye', heim: { name: 'MTV Bergfeld' } }]} columns={COLUMNS} />,
    );
    const head = container.querySelector('tr.hoops-sg-bye th') as HTMLElement;
    expect(head.querySelector('.hoops-sr-only')).toHaveTextContent('Zeit offen');
    expect(head.textContent).toBe('Zeit offen');
  });

  it('hat mit Pausen und Freilos (auch ohne Zeit) keine axe-Verstöße', async () => {
    const { container } = render(
      <ScheduleGrid
        games={[...GAMES, { id: 'by2', state: 'bye', note: 'Aufbau' }]}
        columns={COLUMNS}
        breaks={[{ time: '10:00', label: 'Mittagspause' }]}
        caption="Zeitraster"
      />,
    );
    await expectNoA11yViolations(container);
  });
});

describe('ScheduleGrid · Scrollbereich', () => {
  it('ist eine fokussierbare Region, benannt nach caption', () => {
    render(<ScheduleGrid games={GAMES} columns={COLUMNS} caption="Zeitraster Samstag" title="Titel" />);
    const region = screen.getByRole('region', { name: 'Zeitraster Samstag' });
    expect(region).toHaveClass('hoops-table-scroll');
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('nutzt ohne caption den Titel als Namen', () => {
    render(<ScheduleGrid games={GAMES} columns={COLUMNS} title="Hallenbelegung" />);
    expect(screen.getByRole('region', { name: 'Hallenbelegung' })).toHaveAttribute('tabindex', '0');
  });

  it('nutzt ohne caption und mit nicht-textuellem Titel den Standardnamen', () => {
    render(<ScheduleGrid games={GAMES} columns={COLUMNS} title={<em>Titel</em>} />);
    expect(screen.getByRole('region', { name: 'Zeitraster' })).toBeInTheDocument();
  });

  it('nutzt ohne caption und Titel den Standardnamen', () => {
    render(<ScheduleGrid games={GAMES} columns={COLUMNS} />);
    expect(screen.getByRole('region', { name: 'Zeitraster' })).toBeInTheDocument();
  });
});
