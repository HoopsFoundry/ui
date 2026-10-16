// @vitest-environment node
// Stufen K und D der Umbenennung (scripts/lib/name-rename.mjs, scripts/codemod-names.mjs, Migrationsskript): Regeln, Kontexte, Idempotenz,
// Fremdklassen, Latin-1, Probelauf. Die Beispielprojekte entstehen im Test (Temp-Ordner), damit im Bestand kein altes Markup liegt.
import { afterAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { applyRules, REGELN_D, REGELN_K, REGELSTUFEN } from '../scripts/lib/name-rename.mjs';
import { planen } from '../scripts/codemod-names.mjs';
import { migrateProject } from '../scripts/migrate-from-dss.mjs';

const alle = [...REGELN_D, ...REGELN_K];
const neu = (text: string) => applyRules(text, alle).text;
const made: string[] = [];
const work = () => { const d = mkdtempSync(join(tmpdir(), `hoops-names-${process.pid}-`)); made.push(d); return d; };
afterAll(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });
const put = (d: string, f: string, t: string | Buffer) => { mkdirSync(join(d, f, '..'), { recursive: true }); writeFileSync(join(d, f), t); };

describe('Stufe K: Klassen', () => {
  it('Familienregel in class, CSS-Selektoren, BEM und Zustandsklassen (is-… bleibt)', () => {
    expect(neu('<div class="dss-btn dss-btn--sm is-open">')).toBe('<div class="hoops-btn hoops-btn--sm is-open">');
    expect(neu('.dss-tab.is-active:hover > .dss-tab-label::after { }')).toBe('.hoops-tab.is-active:hover > .hoops-tab-label::after { }');
  });
  it('Template-Literal, Verkettung, classList, querySelector, closest, Svelte class: und React className', () => {
    expect(neu('const c = `dss-${kind}`;')).toBe('const c = `hoops-${kind}`;');
    expect(neu("const c = 'dss-' + name;")).toBe("const c = 'hoops-' + name;");
    expect(neu("el.classList.add('dss-acc--open');")).toBe("el.classList.add('hoops-acc--open');");
    expect(neu("root.querySelector('.dss-acc-panel'); el.closest('.dss-modal')")).toBe("root.querySelector('.hoops-acc-panel'); el.closest('.hoops-modal')");
    expect(neu('<span class:dss-team-name--short={kurz} />')).toBe('<span class:hoops-team-name--short={kurz} />');
    expect(neu('<i className={`dss-chip dss-chip--${t}`} />')).toBe('<i className={`hoops-chip hoops-chip--${t}`} />');
  });
  it('Fremdklassen mit zufälligem Teilwort bleiben; Tokens (Stufe T) werden nicht angefasst', () => {
    const fremd = '.xdss-a, .my-dss-b, .adss-c, praefix-eines-dss-namens, var(--dss-fg), --_dss-x';
    expect(neu(fremd)).toBe(fremd);
  });
});

