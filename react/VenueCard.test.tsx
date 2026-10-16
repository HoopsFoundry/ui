import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { VenueCard } from './VenueCard';
import { HeadingLevel } from './HeadingLevel';
import type { ScheduleGame } from './schedule-types';
import { expectNoA11yViolations } from './test-utils';

const ADDRESS = { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' };
const CONTACT = { name: 'Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' };
const game = (id: string, extra: Partial<ScheduleGame> = {}): ScheduleGame => ({
  id, state: 'scheduled', date: 'Sa, 17.10.2026', time: '17:30', league: { name: 'Oberliga Nordhain Männer' },
  heim: { name: `Heim ${id}`, short: `H${id}` }, gast: { name: `Gast ${id}` }, ...extra,
});
const GAMES = ['1', '2', '3', '4'].map((id) => game(id));
const FULL = { name: 'Sporthalle Nordhain', address: ADDRESS, lat: 49.3, lng: 7.9, info: 'Zwei Spielfelder.', contact: CONTACT, games: GAMES, href: '/hallen/nordhain' };

describe('VenueCard', () => {
  it('minimal: nur der Name als h3, keine weiteren Blöcke, keine Karte', () => {
    const { container } = render(<VenueCard name="Sporthalle Nordhain" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Sporthalle Nordhain' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('hoops-venue', 'hoops-venue--standard');
    expect(container.firstElementChild).not.toHaveClass('hoops-venue--map');
    for (const part of ['address', 'dl', 'ul', 'a', 'button', '.hoops-venue-info', '.hoops-venue-map', '.hoops-map']) expect(container.querySelector(part), part).toBeNull();
  });

  it('alle Blöcke: Karte, Adresse, Info, Kontakt, Spiele, Link', () => {
    const { container } = render(<VenueCard {...FULL} />);
    expect(container.firstElementChild).toHaveClass('hoops-venue--map');
    expect(screen.getByRole('region', { name: 'Karte: Sporthalle Nordhain' })).toBeInTheDocument();
    expect(container.querySelector('address')).toHaveTextContent('Am Sportpark 412345 Nordhain');
    expect(container.querySelectorAll('address .hoops-venue-line')).toHaveLength(2);
    expect(screen.getByText('Zwei Spielfelder.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Nächste Spiele in der Halle' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Zur Hallenseite, Sporthalle Nordhain' })).toHaveAttribute('href', '/hallen/nordhain');
  });

  it('Adresse: höchstens zwei Zeilen, leere Teile entfallen, ohne Angabe kein address-Element', () => {
    const { container, rerender } = render(<VenueCard name="H" address={{ zip: '12345', city: 'Nordhain' }} />);
    expect(container.querySelectorAll('.hoops-venue-line')).toHaveLength(1);
    expect(container.querySelector('address')).toHaveTextContent('12345 Nordhain');
    rerender(<VenueCard name="H" address={{ street: ' ', zip: '', city: '' }} />);
    expect(container.querySelector('address')).toBeNull();
  });

  it('Kurzinfo nur mit Text', () => {
    const { container, rerender } = render(<VenueCard name="H" info="  Zugang über den Hof  " />);
    expect(container.querySelector('.hoops-venue-info')).toHaveTextContent('Zugang über den Hof');
    rerender(<VenueCard name="H" info="   " />);
    expect(container.querySelector('.hoops-venue-info')).toBeNull();
  });

  describe('Kontakt', () => {
    it('Telefon und E-Mail sind tel:- und mailto:-Links mit Beschriftung', () => {
      render(<VenueCard name="H" contact={CONTACT} />);
      expect(screen.getByRole('link', { name: '030 23125 100' })).toHaveAttribute('href', 'tel:03023125100');
      expect(screen.getByRole('link', { name: 'hallenwart@example.org' })).toHaveAttribute('href', 'mailto:hallenwart@example.org');
      const terms = screen.getAllByRole('term').map((t) => t.textContent);
      expect(terms).toEqual(['Kontakt', 'Telefon', 'E-Mail']);
      expect(screen.getByText('Jonas Weide')).toBeInTheDocument();
    });
    it('internationale Rufnummer behält das Plus', () => {
      render(<VenueCard name="H" contact={{ name: 'A', phone: '+49 30 23125 100' }} />);
      expect(screen.getByRole('link', { name: '+49 30 23125 100' })).toHaveAttribute('href', 'tel:+493023125100');
    });
    it('ungültige Angaben bleiben Text ohne Link (nur sichere Links)', () => {
      const { container } = render(<VenueCard name="H" contact={{ name: 'A', phone: 'nur vormittags', email: 'a@example.org?bcc=x@example.org' }} />);
      expect(container.querySelector('.hoops-venue-contact a')).toBeNull();
      expect(screen.getByText('nur vormittags')).toBeInTheDocument();
      expect(screen.getByText('a@example.org?bcc=x@example.org')).toBeInTheDocument();
    });
    it('nur ein Teil: nur die vorhandenen Zeilen', () => {
      render(<VenueCard name="H" contact={{ name: '', email: 'a@example.org' }} />);
      expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['E-Mail']);
    });
    it('ohne Angaben kein Block', () => {
      const { container } = render(<VenueCard name="H" contact={{ name: ' ' }} />);
      expect(container.querySelector('dl')).toBeNull();
    });
  });

  describe('Spiele', () => {
    const names = () => screen.getAllByRole('listitem').map((li) => li.textContent);
    it('Standard: höchstens zwei, in der Reihenfolge der Eingabe', () => {
      render(<VenueCard name="H" games={GAMES} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(names()[0]).toContain('Heim 1');
      expect(names()[1]).toContain('Heim 2');
    });
    it('limit begrenzt auf höchstens fünf', () => {
      const many = ['1', '2', '3', '4', '5', '6', '7'].map((id) => game(id));
      const { rerender } = render(<VenueCard name="H" games={many} limit={3} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      rerender(<VenueCard name="H" games={many} limit={99} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(5);
      rerender(<VenueCard name="H" games={many} limit={0} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });
    it('Zeile: Datum, Uhrzeit, Liga und Mannschaften mit versteckter Seite', () => {
      render(<VenueCard name="H" games={[game('1', { field: 'Feld 2' })]} />);
      const item = screen.getByRole('listitem');
      expect(item).toHaveTextContent('Sa, 17.10.2026 · 17:30');
      expect(item).toHaveTextContent('Oberliga Nordhain Männer · Feld 2');
      expect(item).toHaveTextContent('Heim:');
      expect(item).toHaveTextContent('Gast:');
      expect(within(item).getByText('Heim 1')).toBeInTheDocument();
    });
    it('beendete und spielfreie Spiele entfallen; Live, Abgesagt und Verschoben tragen Text', () => {
      render(<VenueCard name="H" limit={5} games={[game('a', { state: 'finished' }), game('b', { state: 'bye' }), game('c', { state: 'live' }), game('d', { state: 'cancelled' }), game('e', { state: 'postponed' })]} />);
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByText('Abgesagt')).toBeInTheDocument();
      expect(screen.getByText('Verschoben')).toBeInTheDocument();
    });
    it('doppelte und fehlende id: alle Zeilen bleiben, keine React-Warnung über Schlüssel', () => {
      const errors: unknown[] = [];
      const spy = vi.spyOn(console, 'error').mockImplementation((...args) => { errors.push(args); });
      const bad = [game('x'), game('x'), { ...game('y'), id: '' }, { ...game('z'), id: undefined as unknown as string }];
      render(<VenueCard name="H" games={bad} limit={5} />);
      spy.mockRestore();
      expect(screen.getAllByRole('listitem')).toHaveLength(4);
      expect(errors).toEqual([]);
    });
    it('gamesLabel: Überschrift des Blocks und Name der Liste', () => {
      render(<VenueCard name="H" games={GAMES} gamesLabel="Belegung" />);
      expect(screen.getByRole('list', { name: 'Belegung' })).toBeInTheDocument();
    });
    it('ohne Spiele (leer oder nur beendete) kein Block', () => {
      const { container, rerender } = render(<VenueCard name="H" games={[]} />);
      expect(container.querySelector('.hoops-venue-games')).toBeNull();
      rerender(<VenueCard name="H" games={[game('a', { state: 'finished' })]} />);
      expect(container.querySelector('.hoops-venue-games')).toBeNull();
    });
    it('compact zeigt keine Spiele', () => {
      const { container } = render(<VenueCard name="H" games={GAMES} size="compact" />);
      expect(container.querySelector('.hoops-venue-games')).toBeNull();
      expect(container.firstElementChild).toHaveClass('hoops-venue--compact');
    });
    it('logos und Kurznamen: Initialen ohne Logo, Logo als dekoratives Bild, voller Name für Hilfstechnik', () => {
      const withLogo = game('1', { heim: { name: 'TSV Nordhain 1920', short: 'Nordhain', logo: '/l.svg' }, gast: { name: 'BG Seeberg', short: 'Seeberg' } });
      const { container } = render(<VenueCard name="H" games={[withLogo]} logos names="short" />);
      expect(container.querySelector('img')).toHaveAttribute('alt', '');
      expect(container.querySelector('.hoops-team-logo--initials')).toHaveTextContent('BS');
      expect(container.querySelectorAll('.hoops-team-name--short')).toHaveLength(2);
      expect(screen.getByText('TSV Nordhain 1920')).toHaveClass('hoops-name-full');
      expect(container.querySelector('.hoops-name-short')).toHaveAttribute('aria-hidden', 'true');
    });
    it('ohne logos kein Logo', () => {
      const { container } = render(<VenueCard name="H" games={GAMES} />);
      expect(container.querySelector('.hoops-team-logo')).toBeNull();
    });
  });

  describe('Karte', () => {
    it('ohne Koordinaten keine Karte, die Daten nehmen die ganze Breite', () => {
      for (const coords of [{}, { lat: 49.3 }, { lng: 7.9 }, { lat: 91, lng: 7.9 }, { lat: Number.NaN, lng: 7.9 }]) {
        const { container, unmount } = render(<VenueCard name="H" {...coords} />);
        expect(container.querySelector('.hoops-map'), JSON.stringify(coords)).toBeNull();
        expect(container.firstElementChild).not.toHaveClass('hoops-venue--map');
        unmount();
      }
    });
    it('Karte ist nicht interaktiv, zeigt den Platzhalter und lädt nichts', () => {
      const { container } = render(<VenueCard {...FULL} />);
      expect(container.querySelector('.hoops-map')).toHaveAttribute('data-state', 'idle');
      expect(screen.getByRole('button', { name: 'Karte laden' })).toBeInTheDocument();
      expect(container.querySelector('.hoops-map-canvas')).toBeNull();
    });
    it('der Platzhalter wiederholt die Adresse nicht: sie steht genau einmal im Text', () => {
      const { container } = render(<VenueCard {...FULL} />);
      expect(container.textContent!.split('Am Sportpark 4')).toHaveLength(2);
      expect(container.querySelector('.hoops-map-ph')!.textContent).not.toContain('Sportpark');
      expect(container.querySelector('.hoops-map-text')).toHaveClass('is-quiet');
    });
    it('Name der Karte je Halle verschieden (landmark-unique)', () => {
      render(<><VenueCard name="Halle A" lat={49.3} lng={7.9} /><VenueCard name="Halle B" lat={49.31} lng={7.91} /></>);
      expect(screen.getByRole('region', { name: 'Karte: Halle A' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Karte: Halle B' })).toBeInTheDocument();
    });
    it('Links unter der Karte: Größere Karte und Route, mit Hallennamen', () => {
      render(<VenueCard name="Halle A" lat={49.3} lng={7.9} />);
      expect(screen.getByRole('link', { name: 'Größere Karte, Halle A' })).toHaveAttribute('href', 'https://www.openstreetmap.org/?mlat=49.3&mlon=7.9#map=17/49.3/7.9');
      expect(screen.getByRole('link', { name: 'Route planen, Halle A' })).toHaveAttribute('href', expect.stringContaining('directions'));
    });
    it('load="auto", privacyNote und mapHeight gehen an die Karte', () => {
      const { container } = render(<VenueCard name="H" lat={49.3} lng={7.9} load="auto" mapHeight={300} tileUrl="/tiles/{z}/{x}/{y}.png" />);
      expect(container.querySelector('.hoops-map')).toHaveAttribute('data-state', 'loading');
      expect(container.querySelector('.hoops-map')!.getAttribute('style')!.replace(/\s/g, '')).toContain('--hoops-map-h:300px');
      const note = render(<VenueCard name="H2" lat={49.3} lng={7.9} privacyNote="Über unseren Server." />);
      expect(note.container.querySelector('.hoops-map-note')).toHaveTextContent('Über unseren Server.');
    });
  });

  describe('Link zur Hallenseite', () => {
    it('linkLabel ändert den Text, der Hallenname bleibt Teil des Namens', () => {
      render(<VenueCard name="Halle A" href="/h" linkLabel="Hallenplan" />);
      expect(screen.getByRole('link', { name: 'Hallenplan, Halle A' })).toHaveAttribute('href', '/h');
    });
    it('unsicheres oder fehlendes Ziel: kein Link', () => {
      const { container, rerender } = render(<VenueCard name="H" href="javascript:alert(1)" />);
      expect(container.querySelector('a')).toBeNull();
      rerender(<VenueCard name="H" />);
      expect(container.querySelector('a')).toBeNull();
    });
  });

  describe('Überschriftenebene', () => {
    it('Standard h3, nie h1', () => {
      const { container } = render(<VenueCard name="H" />);
      expect(container.querySelector('.hoops-venue-title')!.tagName).toBe('H3');
      expect(container.querySelector('h1')).toBeNull();
    });
    it('titleAs gewinnt vor HeadingLevel vor h3', () => {
      const { container } = render(
        <HeadingLevel level={5}>
          <VenueCard name="A" />
          <VenueCard name="B" titleAs="h2" />
        </HeadingLevel>,
      );
      const tags = [...container.querySelectorAll('.hoops-venue-title')].map((h) => h.tagName);
      expect(tags).toEqual(['H5', 'H2']);
    });
    it('compact hat dieselbe Überschrift mit Ebene', () => {
      const { container } = render(<VenueCard name="H" size="compact" titleAs="h4" />);
      expect(container.querySelector('.hoops-venue-title')!.tagName).toBe('H4');
    });
    it('ungültiges titleAs fällt zurück (nie h1)', () => {
      const { container } = render(<VenueCard name="H" titleAs={'h1' as never} />);
      expect(container.querySelector('.hoops-venue-title')!.tagName).toBe('H3');
    });
  });

  describe('Name', () => {
    it('leer oder nur Leerraum: keine leere Überschrift, Karte und Links bleiben', () => {
      const { container } = render(<VenueCard name="   " lat={49.3} lng={7.9} href="/h" />);
      expect(container.querySelector('h1,h2,h3,h4,h5,h6')).toBeNull();
      expect(screen.getByRole('region', { name: 'Karte' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Zur Hallenseite' })).toBeInTheDocument();
    });
    it('Leerraum am Rand fällt weg', () => {
      render(<VenueCard name="  Halle A " />);
      expect(screen.getByRole('heading', { name: 'Halle A' })).toBeInTheDocument();
    });
    it('Kontakt ohne name ist erlaubt (Typ und Laufzeit)', () => {
      render(<VenueCard name="H" contact={{ phone: '112' }} />);
      expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Telefon']);
    });
  });

  it('className landet am Wurzelelement', () => {
    const { container } = render(<VenueCard name="H" className="meine-klasse" />);
    expect(container.firstElementChild).toHaveClass('hoops-venue', 'meine-klasse');
  });

  describe('axe', () => {
    it('alle Blöcke, mit Karte', async () => {
      const { container } = render(<VenueCard {...FULL} logos names="short" />);
      await expectNoA11yViolations(container);
    });
    it('compact und ohne Karte', async () => {
      const { container } = render(
        <>
          <VenueCard name="A" size="compact" lat={49.3} lng={7.9} address={ADDRESS} contact={CONTACT} href="/a" />
          <VenueCard name="B" address={ADDRESS} games={GAMES} />
        </>,
      );
      await expectNoA11yViolations(container);
    });
    it('Zustände Live, Abgesagt, Verschoben', async () => {
      const { container } = render(<VenueCard name="H" limit={3} games={[game('c', { state: 'live' }), game('d', { state: 'cancelled' }), game('e', { state: 'postponed' })]} />);
      await expectNoA11yViolations(container);
    });
  });
});
