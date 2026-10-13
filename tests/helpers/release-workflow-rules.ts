// Regeln für .github/workflows/release-vanilla.yml (Text und, wenn vorhanden, das Ergebnis eines YAML-Parsers).
import type { Rules } from './mutation';

/** Text eines Jobs: ab `  <name>:` unter `jobs:` bis zum nächsten Job. */
export function jobText(yaml: string, name: string) {
  const jobs = yaml.slice(yaml.indexOf('\njobs:'));
  const start = jobs.indexOf(`\n  ${name}:`);
  if (start < 0) return '';
  const next = jobs.slice(start + 1).search(/\n {2}[a-z][\w-]*:\n/);
  return next < 0 ? jobs.slice(start) : jobs.slice(start, start + 1 + next);
}

export function workflowRules(yaml: string): Rules {
  const build = jobText(yaml, 'build');
  const release = jobText(yaml, 'release');
  const top = yaml.slice(0, yaml.indexOf('\njobs:'));
  const order = ['npm ci', 'npm test', 'npm run typecheck', 'npm run build', 'release-vanilla.mjs'].map((s) => build.indexOf(s));
  return {
    'Trigger: Tag v* und manuell': /push:\n\s+tags:\n\s+- 'v\*'/.test(yaml) && yaml.includes('workflow_dispatch:'),
    'Eingaben: version und dry_run (Standard true)': /version:\n[^]*?required: true\n\s+type: string/.test(top) && /dry_run:\n[^]*?default: true/.test(top),
    'Rechte: oben nur lesen, Schreibrecht genau einmal und nur im Release-Job': /\npermissions:\n  contents: read\n/.test(top) && yaml.split('contents: write').length === 2 && release.includes('contents: write') && !build.includes('contents: write'),
    'Ablauf: install, test, typecheck, build, Release-Skript in dieser Reihenfolge': order.every((i) => i > 0) && order.every((v, i) => i === 0 || v > order[i - 1]),
    'Release-Skript prüft die Version gegen den Tag (--expect-version)': build.includes('release-vanilla.mjs --no-build --expect-version='),
    'Aktionen: checkout@v7 und setup-node mit Node 22': yaml.includes('actions/checkout@v7') && /node-version: '22'/.test(yaml),
    'Release nur bei Tag-Push oder manuell ohne dry_run auf einem Tag': /if: github\.event_name == 'push' \|\| \(github\.event_name == 'workflow_dispatch' && inputs\.dry_run == false && github\.ref_type == 'tag'\)/.test(release),
    'Release-Job hängt an build und lädt das Artefakt': release.includes('needs: build') && release.includes('actions/download-artifact@'),
    'Anhänge: tgz, sha256, manifest.json (fail_on_unmatched_files)': /dss-vanilla-\$\{\{ needs\.build\.outputs\.version \}\}\.tgz/.test(release) && release.includes('.sha256') && release.includes('release/manifest.json') && release.includes('fail_on_unmatched_files: true'),
    'Bau-Job legt das Artefakt an, ohne Release': build.includes('actions/upload-artifact@') && !build.includes('action-gh-release'),
    'Versionsformat wird geprüft': build.includes('[0-9]*.[0-9]*.[0-9]*'),
  };
}