describe('Stufe D: data-Attribute, Ereignisse, Schlüssel, Dateinamen', () => {
  it('data-dss, data-dss-* in HTML, Attributselektoren, JSX und dataset', () => {
    expect(neu('<main data-dss="pagenav" data-dss-options=\'{}\'>')).toBe('<main data-hoops="pagenav" data-hoops-options=\'{}\'>');
    expect(neu('[data-dss-acc], [data-dss="tabs"] { }')).toBe('[data-hoops-acc], [data-hoops="tabs"] { }');
    expect(neu('el.dataset.dssAppnavReady = "1"')).toBe('el.dataset.hoopsAppnavReady = "1"');
  });
  it('Ereignisnamen in addEventListener, dispatchEvent und Doku', () => {
    expect(neu("el.addEventListener('dss:tabchange', f); new CustomEvent('dss:modalopen')")).toBe("el.addEventListener('hoops:tabchange', f); new CustomEvent('hoops:modalopen')");
  });
  it('Speicherschlüssel und Symbol-Schlüssel', () => {
    expect(neu("localStorage.getItem('dss-theme')")).toBe("localStorage.getItem('hoops-theme')");
    expect(neu("Symbol.for('dss.registry')")).toBe("Symbol.for('hoops.registry')");
  });
  it('Dateinamen in Importen, link, script, JSON und Markdown', () => {
    expect(neu('<link rel="stylesheet" href="/dss/dss.css"><script type="module" src="/dss/dss.min.js">')).toBe('<link rel="stylesheet" href="/hoops/hoops.css"><script type="module" src="/hoops/hoops.min.js">');
    expect(neu("import { mountMap } from '/dss/dss-map.min.js';")).toBe("import { mountMap } from '/hoops/hoops-map.min.js';");
    expect(neu("import { renderX } from './dist/vanilla/dss-render.js'")).toBe("import { renderX } from './dist/vanilla/hoops-render.js'");
    expect(neu('"import": "./dist/vanilla/dss.js", "types": "./dss.d.ts"')).toBe('"import": "./dist/vanilla/hoops.js", "types": "./hoops.d.ts"');
  });
  it('Paketname, Repository, Release-Tarball', () => {
    expect(neu("import 'x' from '@bbv/dss-design-system/react'")).toBe("import 'x' from '@hoopsfoundry/ui/react'");
    expect(neu('https://github.com/OliEder/dss-design-system/releases/download/v1/dss-vanilla-1.tgz')).toBe('https://github.com/HoopsFoundry/ui/releases/download/v1/hoops-ui-1.tgz');
  });
});

describe('Werkzeug', () => {
  it('Idempotenz: ein zweiter Lauf ändert nichts', () => {
    const t = '<div class="dss-btn" data-dss="x"> import "@bbv/dss-design-system/react"; "dss:tabchange" /dss/dss.css';
    expect(neu(neu(t))).toBe(neu(t));
  });
  it('Stufen sind getrennt wählbar: K allein lässt data-dss, D allein lässt Klassen', () => {
    const t = '<div class="dss-btn" data-dss="x">';
    expect(applyRules(t, REGELN_K).text).toBe('<div class="hoops-btn" data-dss="x">');
    expect(applyRules(t, REGELN_D).text).toBe('<div class="dss-btn" data-hoops="x">');
    expect(REGELSTUFEN.map((s) => s[0])).toEqual(['D', 'K']);
  });
  it('Probelauf des Codemods schreibt nichts, meldet Treffer; Wiederholung nach dem Schreiben findet nichts', async () => {
    const d = work();
    put(d, 'a.css', '.dss-x { }\n');
    put(d, 'b.html', '<p class="dss-y" data-dss-z>\n');
    const cli = join(process.cwd(), 'scripts/codemod-names.mjs');
    const dry = spawnSync(process.execPath, [cli, '--dry-run', `--root=${d}`, '--stufen=K,D'], { encoding: 'utf8' });
    expect(dry.status).toBe(0);
    expect(dry.stdout).toContain('würde ändern: a.css');
    expect(readFileSync(join(d, 'a.css'), 'utf8')).toBe('.dss-x { }\n');
    spawnSync(process.execPath, [cli, `--root=${d}`, '--stufen=K,D'], { encoding: 'utf8' });
    expect(readFileSync(join(d, 'b.html'), 'utf8')).toBe('<p class="hoops-y" data-hoops-z>\n');
    expect((await planen(d, new Set(['K', 'D']))).out).toEqual([]);
  });
  it('Kollisionen werden gemeldet (hoops-x existiert schon)', async () => {
    const d = work();
    put(d, 'a.css', '.dss-x { } .hoops-x { }\n');
    expect([...(await planen(d, new Set(['K']))).kollisionen]).toEqual(['x']);
  });
});

