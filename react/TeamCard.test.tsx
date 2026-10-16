import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TeamCard, type TeamCardProps } from './TeamCard';
import { expectNoA11yViolations } from './test-utils';

const FULL: TeamCardProps = {
  name: 'TSV Nordhain 1920',
  short: 'TSV N.',
  logo: '/logos/nordhain.svg',
  league: 'Bayernliga Süd',
  season: '2026/27',
  record: { w: 12, l: 3 },
  rank: 3,
  rankOf: 12,
  points: 24,
  next: { date: 'Sa, 25.05.', time: '19:30', opponent: { name: 'Lindenberg Hawks', short: 'Hawks' }, at: 'heim', venue: 'Nordhain-Halle' },
  last: { date: 'Sa, 18.05.', opponent: { name: 'BG Seeberg', short: 'Seeberg' }, ownScore: 92, opponentScore: 79, at: 'gast' },
  squad: { players: 14, staff: 3 },
  stats: { twoPtPct: 48.2, threePtPct: 36.5, trb: 41.3, to: 12.1 },
};

describe('TeamCard standard', () => {
  it('zeigt Kopf mit Logo, Name als Überschrift, Liga und Saison', () => {
    const { container } = render(<TeamCard {...FULL} />);
    expect(screen.getByRole('heading', { name: 'TSV Nordhain 1920', level: 3 })).toBeInTheDocument();
    expect(container.querySelector('.hoops-team-logo--lg img')).toHaveAttribute('alt', '');
    expect(container.querySelector('.hoops-team-logo')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.hoops-team-sub')).toHaveTextContent('Bayernliga Süd2026/27');
  });

  it('ohne Logo erscheinen die Initialen im Kreis', () => {
    const { container } = render(<TeamCard name="Lindenberg Hawks" />);
    const logo = container.querySelector('.hoops-team-logo')!;
    expect(logo).toHaveClass('hoops-team-logo--initials');
    expect(logo).toHaveTextContent('LH');
  });

  it('wählbare Überschriftenebene', () => {
    render(<TeamCard name="X" titleAs="h2" />);
    expect(screen.getByRole('heading', { name: 'X', level: 2 })).toBeInTheDocument();
  });

  it('nur der Name: keine weiteren Blöcke, kein leerer Rahmen', () => {
    const { container } = render(<TeamCard name="Nur Name" />);
    for (const cls of ['.hoops-team-vitals', '.hoops-team-games', '.hoops-team-squad', '.hoops-team-stats', '.hoops-team-sub']) {
      expect(container.querySelector(cls), cls).toBeNull();
    }
  });

  it('Bilanz, Platz und Punkte als Kennzahlen mit Screenreader-Text', () => {
    const { container } = render(<TeamCard {...FULL} />);
    const tiles = container.querySelector('.hoops-team-vitals')!.children;
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toHaveTextContent('12–3');
    expect(tiles[0]).toHaveTextContent('S–N');
    expect(tiles[0].querySelector('.hoops-sr-only')).toHaveTextContent('Bilanz: 12 Siege, 3 Niederlagen');
    expect(tiles[1].querySelector('.hoops-sr-only')).toHaveTextContent('Tabellenplatz 3 von 12');
    expect(tiles[2].querySelector('.hoops-sr-only')).toHaveTextContent('Punkte: 24');
  });

  it('Bilanz mit Unentschieden: S–U–N', () => {
    const { container } = render(<TeamCard name="X" record={{ w: 5, d: 1, l: 2 }} />);
    expect(container.querySelector('.hoops-team-vitals')).toHaveTextContent('5–1–2');
    expect(container.querySelector('.hoops-team-vitals')).toHaveTextContent('S–U–N');
  });

  it('nächstes Spiel: vs.-Chip, Gegner mit Heimspiel-Text, Datum, Zeit und Halle', () => {
    const { container } = render(<TeamCard {...FULL} />);
    const game = container.querySelectorAll('.hoops-team-game')[0];
    expect(game.querySelector('.hoops-chip')).toHaveTextContent('vs.');
    expect(game.querySelector('.hoops-chip')).toHaveAttribute('aria-hidden', 'true');
    expect(game.querySelector('.hoops-sr-only')).toHaveTextContent('Heimspiel gegen');
    expect(game).toHaveTextContent('Lindenberg Hawks');
    expect(game.querySelector('.hoops-team-game-end')).toHaveTextContent('Sa, 25.05. · 19:30');
    expect(game.querySelector('.hoops-team-game-venue')).toHaveTextContent('Nordhain-Halle');
  });

  it('letztes Spiel: @-Chip, Sieg-Chip, Ergebnis und Screenreader-Text wie im Spielplan', () => {
    const { container } = render(<TeamCard {...FULL} />);
    const game = container.querySelectorAll('.hoops-team-game')[1];
    expect(game.querySelector('.hoops-chip--amber')).toHaveTextContent('@');
    expect(game.querySelector('.hoops-chip--ok')).toHaveTextContent('S');
    expect(game.querySelector('.hoops-team-game-score')).toHaveTextContent('92 : 79');
    expect(game.querySelector('.hoops-team-game-end .hoops-sr-only')).toHaveTextContent('Eigene 92, Gegner 79, Sieg');
    expect(game.querySelector('.hoops-team-game-l')).toHaveTextContent('Letztes Spiel · Sa, 18.05.');
  });

  it.each([
    [{ ownScore: 70, opponentScore: 80 }, 'N', 'hoops-chip--err', 'Niederlage'],
    [{ ownScore: 70, opponentScore: 70 }, 'U', null, 'Unentschieden'],
  ])('letztes Spiel %j: Chip %s, Text %s', (score, letter, cls, word) => {
    const { container } = render(<TeamCard name="X" last={{ opponent: { name: 'Y' }, ...score }} />);
    const chip = container.querySelector('.hoops-team-game-end .hoops-chip')!;
    expect(chip).toHaveTextContent(letter);
    if (cls) expect(chip).toHaveClass(cls);
    expect(container.querySelector('.hoops-team-game-end .hoops-sr-only')).toHaveTextContent(word);
  });

  it('last.outcome überschreibt die Punkte (Forfait): Chip N, Text Niederlage', () => {
    const { container } = render(<TeamCard name="X" last={{ opponent: { name: 'Y' }, ownScore: 20, opponentScore: 0, outcome: 'N' }} />);
    expect(container.querySelector('.hoops-team-game-end .hoops-chip')).toHaveTextContent('N');
    expect(container.querySelector('.hoops-team-game-end .hoops-chip')).toHaveClass('hoops-chip--err');
    expect(container.querySelector('.hoops-team-game-end .hoops-sr-only')).toHaveTextContent('Eigene 20, Gegner 0, Niederlage');
  });

  it('negative Bilanz und Kader erscheinen nicht', () => {
    const { container } = render(<TeamCard name="X" record={{ w: -1, l: 2 }} squad={{ players: -4 }} />);
    expect(container.querySelector('.hoops-team-vitals')).toBeNull();
    expect(container.querySelector('.hoops-team-squad')).toBeNull();
  });

  it('Kader-Kurzliste: „14 Spieler · 3 Trainer“, ohne Trainer nur Spieler', () => {
    const { container, rerender } = render(<TeamCard {...FULL} />);
    expect(container.querySelector('.hoops-team-squad')).toHaveTextContent('14 Spieler · 3 Trainer');
    rerender(<TeamCard name="X" squad={{ players: 9 }} />);
    expect(container.querySelector('.hoops-team-squad')).toHaveTextContent(/^9 Spieler$/);
  });

  describe('Saison-Statistik', () => {
    it('zeigt alle vier Felder mit Komma-Format', () => {
      const { container } = render(<TeamCard {...FULL} />);
      const stats = container.querySelector('.hoops-team-stats')!;
      expect(stats).toHaveAttribute('role', 'group');
      expect(stats).toHaveAttribute('aria-label', 'Saison-Statistik');
      const text = [...stats.querySelectorAll('.hoops-team-vitals > div')].map((el) => el.textContent);
      expect(text).toEqual(['48,22PP %', '36,53PP %', '41,3TRB', '12,1TO']);
    });

    it('zeigt nur die übergebenen Felder', () => {
      const { container } = render(<TeamCard name="X" stats={{ trb: 40, threePtPct: 33.3 }} />);
      const labels = [...container.querySelectorAll('.hoops-team-stats .hoops-pc-l')].map((el) => el.textContent);
      expect(labels).toEqual(['3PP %', 'TRB']);
    });

    it.each([undefined, {}, { twoPtPct: undefined }, { to: Number.NaN }])('ohne Daten (%j) erscheint der Block gar nicht', (stats) => {
      const { container } = render(<TeamCard name="X" stats={stats as never} />);
      expect(container.querySelector('.hoops-team-stats')).toBeNull();
      expect(container.textContent).not.toContain('–');
    });

    it('ein Wert 0 zählt als Wert (kein Platzhalter-Strich)', () => {
      const { container } = render(<TeamCard name="X" stats={{ to: 0 }} />);
      expect(container.querySelector('.hoops-team-stats .hoops-pc-v')).toHaveTextContent('0');
    });
  });

  it('Kurzname und Logos der Gegner', () => {
    const { container } = render(<TeamCard {...FULL} names="short" logos />);
    expect(container.querySelector('.hoops-team-name--short')).not.toBeNull();
    expect(container.querySelectorAll('.hoops-team-logo--sm')).toHaveLength(2);
    expect(container.querySelector('.hoops-name-short')).toHaveAttribute('aria-hidden', 'true');
  });

  it('ohne logos keine Gegner-Logos', () => {
    const { container } = render(<TeamCard {...FULL} />);
    expect(container.querySelector('.hoops-team-logo--sm')).toBeNull();
  });
});

describe('TeamCard klickbar', () => {
  it('nicht klickbar: weder Link noch Button', () => {
    const { container } = render(<TeamCard {...FULL} />);
    expect(container.querySelector('a, button')).toBeNull();
    expect(container.firstElementChild).not.toHaveClass('hoops-team--link');
  });

  it('href: der Name in der Überschrift ist ein Link, die Karte klickbar markiert', () => {
    const { container } = render(<TeamCard {...FULL} href="/teams/nordhain" />);
    const link = screen.getByRole('link', { name: 'TSV Nordhain 1920' });
    expect(link).toHaveAttribute('href', '/teams/nordhain');
    expect(link).toHaveClass('hoops-team-link');
    expect(screen.getByRole('heading', { level: 3 })).toContainElement(link);
    expect(container.firstElementChild).toHaveClass('hoops-team--link');
  });

  it('onClick: der Name ist ein Button (type=button) und löst aus', () => {
    const onClick = vi.fn();
    render(<TeamCard {...FULL} onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'TSV Nordhain 1920' });
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('mit href und onClick ist die Karte ein Link, und onClick hängt am Link (SPA-Router)', () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(<TeamCard name="X" href="/x" onClick={onClick} />);
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    fireEvent.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('der zugängliche Name enthält den vollen Namen, auch bei Kurzname (WCAG 2.5.3)', () => {
    render(<TeamCard name="TSV Nordhain 1920" short="Nordhain" href="/x" names="short" />);
    expect(screen.getByRole('link', { name: 'TSV Nordhain 1920' })).toBeInTheDocument();
  });

  it('eine Aktion je Karte: leagueHref ist nur ohne href/onClick ein Link', () => {
    const { rerender } = render(<TeamCard name="X" league="Liga" leagueHref="/liga" />);
    expect(screen.getByRole('link', { name: 'Liga' })).toHaveAttribute('href', '/liga');
    rerender(<TeamCard name="X" league="Liga" leagueHref="/liga" href="/x" />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/x');
  });
});

describe('TeamCard compact', () => {
  it('Listenzeile: Logo, Name, Liga, Bilanz kurz und Platz, ohne Spielzeilen und Statistik', () => {
    const { container } = render(<TeamCard {...FULL} size="compact" />);
    expect(container.firstElementChild).toHaveClass('hoops-team--compact');
    expect(container.querySelector('.hoops-team-rec')).toHaveTextContent('12–3');
    expect(container.querySelector('.hoops-team-rank')).toHaveTextContent('Platz 3');
    for (const cls of ['.hoops-team-games', '.hoops-team-stats', '.hoops-team-squad', '.hoops-team-vitals', 'h3']) {
      expect(container.querySelector(cls), cls).toBeNull();
    }
    expect(container.querySelector('.hoops-sr-only')?.textContent).toMatch(/Bilanz: 12 Siege, 3 Niederlagen/);
  });

  it('ohne Bilanz und Platz bleibt die dritte Grid-Spalte leer besetzt', () => {
    const { container } = render(<TeamCard name="X" size="compact" />);
    expect(container.firstElementChild!.children).toHaveLength(3);
    expect(container.querySelector('.hoops-team-end')).toBeEmptyDOMElement();
  });

  it('klickbar als Link; der Name bleibt einmal im Dokument', () => {
    render(<TeamCard {...FULL} size="compact" href="/x" />);
    expect(screen.getByRole('link', { name: 'TSV Nordhain 1920' })).toBeInTheDocument();
  });

  it('Name wird mit Zusatztexten nur einmal gelesen', () => {
    const { container } = render(<TeamCard {...FULL} size="compact" />);
    expect(within(container as HTMLElement).getAllByText('TSV Nordhain 1920')).toHaveLength(1);
  });
});

describe('TeamCard Zugänglichkeit', () => {
  it.each([
    ['standard vollständig', { ...FULL }],
    ['standard mit Link', { ...FULL, href: '/x' }],
    ['standard mit Button', { ...FULL, onClick: () => {} }],
    ['standard Kurzname und Logos', { ...FULL, names: 'short' as const, logos: true }],
    ['standard minimal', { name: 'Nur Name' }],
    ['compact', { ...FULL, size: 'compact' as const }],
    ['compact mit Link', { ...FULL, size: 'compact' as const, href: '/x' }],
  ])('%s hat keine A11y-Verstöße', async (_label, props) => {
    const { container } = render(<TeamCard {...(props as TeamCardProps)} />);
    await expectNoA11yViolations(container);
  });
});
