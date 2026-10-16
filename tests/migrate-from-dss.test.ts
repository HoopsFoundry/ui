// @vitest-environment node
// Migrationsskript für Konsumenten (scripts/migrate-from-dss.mjs), Stufe T: Beispielprojekt aus tests/fixtures/migrate/projekt.
import { afterAll, describe, expect, it } from 'vitest';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { migrateProject } from '../scripts/migrate-from-dss.mjs';
import { loadMutated, mutateScripts } from './helpers/script-mutation';

const FIXTURE = resolve(process.cwd(), 'tests/fixtures/migrate/projekt');
const made: string[] = [];
const work = () => { const d = mkdtempSync(join(tmpdir(), `hoops-mig-${process.pid}-`)); made.push(d); return d; };
afterAll(() => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

/** Kopie des Beispielprojekts samt Ordnern, die ignoriert werden müssen (im Repository per .gitignore nicht ablegbar). */
function projekt() {
  const d = work();
  cpSync(FIXTURE, d, { recursive: true });
  for (const dir of ['node_modules/paket', 'dist', 'build', '.git']) {
    mkdirSync(join(d, dir), { recursive: true });
    writeFileSync(join(d, dir, 'alt.css'), '.x { color: var(--dss-fg); background: var(--n-0); }\n');
  }
  return d;
}
function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string) => { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) walk(p); else out[p.slice(dir.length)] = createHash('sha1').update(readFileSync(p)).digest('hex'); } };
  walk(dir);
  return out;
}
const read = (d: string, f: string) => readFileSync(join(d, f), 'utf8');
type Datei = { file: string; hits: Record<string, number> };

describe('migrate-from-dss (Stufe T)', () => {
  it('Probelauf (Standard) meldet Treffer je Datei und schreibt nichts', async () => {
    const d = projekt();
    const before = snapshot(d);
    const r = await migrateProject(d);
    expect(r.written).toBe(0);
    expect(snapshot(d)).toEqual(before);
    expect(r.files.map((f: Datei) => f.file)).toEqual(['index.html', 'src/App.svelte', 'src/Card.tsx', 'src/Legend.vue', 'src/theme.js', 'styles/app.css']);
    expect(r.total).toBeGreaterThan(30);
    expect(r.files.find((f: Datei) => f.file === 'src/theme.js').hits['--dss-map-h']).toBe(1);
  });

  it('--write schreibt: CSS, HTML, JS, Svelte, TSX, Vue', async () => {
    const d = projekt();
    const r = await migrateProject(d, { write: true });
    expect(r.written).toBe(6);
    const css = read(d, 'styles/app.css');
    expect(css).toContain('--brand-accent: var(--hoops-amber-400);');
    expect(css).toContain('color: var(--hoops-fg); background: var(--hoops-page-surface-0); border-radius: var(--hoops-radius-md);');
    expect(css).toContain('var(--hoops-accent-text, var(--hoops-signal-800, var(--hoops-ink-900)))');
    expect(css).toContain('outline: var(--hoops-ring-w) dashed var(--hoops-ring-color);');
    expect(read(d, 'index.html')).toContain('style="--hoops-map-h: 320px; background: var(--hoops-page-bg); color: var(--hoops-page-fg)"');
    const js = read(d, 'src/theme.js');
    expect(js).toContain("el.style.setProperty('--hoops-map-h'");
    expect(js).toContain('el.style.setProperty("--hoops-title-size"');
    expect(js).toContain('`var(--hoops-fs-${id})`');
    expect(js).toContain('`--hoops-ink-${name}`');
    expect(read(d, 'src/App.svelte')).toContain('style="--hoops-map-h: {hoehe}px; color: var(--hoops-fg-soft)" style:--hoops-map-pin-bg="var(--hoops-signal-400)"');
    expect(read(d, 'src/Card.tsx')).toContain("'--hoops-card-title-size': '1.5rem'");
    expect(read(d, 'src/Legend.vue')).toContain("'--hoops-chip-ok-bg': 'var(--hoops-ok-soft)'");
    expect(read(d, 'src/Legend.vue')).toContain('border-color: var(--hoops-n-300)');
  });

  it('Fremdes bleibt: eigene Variablen, Leaflet, Tailwind, BEM-Modifikatoren', async () => {
    const d = projekt();
    await migrateProject(d, { write: true });
    const css = read(d, 'styles/app.css');
    for (const keep of ['--shell-gap: 12px;', 'var(--leaflet-font, sans-serif)', 'var(--tw-ring-color)', '.btn--sm {', '.knopf--indicator {']) expect(css).toContain(keep);
    expect(read(d, 'src/theme.js')).toContain("'--meine-farbe': 'red'");
  });

  it('ignoriert node_modules, .git, dist, build und Dateien mit anderer Endung', async () => {
    const d = projekt();
    await migrateProject(d, { write: true });
    for (const dir of ['node_modules/paket', 'dist', 'build', '.git']) expect(read(d, `${dir}/alt.css`)).toContain('var(--dss-fg)');
    expect(read(d, 'notizen.txt')).toContain('--dss-fg');
  });

  it('idempotent: zweiter Lauf findet nichts; schon umbenannte Dateien bleiben unverändert', async () => {
    const d = projekt();
    const neuVorher = read(d, 'neu/schon-migriert.css');
    const erster = await migrateProject(d, { write: true });
    expect(erster.files.some((f: Datei) => f.file.startsWith('neu/'))).toBe(false);
    expect(read(d, 'neu/schon-migriert.css')).toBe(neuVorher);
    const nach = snapshot(d);
    const zweiter = await migrateProject(d, { write: true });
    expect(zweiter.total).toBe(0);
    expect(zweiter.written).toBe(0);
    expect(snapshot(d)).toEqual(nach);
  });

  it('Stufenauswahl und Fehler', async () => {
    const d = projekt();
    expect((await migrateProject(d, { stufen: ['T'] })).total).toBeGreaterThan(0);
    await expect(migrateProject(d, { stufen: ['X'] })).rejects.toThrow(/Keine passende Stufe/);
    await expect(migrateProject(join(d, 'gibt-es-nicht'))).rejects.toThrow(/Kein Ordner/);
  });

  it('Endungsliste ist wählbar', async () => {
    const d = projekt();
    const r = await migrateProject(d, { endungen: ['.vue'] });
    expect(r.files.map((f: Datei) => f.file)).toEqual(['src/Legend.vue']);
  });

  it('Aufruf: Standard ist Probelauf; --write zusammen mit --dry-run ist ein Fehler', () => {
    const d = projekt();
    const before = snapshot(d);
    const script = resolve(process.cwd(), 'scripts/migrate-from-dss.mjs');
    const dry = spawnSync(process.execPath, [script, d], { encoding: 'utf8' });
    expect(dry.status).toBe(0);
    expect(dry.stdout).toContain('Probelauf');
    expect(dry.stdout).toContain('git restore');
    expect(snapshot(d)).toEqual(before);
    expect(spawnSync(process.execPath, [script, d, '--write', '--dry-run'], { encoding: 'utf8' }).status).toBe(2);
    expect(spawnSync(process.execPath, [script], { encoding: 'utf8' }).status).toBe(2);
    const w = spawnSync(process.execPath, [script, d, '--write'], { encoding: 'utf8' });
    expect(w.status).toBe(0);
    expect(w.stdout).toContain('Dateien geschrieben');
    expect(snapshot(d)).not.toEqual(before);
  });
});

