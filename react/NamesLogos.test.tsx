import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ScheduleTable } from './ScheduleTable';
import { ScheduleGrid } from './ScheduleGrid';
import { MatchCard } from './MatchCard';
import type { ScheduleGame } from './schedule-types';
import { expectNoA11yViolations } from './test-utils';

const VERSUS: ScheduleGame[] = [
  {
    id: 'v1', state: 'finished', date: 'Sa, 11.10.2026', time: '18:00',
    heim: { name: 'TSV Nordhain 1920', short: 'TSV N.', href: '/teams/nordhain', score: 87, own: true, logo: '/logos/nordhain.svg' },
    gast: { name: 'Lindenberg Hawks', short: 'Hawks', score: 64 },
  },
  {
    id: 'v2', state: 'scheduled', date: 'Sa, 18.10.2026', time: '18:00',
    heim: { name: 'BG Seeberg' }, gast: { name: 'Erster Gruppe A', short: 'E. A', placeholder: true },
  },
];

const OPPONENT: ScheduleGame[] = [
  {
    id: 'o1', state: 'finished', date: 'Sa, 26.09.2026', time: '17:30', at: 'heim',
    opponent: { name: 'Dukes Eschental', short: 'Dukes', score: 60 }, ownScore: 65,
  },
];

const GRID_COLUMNS = [{ id: 'f1', label: 'Feld 1' }];
const GRID_GAMES: ScheduleGame[] = [
  {
    id: 'g1', state: 'scheduled', time: '09:00', column: 'f1',
    heim: { name: 'Lindenberg Hawks', short: 'Hawks', href: '/h' }, gast: { name: 'SV Kiefernau', logo: '/logos/kiefernau.svg' },
  },
];

describe('Namen · ScheduleTable', () => {
  it('zeigt ohne Kurzname und ohne names nur den vollen Namen (kein Zusatzmarkup)', () => {
    const { container } = render(<ScheduleTable games={VERSUS} />);
    expect(container.querySelectorAll('.hoops-team-name')).toHaveLength(3);
    const seeberg = [...container.querySelectorAll('.hoops-sch-team')].find((el) => el.textContent === 'BG Seeberg');
    expect(seeberg?.querySelector('.hoops-team-name')).toBeNull();
  });

  it('legt beide Namen ins Markup: voller Name, Kurzname aria-hidden', () => {
    render(<ScheduleTable games={VERSUS} />);
    const link = screen.getByRole('link', { name: 'TSV Nordhain 1920' });
    expect(link.querySelector('.hoops-name-full')).toHaveTextContent('TSV Nordhain 1920');
    const short = link.querySelector('.hoops-name-short');
    expect(short).toHaveTextContent('TSV N.');
    expect(short).toHaveAttribute('aria-hidden', 'true');
  });

  it('der Name erscheint für Hilfstechnik einmal: Linkname ist der volle Name, nicht beide', () => {
    render(<ScheduleTable games={VERSUS} names="short" />);
    expect(screen.getByRole('link', { name: 'TSV Nordhain 1920' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /TSV N\./ })).toBeNull();
  });

  it('names="short" setzt die Modifikatorklasse nur an Namen mit Kurzform', () => {
    const { container } = render(<ScheduleTable games={VERSUS} names="short" />);
    expect(container.querySelectorAll('.hoops-team-name--short')).toHaveLength(3);
    const { container: full } = render(<ScheduleTable games={VERSUS} names="full" />);
    expect(full.querySelectorAll('.hoops-team-name--short')).toHaveLength(0);
  });

  it('Kurzname gleich Name oder leer erzeugt kein Zusatzmarkup', () => {
    const games: ScheduleGame[] = [{ id: 'x', state: 'scheduled', heim: { name: 'Hawks', short: 'Hawks' }, gast: { name: 'Dukes', short: '  ' } }];
    const { container } = render(<ScheduleTable games={games} />);
    expect(container.querySelector('.hoops-team-name')).toBeNull();
  });

  it('Platzhalter bleiben kursiv und ohne Link, mit Kurzform wie die anderen', () => {
    const { container } = render(<ScheduleTable games={VERSUS} logos />);
    const ph = container.querySelector('.hoops-sch-ph');
    expect(ph?.querySelector('.hoops-name-short')).toHaveTextContent('E. A');
    expect(ph?.closest('a')).toBeNull();
  });
});

