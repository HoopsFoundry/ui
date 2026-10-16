import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ScheduleTable } from './ScheduleTable';
import type { ScheduleGame } from './schedule-types';
import { expectNoA11yViolations } from './test-utils';

const VERSUS: ScheduleGame[] = [
  {
    id: 'v1', state: 'finished', section: 'Spieltag 5', date: 'Sa, 11.10.2026', time: '18:00',
    heim: { name: 'TSV Nordhain', href: '/teams/troester', score: 87, own: true },
    gast: { name: 'Lindenberg Hawks', score: 64 },
    league: { name: 'Bayernliga Süd', href: '/ligen/by' },
  },
  {
    id: 'v2', state: 'scheduled', section: 'Spieltag 6', date: 'Sa, 18.10.2026', time: '18:00',
    heim: { name: 'TV Elbach' }, gast: { name: 'TSV Nordhain', own: true },
  },
];

const PERSPECTIVE: ScheduleGame[] = [
  {
    id: 'p1', state: 'finished', date: 'Sa, 26.09.2026', time: '17:30', at: 'heim',
    opponent: { name: 'TSV Falken Auental', href: '/teams/freising', score: 108 }, ownScore: 65,
  },
  {
    id: 'p2', state: 'finished', date: 'Sa, 03.10.2026', time: '17:30', at: 'heim', provisional: true,
    opponent: { name: 'Dukes Eschental', score: 0 }, ownScore: 20,
  },
  {
    id: 'p3', state: 'scheduled', date: 'Sa, 10.10.2026', time: '19:30', at: 'gast',
    opponent: { name: 'Bergheimer Basketball Club', logo: '/logos/nbc.png' },
  },
];

const TOURNAMENT: ScheduleGame[] = [
  {
    id: 't1', state: 'live', nr: '#3', section: 'Runde 2 · Gruppe A', time: '09:30–09:50', field: 'F1',
    heim: { name: 'TSV Nordhain', score: 18, own: true }, gast: { name: 'TV Elbach', score: 20 },
  },
  {
    id: 't2', state: 'cancelled', nr: '#4', section: 'Runde 2 · Gruppe A', time: '09:30–09:50', field: 'F2',
    heim: { name: 'Lindenberg Hawks' }, gast: { name: 'SV Kiefernau' }, note: 'Rückzug SV Kiefernau',
  },
  {
    id: 't3', state: 'bye', nr: '#5', section: 'Runde 2 · Gruppe A', time: '09:30–09:50',
    heim: { name: 'BG Seeberg' },
  },
  {
    id: 't4', state: 'scheduled', nr: '#9', section: 'Halbfinale', time: '11:00–11:20', field: 'F1',
    heim: { name: 'Erster Gruppe A', placeholder: true }, gast: { name: 'Zweiter Gruppe B', placeholder: true },
  },
];

