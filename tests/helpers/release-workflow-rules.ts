// Regeln für .github/workflows/release-vanilla.yml (Text, das Versions-Skript wird im echten bash ausgeführt).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Rules } from './mutation';

/** Text eines Jobs: ab `  <name>:` unter `jobs:` bis zum nächsten Job. */
export function jobText(yaml: string, name: string) {
  const jobs = yaml.slice(yaml.indexOf('\njobs:'));
  const start = jobs.indexOf(`\n  ${name}:`);
  if (start < 0) return '';
  const next = jobs.slice(start + 1).search(/\n {2}[a-z][\w-]*:\n/);
  return next < 0 ? jobs.slice(start) : jobs.slice(start, start + 1 + next);
}

/** Die `run:`-Blöcke (Zeile mit `run:` und die tiefer eingerückten Folgezeilen). */
export function runBlocks(yaml: string) {
  const lines = yaml.split('\n');
  const blocks: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\s*)run:(.*)$/);
    if (!match) continue;
    const indent = match[1].length;
    const body = [match[2]];
    while (i + 1 < lines.length && (lines[i + 1].trim() === '' || lines[i + 1].search(/\S/) > indent)) body.push(lines[++i]);
    blocks.push(body.join('\n'));
  }
  return blocks;
}

/** Das Skript des Schritts „Version bestimmen“ (Einrückung entfernt). */
export function versionScript(yaml: string) {
  const start = yaml.indexOf('- name: Version bestimmen');
  const run = yaml.indexOf('run: |\n', start);
  if (start < 0 || run < 0) return '';
  const lines = yaml.slice(run + 'run: |\n'.length).split('\n');
  const indent = lines[0].search(/\S/);
  const out: string[] = [];
  for (const line of lines) {
    if (line.trim() !== '' && line.search(/\S/) < indent) break;
    out.push(line.slice(indent));
  }
  return out.join('\n');
}

export type VersionRun = { status: number | null; output: string };

