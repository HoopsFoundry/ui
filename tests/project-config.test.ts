// @vitest-environment node
// project.config.json ist die eine Quelle für Besitzer/Repo, Domain, Release-Adresse und Paketname.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bundleSync } from '../scripts/release-vanilla.mjs';
import { RELEASE_BASE_URL, resolveBaseUrl } from '../scripts/portal-sync.mjs';
import { mutate, read } from './helpers/mutation';

const config = JSON.parse(read('project.config.json'));
const pkg = JSON.parse(read('package.json'));
const repo = `${config.repository.owner}/${config.repository.name}`;

/** Dateien, in denen die feste Adresse stehen darf (Text für Menschen, Verlauf, Migration, Konfiguration selbst). */
export const ALLOWED = [
  /^project\.config\.json$/, /^package\.json$/, /^package-lock\.json$/, /^CHANGELOG\.md$/, /^README\.md$/, /^LICENSE$/, /^CLAUDE\.md$/,
  /^docs\//, /^stories\/.*\.mdx$/, /^deploy\//, /^scripts\/(lib\/name-rename|migration-table|migrate-from-dss|codemod-names)\.mjs$/,
  /^tests\/(project-config|codemod-names|no-dss|migrate-from-dss)\.test\.ts$/, /^tests\/fixtures\//
];
const ADDRESS = /(?:github\.com\/|\bgithub:)HoopsFoundry\/ui|\bHoopsFoundry\/ui\b|[\w.-]*hoopsfoundry\.(?:com|de|org)\b/i;

export const findHardcoded = (files: Record<string, string>) =>
  Object.entries(files).filter(([f, text]) => !ALLOWED.some((a) => a.test(f)) && ADDRESS.test(text.split(config.npmPackage).join(''))).map(([f]) => f);

describe('project.config.json', () => {
  it('hat alle Felder', () => {
    expect(Object.keys(config).sort()).toEqual(['domain', 'name', 'npmPackage', 'releaseBaseUrl', 'repository']);
    expect(config.releaseBaseUrl).toBe(`https://github.com/${repo}/releases/download`);
  });
  it('package.json stimmt überein', () => {
    expect(pkg.name).toBe(config.npmPackage);
    expect(pkg.homepage).toBe(`https://${config.domain}`);
    expect(pkg.repository.url).toBe(`git+https://github.com/${repo}.git`);
    expect(pkg.bugs.url).toBe(`https://github.com/${repo}/issues`);
    expect(pkg.files).toContain('project.config.json');
  });
  it('keine feste Adresse außerhalb der Konfiguration (Code, Workflows, Stories als TypeScript)', () => {
    const list = execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter((f) => f && !/\.(png|jpe?g|webp|woff2?|ico|tgz)$/.test(f));
    const files: Record<string, string> = {};
    for (const f of list) {
      try {
        files[f] = readFileSync(f, 'utf8');
      } catch {
        /* gelöscht oder Verzeichnis */
      }
    }
    expect(findHardcoded(files)).toEqual([]);
  });
  it('Verbotstest erkennt eine feste Adresse (Mutation)', () => {
    expect(findHardcoded({ 'scripts/x.mjs': "const u = 'https://github.com/HoopsFoundry/ui/releases';" })).toEqual(['scripts/x.mjs']);
    expect(findHardcoded({ '.github/workflows/a.yml': '# https://ui.hoopsfoundry.com' })).toEqual(['.github/workflows/a.yml']);
    expect(findHardcoded({ 'README.md': 'https://ui.hoopsfoundry.com' })).toEqual([]);
  });
  it('Rangfolge der Release-Adresse: Option > Variable > eingebauter Wert', () => {
    expect(RELEASE_BASE_URL).toBe(config.releaseBaseUrl);
    expect(resolveBaseUrl('https://a.example', { HOOPS_UI_BASE_URL: 'https://b.example' })).toBe('https://a.example');
    expect(resolveBaseUrl(undefined, { HOOPS_UI_BASE_URL: 'https://b.example' })).toBe('https://b.example');
    expect(resolveBaseUrl(undefined, {})).toBe(config.releaseBaseUrl);
    expect(resolveBaseUrl(undefined, { HOOPS_UI_BASE_URL: '' })).toBe(config.releaseBaseUrl);
  });
  it('hoops-sync.mjs trägt die Werte zur Bauzeit ein und liest die Datei nicht', async () => {
    const text = (await bundleSync()).toString('utf8');
    expect(text).toContain(config.releaseBaseUrl);
    expect(text).toContain(config.npmPackage);
    expect(text).not.toContain('project.config.json');
  });
  it('Mutation: andere Quelle in portal-sync kippt die Rangfolge', () => {
    const src = read('scripts/portal-sync.mjs');
    const bad = mutate(src, 'explicit || env.HOOPS_UI_BASE_URL || RELEASE_BASE_URL', 'env.HOOPS_UI_BASE_URL || explicit || RELEASE_BASE_URL');
    expect(bad).toContain('env.HOOPS_UI_BASE_URL || explicit');
  });
});
