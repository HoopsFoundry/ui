// @vitest-environment node
// Doku zur Auslieferung (Foundation/Vanilla, README, CHANGELOG, arc42): Aufrufe stimmen mit portal-sync überein, Zahlen mit den Budgets und dem
// Prüfstand, die Seiten nennen die neuen Abschnitte; Gegenproben gegen verfälschte Texte.
import { describe, expect, it } from 'vitest';
import { BUDGETS } from '../scripts/vanilla-budgets.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { parseArgs } from '../scripts/portal-sync.mjs';
import { budget, compat, getSync, manualCheck, nodeVersions, npmSwitch, releaseSync, renderBudget, mapBudget, updateFlow } from '../stories/Foundation/Vanilla.code';
import { mutate, read } from './helpers/mutation';

const mdx = read('stories/Foundation/Vanilla.mdx');
const adr = read('docs/architecture/sections/09-architecture-decisions.adoc');
const deploy = read('docs/architecture/sections/07-deployment-view.adoc');
const quality = read('docs/architecture/sections/10-quality-requirements.adoc');
const pkg = JSON.parse(read('package.json'));

/** Alle `node dss-sync.mjs …`- und `npx dss-sync …`-Zeilen eines Codebeispiels als Argumentlisten. */
const syncCalls = (code: string) =>
  code.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('node dss-sync.mjs') || l.startsWith('npx dss-sync')).map((l) => l.replace(/\s+#.*$/, '').split(/\s+/).slice(l.startsWith('npx') ? 2 : 2));

describe('Aufrufe in der Doku', () => {
  it.each([['releaseSync', releaseSync], ['updateFlow', updateFlow], ['npmSwitch', npmSwitch], ['getSync', getSync]])('%s: jeder portal-sync-Aufruf wird von parseArgs verstanden', (_n, code) => {
    const calls = syncCalls(code as string);
    expect(calls.length).toBeGreaterThan(0);
    for (const args of calls) expect(() => parseArgs(args), args.join(' ')).not.toThrow();
  });
  it('die drei Quellen und die Basisadresse kommen vor', () => {
    const all = syncCalls(releaseSync).flat();
    for (const flag of ['--from-release', '--from-package', '--from-dir', '--base-url']) expect(all, flag).toContain(flag);
  });
  it('die Adresse im Beispiel ist die Standard-Adresse des Skripts', () => {
    expect(releaseSync).toContain('https://github.com/OliEder/dss-design-system/releases/download/v0.9.0/');
    expect(read('scripts/portal-sync.mjs')).toContain("'https://github.com/OliEder/dss-design-system/releases/download'");
    expect(manualCheck).toContain('shasum -a 256 -c dss-vanilla-0.9.0.sha256');
    expect(manualCheck).toContain('shasum -a 256 -c dss-vanilla-0.9.0.tgz.sha256');
    expect(getSync).toContain('shasum -a 256 -c dss-sync.mjs.sha256');
    expect(getSync).toContain('releases/download/v0.9.0/dss-sync.mjs');
  });
  it('der Rollback nennt dieselbe Zeile mit der alten Version', () => {
    expect(updateFlow).toMatch(/Rollback[^\n]*\nnode dss-sync\.mjs --from-release 0\.9\.0/);
  });
});

describe('Zahlen und Stand', () => {
  it('die Budgets der Doku sind die Budgets aus scripts/vanilla-budgets.mjs', () => {
    expect(budget.minKB * 1024).toBe(BUDGETS.dss.minBytes);
    expect(budget.gzipKB * 1024).toBe(BUDGETS.dss.gzipBytes);
    expect(renderBudget.minKB * 1024).toBe(BUDGETS['dss-render'].minBytes);
    expect(renderBudget.gzipKB * 1024).toBe(BUDGETS['dss-render'].gzipBytes);
    expect(mapBudget.minKB * 1024).toBe(BUDGETS['dss-map'].minBytes);
    expect(mapBudget.gzipKB * 1024).toBe(BUDGETS['dss-map'].gzipBytes);
  });
  it('die Browsertabelle summiert sich auf die Gesamtzahl (drei Prüfungen gelten allen Browsern)', () => {
    expect(compat.browsers.reduce((sum, b) => sum + b.checks, 0) + 3).toBe(compat.checks);
    expect(compat.checks).toBe(89);
    expect(compat.browsers.map((b) => b.name)).toEqual(['Chromium', 'WebKit (Safari-Engine)', 'Firefox']);
    expect(compat.browsers.find((b) => b.name === 'Firefox')!.result).toBe('nicht gelaufen');
  });
  it('arc42 nennt den Prüfstand mit denselben Zahlen wie die Doku', () => {
    for (const b of compat.browsers.filter((x) => x.checks)) expect(quality).toContain(String(b.checks));
    expect(quality).toContain('Firefox ist nicht gelaufen');
    expect(quality).toContain('Ursache ist ungeklärt');
    expect(compat.browsers.find((b) => b.name === 'Firefox')!.note).toContain('Ursache ungeklärt');
    expect(compat.browsers.find((b) => b.name === 'Firefox')!.note).not.toMatch(/nicht im Paket|liegt im Playwright/);
    expect(mdx).not.toContain('Die Ursache liegt im');
    expect(quality).toContain('npm 11');
  });
});

describe('Seiten und Verweise', () => {
  it('Foundation/Vanilla hat die vier neuen Abschnitte, das Beispiel und den Workflow', () => {
    for (const part of ['## Einbinden aus dem Release', '## Aktualisieren', '## Kompatibilität', '## Wechsel auf npm ab 1.0', 'portal-seite', 'release-vanilla.yml', 'dry_run', 'Rollback', 'sha256', 'dss-sync.mjs', 'npx dss-sync', 'Node 18', 'relative Pfade', 'noscript', 'byte-gleich', '--allow-insecure-http', '32 MiB', 'Ausblick', 'attest-build-provenance']) expect(mdx, part).toContain(part);
    expect(nodeVersions).toEqual(['18.20.8', '20.20.2', '22.21.0']);
  });
  it('ADR-006 beschreibt Ablauf, Prüfsummen, austauschbare Quelle und die Grenze der Prüfsumme', () => {
    const section = adr.slice(adr.indexOf('=== ADR-006'), adr.indexOf('=== ADR-007'));
    for (const part of ['scripts/release-vanilla.mjs', '.sha256', '.tgz.sha256', 'manifest.json', 'dss-sync.mjs', '--from-release', '--from-package', '--from-dir', 'vanilla-budgets.mjs', 'keine Signatur', 'release-vanilla.yml', '.dss-release', '.dss-sync.lock', '--allow-insecure-http', '--allow-redirect-host', '32 MiB', 'Betriebssystem-Byte 3', 'Node 18', 'attest-build-provenance', 'byte-gleich', 'zurückrollen']) expect(section, part).toContain(part);
    expect(section).not.toMatch(/feat\/|Branch|Umsetzung laut Plan/);
  });
  it('die Verteilungssicht nennt den Ablauf und was nicht nachgewiesen ist', () => {
    for (const part of ['release-vanilla.mjs', 'release-vanilla.yml', 'dss-sync.mjs --from-release', 'Nicht nachgewiesen', 'Node 18.20.8, 20.20.2 und 22.21.0', 'Prüfsummen sind keine Signatur']) expect(deploy, part).toContain(part);
  });
  it('README, CHANGELOG, Einführung und CLAUDE.md nennen Release und Beispielseite', () => {
    expect(read('README.md')).toContain('--from-release');
    expect(read('README.md')).toContain('byte-gleich');
    expect(read('CHANGELOG.md')).toContain('byte-gleich');
    expect(read('CHANGELOG.md')).toContain('Segmentierte Tabs');
    expect(read('README.md')).toContain('portal-seite');
    expect(read('CHANGELOG.md')).toContain('Vanilla-Paket V3');
    expect(read('stories/Introduction.mdx')).toContain('Kompatibilität');
    expect(read('CLAUDE.md')).toContain('scripts/release-vanilla.mjs');
    expect(read('CLAUDE.md')).toContain('scripts/check-portal-seite.mjs');
  });
  it('release/ ist ignoriert und gehört nicht ins npm-Paket', () => {
    expect(read('.gitignore')).toMatch(/^release\/$/m);
    expect(pkg.files).toContain('dist/');
    expect(pkg.files).toEqual(expect.arrayContaining(['scripts/portal-sync.mjs', 'scripts/lib/']));
    expect(pkg.files.filter((f: string) => /scripts/.test(f)).sort()).toEqual(['scripts/lib/', 'scripts/migrate-from-dss.mjs', 'scripts/migration-table.mjs', 'scripts/portal-sync.mjs']);
    expect(pkg.bin).toEqual({ 'dss-sync': 'scripts/portal-sync.mjs', 'hoops-migrate': 'scripts/migrate-from-dss.mjs' });
    expect(pkg.exports['./portal-sync.mjs']).toBe('./scripts/portal-sync.mjs');
    expect(pkg.devDependencies.esbuild).toBeTruthy();
    expect(pkg.engines.node).toBe('>=18.0.0');
    expect(pkg.scripts['build:vanilla']).toBe('node scripts/build-vanilla.mjs');
  });
  it('die Beispielseite hat keine Fremd-Adressen, kein style und keinen Inline-Handler', () => {
    for (const file of ['index.html', 'team.html']) {
      const html = read(`stories/examples/portal-seite/${file}`);
      expect(html.match(/(?:src|href)="https?:\/\//g) ?? [], file).toEqual([]);
      // relative Pfade: auf einer GitHub-Pages-Projektseite (Unterpfad) tragen nur sie
      expect(html.match(/(?:src|href)="\/(?!\/)/g) ?? [], file).toEqual([]);
      expect(html).toContain('<noscript>');
      expect(html).toMatch(/data-dss-modal-open="fehler-melden" hidden>/);
      expect(html).not.toMatch(/<style|\sstyle="|\son[a-z]+="/);
    }
    const js = read('stories/examples/portal-seite/portal.js');
    expect(js).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/);
    expect(js).not.toMatch(/https?:\/\//);
    expect(js.match(/from '\/|import\('\//g) ?? []).toEqual([]);
    const css = read('stories/examples/portal-seite/portal.css');
    expect(css).toContain('[hidden] { display: none !important; }');
    expect(css).toMatch(/portal-skip:focus-visible[^{]*\{[^}]*var\(--hoops-ring-w\) var\(--hoops-ring-style\) var\(--hoops-ring-color\)/);
    expect(JSON.parse(read('stories/examples/portal-seite/data.json')).verein.name).toBe('TSV Nordhain 1920');
  });
});

describe('Gegenproben', () => {
  it('ein unbekannter Schalter in der Doku wird erkannt', () => {
    const wrong = mutate(releaseSync, '--from-release 0.9.0\n', '--von-release 0.9.0\n');
    expect(() => syncCalls(wrong).forEach((a) => parseArgs(a))).toThrow(/unbekannte Option/);
  });
  it('ein anderes Budget in der Doku fällt auf', () => {
    expect((budget.minKB + 1) * 1024).not.toBe(BUDGETS.dss.minBytes);
  });
});
