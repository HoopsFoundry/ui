// @vitest-environment node
// Der Workflow .github/workflows/release-vanilla.yml (ungetestet bis zum ersten Tag): Aufbau, Rechte, Reihenfolge; Mutationen der Regeln.
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { mutate, read } from './helpers/mutation';
import { jobText, workflowRules } from './helpers/release-workflow-rules';

const FILE = '.github/workflows/release-vanilla.yml';
const yaml = read(FILE);

describe('release-vanilla.yml', () => {
  it('erfüllt alle Regeln', () => {
    for (const [name, ok] of Object.entries(workflowRules(yaml))) expect(ok, name).toBe(true);
  });
  it('lässt sich mit einem YAML-Parser lesen (python3 mit PyYAML, sonst übersprungen)', () => {
    const run = spawnSync('python3', ['-c', 'import sys, json, yaml; print(json.dumps(yaml.safe_load(sys.stdin.read())))'], { input: yaml, encoding: 'utf8' });
    if (run.status !== 0) return;
    const doc = JSON.parse(run.stdout);
    const on = doc.on ?? doc.true;
    expect(Object.keys(on).sort()).toEqual(['push', 'workflow_dispatch']);
    expect(on.push.tags).toEqual(['v*']);
    expect(on.workflow_dispatch.inputs.dry_run.default).toBe(true);
    expect(Object.keys(doc.jobs)).toEqual(['build', 'release']);
    expect(doc.permissions).toEqual({ contents: 'read' });
    expect(doc.jobs.release.permissions).toEqual({ contents: 'write' });
    expect(doc.jobs.build.permissions).toBeUndefined();
    expect(doc.jobs.release.needs).toBe('build');
    const names = doc.jobs.build.steps.map((s: { name?: string }) => s.name);
    expect(names.indexOf('Test')).toBeLessThan(names.indexOf('Build'));
  });
  it('jobText trennt die Jobs', () => {
    expect(jobText(yaml, 'build')).toContain('npm ci');
    expect(jobText(yaml, 'build')).not.toContain('action-gh-release');
    expect(jobText(yaml, 'release')).toContain('action-gh-release');
  });
  it('alle Aktionen sind auf eine Hauptversion festgelegt', () => {
    const uses = [...yaml.matchAll(/uses: ([\w./-]+)@(\S+)/g)];
    expect(uses.length).toBeGreaterThanOrEqual(5);
    for (const [, name, version] of uses) expect(version, name).toMatch(/^v\d+$/);
  });
});

describe('release-vanilla.yml: Mutationen', () => {
  const MUTATIONS: { name: string; rule: string; from: string; to: string }[] = [
    { name: 'Tag-Trigger fehlt', rule: 'Trigger: Tag v* und manuell', from: "      - 'v*'", to: "      - 'x*'" },
    { name: 'dry_run standardmäßig falsch', rule: 'Eingaben: version und dry_run (Standard true)', from: 'default: true', to: 'default: false' },
    { name: 'Schreibrecht für alle', rule: 'Rechte: oben nur lesen, Schreibrecht genau einmal und nur im Release-Job', from: 'permissions:\n  contents: read', to: 'permissions:\n  contents: write' },
    { name: 'Schreibrecht im Bau-Job', rule: 'Rechte: oben nur lesen, Schreibrecht genau einmal und nur im Release-Job', from: '    outputs:', to: '    permissions:\n      contents: write\n    outputs:' },
    { name: 'Tests nach dem Bau', rule: 'Ablauf: install, test, typecheck, build, Release-Skript in dieser Reihenfolge', from: '      - name: Test\n        run: npm test\n', to: '' },
    { name: 'ohne Versionsabgleich', rule: 'Release-Skript prüft die Version gegen den Tag (--expect-version)', from: ' --expect-version="$VERSION"', to: '' },
    { name: 'alter Checkout', rule: 'Aktionen: checkout@v7 und setup-node mit Node 22', from: 'actions/checkout@v7', to: 'actions/checkout@v4' },
    { name: 'Release bei jedem Lauf', rule: 'Release nur bei Tag-Push oder manuell ohne dry_run auf einem Tag', from: " && github.ref_type == 'tag')", to: ')' },
    { name: 'Release ohne Bau', rule: 'Release-Job hängt an build und lädt das Artefakt', from: '    needs: build\n', to: '' },
    { name: 'Anhang fehlt', rule: 'Anhänge: tgz, sha256, manifest.json (fail_on_unmatched_files)', from: '            release/manifest.json\n', to: '' },
    { name: 'Release im Bau-Job', rule: 'Bau-Job legt das Artefakt an, ohne Release', from: '          if-no-files-found: error', to: '          if-no-files-found: error\n      - uses: softprops/action-gh-release@v3' },
    { name: 'Versionsformat ungeprüft', rule: 'Versionsformat wird geprüft', from: '[0-9]*.[0-9]*.[0-9]*', to: '*' },
  ];
  for (const m of MUTATIONS) {
    it(`${m.name} → Regel „${m.rule}“ kippt`, () => {
      const rules = workflowRules(mutate(yaml, m.from, m.to));
      expect(rules[m.rule], m.rule).toBe(false);
    });
  }
});
