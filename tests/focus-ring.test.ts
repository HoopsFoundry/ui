// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const tokens = readFileSync(new URL('../tokens/tokens.css', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

describe('Fokus-Ring: gestrichelt, Gold/Amber', () => {
  it('tokens.css definiert --hoops-ring-style: dashed und --hoops-ring-color-on-dark', () => {
    expect(tokens).toMatch(/--hoops-ring-style:\s*dashed;/);
    expect(tokens).toMatch(/--hoops-ring-color-on-dark:/);
  });

  it('components.css hat keinen durchgezogenen Ring mehr', () => {
    expect(css).not.toMatch(/solid\s+var\(--hoops-ring-color\)/);
  });

  it('kein Ring über box-shadow (kann nicht gestrichelt sein)', () => {
    expect(css).not.toMatch(/box-shadow:[^;]*var\(--hoops-ring-w\)\s+var\(--hoops-ring-color\)/);
  });

  it('jede outline-Deklaration mit --hoops-ring-w nutzt auch --hoops-ring-style', () => {
    const decls = css.match(/outline:[^;}]*;?/g) ?? [];
    const rings = decls.filter((d) => d.includes('--hoops-ring-w'));
    expect(rings.length).toBeGreaterThan(10);
    for (const d of rings) expect(d).toContain('var(--hoops-ring-style)');
  });

  it('dunkle Flächen nutzen --hoops-ring-color-on-dark', () => {
    expect(css).toMatch(/\.dss-appnav--dark[^{]*:focus-visible[^{]*\{\s*outline-color:\s*var\(--hoops-ring-color-on-dark\)/);
  });

  it('Eingabegruppe, Select und Checkbox haben einen gestrichelten Fokus-Ring', () => {
    const ring = 'outline:\\s*var\\(--hoops-ring-w\\)\\s+var\\(--hoops-ring-style\\)\\s+var\\(--hoops-ring-color\\)';
    expect(css).toMatch(new RegExp('\\.dss-input-group:focus-within\\s*\\{[^}]*' + ring));
    expect(css).toMatch(new RegExp('\\.dss-select:focus-visible[^{]*\\{[^}]*' + ring));
    expect(css).toMatch(new RegExp('\\.dss-check-input:focus-visible\\s*\\{[^}]*' + ring));
  });
  it('Schließen-Button des Modals und Link im Banner haben einen gestrichelten Fokus-Ring', () => {
    const ring = 'outline:\\s*var\\(--hoops-ring-w\\)\\s+var\\(--hoops-ring-style\\)\\s+var\\(--hoops-ring-color\\)';
    expect(css).toMatch(new RegExp('\\.dss-m-close:focus-visible\\s*\\{[^}]*' + ring));
    expect(css).toMatch(new RegExp('\\.dss-banner a:focus-visible\\s*\\{[^}]*' + ring));
  });

  it('klickbare Karte (Link, Button, role=button), Spielkarte und Spielerzeile haben einen gestrichelten Fokus-Ring', () => {
    const ring = 'outline:\\s*var\\(--hoops-ring-w\\)\\s+var\\(--hoops-ring-style\\)\\s+var\\(--hoops-ring-color\\)';
    expect(css).toMatch(new RegExp('\\.dss-card:is\\(a, button, \\[role="button"\\]\\):focus-visible\\s*\\{[^}]*' + ring));
    expect(css).toMatch(new RegExp('button\\.dss-match:focus-visible, a\\.dss-match:focus-visible\\s*\\{[^}]*' + ring));
    expect(css).toMatch(new RegExp('button\\.dss-pc-row:focus-visible\\s*\\{[^}]*' + ring));
  });
});