/** Führt das Versions-Skript mit den Umgebungswerten aus; liefert Exit-Code und den Inhalt von GITHUB_OUTPUT. */
export function runVersionScript(yaml: string, env: Record<string, string>): VersionRun {
  const dir = mkdtempSync(join(tmpdir(), 'hoops-wf-'));
  const out = join(dir, 'output');
  try {
    const run = spawnSync('bash', ['-c', versionScript(yaml)], { env: { PATH: process.env.PATH ?? '', GITHUB_OUTPUT: out, ...env }, encoding: 'utf8' });
    let output = '';
    try {
      output = readFileSync(out, 'utf8');
    } catch {
      /* keine Ausgabe */
    }
    return { status: run.status, output };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const GOOD_VERSIONS = ['0.9.0', '1.0.0', '10.20.30', '1.0.0-rc.1', '2.1.3-beta-2'];
export const BAD_VERSIONS = [
  '1.2.3;rm -rf x', '1.2.3\nversion=evil', '1.2.3\n', ' 1.2.3', '1.2.3 ', '1.2.3 && id', '$(id)', '1.2.3$(id)', '`id`', "1.2.3'x", '1.2.3"x', '1.2.3|id', '1.2.3\r\nx=1',
  '', '1.2', 'v1.2.3', '1.2.3-', '../x', '1.2.3-a b', '-1.2.3', 'a.b.c'
];

/** Text ohne Kommentarzeilen. */
export const withoutComments = (text: string) => text.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

export function workflowRules(yaml: string): Rules {
  const build = jobText(yaml, 'build');
  const release = withoutComments(jobText(yaml, 'release'));
  const top = yaml.slice(0, yaml.indexOf('\njobs:'));
  const order = ['npm ci', 'npm test', 'npm run typecheck', 'npm run build', 'release-vanilla.mjs'].map((s) => build.indexOf(s));
  const base = { EVENT: 'workflow_dispatch', REF_NAME: 'main', REF_TYPE: 'branch' };
  const good = GOOD_VERSIONS.every((v) => {
    const r = runVersionScript(yaml, { ...base, INPUT_VERSION: v });
    return r.status === 0 && r.output === `version=${v}\n`;
  });
  const bad = BAD_VERSIONS.every((v) => {
    const r = runVersionScript(yaml, { ...base, INPUT_VERSION: v });
    return r.status !== 0 && r.output === '';
  });
  const tagMismatch = runVersionScript(yaml, { EVENT: 'workflow_dispatch', INPUT_VERSION: '1.2.3', REF_NAME: 'v1.2.4', REF_TYPE: 'tag' });
  const tagOk = runVersionScript(yaml, { EVENT: 'push', INPUT_VERSION: '', REF_NAME: 'v1.2.3', REF_TYPE: 'tag' });
  const tagEvil = runVersionScript(yaml, { EVENT: 'push', INPUT_VERSION: '', REF_NAME: 'v1.2.3;id', REF_TYPE: 'tag' });
  const uses = [...release.matchAll(/uses: ([\w./-]+)@(\S+)/g)];
  return {
    'Trigger: Tag v* und manuell': /push:\n\s+tags:\n\s+- 'v\*'/.test(yaml) && yaml.includes('workflow_dispatch:'),
    'Eingaben: version und dry_run (Standard true)': /version:\n[^]*?required: true\n\s+type: string/.test(top) && /dry_run:\n[^]*?default: true/.test(top),
    'Rechte: oben nur lesen, Schreibrecht genau einmal und nur im Release-Job': /\npermissions:\n  contents: read\n/.test(top) && yaml.split('contents: write').length === 2 && release.includes('contents: write') && !build.includes('contents: write'),
    'Ablauf: install, test, typecheck, build, Release-Skript in dieser Reihenfolge': order.every((i) => i > 0) && order.every((v, i) => i === 0 || v > order[i - 1]),
    'Release-Skript prüft die Version gegen den Tag (--expect-version)': build.includes('release-vanilla.mjs --no-build --expect-version='),
    'Aktionen: checkout@v7 und setup-node mit Node 22': yaml.includes('actions/checkout@v7') && /node-version: '22'/.test(yaml),
    'Release nur bei Tag-Push oder manuell ohne dry_run auf einem Tag': /if: github\.event_name == 'push' \|\| \(github\.event_name == 'workflow_dispatch' && inputs\.dry_run == false && github\.ref_type == 'tag'\)/.test(release),
    'Release-Job hängt an build und lädt das Artefakt': release.includes('needs: build') && release.includes('actions/download-artifact@'),
    'Anhänge: Tarball, beide Prüfsummen, Manifest und hoops-sync.mjs mit Prüfsumme (fail_on_unmatched_files)':
      ['.tgz\n', '.tgz.sha256', '.sha256\n', 'release/manifest.json', 'release/hoops-sync.mjs\n', 'release/hoops-sync.mjs.sha256'].every((p) => release.includes(p)) && release.includes('fail_on_unmatched_files: true'),
    'Bau-Job legt das Artefakt an, ohne Release': build.includes('actions/upload-artifact@') && !build.includes('action-gh-release'),
    'Version: strikte Prüfung mit Regex, kein case-Glob': versionScript(yaml).includes('=~ ^[0-9]+\\.[0-9]+\\.[0-9]+(-[0-9A-Za-z.-]+)?$') && !versionScript(yaml).includes('case '),
    'Version: gültige Werte werden ausgegeben': good,
    'Version: bösartige und ungültige Werte (Zeilenumbruch, Semikolon, Leerzeichen, $(…), leer) brechen ab und schreiben nichts': bad,
    'Version: Tag muss zur Version passen, Tag-Name wird geprüft': tagMismatch.status !== 0 && tagMismatch.output === '' && tagOk.status === 0 && tagOk.output === 'version=1.2.3\n' && tagEvil.status !== 0 && tagEvil.output === '',
    'Keine ${{ }}-Ausdrücke in run-Blöcken (Injektion), Werte kommen über env': runBlocks(yaml).every((b) => !b.includes('${{')) && versionScript(yaml).includes('"$INPUT_VERSION"'),
    'Aktionen mit Schreibrecht sind auf einen Commit festgelegt (SHA, Version im Kommentar)': uses.length >= 2 && uses.every((m) => /^[0-9a-f]{40}$/.test(m[2])) && [...release.matchAll(/uses: \S+@[0-9a-f]{40} # v\d+\.\d+\.\d+/g)].length === uses.length,
    'Jeder Job hat timeout-minutes': build.includes('timeout-minutes:') && release.includes('timeout-minutes:'),
    'Checkout ohne gespeicherte Zugangsdaten und mit vollem Verlauf': build.includes('persist-credentials: false') && build.includes('fetch-depth: 0'),
    'Der Tag-Commit muss auf main liegen': build.includes('git merge-base --is-ancestor "$GITHUB_SHA" origin/main') && /name: Tag-Commit liegt auf main\n\s+if: github\.ref_type == 'tag'/.test(build),
    'Build-Provenance ist vorbereitet, aber nicht aktiv': /# +uses: actions\/attest-build-provenance@/.test(yaml) && !/^\s+uses: actions\/attest-build-provenance/m.test(yaml),
  };
}