describe('Mutationstests des Migrationsskripts', () => {
  it('ein Probelauf, der doch schreibt, wird erkannt', async () => {
    const m = await loadMutated('migrate-from-dss.mjs', 'migrate-from-dss.mjs', 'if (write) { await writeFile', 'if (true) { await writeFile');
    const d = projekt();
    const before = snapshot(d);
    await m.migrateProject(d);
    expect(snapshot(d)).not.toEqual(before); // die Verfälschung wirkt, der Test aus dem ersten Block würde also kippen
  });
  it('eine fehlende Ignorierliste (node_modules) wird erkannt', async () => {
    const m = await loadMutated('migrate-from-dss.mjs', 'migrate-from-dss.mjs', "new Set(['node_modules', ", 'new Set([');
    const d = projekt();
    await m.migrateProject(d, { write: true });
    expect(read(d, 'node_modules/paket/alt.css')).not.toContain('--dss-fg');
  });
  it('eine fehlende Wortgrenze trifft den BEM-Modifikator im Beispielprojekt', async () => {
    const m = await loadMutated('migrate-from-dss.mjs', 'lib/token-rename.mjs', '(?<![\\\\w-])(${alt(table.names.keys())})', '(${alt(table.names.keys())})');
    const d = projekt();
    await m.migrateProject(d, { write: true });
    expect(read(d, 'styles/app.css')).not.toContain('.knopf--indicator {');
  });
  it('Endungsliste: .txt ist nicht enthalten', async () => {
    const m = await import('../scripts/migrate-from-dss.mjs');
    expect(m.STANDARD_ENDUNGEN).not.toContain('.txt');
    expect(m.STANDARD_ENDUNGEN).toEqual(expect.arrayContaining(['.css', '.html', '.js', '.svelte', '.tsx', '.jsx', '.vue']));
  });
});

