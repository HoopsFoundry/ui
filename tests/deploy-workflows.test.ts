// @vitest-environment node
// Auslieferungs-Workflows: deploy-webspace.yml (rsync), publish-npm.yml (Trusted Publishing, Tag-Push), .htaccess. Aufbau und Sicherheitsregeln; Mutationen.
import { describe, expect, it } from 'vitest';
import { mutate, read } from './helpers/mutation';
import { runBlocks, withoutComments } from './helpers/release-workflow-rules';

const deploy = read('.github/workflows/deploy-webspace.yml');
const npm = read('.github/workflows/publish-npm.yml');
const pages = read('.github/workflows/deploy-storybook.yaml');
const htaccess = read('deploy/htaccess');

const deployRules = (y: string) => ({
  'Trigger: Push auf main und manuell, kein pull_request': /\n {2}push:\n {4}branches:\n {6}- main/.test(y) && !/pull_request/.test(y) && y.includes('workflow_dispatch:'),
  'Probelauf ist Standard und nutzt rsync -n': /default: true/.test(y) && y.includes('flags+=(-n)'),
  'Rechte nur lesen': /\npermissions:\n  contents: read\n/.test(y) && !/id-token|contents: write/.test(y),
  'Secrets nur über env, nicht in run': runBlocks(y).every((b) => !b.includes('${{')),
  'Host-Schlüssel werden geprüft': y.includes('StrictHostKeyChecking=yes') && y.includes('UserKnownHostsFile'),
  'geänderter Host-Schlüssel wird erklärt': y.includes('Host key verification failed') && y.includes('DEPLOY_KNOWN_HOSTS mit der Ausgabe von ssh-keyscan') && y.includes('exit "$status"'),
  'Zielpfad wird auf Allgemeinheit geprüft': y.includes('DEPLOY_PATH ist zu allgemein'),
  'releases/ bleibt erhalten': y.includes("--exclude='/releases/'"),
  'Build vor Übertragung geprüft': y.includes('storybook-static/index.html'),
  'alle fünf Secrets': ['DEPLOY_HOST', 'DEPLOY_USER', 'DEPLOY_SSH_KEY', 'DEPLOY_KNOWN_HOSTS', 'DEPLOY_PATH'].every((s) => y.includes(`secrets.${s}`)),
  'Checkout ohne gespeicherte Zugangsdaten': y.includes('persist-credentials: false')
});

const npmRules = (y: string) => {
  const top = y.slice(0, y.indexOf('\njobs:'));
  return {
    'Auslöser: Tag-Push v* und manuell, kein Branch-Push': /\n {2}push:\n {4}tags:\n {6}- 'v\*'/.test(top) && !/branches:|pull_request/.test(top) && top.includes('workflow_dispatch:'),
    'OIDC: id-token write nur im Job': y.includes('id-token: write') && !top.includes('id-token'),
    'kein Token, kein NPM_ATOKEN': !/NPM_ATOKEN|NODE_AUTH_TOKEN|NPM_TOKEN/.test(withoutComments(y)),
    'npm wird aktualisiert': y.includes('npm install -g npm@latest'),
    'Tag muss zur Version passen': y.includes('"$REF_NAME" != "v$version"') && y.includes('"$REF_TYPE" != "tag"'),
    'Tests und Build vor dem Veröffentlichen': ['npm test', 'npm run typecheck', 'npm run build'].map((s) => y.indexOf(s)).every((i, k, a) => i > 0 && (k === 0 || i > a[k - 1])) && y.lastIndexOf('npm stage publish') > y.indexOf('npm run build'),
    'gestuft: kein direktes npm publish': !/npm publish/.test(withoutComments(y)),
    'Workflow-Datei heißt wie im Trusted Publisher': y.includes('Workflow-Datei `publish-npm.yml`'),
    'keine ${{ }} in run': runBlocks(y).every((b) => !b.includes('${{'))
  } as Record<string, boolean>;
};

describe('deploy-webspace.yml', () => {
  it('erfüllt alle Regeln', () => {
    for (const [n, ok] of Object.entries(deployRules(deploy))) expect(ok, n).toBe(true);
  });
  const M = [
    ['Probelauf entfällt', 'Probelauf ist Standard und nutzt rsync -n', 'flags+=(-n)', 'true'],
    ['Host-Schlüssel nicht geprüft', 'Host-Schlüssel werden geprüft', 'StrictHostKeyChecking=yes', 'StrictHostKeyChecking=no'],
    ['releases/ wird gelöscht', 'releases/ bleibt erhalten', "--exclude='/releases/'", ''],
    ['Schreibrecht', 'Rechte nur lesen', 'permissions:\n  contents: read', 'permissions:\n  contents: write'],
    ['Hinweis zum Host-Schlüssel entfällt', 'geänderter Host-Schlüssel wird erklärt', 'DEPLOY_KNOWN_HOSTS mit der Ausgabe von ssh-keyscan', 'DEPLOY_KNOWN_HOSTS erneuern'],
    ['Zielpfad-Prüfung entfällt', 'Zielpfad wird auf Allgemeinheit geprüft', 'DEPLOY_PATH ist zu allgemein', 'x']
  ];
  for (const [name, rule, from, to] of M) it(`${name} → „${rule}“ kippt`, () => expect(deployRules(mutate(deploy, from, to))[rule as keyof ReturnType<typeof deployRules>]).toBe(false));
});

describe('publish-npm.yml', () => {
  it('erfüllt alle Regeln', () => {
    for (const [n, ok] of Object.entries(npmRules(npm))) expect(ok, n).toBe(true);
  });
  const M = [
    ['Push auf Branch', 'Auslöser: Tag-Push v* und manuell, kein Branch-Push', "    tags:\n      - 'v*'", "    branches:\n      - main"],
    ['Token eingesetzt', 'kein Token, kein NPM_ATOKEN', '        run: npm test', '        run: npm test\n        env:\n          NODE_AUTH_TOKEN: ${{ secrets.NPM_ATOKEN }}'],
    ['Tag-Prüfung entfällt', 'Tag muss zur Version passen', '"$REF_NAME" != "v$version"', 'false'],
    ['kein npm-Update', 'npm wird aktualisiert', 'npm install -g npm@latest', 'true'],
    ['ohne id-token', 'OIDC: id-token write nur im Job', 'id-token: write', 'id-token: none']
  ];
  for (const [name, rule, from, to] of M) it(`${name} → „${rule}“ kippt`, () => expect(npmRules(mutate(npm, from, to))[rule]).toBe(false));
});

describe('Rückfall und .htaccess', () => {
  it('GitHub Pages läuft nur noch manuell', () => {
    expect(pages).not.toMatch(/\n {2}push:/);
    expect(pages).toContain('workflow_dispatch:');
  });
  it('.htaccess setzt HTTPS, Header und eine Report-Only-CSP', () => {
    for (const part of ['RewriteCond %{HTTPS} !=on', 'X-Content-Type-Options "nosniff"', 'Referrer-Policy', 'Content-Security-Policy-Report-Only', 'Strict-Transport-Security']) expect(htaccess, part).toContain(part);
    expect(htaccess).not.toMatch(/\bContent-Security-Policy "/);
  });
});
