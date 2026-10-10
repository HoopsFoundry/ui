import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useState } from 'react';
import { Accordion, AccordionItem } from './Accordion';
import { HeadingLevel } from './HeadingLevel';
import { EmptyState } from './EmptyState';
import { expectNoA11yViolations } from './test-utils';

const tick = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
const trigger = (id: string) => document.getElementById(`${id}-trigger`) as HTMLButtonElement;
const panel = (id: string) => document.getElementById(`${id}-panel`) as HTMLElement;
const isOpen = (id: string) => trigger(id).getAttribute('aria-expanded') === 'true';

function Basic(props: Record<string, unknown> = {}) {
  return (
    <Accordion syncHash={false} {...props}>
      <AccordionItem id="a" title="Tabelle">Inhalt A</AccordionItem>
      <AccordionItem id="b" title="Spielplan">Inhalt B</AccordionItem>
      <AccordionItem id="c" title="Kader">Inhalt C</AccordionItem>
    </Accordion>
  );
}

beforeEach(() => window.history.replaceState(null, '', '/'));
afterEach(() => window.history.replaceState(null, '', '/'));

describe('Accordion: Öffnen und Schließen', () => {
  it('ist beim Start geschlossen: aria-expanded false, Bereich hidden und inert', () => {
    render(<Basic />);
    expect(trigger('a')).toHaveAttribute('aria-expanded', 'false');
    expect(panel('a')).toHaveAttribute('hidden');
    expect(panel('a')).toHaveAttribute('inert');
    expect(trigger('a')).toHaveAttribute('aria-controls', 'a-panel');
  });

  it('Klick öffnet und schließt; Bereich wird sichtbar und erreichbar', () => {
    render(<Basic />);
    fireEvent.click(trigger('a'));
    expect(isOpen('a')).toBe(true);
    expect(panel('a')).not.toHaveAttribute('hidden');
    expect(panel('a')).not.toHaveAttribute('inert');
    expect(document.getElementById('a')).toHaveClass('is-open');
    fireEvent.click(trigger('a'));
    expect(isOpen('a')).toBe(false);
    expect(panel('a')).toHaveAttribute('inert');
  });

  it('mehrere Bereiche können offen sein', () => {
    render(<Basic />);
    fireEvent.click(trigger('a'));
    fireEvent.click(trigger('c'));
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([true, false, true]);
  });

  it('defaultOpen öffnet beim Start (unkontrolliert)', () => {
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="a" title="A" defaultOpen>x</AccordionItem>
      </Accordion>,
    );
    expect(isOpen('a')).toBe(true);
  });

  it('kontrolliert: open + onOpenChange; ohne Nachführen bleibt der Zustand', () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Accordion syncHash={false}>
        <AccordionItem id="a" title="A" open={false} onOpenChange={onOpenChange}>x</AccordionItem>
      </Accordion>,
    );
    fireEvent.click(trigger('a'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(isOpen('a')).toBe(false);
    rerender(
      <Accordion syncHash={false}>
        <AccordionItem id="a" title="A" open onOpenChange={onOpenChange}>x</AccordionItem>
      </Accordion>,
    );
    expect(isOpen('a')).toBe(true);
  });

  it('funktioniert allein ohne Accordion (Region, kein Werkzeugstreifen)', () => {
    render(<AccordionItem id="solo" title="Allein">Text</AccordionItem>);
    fireEvent.click(trigger('solo'));
    expect(isOpen('solo')).toBe(true);
    expect(screen.getByRole('region', { name: 'Allein' })).toBeInTheDocument();
    expect(document.querySelector('.dss-acc-tools')).toBeNull();
  });

  it('ein gesperrter Bereich öffnet nicht, trägt aria-disabled und bleibt fokussierbar', () => {
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="a" title="A" disabled>x</AccordionItem>
      </Accordion>,
    );
    fireEvent.click(trigger('a'));
    expect(isOpen('a')).toBe(false);
    expect(trigger('a')).toHaveAttribute('aria-disabled', 'true');
    expect(trigger('a')).not.toBeDisabled();
  });

  it('die Kopfklasse: Überschrift enthält den Button', () => {
    render(<Basic />);
    const heading = screen.getByRole('heading', { name: 'Tabelle', level: 3 });
    expect(heading).toHaveClass('dss-acc-title');
    expect(within(heading).getByRole('button')).toBe(trigger('a'));
  });
});

