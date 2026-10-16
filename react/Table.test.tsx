import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, type TableColumn } from './Table';
import { expectNoA11yViolations } from './test-utils';

const COLUMNS: TableColumn[] = [
  { key: 'team', label: 'Team' },
  { key: 'pts', label: 'Punkte', align: 'right', sortable: true, sort: 'desc' },
  { key: 'dif', label: 'Diff', align: 'center', width: '80px' },
];

const ROWS = (
  <tr>
    <td>Alpha</td>
    <td className="num">12</td>
    <td className="center">+4</td>
  </tr>
);

describe('Table', () => {
  it('rendert Kopfbereich mit Titel, Meta und Live-Marke', () => {
    const { container } = render(
      <Table title="Tabelle" meta="Gruppe A" live columns={COLUMNS}>
        {ROWS}
      </Table>,
    );
    expect(screen.getByRole('heading', { name: 'Tabelle', level: 3 })).toBeInTheDocument();
    expect(container.querySelector('.hoops-frame-meta')).toHaveTextContent('Gruppe A');
    expect(container.querySelector('.hoops-crumb')).toHaveTextContent('Live');
  });

  it('nutzt die gewünschte Überschriftenebene', () => {
    render(
      <Table title="Tabelle" titleAs="h2" columns={COLUMNS}>
        {ROWS}
      </Table>,
    );
    expect(screen.getByRole('heading', { name: 'Tabelle', level: 2 })).toBeInTheDocument();
  });

  it('rendert ohne Titel, Meta und Live keinen Kopfbereich', () => {
    const { container } = render(<Table columns={COLUMNS}>{ROWS}</Table>);
    expect(container.querySelector('.hoops-frame-head')).toBeNull();
  });

  it('setzt Spalten-Ausrichtung, Breite und aria-sort', () => {
    render(<Table columns={COLUMNS}>{ROWS}</Table>);
    const pts = screen.getByRole('columnheader', { name: 'Punkte' });
    expect(pts).toHaveClass('right', 'sortable', 'sort-desc');
    expect(pts).toHaveAttribute('aria-sort', 'descending');
    expect(screen.getByRole('columnheader', { name: 'Diff' })).toHaveStyle({ width: '80px' });
    expect(screen.getByRole('columnheader', { name: 'Team' })).not.toHaveAttribute('aria-sort');
  });

  it('setzt Dichte, Striping und dunkle Fläche', () => {
    const { container } = render(
      <Table density="dense" striped dark columns={COLUMNS}>
        {ROWS}
      </Table>,
    );
    expect(container.firstElementChild).toHaveClass('hoops-frame', 'hoops-frame--dark');
    expect(container.querySelector('table')).toHaveClass('hoops-tbl', 'hoops-tbl--dense', 'hoops-tbl--striped');
  });

  it('rendert tfoot und gibt der Tabelle über caption einen Namen', () => {
    const { container } = render(
      <Table caption="Tabellenstand" columns={COLUMNS} foot={<tr><td>Summe</td><td className="num">12</td><td /></tr>}>
        {ROWS}
      </Table>,
    );
    expect(screen.getByRole('table', { name: 'Tabellenstand' })).toBeInTheDocument();
    expect(container.querySelector('tfoot')).toHaveTextContent('Summe');
  });

  it('hat keine A11y-Verstöße', async () => {
    const { container } = render(
      <Table title="Tabelle" caption="Tabellenstand" columns={COLUMNS}>
        {ROWS}
      </Table>,
    );
    await expectNoA11yViolations(container);
  });

  it('rendert nur ein thead, wenn columns und head gleichzeitig übergeben werden (columns gewinnt)', () => {
    const { container } = render(
      <Table columns={COLUMNS} head={<tr><th>Eigener Kopf</th></tr>}>
        {ROWS}
      </Table>,
    );
    expect(container.querySelectorAll('thead')).toHaveLength(1);
    expect(screen.queryByText('Eigener Kopf')).toBeNull();
  });
});
