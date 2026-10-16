// @vitest-environment node
// Struktur von css/components.css: Klammern ausgeglichen (auch @media/@supports), und die Blöcke von Accordion und Ligencard/Tabellen
// sind nicht ineinander geraten (ein Merge-Konflikt am Dateiende hatte das schon einmal verschoben).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
// Kommentare weg (enthalten Klammern), Zeichenketten weg (data:-URLs)
const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");
const bare = strip(css);

type Block = { prelude: string; body: string };
function topLevel(src: string): Block[] {
  const blocks: Block[] = [];
  let depth = 0;
  let start = 0;
  let open = -1;
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '{') {
      if (depth === 0) open = i;
      depth++;
    } else if (src[i] === '}') {
      depth--;
      if (depth < 0) throw new Error(`Überzählige } bei Zeichen ${i}`);
      if (depth === 0) {
        blocks.push({ prelude: src.slice(start, open).trim(), body: src.slice(open + 1, i) });
        start = i + 1;
      }
    }
  }
  if (depth !== 0) throw new Error('Nicht geschlossener Block am Dateiende');
  return blocks;
}

describe('components.css: Klammern', () => {
  it('{ und } sind ausgeglichen, am Ende steht kein offener Block', () => {
    expect((bare.match(/\{/g) ?? []).length).toBe((bare.match(/\}/g) ?? []).length);
    expect(() => topLevel(bare)).not.toThrow();
  });
  it('jeder @media/@supports-Block enthält nur vollständige Regeln', () => {
    for (const block of topLevel(bare).filter((b) => /^@(media|supports)/.test(b.prelude))) {
      expect(() => topLevel(block.body), block.prelude).not.toThrow();
      expect(block.body.trim().endsWith('}'), block.prelude).toBe(true);
    }
  });
});

describe('components.css: Blöcke der Komponenten bleiben getrennt', () => {
  // Der Abschnitt „Einklappbare Rahmen“ (Paket B) verbindet beide Welten bewusst und steht am Ende; er wird getrennt geprüft
  const marker = '/* ── Einklappbare Rahmen';
  const frames = css.indexOf(marker);
  const at = topLevel(strip(frames > 0 ? css.slice(0, frames) : css)).filter((b) => b.prelude.startsWith('@'));
  it('kein @media/@supports mit Accordion-Selektoren enthält Ligencard-, Tabellen- oder Rahmen-Selektoren', () => {
    for (const b of at.filter((x) => x.body.includes('.hoops-acc'))) {
      expect(b.body, b.prelude).not.toMatch(/\.hoops-(league|tbl|frame|sch|sgrid)/);
    }
  });
  it('kein @media/@supports mit Ligencard-Selektoren enthält Accordion-Selektoren', () => {
    for (const b of at.filter((x) => x.body.includes('.hoops-league'))) expect(b.body, b.prelude).not.toContain('.hoops-acc');
  });
  it('die Accordion-Regeln stehen vor den Ligencard-Regeln, beide Abschnitte sind erhalten', () => {
    expect(css.indexOf('/* ── Accordion')).toBeGreaterThan(0);
    expect(css.indexOf('/* ── LeagueCard')).toBeGreaterThan(css.indexOf('/* ── Accordion'));
    expect(css).toMatch(/\.hoops-league-tbl/);
  });
  it('der Druck-Block des Accordions steht auf oberster Ebene und enthält ::details-content', () => {
    const print = at.find((b) => b.prelude === '@media print' && b.body.includes('.hoops-acc'));
    expect(print).toBeDefined();
    expect(print!.body).toContain('::details-content');
  });
  it('der Abschnitt „Einklappbare Rahmen“ steht nach Accordion und Ligencard und ist in sich ausgeglichen', () => {
    expect(frames).toBeGreaterThan(css.indexOf('/* ── LeagueCard'));
    expect(() => topLevel(strip(css.slice(frames)))).not.toThrow();
  });
});