describe('Accordion: exclusive', () => {
  it('ein Öffnen schließt die anderen', () => {
    render(<Basic exclusive />);
    fireEvent.click(trigger('a'));
    fireEvent.click(trigger('b'));
    expect([isOpen('a'), isOpen('b')]).toEqual([false, true]);
    expect(panel('a')).toHaveAttribute('hidden');
  });
  it('Schließen des einzigen offenen Bereichs ist erlaubt', () => {
    render(<Basic exclusive />);
    fireEvent.click(trigger('a'));
    fireEvent.click(trigger('a'));
    expect(isOpen('a')).toBe(false);
  });
  it('bietet „Alle öffnen/schließen“ nicht an', async () => {
    render(<Basic exclusive expandAll />);
    await tick();
    expect(screen.queryByRole('button', { name: 'Alle öffnen' })).toBeNull();
  });
  it('kontrollierte Bereiche bekommen onOpenChange(false) für die anderen', () => {
    const closed = vi.fn();
    render(
      <Accordion exclusive syncHash={false}>
        <AccordionItem id="a" title="A" open onOpenChange={closed}>x</AccordionItem>
        <AccordionItem id="b" title="B">y</AccordionItem>
      </Accordion>,
    );
    fireEvent.click(trigger('b'));
    expect(closed).toHaveBeenCalledWith(false);
  });
});

describe('Accordion: Alle öffnen / schließen', () => {
  it('zeigt zwei Buttons mit aria-controls und eine höfliche Ansage', async () => {
    render(<Basic expandAll />);
    await tick();
    const open = screen.getByRole('button', { name: 'Alle öffnen' });
    expect(open).toHaveAttribute('aria-controls', 'a-panel b-panel c-panel');
    expect(screen.getByRole('button', { name: 'Alle schließen' })).toBeInTheDocument();
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('');
  });
  it('öffnet alle, sagt es an, schließt alle und sagt es an', async () => {
    render(<Basic expandAll />);
    await tick();
    fireEvent.click(screen.getByRole('button', { name: 'Alle öffnen' }));
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([true, true, true]);
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Alle Bereiche geöffnet');
    fireEvent.click(screen.getByRole('button', { name: 'Alle schließen' }));
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([false, false, false]);
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Alle Bereiche geschlossen');
  });
  it('gesperrte Bereiche bleiben; die Ansage nennt die Zahl', async () => {
    render(
      <Accordion syncHash={false} expandAll>
        <AccordionItem id="a" title="A">x</AccordionItem>
        <AccordionItem id="b" title="B" disabled>y</AccordionItem>
        <AccordionItem id="c" title="C">z</AccordionItem>
      </Accordion>,
    );
    await tick();
    fireEvent.click(screen.getByRole('button', { name: 'Alle öffnen' }));
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([true, false, true]);
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('2 von 3 Bereichen geöffnet');
  });
  it('ohne expandAll gibt es keine Leiste', async () => {
    render(<Basic />);
    await tick();
    expect(document.querySelector('.dss-acc-tools')).toBeNull();
  });
});