describe('ScheduleTable · versus', () => {
  it('zeigt Gruppenzeilen, Teams als Links und die Liga als Unterzeile', () => {
    const { container } = render(<ScheduleTable games={VERSUS} />);
    const groups = container.querySelectorAll('tr.hoops-sch-group th');
    expect([...groups].map((g) => g.textContent)).toEqual(['Spieltag 5', 'Spieltag 6']);
    expect(groups[0]).toHaveAttribute('colspan', '3');
    expect(groups[0]).toHaveAttribute('scope', 'colgroup');
    expect(screen.getByRole('link', { name: 'TSV Nordhain' })).toHaveAttribute('href', '/teams/troester');
    expect(screen.getByRole('link', { name: 'Bayernliga Süd' })).toHaveAttribute('href', '/ligen/by');
  });

  it('spricht das Ergebnis aus und blendet den Verlierer ab', () => {
    const { container } = render(<ScheduleTable games={VERSUS} />);
    expect(screen.getByText('Heim 87, Gast 64')).toHaveClass('hoops-sr-only');
    const teams = container.querySelectorAll('tr.hoops-sch-row')[0].querySelectorAll('.hoops-sch-team');
    expect(teams[0]).not.toHaveClass('is-loser');
    expect(teams[1]).toHaveClass('is-loser');
  });

  it('zeigt "–" ohne Ergebnis und markiert die eigene Mannschaft', () => {
    const { container } = render(<ScheduleTable games={VERSUS} />);
    const rows = container.querySelectorAll('tr.hoops-sch-row');
    expect(rows[0]).toHaveClass('is-own');
    expect(rows[1].querySelector('.hoops-sch-none')).toHaveTextContent('–');
  });

  it('wählt touch bei Liga-Unterzeile und default sonst', () => {
    const { container, rerender } = render(<ScheduleTable games={VERSUS} />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--touch');
    rerender(<ScheduleTable games={[VERSUS[1]]} />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--default');
    rerender(<ScheduleTable games={[VERSUS[1]]} density="compact" />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--compact');
  });

  it('versteckt den Tabellenkopf visuell, behält ihn aber für Screenreader', () => {
    const { container } = render(<ScheduleTable games={VERSUS} />);
    const thead = container.querySelector('thead');
    expect(thead).toHaveClass('hoops-sr-only');
    expect([...container.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual(['Zeit', 'Spiel', 'Ergebnis']);
  });

  it('trägt Tabellen-Rollen für die Handy-Ansicht', () => {
    const { container } = render(<ScheduleTable games={VERSUS} />);
    expect(container.querySelector('table')).toHaveAttribute('role', 'table');
    expect(container.querySelector('tbody')).toHaveAttribute('role', 'rowgroup');
    expect(container.querySelector('tr.hoops-sch-row')).toHaveAttribute('role', 'row');
    expect(container.querySelector('td')).toHaveAttribute('role', 'cell');
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<ScheduleTable games={VERSUS} title="Bayernliga" caption="Spielplan" />);
    await expectNoA11yViolations(container);
  });
});

describe('ScheduleTable · opponent', () => {
  it('zeigt Chip vs. oder @, Logo oder Initialen und die Bewertung', () => {
    const { container } = render(<ScheduleTable games={PERSPECTIVE} />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--touch');
    const chips = [...container.querySelectorAll('.hoops-sch-ha .hoops-chip')].map((c) => c.textContent);
    expect(chips).toEqual(['vs.', 'vs.', '@']);
    const logos = container.querySelectorAll('.hoops-sch-logo');
    expect(logos[0]).toHaveTextContent('TFA');
    expect(logos[2].querySelector('img')).toHaveAttribute('src', '/logos/nbc.png');
    expect(screen.getByText('Eigene 65, Gegner 108, Niederlage')).toBeInTheDocument();
    expect(container.querySelector('.hoops-chip--err')).toHaveTextContent('N');
  });

  it('zeigt vorläufig und Sieg-Chip, bei offenem Spiel nur "–"', () => {
    const { container } = render(<ScheduleTable games={PERSPECTIVE} />);
    expect(screen.getByText('Eigene 20, Gegner 0, Sieg, vorläufig')).toBeInTheDocument();
    expect(container.querySelector('.hoops-chip--ok')).toHaveTextContent('S');
    // "vorläufig" steht als Tag in der Ergebnis-Box, nach der Zahl im Markup (CSS setzt es darunter)
    const box = container.querySelector('.hoops-sch-prov')?.closest('.hoops-sch-resbox') as HTMLElement;
    expect(box.querySelector('.hoops-sch-prov')).toHaveTextContent('vorläufig');
    expect(box.querySelector('.hoops-sch-prov')).toHaveAttribute('aria-hidden', 'true');
    expect(box.querySelector('.hoops-sch-score')?.nextElementSibling).toHaveClass('hoops-sr-only');
    const rows = container.querySelectorAll('tr.hoops-sch-row');
    expect(within(rows[2] as HTMLElement).getByText('–')).toBeInTheDocument();
    expect(within(rows[2] as HTMLElement).queryByText(/Eigene/)).toBeNull();
  });

  it('nimmt einen gesetzten outcome statt der Rechnung (Forfait)', () => {
    const forfeit: ScheduleGame = { ...PERSPECTIVE[0], id: 'f', ownScore: 0, opponent: { name: 'X', score: 20 }, outcome: 'S' };
    const { container } = render(<ScheduleTable games={[forfeit]} />);
    expect(container.querySelector('.hoops-chip--ok')).toHaveTextContent('S');
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<ScheduleTable games={PERSPECTIVE} caption="Spielplan" />);
    await expectNoA11yViolations(container);
  });
});

describe('ScheduleTable · columns (Turnier)', () => {
  it('zeigt sichtbaren Kopf nur mit Spalten, für die Daten vorliegen', () => {
    const { container } = render(<ScheduleTable games={TOURNAMENT} layout="columns" />);
    expect(container.querySelector('thead')).not.toHaveClass('hoops-sr-only');
    expect([...container.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Nr', 'Zeit', 'Feld', 'Heim', 'Ergebnis', 'Gast',
    ]);
  });

  it('zeigt Live hinter der Uhrzeit, durchgestrichen bei abgesagt und den Grund', () => {
    const { container } = render(<ScheduleTable games={TOURNAMENT} layout="columns" />);
    const rows = container.querySelectorAll('tr.hoops-sch-row');
    expect(rows[0]).toHaveClass('is-live');
    const when = rows[0].querySelector('.hoops-sch-when') as HTMLElement;
    expect(when.querySelector('.hoops-sch-time')).toHaveTextContent('09:30–09:50');
    expect(when.querySelector('.hoops-match-live')).toHaveTextContent('Live');
    expect(screen.getByText('Heim 18, Gast 20, läuft')).toHaveClass('hoops-sr-only');
    expect(rows[1]).toHaveClass('is-cancelled');
    expect(screen.getByText('Rückzug SV Kiefernau')).toHaveClass('hoops-sch-note');
  });

  it('zeigt Freilos als Zeile über alle Spalten und Platzhalter kursiv', () => {
    const { container } = render(<ScheduleTable games={TOURNAMENT} layout="columns" />);
    const bye = container.querySelector('tr.is-bye td') as HTMLElement;
    expect(bye).toHaveAttribute('colspan', '6');
    expect(bye).toHaveTextContent('BG Seeberg hat Freilos');
    expect(screen.getByText('Erster Gruppe A')).toHaveClass('hoops-sch-ph');
  });

  it('rendert Slots für Zeit, Hinweis und Router-Links', () => {
    const games: ScheduleGame[] = [{ ...TOURNAMENT[0], heim: { name: 'TSV Nordhain', href: '/t/1' } }];
    const { container } = render(
      <ScheduleTable
        games={games}
        layout="columns"
        renderTime={(g) => <input aria-label={`Start ${g.nr}`} defaultValue={g.time} />}
        renderNotice={() => <span className="hoops-chip hoops-chip--warn">Sperrzeit</span>}
        renderLink={({ href, className, children }) => (
          <a data-router className={className} href={href}>
            {children}
          </a>
        )}
      />,
    );
    expect(screen.getByLabelText('Start #3')).toHaveValue('09:30–09:50');
    expect(screen.getByText('Sperrzeit')).toBeInTheDocument();
    expect(container.querySelector('a[data-router]')).toHaveAttribute('href', '/t/1');
    const heads = container.querySelectorAll('thead th');
    expect(heads[heads.length - 1]).toHaveTextContent('Hinweis');
  });

  it('hat keine axe-Verstöße', async () => {
    const { container } = render(<ScheduleTable games={TOURNAMENT} layout="columns" caption="Spielplan" />);
    await expectNoA11yViolations(container);
  });
});

describe('ScheduleTable · Ergebnis und Zustände', () => {
  const base: ScheduleGame = {
    id: 'b', state: 'finished', time: '18:00',
    heim: { name: 'A', score: 80 }, gast: { name: 'B', score: 70 },
  };
  const resText = (c: HTMLElement) => c.querySelector('td.hoops-sch-res')?.textContent;

  it('zeigt für Perspektiv-Spiele außerhalb von opponent "–" statt "undefined"', () => {
    const game: ScheduleGame = {
      id: 'o', state: 'finished', time: '10:00', at: 'heim', ownScore: 50, opponent: { name: 'Gegner', score: 40 },
    };
    for (const layout of ['columns', 'versus'] as const) {
      const { container, unmount } = render(<ScheduleTable games={[game]} layout={layout} />);
      expect(container.querySelector('td.hoops-sch-res')).toHaveTextContent('–');
      expect(container.textContent).not.toContain('undefined');
      unmount();
    }
  });

  it('markiert verschobene Spiele und zeigt "–"', () => {
    const { container } = render(<ScheduleTable games={[{ ...base, state: 'postponed' }]} />);
    expect(container.querySelector('tr.hoops-sch-row')).toHaveClass('is-postponed');
    expect(container.querySelector('td.hoops-sch-res')).toHaveTextContent('–');
  });

  it('zeigt bei abgesagt und angesetzt trotz Stand nur "–"', () => {
    for (const state of ['cancelled', 'scheduled'] as const) {
      const { container, unmount } = render(<ScheduleTable games={[{ ...base, state }]} />);
      expect(container.querySelector('td.hoops-sch-res')).toHaveTextContent('–');
      expect(container.querySelector('.hoops-sch-score')).toBeNull();
      unmount();
    }
  });

  it('zeigt 0 : 0 als Ergebnis', () => {
    const { container } = render(
      <ScheduleTable games={[{ ...base, heim: { name: 'A', score: 0 }, gast: { name: 'B', score: 0 } }]} />,
    );
    expect(container.querySelector('.hoops-sch-score')).toHaveTextContent('0 : 0');
    expect(resText(container)).not.toBe('–');
  });

  it('zeigt Unentschieden (outcome U) ohne Farbe', () => {
    const game: ScheduleGame = {
      id: 'u', state: 'finished', time: '10:00', at: 'heim', ownScore: 80, opponent: { name: 'G', score: 80 }, outcome: 'U',
    };
    const { container } = render(<ScheduleTable games={[game]} />);
    const chip = container.querySelector('td.hoops-sch-res .hoops-chip') as HTMLElement;
    expect(chip).toHaveTextContent('U');
    expect(chip).not.toHaveClass('hoops-chip--ok');
    expect(chip).not.toHaveClass('hoops-chip--err');
    expect(screen.getByText('Eigene 80, Gegner 80, Unentschieden')).toBeInTheDocument();
  });

  it('fällt bei unbekanntem state nicht um', () => {
    const { container } = render(<ScheduleTable games={[{ ...base, state: 'kaputt' as never }]} />);
    expect(container.querySelectorAll('tr.hoops-sch-row')).toHaveLength(1);
  });
});

describe('ScheduleTable · Rahmen und Optionen', () => {
  const one: ScheduleGame[] = [
    { id: 'x', state: 'scheduled', time: '18:00', heim: { name: 'A' }, gast: { name: 'B' } },
  ];

  it('setzt density explizit', () => {
    const { container, rerender } = render(<ScheduleTable games={one} density="touch" />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--touch');
    rerender(<ScheduleTable games={one} density="default" />);
    expect(container.querySelector('table')).toHaveClass('hoops-tbl--default');
  });

  it('rendert Kopf mit Titelebene und Meta, sonst keinen Kopf', () => {
    const { container, rerender } = render(<ScheduleTable games={one} title="Titel" titleAs="h2" meta="Saison 26" />);
    expect(container.querySelector('.hoops-frame-head')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Titel' })).toHaveClass('hoops-frame-title');
    expect(container.querySelector('.hoops-frame-meta')).toHaveTextContent('Saison 26');
    rerender(<ScheduleTable games={one} />);
    expect(container.querySelector('.hoops-frame-head')).toBeNull();
  });

  it('nutzt h3 als Standard-Titelebene', () => {
    render(<ScheduleTable games={one} title="Titel" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Titel' })).toBeInTheDocument();
  });

  it('rendert die Caption für Screenreader', () => {
    const { container } = render(<ScheduleTable games={one} caption="Spielplan Herren" />);
    const cap = container.querySelector('caption') as HTMLElement;
    expect(cap).toHaveClass('hoops-sr-only');
    expect(cap).toHaveTextContent('Spielplan Herren');
  });

  it('rendert ohne Spiele Kopf und leeren Körper', () => {
    const { container } = render(<ScheduleTable games={[]} />);
    expect(container.querySelector('thead')).not.toBeNull();
    const body = container.querySelector('tbody') as HTMLElement;
    expect(body).not.toBeNull();
    expect(body.children).toHaveLength(0);
  });

  it('zeigt Liga ohne href als Text und mit href über renderLink', () => {
    const plain: ScheduleGame[] = [{ ...one[0], league: { name: 'Kreisliga' } }];
    const { container, rerender } = render(<ScheduleTable games={plain} />);
    expect(container.querySelector('.hoops-sch-sub')).toHaveTextContent('Kreisliga');
    expect(container.querySelector('.hoops-sch-sub a')).toBeNull();
    const linked: ScheduleGame[] = [{ ...one[0], league: { name: 'Kreisliga', href: '/l/1' } }];
    rerender(
      <ScheduleTable
        games={linked}
        renderLink={({ href, className, children }) => (
          <a data-router className={className} href={href}>
            {children}
          </a>
        )}
      />,
    );
    expect(container.querySelector('.hoops-sch-sub a[data-router]')).toHaveAttribute('href', '/l/1');
  });

  it('lässt Datum und Zeit weg, wenn sie fehlen', () => {
    const { container } = render(<ScheduleTable games={[{ ...one[0], time: undefined }]} />);
    expect(container.querySelector('.hoops-sch-date')).toBeNull();
    expect(container.querySelector('.hoops-sch-time')).toBeNull();
  });

  it('zeigt "?" für fehlende Teams in der Gegenüberstellung', () => {
    const { container } = render(<ScheduleTable games={[{ id: 'n', state: 'scheduled', time: '10:00' }]} layout="versus" />);
    const teams = container.querySelectorAll('.hoops-sch-team');
    expect([...teams].map((t) => t.textContent)).toEqual(['?', '?']);
  });
});

describe('ScheduleTable · Freilos', () => {
  const bye: ScheduleGame = { id: 'by', state: 'bye', time: '09:00', heim: { name: 'BG Seeberg' } };
  const persp: ScheduleGame = {
    id: 'pp', state: 'scheduled', time: '10:00', at: 'heim', opponent: { name: 'G' },
  };
  const versus: ScheduleGame = { id: 'vv', state: 'scheduled', time: '10:00', heim: { name: 'A' }, gast: { name: 'B' } };

  it('füllt 3 Spalten in der Gegenüberstellung und 4 in der Perspektive', () => {
    const a = render(<ScheduleTable games={[versus, bye]} />);
    expect(a.container.querySelector('tr.is-bye td')).toHaveAttribute('colspan', '3');
    a.unmount();
    const b = render(<ScheduleTable games={[persp, bye]} />);
    expect(b.container.querySelector('tr.is-bye td')).toHaveAttribute('colspan', '4');
  });

  it('zeigt ohne heim den Hinweis oder "Spielfrei"', () => {
    const noTeam: ScheduleGame = { id: 'nt', state: 'bye', time: '09:00' };
    const a = render(<ScheduleTable games={[versus, { ...noTeam, note: 'Pause Halle' }]} />);
    expect(a.container.querySelector('tr.is-bye td')).toHaveTextContent('Pause Halle');
    a.unmount();
    const b = render(<ScheduleTable games={[versus, noTeam]} />);
    expect(b.container.querySelector('tr.is-bye td')).toHaveTextContent('Spielfrei');
  });
});

describe('ScheduleTable · Zustand als Text', () => {
  const base: ScheduleGame = { id: 's', state: 'scheduled', time: '10:00', heim: { name: 'A' }, gast: { name: 'B' } };
  const srTexts = (container: HTMLElement) =>
    [...container.querySelectorAll('.hoops-sr-only')].map((el) => el.textContent?.trim());

  it('macht abgesagte Spiele für Screenreader hörbar', () => {
    const { container } = render(<ScheduleTable games={[{ ...base, state: 'cancelled' }]} />);
    const span = container.querySelector('td.hoops-sch-when .hoops-sr-only') as HTMLElement;
    expect(span).toHaveTextContent('abgesagt');
    expect(span.previousElementSibling).toHaveClass('hoops-sch-time');
  });

  it('macht verschobene Spiele hörbar', () => {
    const { container } = render(<ScheduleTable games={[{ ...base, state: 'postponed' }]} />);
    expect(container.querySelector('td.hoops-sch-when .hoops-sr-only')).toHaveTextContent('verschoben');
  });

  it('sagt bei angesetzten und beendeten Spielen nichts', () => {
    const finished: ScheduleGame = { ...base, id: 'f', state: 'finished', heim: { name: 'A', score: 1 }, gast: { name: 'B', score: 2 } };
    const { container } = render(<ScheduleTable games={[base, finished]} />);
    expect(srTexts(container)).not.toContain('abgesagt');
    expect(srTexts(container)).not.toContain('verschoben');
  });
});

describe('ScheduleTable · Scrollbereich', () => {
  const g: ScheduleGame[] = [{ id: 'x', state: 'scheduled', time: '10:00', heim: { name: 'A' }, gast: { name: 'B' } }];

  it('ist eine fokussierbare Region, benannt nach caption', () => {
    render(<ScheduleTable games={g} caption="Spielplan Herren" title="Titel" />);
    const region = screen.getByRole('region', { name: 'Spielplan Herren' });
    expect(region).toHaveClass('hoops-table-scroll');
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('nutzt ohne caption den Titel als Namen', () => {
    render(<ScheduleTable games={g} title="Saison 2026" />);
    expect(screen.getByRole('region', { name: 'Saison 2026' })).toHaveAttribute('tabindex', '0');
  });

  it('nutzt ohne caption und mit nicht-textuellem Titel den Standardnamen', () => {
    render(<ScheduleTable games={g} title={<em>Titel</em>} />);
    expect(screen.getByRole('region', { name: 'Spielplan' })).toBeInTheDocument();
  });

  it('nutzt ohne caption und Titel den Standardnamen', () => {
    render(<ScheduleTable games={g} />);
    expect(screen.getByRole('region', { name: 'Spielplan' })).toBeInTheDocument();
  });
});
