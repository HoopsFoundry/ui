import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { LeagueCard, type LeagueTeam } from './LeagueCard';
import { HeadingLevel } from './HeadingLevel';
import { expectNoA11yViolations } from './test-utils';

const NAMES = ['TSV Nordhain 1920', 'Lindenberg Hawks', 'BG Seeberg', 'SV Kiefernau', 'Elbach Eagles', 'TuS Waldmark', 'BC Sonnental', 'Hafenstadt Giants', 'SG Moorberg', 'Basket Auenland', 'TV Felsenau', 'BG Rotbach'];
const teams = (ownRank?: number): LeagueTeam[] =>
  NAMES.map((name, i) => ({ rank: i + 1, name, played: 10 + (i % 2), points: 30 - i * 2, won: 10 - i, lost: i, diff: 40 - i * 8, form: ['S', 'S', 'N', 'S', 'U'], ...(ownRank === i + 1 ? { own: true } : {}) }));
const bodyRows = () => screen.getAllByRole('row').slice(1);
const rankCells = () => bodyRows().map((row) => within(row).getAllByRole('cell')[0].textContent);

describe('LeagueCard', () => {
  it('minimal: Titel als h3, Untertitel aus der Liste, drei Zeilen, Kopf # Mannschaft SP PKT', () => {
    const { container } = render(<LeagueCard title="Oberliga Nordhain Männer" teams={teams()} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Oberliga Nordhain Männer' })).toBeInTheDocument();
    expect(screen.getByText('12 Teams')).toBeInTheDocument();
    expect(rankCells()).toEqual(['1', '2', '3']);
    const heads = screen.getAllByRole('columnheader').map((th) => th.textContent);
    expect(heads).toEqual(['#Platz', 'Mannschaft', 'SPSpiele', 'PKTPunkte']);
    expect(container.firstElementChild).toHaveClass('hoops-league');
    expect(container.querySelector('a')).toBeNull();
  });

  it('Untertitel mit Spielen und teamCount', () => {
    render(<LeagueCard title="L" teams={teams()} teamCount={12} played={15} total={132} />);
    expect(screen.getByText('12 Teams · 15 von 132 Spielen gespielt')).toBeInTheDocument();
  });

  it('Ausschnitt um die eigene Mannschaft: zwei davor, eigene, eins dahinter; caption nennt die Plätze', () => {
    render(<LeagueCard title="L" teams={teams(7)} />);
    expect(rankCells()).toEqual(['5', '6', '7', '8']);
    expect(screen.getByRole('table', { name: 'L, Plätze 5 bis 8 von 12' })).toBeInTheDocument();
  });

  it('Platz 1 und letzter Platz verschieben das Fenster', () => {
    const { unmount } = render(<LeagueCard title="L" teams={teams(1)} />);
    expect(rankCells()).toEqual(['1', '2', '3', '4']);
    unmount();
    render(<LeagueCard title="L" teams={teams(12)} />);
    expect(rankCells()).toEqual(['9', '10', '11', '12']);
  });

  it('limit ohne eigene Mannschaft', () => {
    render(<LeagueCard title="L" teams={teams()} limit={5} />);
    expect(rankCells()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('eigene Zeile: is-own und versteckter Text', () => {
    render(<LeagueCard title="L" teams={teams(2)} />);
    const own = bodyRows().filter((row) => row.classList.contains('is-own'));
    expect(own).toHaveLength(1);
    expect(own[0]).toHaveTextContent('Lindenberg Hawks, eigene Mannschaft');
    expect(screen.getAllByText(/eigene Mannschaft/)).toHaveLength(1);
  });

  it('optionale Spalten S, N, Diff, Form mit Vorzeichen und Text', () => {
    render(<LeagueCard title="L" teams={teams(1)} columns={['won', 'lost', 'diff', 'form']} />);
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual(['#Platz', 'Mannschaft', 'SPSpiele', 'SSiege', 'NNiederlagen', 'DiffKorbdifferenz', 'PKTPunkte', 'Form']);
    const first = within(bodyRows()[0]).getAllByRole('cell');
    expect(first.map((c) => c.textContent?.replace(/, eigene Mannschaft/, ''))).toEqual(['1', 'TSV Nordhain 1920', '10', '10', '0', '+40', '30', 'Form: Sieg, Sieg, Niederlage, Sieg, Unentschieden']);
    expect(first[5]).toHaveClass('plus');
    const last = within(bodyRows()[3]).getAllByRole('cell');
    expect(last[5]).toHaveTextContent('+16');
  });

  it('negative Differenz mit Minuszeichen und Klasse minus; 0 ohne Farbe', () => {
    const rows: LeagueTeam[] = [
      { rank: 1, name: 'A', played: 1, points: 2, diff: -5 },
      { rank: 2, name: 'B', played: 1, points: 2, diff: 0 },
    ];
    render(<LeagueCard title="L" teams={rows} columns={['diff']} />);
    const cells = bodyRows().map((row) => within(row).getAllByRole('cell')[3]);
    expect(cells[0]).toHaveTextContent('−5');
    expect(cells[0]).toHaveClass('minus');
    expect(cells[1]).toHaveTextContent('0');
    expect(cells[1]).not.toHaveClass('plus', 'minus');
  });

  it('Form ohne Spalte erscheint nicht; die Form-Punkte sind aria-hidden', () => {
    const { container, rerender } = render(<LeagueCard title="L" teams={teams()} />);
    expect(container.querySelector('.hoops-form')).toBeNull();
    expect(screen.queryByText(/Form:/)).toBeNull();
    rerender(<LeagueCard title="L" teams={teams()} columns={['form']} />);
    expect(container.querySelector('.hoops-form-list')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('.hoops-form-item--s').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Form: Sieg, Sieg, Niederlage, Sieg, Unentschieden').length).toBeGreaterThan(0);
  });

  it('Zonen: Streifen-Klasse, versteckter Text je Zeile und Legende nur mit Zone', () => {
    const rows = teams(2).map((t) => (t.rank === 1 ? { ...t, zone: 'up' as const } : t.rank === 4 ? { ...t, zone: 'down' as const } : t));
    const { container } = render(<LeagueCard title="L" teams={rows} />);
    expect(bodyRows()[0]).toHaveClass('hoops-league-zone--up');
    expect(bodyRows()[0]).toHaveTextContent('TSV Nordhain 1920, Aufstiegsplatz');
    expect(bodyRows()[3]).toHaveTextContent('SV Kiefernau, Abstiegsplatz');
    const legend = screen.getByRole('list', { name: 'Legende' });
    expect(within(legend).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Aufstieg', 'Abstieg']);
    expect(container.querySelectorAll('.hoops-league-key')).toHaveLength(2);
  });

  it('Legende nur für sichtbare Zonen; ohne Zone keine Legende', () => {
    const rows = teams().map((t) => (t.rank === 9 ? { ...t, zone: 'down' as const } : t));
    render(<LeagueCard title="L" teams={rows} />);
    expect(screen.queryByRole('list', { name: 'Legende' })).toBeNull();
  });

  it('Relegation: Text in Zeile und Legende', () => {
    render(<LeagueCard title="L" teams={[{ rank: 1, name: 'A', played: 1, points: 1, zone: 'playoff' }]} />);
    expect(bodyRows()[0]).toHaveTextContent('A, Relegation');
    expect(screen.getByRole('list', { name: 'Legende' })).toHaveTextContent('Relegation');
  });

  it('Fußlink: Standardtext, eindeutiger Name, linkLabel änderbar, ohne href kein Link', () => {
    const { rerender } = render(<LeagueCard title="Oberliga Nordhain Männer" teams={teams()} href="/liga/tabelle" />);
    const link = screen.getByRole('link', { name: 'Komplette Tabelle und Spielplan, Oberliga Nordhain Männer' });
    expect(link).toHaveAttribute('href', '/liga/tabelle');
    rerender(<LeagueCard title="L" teams={teams()} href="/x" linkLabel="Alle Spiele" />);
    expect(screen.getByRole('link', { name: 'Alle Spiele, L' })).toBeInTheDocument();
    rerender(<LeagueCard title="L" teams={teams()} />);
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('Teamnamen mit href sind Links', () => {
    const rows = teams().map((t) => ({ ...t, href: `/t/${t.rank}` }));
    render(<LeagueCard title="L" teams={rows} />);
    expect(screen.getByRole('link', { name: 'TSV Nordhain 1920' })).toHaveAttribute('href', '/t/1');
  });

  it('Live: Zahl als Text, true nur Live, false nichts', () => {
    const { container, rerender } = render(<LeagueCard title="L" teams={teams()} live={2} />);
    expect(container.querySelector('.hoops-live')).toHaveTextContent('Live');
    expect(screen.getByText('2 Spiele laufen')).toBeInTheDocument();
    expect(container.querySelector('.hoops-live-dot')).toHaveAttribute('aria-hidden', 'true');
    rerender(<LeagueCard title="L" teams={teams()} live={1} />);
    expect(screen.getByText('1 Spiel läuft')).toBeInTheDocument();
    rerender(<LeagueCard title="L" teams={teams()} live />);
    expect(container.querySelector('.hoops-league-live-n')).toBeNull();
    expect(container.querySelector('.hoops-live')).not.toBeNull();
    rerender(<LeagueCard title="L" teams={teams()} live={0} />);
    expect(container.querySelector('.hoops-league-live')).toBeNull();
    rerender(<LeagueCard title="L" teams={teams()} live={false} />);
    expect(container.querySelector('.hoops-league-live')).toBeNull();
  });

  it('Logos und Kurznamen: voller Name genau einmal für Hilfstechnik, Initialen als Rückfall', () => {
    const rows: LeagueTeam[] = [
      { rank: 1, name: 'TSV Nordhain 1920', short: 'Nordhain', logo: '/l/n.svg', played: 1, points: 2 },
      { rank: 2, name: 'SV Kiefernau', played: 1, points: 0 },
    ];
    const { container } = render(<LeagueCard title="L" teams={rows} logos names="short" />);
    expect(container.querySelectorAll('.hoops-team-logo')).toHaveLength(2);
    expect(container.querySelector('.hoops-team-logo img')).toHaveAttribute('alt', '');
    expect(container.querySelector('.hoops-team-logo--initials')).toHaveTextContent('SK');
    expect(container.querySelector('.hoops-team-name--short')).not.toBeNull();
    expect(container.querySelector('.hoops-name-short')).toHaveAttribute('title', 'TSV Nordhain 1920');
    expect(container.querySelector('.hoops-name-short')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByText('TSV Nordhain 1920')).toHaveLength(1);
  });

  it('ohne logos keine Logos', () => {
    const { container } = render(<LeagueCard title="L" teams={teams()} />);
    expect(container.querySelector('.hoops-team-logo')).toBeNull();
  });

  it('compact: Klasse, Dichte compact, kein Untertitel', () => {
    const { container } = render(<LeagueCard title="L" teams={teams()} size="compact" played={1} total={2} />);
    expect(container.firstElementChild).toHaveClass('hoops-league--compact');
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--compact');
    expect(container.querySelector('.hoops-league-sub')).toBeNull();
  });

  it('standard: Dichte touch (60 px)', () => {
    const { container } = render(<LeagueCard title="L" teams={teams()} />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--touch');
  });

  it('Überschriftenebene: titleAs vor HeadingLevel vor h3', () => {
    const { unmount } = render(<LeagueCard title="L" teams={teams()} titleAs="h2" />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('hoops-league-title');
    unmount();
    const second = render(
      <HeadingLevel level={4}>
        <LeagueCard title="L" teams={teams()} />
      </HeadingLevel>,
    );
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    second.unmount();
    render(
      <HeadingLevel level={4}>
        <LeagueCard title="L" teams={teams()} titleAs="h6" />
      </HeadingLevel>,
    );
    expect(screen.getByRole('heading', { level: 6 })).toBeInTheDocument();
  });

  it('Scrollbereich ist eine benannte, fokussierbare Region', () => {
    render(<LeagueCard title="Liga" teams={teams()} />);
    const region = screen.getByRole('region', { name: 'Tabelle: Liga' });
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('leere Liste: Karte mit Titel, keine Zeilen, kein Fehler', () => {
    render(<LeagueCard title="Leer" teams={[]} />);
    expect(screen.getByRole('heading', { name: 'Leer' })).toBeInTheDocument();
    expect(screen.queryAllByRole('row')).toHaveLength(1);
  });

  it('className kommt an die Karte', () => {
    const { container } = render(<LeagueCard title="L" teams={teams()} className="extra" />);
    expect(container.firstElementChild).toHaveClass('hoops-league', 'extra');
  });

  it('hat keine axe-Verstöße (alle Zusätze)', async () => {
    const rows = teams(6).map((t) => (t.rank === 1 ? { ...t, zone: 'up' as const } : t.rank === 7 ? { ...t, zone: 'playoff' as const, href: '/t' } : t));
    const { container } = render(
      <main>
        <h2>Seite</h2>
        <LeagueCard title="Oberliga" teams={rows} teamCount={12} played={15} total={132} columns={['won', 'lost', 'diff', 'form']} href="/tabelle" live={2} logos names="short" />
        <LeagueCard title="Zweite" teams={teams()} size="compact" href="/b" />
      </main>,
    );
    await expectNoA11yViolations(container);
  });
});