describe('Accordion: Deep-Link', () => {
  it('öffnet den Bereich zum Anker beim Laden', () => {
    window.history.replaceState(null, '', '/#b');
    render(<Basic syncHash />);
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([false, true, false]);
  });
  it('öffnet die Eltern-Bereiche mit', () => {
    window.history.replaceState(null, '', '/#tief');
    render(
      <Accordion>
        <AccordionItem id="aussen" title="Außen">
          <Accordion>
            <AccordionItem id="mitte" title="Mitte">
              <Accordion>
                <AccordionItem id="tief" title="Tief">x</AccordionItem>
              </Accordion>
            </AccordionItem>
          </Accordion>
        </AccordionItem>
        <AccordionItem id="andere" title="Andere">y</AccordionItem>
      </Accordion>,
    );
    expect([isOpen('aussen'), isOpen('mitte'), isOpen('tief'), isOpen('andere')]).toEqual([true, true, true, false]);
  });
  it('reagiert auf hashchange', async () => {
    render(<Basic syncHash />);
    act(() => {
      window.location.hash = '#c';
    });
    await tick();
    await tick();
    expect(isOpen('c')).toBe(true);
  });
  it('syncHash=false ignoriert den Anker und schreibt keinen', () => {
    window.history.replaceState(null, '', '/#b');
    render(<Basic syncHash={false} />);
    expect(isOpen('b')).toBe(false);
    fireEvent.click(trigger('a'));
    expect(window.location.hash).toBe('#b');
  });
  it('Klick setzt den Anker ohne neuen Verlaufseintrag; Schließen entfernt ihn nur beim eigenen', () => {
    const before = window.history.length;
    render(<Basic syncHash />);
    fireEvent.click(trigger('a'));
    expect(window.location.hash).toBe('#a');
    fireEvent.click(trigger('b'));
    expect(window.location.hash).toBe('#b');
    fireEvent.click(trigger('a'));
    expect(window.location.hash).toBe('#b');
    fireEvent.click(trigger('b'));
    expect(window.location.hash).toBe('');
    expect(window.history.length).toBe(before);
  });
  it('scrollt den Bereich in Sicht', async () => {
    const spy = vi.fn();
    Element.prototype.scrollIntoView = spy;
    window.history.replaceState(null, '', '/#b');
    render(<Basic syncHash />);
    await new Promise((r) => setTimeout(r, 30));
    expect(spy).toHaveBeenCalled();
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });
});

describe('Accordion: Tastatur', () => {
  const setup = () =>
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="a" title="A">x</AccordionItem>
        <AccordionItem id="b" title="B" disabled>x</AccordionItem>
        <AccordionItem id="c" title="C">x</AccordionItem>
        <AccordionItem id="d" title="D">x</AccordionItem>
      </Accordion>,
    );
  it('Pfeile springen zwischen Köpfen, überspringen gesperrte, kein Umlauf', () => {
    setup();
    trigger('a').focus();
    fireEvent.keyDown(trigger('a'), { key: 'ArrowDown' });
    expect(trigger('c')).toHaveFocus();
    fireEvent.keyDown(trigger('c'), { key: 'ArrowDown' });
    expect(trigger('d')).toHaveFocus();
    fireEvent.keyDown(trigger('d'), { key: 'ArrowDown' });
    expect(trigger('d')).toHaveFocus();
    fireEvent.keyDown(trigger('d'), { key: 'ArrowUp' });
    expect(trigger('c')).toHaveFocus();
    fireEvent.keyDown(trigger('c'), { key: 'ArrowUp' });
    expect(trigger('a')).toHaveFocus();
    fireEvent.keyDown(trigger('a'), { key: 'ArrowUp' });
    expect(trigger('a')).toHaveFocus();
  });
  it('Home und End', () => {
    setup();
    trigger('c').focus();
    fireEvent.keyDown(trigger('c'), { key: 'End' });
    expect(trigger('d')).toHaveFocus();
    fireEvent.keyDown(trigger('d'), { key: 'Home' });
    expect(trigger('a')).toHaveFocus();
  });
  it('die Pfeiltaste wird abgefangen, andere Tasten nicht', () => {
    setup();
    expect(fireEvent.keyDown(trigger('a'), { key: 'ArrowDown' })).toBe(false);
    expect(fireEvent.keyDown(trigger('a'), { key: 'Enter' })).toBe(true);
    expect(fireEvent.keyDown(trigger('a'), { key: 'ArrowDown', ctrlKey: true })).toBe(true);
  });
  it('Köpfe verschachtelter Gruppen gehören zur inneren Gruppe', () => {
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="a" title="A" defaultOpen>
          <Accordion syncHash={false}>
            <AccordionItem id="a1" title="A1">x</AccordionItem>
            <AccordionItem id="a2" title="A2">x</AccordionItem>
          </Accordion>
        </AccordionItem>
        <AccordionItem id="b" title="B">x</AccordionItem>
      </Accordion>,
    );
    trigger('a').focus();
    fireEvent.keyDown(trigger('a'), { key: 'ArrowDown' });
    expect(trigger('b')).toHaveFocus();
    trigger('a1').focus();
    fireEvent.keyDown(trigger('a1'), { key: 'End' });
    expect(trigger('a2')).toHaveFocus();
  });
});

