// @vitest-environment node
// Der Workflow .github/workflows/release-vanilla.yml (ungetestet bis zum ersten Tag): Aufbau, Rechte, Reihenfolge; Mutationen der Regeln.
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { mutate, read } from './helpers/mutation';
import { jobText, withoutComments, workflowRules } from './helpers/release-workflow-rules';

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
    const uses = [...withoutComments(yaml).matchAll(/uses: ([\w./-]+)@(\S+)/g)];
    expect(uses.length).toBeGreaterThanOrEqual(5);
    for (const [, name, version] of uses) expect(version, name).toMatch(/^(v\d+|[0-9a-f]{40})$/);
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
    { name: 'hoops-sync.mjs fehlt im Anhang', rule: 'Anhänge: Tarball, beide Prüfsummen, Manifest und hoops-sync.mjs mit Prüfsumme (fail_on_unmatched_files)', from: '            release/hoops-sync.mjs\n', to: '' },
    { name: 'Tarball-Prüfsumme fehlt im Anhang', rule: 'Anhänge: Tarball, beide Prüfsummen, Manifest und hoops-sync.mjs mit Prüfsumme (fail_on_unmatched_files)', from: '.tgz.sha256\n', to: '.xx\n' },
    { name: 'Release im Bau-Job', rule: 'Bau-Job legt das Artefakt an, ohne Release', from: '          if-no-files-found: error', to: '          if-no-files-found: error\n      - uses: softprops/action-gh-release@v3' },
    { name: 'Versionsformat als case-Glob', rule: 'Version: strikte Prüfung mit Regex, kein case-Glob', from: 'if ! [[ $version =~ ^[0-9]+\\.[0-9]+\\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then', to: 'case "$version" in [0-9]*.[0-9]*.[0-9]*) ;; *) false ;; esac; if false; then' },
    { name: 'Regex ohne Zeilenende-Anker', rule: 'Version: bösartige und ungültige Werte (Zeilenumbruch, Semikolon, Leerzeichen, $(…), leer) brechen ab und schreiben nichts', from: '(-[0-9A-Za-z.-]+)?$ ]]', to: '(-[0-9A-Za-z.-]+)?.* ]]' },
    { name: 'Regex ohne Zeilenanfang-Anker', rule: 'Version: bösartige und ungültige Werte (Zeilenumbruch, Semikolon, Leerzeichen, $(…), leer) brechen ab und schreiben nichts', from: '=~ ^[0-9]+', to: '=~ [0-9]+' },
    { name: 'Ausgabe vor der Prüfung', rule: 'Version: bösartige und ungültige Werte (Zeilenumbruch, Semikolon, Leerzeichen, $(…), leer) brechen ab und schreiben nichts', from: '          if ! [[ $version', to: '          echo "version=$version" >> "$GITHUB_OUTPUT"\n          if ! [[ $version' },
    { name: 'Tag-Abgleich entfällt', rule: 'Version: Tag muss zur Version passen, Tag-Name wird geprüft', from: '[ "$REF_NAME" != "v$version" ]', to: 'false' },
    { name: 'Wert direkt eingesetzt', rule: 'Keine ${{ }}-Ausdrücke in run-Blöcken (Injektion), Werte kommen über env', from: '            version="$INPUT_VERSION"', to: '            version="${{ inputs.version }}"' },
    { name: 'Aktion ohne SHA-Pin', rule: 'Aktionen mit Schreibrecht sind auf einen Commit festgelegt (SHA, Version im Kommentar)', from: 'softprops/action-gh-release@efb35369e0ad2afab669f228072c1b0d510eae64 # v3.0.3', to: 'softprops/action-gh-release@v3' },
    { name: 'SHA-Pin ohne Versionskommentar', rule: 'Aktionen mit Schreibrecht sind auf einen Commit festgelegt (SHA, Version im Kommentar)', from: ' # v8.0.2', to: '' },
    { name: 'timeout fehlt im Release-Job', rule: 'Jeder Job hat timeout-minutes', from: '    timeout-minutes: 10\n', to: '' },
    { name: 'Zugangsdaten bleiben im Checkout', rule: 'Checkout ohne gespeicherte Zugangsdaten und mit vollem Verlauf', from: '          persist-credentials: false\n', to: '' },
    { name: 'kein voller Verlauf', rule: 'Checkout ohne gespeicherte Zugangsdaten und mit vollem Verlauf', from: '          fetch-depth: 0\n', to: '' },
    { name: 'main-Prüfung entfällt', rule: 'Der Tag-Commit muss auf main liegen', from: 'git merge-base --is-ancestor "$GITHUB_SHA" origin/main', to: 'true' },
    { name: 'main-Prüfung nur ohne Tag', rule: 'Der Tag-Commit muss auf main liegen', from: "        if: github.ref_type == 'tag'", to: "        if: github.ref_type != 'tag'" },
    { name: 'Provenance eingeschaltet', rule: 'Build-Provenance ist vorbereitet, aber nicht aktiv', from: '      # - name: Provenance der Anhänge erzeugen\n      #   uses: actions/attest-build-provenance@<Commit-SHA> # <Version>', to: '      - name: Provenance der Anhänge erzeugen\n        uses: actions/attest-build-provenance@v2' },
  ];
  for (const m of MUTATIONS) {
    it(`${m.name} → Regel „${m.rule}“ kippt`, () => {
      const rules = workflowRules(mutate(yaml, m.from, m.to));
      expect(rules[m.rule], m.rule).toBe(false);
    });
  }
});
