// Dateihilfen für portal-sync.mjs: Ordner kopieren (ohne fs.cp, das bis Node 22.3 als experimentell gemeldet wird) und eine einfache Sperrdatei.
import { copyFile, mkdir, open, readdir, readFile, stat, unlink } from 'node:fs/promises';
import { join } from 'node:path';

/** Kopiert den Ordner `from` nach `to` (rekursiv, folgt Verknüpfungen). `filter(quellpfad)` darf Einträge auslassen. */
export async function copyDir(from, to, filter = () => true) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from)) {
    const source = join(from, entry);
    if (!filter(source)) continue;
    const info = await stat(source);
    if (info.isDirectory()) await copyDir(source, join(to, entry), filter);
    else if (info.isFile()) await copyFile(source, join(to, entry));
  }
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

/**
 * Legt `<dir>/<name>` exklusiv an (Sperre gegen einen zweiten Lauf). Ein vorhandenes Sperrfile eines nicht mehr laufenden Prozesses gilt als
 * verwaist und wird übernommen. Gibt `release()` zurück, das nur die eigene Sperre entfernt.
 */
export async function acquireLock(dir, name, label) {
  await mkdir(dir, { recursive: true });
  const path = join(dir, name);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const handle = await open(path, 'wx');
      await handle.writeFile(`${process.pid}\n`);
      await handle.close();
      return async () => {
        const owner = await readFile(path, 'utf8').catch(() => '');
        if (owner.trim() === String(process.pid)) await unlink(path).catch(() => {});
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      const pid = Number.parseInt(await readFile(path, 'utf8').catch(() => ''), 10);
      // eine Sperre ohne lesbare Prozessnummer wird gerade angelegt (Datei da, Inhalt noch nicht): nur eine alte gilt als verwaist
      const young = !Number.isFinite(pid) && Date.now() - (await stat(path).then((i) => i.mtimeMs, () => 0)) < 5000;
      if ((Number.isFinite(pid) && alive(pid)) || young) {
        throw new Error(`${label}: Ein anderer Lauf${Number.isFinite(pid) ? ` (Prozess ${pid})` : ''} arbeitet gerade im selben Ordner (Sperrdatei ${path}). Warte, bis er fertig ist.`);
      }
      await unlink(path).catch(() => {});
    }
  }
  throw new Error(`${label}: Die Sperrdatei ${path} lässt sich nicht anlegen.`);
}