describe('Accordion: Sprungleiste', () => {
  it('nav „Bereiche“ mit Links auf die ids in Dokumentreihenfolge', async () => {
    render(<Basic nav />);
    await tick();
    const nav = screen.getByRole('navigation', { name: 'Bereiche' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Tabelle', '#a'],
      ['Spielplan', '#b'],
      ['Kader', '#c'],
    ]);
  });
  it('Klick öffnet den Bereich, setzt den Fokus auf den Kopf und markiert den Link', async () => {
    render(<Basic nav />);
    await tick();
    const link = screen.getByRole('link', { name: 'Kader' });
    expect(fireEvent.click(link)).toBe(false); // preventDefault
    expect(isOpen('c')).toBe(true);
    expect(trigger('c')).toHaveFocus();
    expect(link).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('link', { name: 'Tabelle' })).not.toHaveAttribute('aria-current');
  });
  it('aria-current folgt dem zuletzt geöffneten Bereich', async () => {
    render(<Basic nav />);
    await tick();
    fireEvent.click(trigger('a'));
    expect(screen.getByRole('link', { name: 'Tabelle' })).toHaveAttribute('aria-current', 'true');
    fireEvent.click(trigger('b'));
    expect(screen.getByRole('link', { name: 'Tabelle' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Spielplan' })).toHaveAttribute('aria-current', 'true');
    fireEvent.click(trigger('b'));
    expect(screen.getByRole('link', { name: 'Spielplan' })).not.toHaveAttribute('aria-current');
  });
  it('der Schalter „Bereiche“ klappt die Liste (Handy) mit aria-expanded', async () => {
    render(<Basic nav />);
    await tick();
    const toggle = document.querySelector('.dss-acc-nav-toggle') as HTMLButtonElement;
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.getAttribute('aria-controls')).toBe(document.querySelector('.dss-acc-nav-list')!.id);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.dss-acc-nav')).toHaveClass('is-open');
  });
});

describe('Accordion: Zusatzinfo und Name', () => {
  it('der Name des Buttons enthält Titel und Zusatz, die Zusatzinfo wird einmal gelesen', () => {
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="k" title="Kader" meta="14 Spieler">x</AccordionItem>
      </Accordion>,
    );
    const button = screen.getByRole('button', { name: /Kader/ });
    expect(button).toHaveAccessibleName(/^Kader,\s?14 Spieler$/); // Leerraum zwischen Spans: je nach Layout
    expect(button.textContent?.match(/14 Spieler/g)).toHaveLength(1);
    expect(button.querySelector('.dss-acc-meta')).toHaveTextContent(', 14 Spieler');
  });
  it('Chip und Live-Tag als Zusatzinfo', () => {
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="l" title="Spielplan" meta={<span className="dss-live"><span className="dss-live-dot" aria-hidden="true" />Live</span>}>x</AccordionItem>
      </Accordion>,
    );
    expect(screen.getByRole('button')).toHaveAccessibleName(/^Spielplan,\s?Live$/);
  });
  it('ohne meta gibt es kein Zusatzelement', () => {
    render(<Basic />);
    expect(document.querySelector('.dss-acc-meta')).toBeNull();
  });
  it('der Pfeil ist für Screenreader verborgen', () => {
    render(<Basic />);
    expect(trigger('a').querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Accordion: Region nur bis 6 Bereiche', () => {
  const many = (n: number) => (
    <Accordion syncHash={false}>
      {Array.from({ length: n }, (_, i) => (
        <AccordionItem key={i} id={`i${i}`} title={`Bereich ${i}`}>x</AccordionItem>
      ))}
    </Accordion>
  );
  it('bei 6 Bereichen trägt jeder role="region" mit aria-labelledby auf den Kopf', async () => {
    render(many(6));
    await tick();
    expect(screen.getAllByRole('region', { hidden: true })).toHaveLength(6);
    expect(panel('i0')).toHaveAttribute('aria-labelledby', 'i0-trigger');
  });
  it('bei 7 Bereichen entfällt die Rolle samt aria-labelledby', async () => {
    render(many(7));
    await tick();
    expect(screen.queryAllByRole('region', { hidden: true })).toHaveLength(0);
    expect(panel('i0')).not.toHaveAttribute('role');
    expect(panel('i0')).not.toHaveAttribute('aria-labelledby');
  });
  it('wechselt mit der Anzahl', async () => {
    const { rerender } = render(many(6));
    await tick();
    rerender(many(7));
    await tick();
    expect(document.querySelectorAll('[role="region"]')).toHaveLength(0);
    rerender(many(3));
    await tick();
    expect(document.querySelectorAll('[role="region"]')).toHaveLength(3);
  });
});

describe('Accordion: Überschriftenebene', () => {
  const level = (id: string) => document.getElementById(id)!.querySelector('.dss-acc-title')!.tagName.toLowerCase();
  it('Standard h3; titleAs am Bereich > titleAs der Gruppe > HeadingLevel', () => {
    render(
      <>
        <Accordion syncHash={false}><AccordionItem id="s1" title="A">x</AccordionItem></Accordion>
        <Accordion syncHash={false} titleAs="h4"><AccordionItem id="s2" title="A">x</AccordionItem></Accordion>
        <Accordion syncHash={false} titleAs="h4"><AccordionItem id="s3" title="A" titleAs="h5">x</AccordionItem></Accordion>
        <HeadingLevel level={2}><Accordion syncHash={false}><AccordionItem id="s4" title="A">x</AccordionItem></Accordion></HeadingLevel>
        <HeadingLevel level={2}><Accordion syncHash={false} titleAs="h6"><AccordionItem id="s5" title="A">x</AccordionItem></Accordion></HeadingLevel>
      </>,
    );
    expect(['s1', 's2', 's3', 's4', 's5'].map(level)).toEqual(['h3', 'h4', 'h5', 'h2', 'h6']);
  });
  it('der Inhalt eines Bereichs bekommt die Ebene darunter (EmptyState)', () => {
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="e" title="Leer" defaultOpen><EmptyState title="Nichts da" /></AccordionItem>
      </Accordion>,
    );
    expect(screen.getByText('Nichts da').tagName).toBe('H4');
  });
  it('ein verschachteltes Accordion zählt hoch (h3, h4, h5) und ist als nested markiert', () => {
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="o" title="Außen">
          <Accordion syncHash={false}>
            <AccordionItem id="m" title="Mitte">
              <Accordion syncHash={false}>
                <AccordionItem id="i" title="Innen">x</AccordionItem>
              </Accordion>
            </AccordionItem>
          </Accordion>
        </AccordionItem>
      </Accordion>,
    );
    expect(['o', 'm', 'i'].map(level)).toEqual(['h3', 'h4', 'h5']);
    expect(document.querySelectorAll('.dss-acc--nested')).toHaveLength(2);
    expect(document.querySelector('.dss-acc')).not.toHaveClass('dss-acc--nested');
  });
  it('bei h6 bleibt es h6', () => {
    render(
      <Accordion syncHash={false} titleAs="h6">
        <AccordionItem id="o" title="Außen">
          <Accordion syncHash={false}><AccordionItem id="m" title="Mitte">x</AccordionItem></Accordion>
        </AccordionItem>
      </Accordion>,
    );
    expect(['o', 'm'].map(level)).toEqual(['h6', 'h6']);
  });
  it('ein eigenes HeadingLevel im Inhalt gewinnt', () => {
    render(
      <Accordion syncHash={false}>
        <AccordionItem id="o" title="Außen">
          <HeadingLevel level={5}><Accordion syncHash={false}><AccordionItem id="m" title="Mitte">x</AccordionItem></Accordion></HeadingLevel>
        </AccordionItem>
      </Accordion>,
    );
    expect(level('m')).toBe('h5');
  });
});