describe('Schutz vor Beschädigung (Kodierung, Symlinks, Größe, Optionen)', () => {
  const ALT = '.x { color: var(--dss-fg); } /* ';
  const latin1 = () => Buffer.concat([Buffer.from(ALT, 'utf8'), Buffer.from([0xe4, 0xf6, 0xfc]), Buffer.from(' */\n', 'utf8')]);
  const mitProblemen = () => {
    const d = projekt();
    writeFileSync(join(d, 'styles/latin1.css'), latin1());
    writeFileSync(join(d, 'styles/binaer.css'), Buffer.concat([Buffer.from(ALT), Buffer.from([0, 1, 2]), Buffer.from(' */')]));
    writeFileSync(join(d, 'styles/bom.css'), Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('.x { color: var(--dss-fg); }\n')]));
    writeFileSync(join(d, 'styles/gross.css'), Buffer.from(`.x { color: var(--dss-fg); }\n${'/* x */\n'.repeat(5 * 1024 * 1024 / 8 + 10)}`));
    symlinkSync(join(d, 'styles/app.css'), join(d, 'styles/link.css'));
    return d;
  };
  it('Latin-1 und Binärdateien bleiben Byte für Byte unverändert und werden genannt', async () => {
    const d = mitProblemen();
    const l1 = readFileSync(join(d, 'styles/latin1.css'));
    const bin = readFileSync(join(d, 'styles/binaer.css'));
    const r = await migrateProject(d, { write: true });
    expect(readFileSync(join(d, 'styles/latin1.css')).equals(l1)).toBe(true);
    expect(readFileSync(join(d, 'styles/binaer.css')).equals(bin)).toBe(true);
    const grund = (f: string) => r.skipped.find((k: { file: string }) => k.file === f)?.grund ?? '';
    expect(grund('styles/latin1.css')).toContain('UTF-8');
    expect(grund('styles/binaer.css')).toContain('binär');
    expect(r.files.some((f: Datei) => f.file === 'styles/latin1.css')).toBe(false);
  });
  it('UTF-8 mit BOM wird umgeschrieben, das BOM bleibt', async () => {
    const d = mitProblemen();
    await migrateProject(d, { write: true });
    const bytes = readFileSync(join(d, 'styles/bom.css'));
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.toString('utf8')).toContain('var(--hoops-fg)');
  });
  it('Symlinks und zu große Dateien werden nicht verändert, aber in der Ausgabe genannt', async () => {
    const d = mitProblemen();
    const r = await migrateProject(d, { write: true });
    const grund = (f: string) => r.skipped.find((k: { file: string }) => k.file === f)?.grund ?? '';
    expect(grund('styles/link.css')).toContain('Symlink');
    expect(grund('styles/gross.css')).toContain('MiB');
    expect(read(d, 'styles/gross.css')).toContain('var(--dss-fg)');
    expect(read(d, 'styles/app.css')).toContain('var(--hoops-fg)');
  });
  it('Aufruf: Übersprungenes steht in der Ausgabe; unbekannte Option ergibt Exit 2', () => {
    const d = mitProblemen();
    const script = resolve(process.cwd(), 'scripts/migrate-from-dss.mjs');
    const out = spawnSync(process.execPath, [script, d], { encoding: 'utf8' });
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('übersprungen: styles/latin1.css');
    expect(out.stdout).toContain('übersprungen: styles/link.css');
    const bad = spawnSync(process.execPath, [script, d, '--wirte'], { encoding: 'utf8' });
    expect(bad.status).toBe(2);
    expect(bad.stderr).toContain('Unbekannte Option: --wirte');
  });
  it('Mutation: ohne strenge UTF-8-Prüfung würde Latin-1 beschädigt', async () => {
    const m = await loadMutated('migrate-from-dss.mjs', 'migrate-from-dss.mjs', 'fatal: true', 'fatal: false');
    const d = mitProblemen();
    const l1 = readFileSync(join(d, 'styles/latin1.css'));
    await m.migrateProject(d, { write: true });
    expect(readFileSync(join(d, 'styles/latin1.css')).equals(l1)).toBe(false);
  });
  it('Mutation: ohne Nullbyte-Prüfung wird die Binärdatei verändert', async () => {
    const m = await loadMutated('migrate-from-dss.mjs', 'migrate-from-dss.mjs', 'if (bytes.includes(0))', 'if (false)');
    const d = mitProblemen();
    const bin = readFileSync(join(d, 'styles/binaer.css'));
    await m.migrateProject(d, { write: true });
    expect(readFileSync(join(d, 'styles/binaer.css')).equals(bin)).toBe(false);
  });
  it('Mutation: ohne Größengrenze wird die große Datei bearbeitet', async () => {
    const m = await loadMutated('migrate-from-dss.mjs', 'migrate-from-dss.mjs', 'if (st.size > MAX_BYTES)', 'if (false)');
    const d = mitProblemen();
    await m.migrateProject(d, { write: true });
    expect(read(d, 'styles/gross.css')).toContain('var(--hoops-fg)');
  });
  it('Mutation: ohne Symlink-Behandlung wird nichts genannt', async () => {
    const m = await loadMutated('migrate-from-dss.mjs', 'migrate-from-dss.mjs', "if (e.isSymbolicLink()) { yield", 'if (false) { yield');
    const d = mitProblemen();
    const r = await m.migrateProject(d);
    expect(r.skipped.some((k: { file: string }) => k.file === 'styles/link.css')).toBe(false);
  });
  it('Mutation: unbekannte Optionen werden still hingenommen', () => {
    const dir = mutateScripts('migrate-from-dss.mjs', 'if (unbekannt.length) {', 'if (false) {');
    const d = projekt();
    const r = spawnSync(process.execPath, [join(dir, 'migrate-from-dss.mjs'), d, '--wirte'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
  });
});
