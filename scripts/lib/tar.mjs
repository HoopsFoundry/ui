// Tarball und Prüfsummen für release-vanilla.mjs (schreiben) und portal-sync.mjs (lesen): ustar im gzip-Strom, nur reguläre Dateien.
import { gunzipSync, gzipSync } from 'node:zlib';

const MAX_UNPACKED_BYTES = 96 * 1024 * 1024;
const MAX_ENTRIES = 2000;

/** Schreibt eine Zahl als nullterminiertes Oktalfeld der Länge `length`. */
function octal(value, length) {
  return Buffer.from(`${value.toString(8).padStart(length - 1, '0')}\0`, 'latin1');
}

/** Baut einen ustar-Tarball (nur Dateien; Namen bis 100 Zeichen; Zeitstempel 0, Besitzer 0, Modus 0644). */
export function createTar(entries) {
  const blocks = [];
  for (const { path: name, data } of entries) {
    if (Buffer.byteLength(name) > 100) throw new Error(`release-vanilla: Dateiname zu lang für ustar: ${name}`);
    const header = Buffer.alloc(512);
    header.write(name, 0, 'latin1');
    octal(0o644, 8).copy(header, 100);
    octal(0, 8).copy(header, 108);
    octal(0, 8).copy(header, 116);
    octal(data.length, 12).copy(header, 124);
    octal(0, 12).copy(header, 136);
    header.fill(0x20, 148, 156);
    header.write('0', 156, 'latin1');
    header.write('ustar\0', 257, 'latin1');
    header.write('00', 263, 'latin1');
    let sum = 0;
    for (const byte of header) sum += byte;
    Buffer.from(`${sum.toString(8).padStart(6, '0')}\0 `, 'latin1').copy(header, 148);
    blocks.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}


// ── Tarball und Prüfsummen ─────────────────────────────────────

/** Prüft einen Pfad aus dem Archiv: relativ, ohne `..`, ohne Rückwärtsstrich (Windows), ohne Laufwerk, ohne NUL. */
function safeEntryPath(name) {
  const bad = !name || name.includes('\0') || name.includes('\\') || name.startsWith('/') || name.split('/').some((s) => s === '' || s === '.' || s === '..' || s.includes(':'));
  if (bad) throw new Error(`portal-sync: unzulässiger Pfad im Archiv: ${JSON.stringify(name)}`);
  return name;
}

/**
 * Liest ein .tgz (ustar) vollständig in den Speicher. Es zählen nur reguläre Dateien unter einem einzigen Ordner `expectedTop`; Verknüpfungen,
 * Geräte, doppelte Namen, zu viele oder zu große Einträge und falsche Kopf-Prüfsummen brechen ab. Gibt `[{ path, data }]` mit Pfaden ohne
 * den obersten Ordner zurück (Reihenfolge wie im Archiv).
 */
export function readTgz(buffer, { expectedTop } = {}) {
  let tar;
  try {
    tar = gunzipSync(buffer, { maxOutputLength: MAX_UNPACKED_BYTES });
  } catch (error) {
    throw new Error(`portal-sync: Archiv ist kein gültiges .tgz oder zu groß (${error.message})`);
  }
  const entries = [];
  const seen = new Set();
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const field = (from, length) => header.toString('latin1', from, from + length).replace(/\0.*$/s, '');
    const stored = parseInt(field(148, 8).trim(), 8);
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 0x20 : header[i];
    if (stored !== sum) throw new Error('portal-sync: Archiv beschädigt (Kopf-Prüfsumme stimmt nicht).');
    const type = field(156, 1) || '0';
    const size = parseInt(field(124, 12).trim() || '0', 8);
    if (!Number.isFinite(size) || size < 0) throw new Error('portal-sync: Archiv beschädigt (Größenangabe).');
    const start = offset + 512;
    if (start + size > tar.length) throw new Error('portal-sync: Archiv abgeschnitten (Datei endet vor ihrer Länge).');
    offset = start + Math.ceil(size / 512) * 512;
    if (type === 'x' || type === 'g') continue; // erweiterte Köpfe: ignoriert
    if (type === '5') {
      safeEntryPath(field(0, 100).replace(/\/$/, ''));
      continue;
    }
    if (type !== '0') throw new Error(`portal-sync: unzulässiger Eintragstyp ${JSON.stringify(type)} im Archiv (nur Dateien und Ordner).`);
    const prefix = field(345, 155);
    const name = safeEntryPath(prefix ? `${prefix}/${field(0, 100)}` : field(0, 100));
    if (seen.has(name)) throw new Error(`portal-sync: doppelter Eintrag im Archiv: ${name}`);
    seen.add(name);
    if (entries.length >= MAX_ENTRIES) throw new Error('portal-sync: zu viele Einträge im Archiv.');
    entries.push({ name, data: Buffer.from(tar.subarray(start, start + size)) });
  }
  if (!entries.length) throw new Error('portal-sync: Archiv enthält keine Dateien.');
  const tops = new Set(entries.map((e) => e.name.split('/')[0]));
  if (entries.some((e) => !e.name.includes('/')) || tops.size !== 1) throw new Error('portal-sync: Archiv muss genau einen obersten Ordner enthalten.');
  const [top] = tops;
  if (expectedTop !== undefined && top !== expectedTop) throw new Error(`portal-sync: oberster Ordner ${top} statt ${expectedTop}.`);
  return entries.map((e) => ({ path: e.name.slice(top.length + 1), data: e.data }));
}

/** Liest eine .sha256-Datei (`<hex>  <name>` je Zeile) als Map Name → Hex. */
export function parseSums(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^([0-9a-f]{64}) [ *](.+)$/);
    if (!match) throw new Error(`portal-sync: unlesbare Zeile in der Prüfsummen-Datei: ${JSON.stringify(line.slice(0, 80))}`);
    map.set(match[2], match[1]);
  }
  return map;
}


/**
 * gzip mit normiertem Kopf: Zeitstempel 0 (MTIME), kein Dateiname, Betriebssystem-Byte 3 (Unix). zlib schreibt dort je nach Plattform einen
 * anderen Wert (macOS 19, Linux 3); die Prüfsumme des Stroms deckt dieses Byte nicht ab, es darf also ersetzt werden. Der Rest des Stroms
 * hängt von der zlib-Version ab: gleiche Bytes sind nur auf derselben Plattform und Node-Version zugesichert, maßgeblich ist die veröffentlichte .sha256.
 */
export function gzipNormalized(data) {
  const out = Buffer.from(gzipSync(data, { level: 9 }));
  out[4] = out[5] = out[6] = out[7] = 0; // MTIME
  out[9] = 3; // OS: Unix
  return out;
}