describe('Accordion: Varianten, sticky, Klassen', () => {
  it('Karte ist Standard, flach und sticky setzen Klassen, class kommt dazu', () => {
    const { container, rerender } = render(<Accordion syncHash={false}><AccordionItem id="a" title="A">x</AccordionItem></Accordion>);
    expect(container.firstElementChild).toHaveClass('dss-acc', 'dss-acc--card');
    rerender(<Accordion syncHash={false} variant="flat" sticky className="extra"><AccordionItem id="a" title="A">x</AccordionItem></Accordion>);
    expect(container.firstElementChild).toHaveClass('dss-acc', 'dss-acc--flat', 'dss-acc--sticky', 'extra');
    expect(container.firstElementChild).not.toHaveClass('dss-acc--card');
  });
});

describe('Accordion: Server-Rendering', () => {
  it('rendert ohne window und ohne Fehler; Werkzeugleiste und Region entstehen erst im Browser', () => {
    const html = renderToString(
      <Accordion expandAll nav>
        <AccordionItem id="a" title="A" defaultOpen>x</AccordionItem>
        <AccordionItem id="b" title="B">y</AccordionItem>
      </Accordion>,
    );
    expect(html).toContain('aria-expanded="true"');
    expect(html).not.toContain('dss-acc-tools');
    expect(html).not.toContain('role="region"');
  });
  it('ein einzelner Bereich ist schon im Server-Markup eine Region', () => {
    expect(renderToString(<AccordionItem id="a" title="A">x</AccordionItem>)).toContain('role="region"');
  });
});

