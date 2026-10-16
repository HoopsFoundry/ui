// @vitest-environment node
// Verbotstest (Stufen K, D, M): Im ganzen Bestand (git ls-files, ohne node_modules und dist) kommt der alte Name „dss“ (ohne Beachtung der
// Groß-/Kleinschreibung, in jeder Form: dss-, dss:, dss_, data-dss, DSS) nicht mehr vor, außer in einer begründeten Allowlist.
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Pfade, die den alten Namen behalten dürfen. Jede Zeile braucht eine Begründung; der Satz ist fest (siehe Test unten). */
export const ALLOWLIST: { muster: RegExp; grund: string }[] = [
  { muster: /^CHANGELOG\.md$/, grund: 'Historie der Versionen vor 0.10.0 und die Ersetzungstabelle der Umbenennung (alt → neu)' },
  { muster: /^docs\/superpowers\//, grund: 'historische Spezifikationen und Pläne bleiben unverändert' },
  { muster: /^docs\/entwuerfe\//, grund: 'historische Design-Entwürfe (Ideen für später), unverändert' },
  { muster: /^docs\/architecture\/README\.adoc$/, grund: 'wird per Workflow aus sections/*.adoc neu erzeugt' },
  { muster: /^scripts\/(migration-table|migrate-from-dss|codemod-names|codemod-tokens)\.mjs$/, grund: 'Migrationsskript, Codemods und Ersetzungstabellen nennen die alten Namen als Eingabe' },
  { muster: /^scripts\/lib\/(name-rename|token-rename)\.mjs$/, grund: 'Regeln der Umbenennung: die alten Namen sind die Suchmuster' },
  { muster: /^tests\/(migrate-from-dss|codemod-names|codemod-tokens|token-prefix|no-dss)\.test\.ts$/, grund: 'Tests der Umbenennung prüfen mit den alten Namen als Eingabe' },
  { muster: /^tests\/fixtures\/migrate\//, grund: 'Beispielprojekt eines Konsumenten mit altem Stand für das Migrationsskript' },
  { muster: /^stories\/assets\//, grund: 'Fotos und Quellenangaben, kein Code' },
  { muster: /^package-lock\.json$/, grund: 'erzeugt; enthält nur den Pfad scripts/migrate-from-dss.mjs' },
];

/** Die Dateinamen des Migrationsskripts (`migrate-from-dss`) und dieses Tests (`no-dss`) sind erlaubt, überall. */
const NAME_SKRIPT = /migrate-from-dss|no-dss/g;

/** Abschnitte, in denen alte Namen als Migrationshinweis stehen dürfen: README (Überschrift mit „Migration“) und ADR-Aufzählungspunkte „Migration“. */
function ohneMigrationsabschnitte(file: string, text: string): string {
  if (file === 'README.md') {
    const out: string[] = [];
    let skipLevel = 0;
    for (const line of text.split('\n')) {
      const h = line.match(/^(#{1,6}) /);
      if (h) {
        const level = h[1].length;
        if (skipLevel && level <= skipLevel) skipLevel = 0;
        if (!skipLevel && /Migration/.test(line)) skipLevel = level;
      }
      if (!skipLevel) out.push(line);
    }
    return out.join('\n');
  }
  if (file.startsWith('docs/architecture/sections/')) return text.split('\n').filter((l) => !/^\*+ Migration/.test(l)).join('\n');
  return text;
}

/** Liefert alle Verstöße (Pfad:Zeile: Treffer) in den Dateien (Pfad → Text). */
export function findDss(files: Map<string, string>, allow = ALLOWLIST): string[] {
  const out: string[] = [];
  for (const [file, raw] of files) {
    if (allow.some((a) => a.muster.test(file))) continue;
    const lines = ohneMigrationsabschnitte(file, raw).replace(NAME_SKRIPT, '').split('\n');
    lines.forEach((line, i) => { for (const m of line.matchAll(/[\w:.-]*dss[\w:.-]*/gi)) out.push(`${file}:${i + 1}: ${m[0]}`); });
    if (/dss/i.test(file.replace(NAME_SKRIPT, ''))) out.push(`${file}: Dateiname`);
  }
  return out;
}

const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).split('\0').filter(Boolean)
  .filter((f) => !/^(node_modules|dist)\//.test(f) && !/\.(woff2?|jpe?g|png|webp|ico|gz|tgz)$/i.test(f));
const real = new Map<string, string>();
for (const f of tracked) { try { real.set(f, readFileSync(f, 'utf8')); } catch { /* gelöscht im Arbeitsbaum */ } }
const mit = (file: string, text: string, allow = ALLOWLIST) => findDss(new Map(real).set(file, text), allow).join('\n');

describe('Kein „dss“ mehr im Bestand (Stufen K, D, M)', () => {
  it('der Bestand ist frei vom alten Namen', () => {
    expect(real.size).toBeGreaterThan(500);
    expect(findDss(real)).toEqual([]);
  });
  it('die Allowlist ist ein fester, begründeter Satz', () => {
    expect(ALLOWLIST.map((a) => a.muster.source)).toHaveLength(10);
    for (const a of ALLOWLIST) expect(a.grund.length, a.muster.source).toBeGreaterThan(20);
    // Mutation: ein zusätzlicher Eintrag blendet einen Verstoß aus, ist aber am festen Umfang erkennbar
    const lax = [...ALLOWLIST, { muster: /^js\//, grund: 'unzulässig: würde alle Skripte ausnehmen und fällt hier auf' }];
    expect(mit('js/neu.js', 'const c = "dss-btn";', lax)).toBe('');
    expect(lax).toHaveLength(ALLOWLIST.length + 1);
  });
  it.each([
    ['Klasse in CSS', 'css/neu.css', '.dss-btn { }'],
    ['Klasse im Template-Literal', 'js/neu.js', 'const c = `dss-${x}`;'],
    ['Attributselektor', 'css/neu.css', '[data-dss-acc] { }'],
    ['data-Attribut in HTML', 'stories/neu.html', '<div data-dss="tabs">'],
    ['Ereignisname', 'js/neu.js', "el.addEventListener('dss:tabchange', f);"],
    ['Dateiname im Import', 'js/neu.js', "import { x } from '/dss/dss.min.js';"],
    ['Bezeichner mit Unterstrich', 'js/neu.js', 'const DSS_BLOCKS = 1;'],
    ['Großbuchstaben in der Doku', 'stories/Neu.mdx', 'Das DSS Design System.'],
    ['Bezeichner in Camel-Schreibweise', 'js/neu.js', 'export function syncDss() {}'],
    ['Speicherschlüssel', 'js/neu.js', "localStorage.getItem('dss-theme')"],
    ['Paketname in Markdown', 'docs/neu.md', 'npm i @bbv/dss-design-system'],
    ['arc42-Quelle', 'docs/architecture/sections/05-building-block-view.adoc', 'Klassen `dss-*`'],
  ])('erkennt: %s', (_n, file, text) => {
    expect(mit(file, text)).toContain('dss');
  });
  it('erkennt einen Dateinamen mit dss, erlaubt aber den Namen des Migrationsskripts', () => {
    expect(findDss(new Map(real).set('js/dss-neu.js', '')).join('\n')).toContain('Dateiname');
    expect(mit('js/neu.js', '// siehe scripts/migrate-from-dss.mjs')).toBe('');
  });
  it('Allowlist-Pfade bleiben frei, auch mit altem Namen; README-Abschnitt „Migration“ ebenso', () => {
    expect(mit('docs/superpowers/specs/x.md', 'dss-btn')).toBe('');
    expect(mit('docs/entwuerfe/x.html', 'DSS')).toBe('');
    const readme = real.get('README.md')!;
    expect(mit('README.md', `${readme}\n## Migration von dss\n\n.dss-btn alt\n\n## Weiter\n`)).toBe('');
    expect(mit('README.md', `${readme}\n## Weiter unten\n\n.dss-btn alt\n`)).toContain('.dss-btn');
  });
});