describe('Migrationsskript, Stufen K und D', () => {
  const projekt = () => {
    const d = work();
    put(d, 'index.html', '<link rel="stylesheet" href="/dss/dss.css"><div class="dss-card fremd-dss" data-dss="tabs"></div><script type="module" src="/dss/dss.min.js"></script>');
    put(d, 'src/App.svelte', '<div class="dss-map" class:dss-team--link={a} data-dss-options="{}">x</div>');
    put(d, 'src/Card.tsx', 'export const Card = () => <div className={`dss-btn dss-btn--${v}`}>x</div>;');
    put(d, 'src/app.js', "import { initAll } from '/dss/dss.min.js'; el.addEventListener('dss:tabchange', f); localStorage.setItem('dss-theme', 'dark'); const x = document.querySelector('.dss-acc');");
    put(d, 'styles/app.css', '.dss-btn:hover, [data-dss-acc] > .xdss-eigen { color: var(--dss-fg); }');
    put(d, 'neu/schon.css', '.hoops-btn { color: var(--hoops-fg); }');
    return d;
  };
  it('Probelauf ändert nichts; --write migriert alle Dateitypen und lässt Fremdes stehen', async () => {
    const d = projekt();
    const vorher = readFileSync(join(d, 'index.html'), 'utf8');
    const probe = await migrateProject(d);
    expect(probe.written).toBe(0);
    expect(readFileSync(join(d, 'index.html'), 'utf8')).toBe(vorher);
    expect(probe.files.map((f: { file: string }) => f.file)).toEqual(['index.html', 'src/app.js', 'src/App.svelte', 'src/Card.tsx', 'styles/app.css']);
    await migrateProject(d, { write: true });
    expect(readFileSync(join(d, 'index.html'), 'utf8')).toBe('<link rel="stylesheet" href="/hoops/hoops.css"><div class="hoops-card fremd-dss" data-hoops="tabs"></div><script type="module" src="/hoops/hoops.min.js"></script>');
    expect(readFileSync(join(d, 'src/App.svelte'), 'utf8')).toBe('<div class="hoops-map" class:hoops-team--link={a} data-hoops-options="{}">x</div>');
    expect(readFileSync(join(d, 'src/Card.tsx'), 'utf8')).toContain('className={`hoops-btn hoops-btn--${v}`}');
    expect(readFileSync(join(d, 'src/app.js'), 'utf8')).toBe("import { initAll } from '/hoops/hoops.min.js'; el.addEventListener('hoops:tabchange', f); localStorage.setItem('hoops-theme', 'dark'); const x = document.querySelector('.hoops-acc');");
    // Stufe T läuft mit: das Token wird ebenfalls umbenannt; die Fremdklasse mit Teilwort bleibt
    expect(readFileSync(join(d, 'styles/app.css'), 'utf8')).toBe('.hoops-btn:hover, [data-hoops-acc] > .xdss-eigen { color: var(--hoops-fg); }');
  });
  it('idempotent; schon migrierte Dateien bleiben', async () => {
    const d = projekt();
    const schon = readFileSync(join(d, 'neu/schon.css'), 'utf8');
    await migrateProject(d, { write: true });
    expect((await migrateProject(d, { write: true })).total).toBe(0);
    expect(readFileSync(join(d, 'neu/schon.css'), 'utf8')).toBe(schon);
  });
  it('Stufenauswahl: nur K lässt data-dss und Tokens', async () => {
    const d = projekt();
    await migrateProject(d, { write: true, stufen: ['K'] });
    expect(readFileSync(join(d, 'styles/app.css'), 'utf8')).toBe('.hoops-btn:hover, [data-dss-acc] > .xdss-eigen { color: var(--dss-fg); }');
  });
  it('Latin-1-Dateien werden nicht beschädigt, sondern genannt', async () => {
    const d = work();
    const bytes = Buffer.from([0x2e, 0x64, 0x73, 0x73, 0x2d, 0x61, 0x20, 0x7b, 0x20, 0x2f, 0x2a, 0xe4, 0xf6, 0xfc, 0x2a, 0x2f, 0x20, 0x7d]);
    put(d, 'alt.css', bytes);
    const r = await migrateProject(d, { write: true });
    expect(readFileSync(join(d, 'alt.css')).equals(bytes)).toBe(true);
    expect(r.skipped.map((s: { file: string }) => s.file)).toEqual(['alt.css']);
  });
});
