// @vitest-environment node
// Review W3: Startet kein einziger angeforderter Browser, enden check-browser-matrix.mjs und check-csp-boot.mjs mit Exit-Code 1 und klarer Meldung.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { noBrowserMessage, requireOneStarted } from '../scripts/browser-launch.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SCRIPTS = ['scripts/check-browser-matrix.mjs', 'scripts/check-csp-boot.mjs'];

afterEach(() => { process.exitCode = undefined; vi.restoreAllMocks(); });

describe('kein Browser gestartet ist ein Fehlschlag', () => {
  it.each(SCRIPTS)('%s mit unbekanntem Browser: Exit-Code 1, Meldung auf stderr, ohne vorher zu bauen', (script) => {
    const run = spawnSync(process.execPath, [script, '--browsers=keiner'], { cwd: ROOT, encoding: 'utf8', timeout: 30000 });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('Kein angeforderter Browser ist gestartet (angefordert: keiner)');
    expect(run.stdout).toBe('');
  });

  it.each(SCRIPTS)('%s prüft nach den Läufen mit requireOneStarted (Startfehler, z. B. Firefox hier)', (script) => {
    const source = readFileSync(new URL(`../${script}`, import.meta.url), 'utf8');
    expect(source).toContain("import { exitIfNoKnownBrowser, requireOneStarted } from './browser-launch.mjs'");
    expect(source).toMatch(/exitIfNoKnownBrowser\(BROWSERS\);/);
    expect(source).toMatch(/requireOneStarted\(BROWSERS, versions, notStarted\);/);
  });

  it('requireOneStarted setzt Exit-Code 1 nur, wenn kein Browser lief', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(requireOneStarted(['firefox'], {}, [{ browser: 'firefox', reason: 'Could not find profile folder' }])).toBe(false);
    expect(process.exitCode).toBe(1);
    expect(err.mock.calls[0][0]).toBe(noBrowserMessage(['firefox'], [{ browser: 'firefox', reason: 'Could not find profile folder' }]));
    process.exitCode = undefined;
    expect(requireOneStarted(['chromium', 'firefox'], { chromium: '153' }, [{ browser: 'firefox', reason: 'x' }])).toBe(true);
    expect(process.exitCode).toBeUndefined();
  });
});