describe('Accordion: Zugänglichkeit (axe)', () => {
  it('geschlossen, offen, mit Sprungleiste, Alle-öffnen-Leiste, Meta, gesperrtem und verschachteltem Bereich', async () => {
    render(
      <Accordion nav expandAll syncHash={false}>
        <AccordionItem id="a" title="Tabelle" meta="12 Teams" defaultOpen>
          <Accordion syncHash={false}>
            <AccordionItem id="a1" title="Heim">Heim</AccordionItem>
            <AccordionItem id="a2" title="Gast" defaultOpen>Gast</AccordionItem>
          </Accordion>
        </AccordionItem>
        <AccordionItem id="b" title="Spielplan">y</AccordionItem>
        <AccordionItem id="c" title="Kader" disabled>z</AccordionItem>
      </Accordion>,
    );
    await tick();
    await expectNoA11yViolations();
  });
  it('mehr als 6 Bereiche', async () => {
    render(
      <Accordion syncHash={false}>
        {Array.from({ length: 8 }, (_, i) => <AccordionItem key={i} id={`i${i}`} title={`Bereich ${i}`}>x</AccordionItem>)}
      </Accordion>,
    );
    await tick();
    await expectNoA11yViolations();
  });
});

function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <Accordion syncHash={false}>
      <AccordionItem id="c" title="Gesteuert" open={open} onOpenChange={setOpen}>x</AccordionItem>
      <button type="button" onClick={() => setOpen(true)}>von außen öffnen</button>
    </Accordion>
  );
}
describe('Accordion: von außen gesteuert', () => {
  it('open lässt sich von außen setzen und per Klick ändern', () => {
    render(<Controlled />);
    fireEvent.click(screen.getByText('von außen öffnen'));
    expect(isOpen('c')).toBe(true);
    fireEvent.click(trigger('c'));
    expect(isOpen('c')).toBe(false);
  });
});