describe('Logos · ScheduleTable', () => {
  it('zeigt ohne logos kein Team-Logo (Standard aus)', () => {
    const { container } = render(<ScheduleTable games={VERSUS} />);
    expect(container.querySelector('.hoops-team-logo')).toBeNull();
    expect(container.querySelector('.hoops-sch-team--logo')).toBeNull();
  });

  it('logos zeigt Bild mit leerem Alternativtext, lazy geladen, sonst Initialen im Kreis', () => {
    const { container } = render(<ScheduleTable games={VERSUS} logos />);
    const logos = container.querySelectorAll('.hoops-team-logo');
    // v1: Bild, Initialen; v2: Initialen (Platzhalter ohne Logo)
    expect(logos).toHaveLength(3);
    const img = logos[0].querySelector('img');
    expect(img).toHaveAttribute('src', '/logos/nordhain.svg');
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(logos[1]).toHaveClass('hoops-team-logo--initials');
    expect(logos[1]).toHaveTextContent('LH');
    expect(logos[2]).toHaveTextContent('BS');
    for (const logo of logos) expect(logo).toHaveAttribute('aria-hidden', 'true');
  });

  it('Initialen kommen aus dem vollen Namen (zwei Buchstaben), auch bei names="short"', () => {
    const { container } = render(<ScheduleTable games={VERSUS} logos names="short" />);
    expect(container.querySelectorAll('.hoops-team-logo')[1]).toHaveTextContent('LH');
  });

  it('Platzhalter bekommen kein Logo und keinen Initialenkreis', () => {
    const { container } = render(<ScheduleTable games={VERSUS} logos />);
    const ph = container.querySelector('.hoops-sch-ph');
    expect(ph?.closest('.hoops-sch-team')?.querySelector('.hoops-team-logo')).toBeNull();
    expect(ph?.closest('.hoops-sch-team')).not.toHaveClass('hoops-sch-team--logo');
  });

  it('der Link umschließt nur den Namen, nicht das Logo', () => {
    render(<ScheduleTable games={VERSUS} logos />);
    const link = screen.getByRole('link', { name: 'TSV Nordhain 1920' });
    expect(link.querySelector('.hoops-team-logo')).toBeNull();
    expect(link.parentElement?.querySelector('.hoops-team-logo')).not.toBeNull();
  });

  it('funktioniert im Layout columns', () => {
    const { container } = render(<ScheduleTable games={VERSUS} layout="columns" logos names="short" />);
    expect(container.querySelectorAll('.hoops-sch-heim .hoops-team-logo')).toHaveLength(2);
  });

  it('opponent: Logo/Initialen wie bisher ohne Prop, mit logos={false} entfällt es', () => {
    const { container, rerender } = render(<ScheduleTable games={OPPONENT} />);
    expect(container.querySelector('.hoops-sch-logo')).toHaveTextContent('DE');
    expect(container.querySelector('.hoops-team-logo')).toBeNull();
    rerender(<ScheduleTable games={OPPONENT} logos />);
    expect(container.querySelector('.hoops-sch-logo')).not.toBeNull();
    expect(container.querySelector('.hoops-team-logo')).toBeNull();
    rerender(<ScheduleTable games={OPPONENT} logos={false} />);
    expect(container.querySelector('.hoops-sch-logo')).toBeNull();
    expect(screen.getByText('Dukes Eschental')).toBeInTheDocument();
  });

  it('opponent mit names="short" zeigt den Kurznamen, Linkname bleibt der volle Name', () => {
    const games: ScheduleGame[] = [{ ...OPPONENT[0], opponent: { ...OPPONENT[0].opponent!, href: '/d' } }];
    const { container } = render(<ScheduleTable games={games} names="short" />);
    expect(container.querySelector('.hoops-team-name--short')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Dukes Eschental' })).toBeInTheDocument();
  });

  it('hat keine axe-Verstöße (alle Varianten)', async () => {
    const { container } = render(
      <div>
        <ScheduleTable games={VERSUS} logos names="short" caption="Versus" />
        <ScheduleTable games={VERSUS} layout="columns" logos caption="Spalten" />
        <ScheduleTable games={OPPONENT} logos={false} names="short" caption="Perspektive" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});

describe('Namen und Logos · ScheduleGrid', () => {
  it('Standard: voller Name, keine Logos', () => {
    const { container } = render(<ScheduleGrid games={GRID_GAMES} columns={GRID_COLUMNS} />);
    expect(container.querySelector('.hoops-team-logo')).toBeNull();
    expect(container.querySelector('.hoops-team-name--short')).toBeNull();
    expect(container.querySelector('.hoops-name-short')).toHaveTextContent('Hawks');
  });

  it('logos und names="short" wirken in den Zellen', () => {
    const { container } = render(<ScheduleGrid games={GRID_GAMES} columns={GRID_COLUMNS} logos names="short" />);
    const logos = container.querySelectorAll('.hoops-sg-teams .hoops-team-logo');
    expect(logos).toHaveLength(2);
    expect(logos[0]).toHaveTextContent('LH');
    expect(logos[1].querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.getByRole('link', { name: 'Lindenberg Hawks' })).toBeInTheDocument();
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<ScheduleGrid games={GRID_GAMES} columns={GRID_COLUMNS} logos names="short" caption="Raster" />);
    await expectNoA11yViolations(container);
  });
});

describe('Namen und Logos · MatchCard', () => {
  const heim = { name: 'TSV Nordhain 1920', short: 'TSV N.', logo: '/logos/nordhain.svg', score: 80 };
  const gast = { name: 'Lindenberg Hawks', short: 'Hawks', score: 70 };

  it('Standard: voller Name sichtbar, keine Logos', () => {
    const { container } = render(<MatchCard state="finished" heim={heim} gast={gast} />);
    expect(container.querySelector('.hoops-team-logo')).toBeNull();
    expect(container.firstElementChild).not.toHaveClass('hoops-match--logos');
    expect(container.querySelector('.hoops-team-name--short')).toBeNull();
  });

  it('names="short" mit beiden Texten im Markup; der Kurzname ist aria-hidden', () => {
    const { container } = render(<MatchCard state="finished" heim={heim} gast={gast} names="short" />);
    const names = container.querySelectorAll('.hoops-match-name.hoops-team-name--short');
    expect(names).toHaveLength(2);
    expect(within(names[0] as HTMLElement).getByText('TSV N.')).toHaveAttribute('aria-hidden', 'true');
    expect(within(names[0] as HTMLElement).getByText('TSV Nordhain 1920')).toHaveClass('hoops-name-full');
  });

  it('als Link heißt die Karte nach dem vollen Namen, nicht doppelt', () => {
    render(<MatchCard state="scheduled" heim={heim} gast={gast} names="short" href="/spiel/1" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName(/TSV Nordhain 1920/);
    expect(link).not.toHaveAccessibleName(/TSV N\./);
  });

  it('logos: Bild (alt leer) oder Initialen in beiden Zeilen, Karte trägt die Modifikatorklasse', () => {
    const { container } = render(<MatchCard state="finished" heim={heim} gast={gast} logos />);
    expect(container.firstElementChild).toHaveClass('hoops-match--logos');
    const logos = container.querySelectorAll('.hoops-match-team .hoops-team-logo');
    expect(logos).toHaveLength(2);
    expect(logos[0].querySelector('img')).toHaveAttribute('alt', '');
    expect(logos[1]).toHaveClass('hoops-team-logo--initials');
    expect(logos[1]).toHaveTextContent('LH');
  });

  it('ohne short ändert sich das Namensmarkup nicht', () => {
    const { container } = render(<MatchCard state="finished" heim={{ name: 'A', score: 1 }} gast={{ name: 'B', score: 0 }} names="short" />);
    expect(container.querySelector('.hoops-team-name')).toBeNull();
    expect(container.querySelector('.hoops-match-name')).toHaveTextContent('A');
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<MatchCard state="live" quarter="Q3" clock="04:12" heim={heim} gast={gast} logos names="short" href="/spiel/1" />);
    await expectNoA11yViolations(container);
  });
});

describe('Tooltip, Freilos, Initialen mit mehreren Wörtern', () => {
  const BYE: ScheduleGame[] = [{ id: 'b', state: 'bye', time: '09:30', heim: { name: 'Lindenberg Hawks', short: 'Hawks', logo: '/logos/hawks.svg' } }];
  const THREE = { name: 'Erster FC Waldbach', short: 'Waldbach' };

  it('der sichtbare Kurzname trägt den vollen Namen als title, ohne dass der Zugänglichkeitsname doppelt wird', () => {
    const { container } = render(<ScheduleTable games={VERSUS} names="short" />);
    const short = container.querySelector('.hoops-name-short');
    expect(short).toHaveAttribute('title', 'TSV Nordhain 1920');
    expect(short).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link', { name: 'TSV Nordhain 1920' })).toBeInTheDocument();
    const { container: card } = render(<MatchCard heim={{ name: 'TSV Nordhain 1920', short: 'TSV N.' }} gast={{ name: 'Hawks Club' }} names="short" />);
    expect(card.querySelector('.hoops-name-short')).toHaveAttribute('title', 'TSV Nordhain 1920');
  });

  it('Freilos in der Tabelle: Name mit Kurzform und Logo, „hat Freilos“ bleibt mit vollem Namen lesbar', () => {
    const { container } = render(<ScheduleTable games={BYE} layout="columns" names="short" logos />);
    const cell = container.querySelector('td.hoops-sch-bye') as HTMLElement;
    expect(cell.querySelector('.hoops-team-name--short .hoops-name-short')).toHaveTextContent('Hawks');
    expect(cell.querySelector('.hoops-team-logo img')).toHaveAttribute('alt', '');
    expect(cell).toHaveTextContent('Lindenberg HawksHawks hat Freilos');
    expect(cell.querySelector('.hoops-name-short')).toHaveAttribute('aria-hidden', 'true');
  });

  it('Freilos ohne Mannschaft zeigt weiter Notiz oder „Spielfrei“', () => {
    const { container } = render(<ScheduleTable games={[{ id: 'b', state: 'bye', note: 'Spielfrei am Sonntag' }]} layout="columns" />);
    expect(container.querySelector('td.hoops-sch-bye')).toHaveTextContent('Spielfrei am Sonntag');
  });

  it('Freilos im Raster nutzt Kurzname und Logo', () => {
    const { container } = render(<ScheduleGrid games={BYE} columns={GRID_COLUMNS} slots={['09:30']} names="short" logos />);
    const cell = container.querySelector('.hoops-sg-bye td') as HTMLElement;
    expect(cell.querySelector('.hoops-name-short')).toHaveTextContent('Hawks');
    expect(cell.querySelector('.hoops-team-logo')).not.toBeNull();
    expect(cell).toHaveTextContent('hat Freilos');
  });

  it('Initialen aus drei Wörtern ohne Logo bleiben bei zwei Buchstaben (Tabelle, Raster, MatchCard)', () => {
    const games: ScheduleGame[] = [{ id: 't', state: 'scheduled', heim: THREE, gast: { name: 'Zweiter FC Hollbach' } }];
    const { container } = render(<ScheduleTable games={games} logos />);
    expect([...container.querySelectorAll('.hoops-team-logo')].map((l) => l.textContent)).toEqual(['EF', 'ZF']);
    const grid = render(<ScheduleGrid games={[{ ...games[0], time: '09:00', column: 'f1' }]} columns={GRID_COLUMNS} logos />);
    expect([...grid.container.querySelectorAll('.hoops-team-logo')].map((l) => l.textContent)).toEqual(['EF', 'ZF']);
    const card = render(<MatchCard heim={THREE} gast={{ name: 'Zweiter FC Hollbach' }} logos />);
    expect([...card.container.querySelectorAll('.hoops-team-logo')].map((l) => l.textContent)).toEqual(['EF', 'ZF']);
  });
});
