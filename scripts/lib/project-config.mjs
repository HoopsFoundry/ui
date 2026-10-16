// Die eine Quelle für Besitzer/Repo, Domain, Release-Adresse und Paketname: project.config.json im Wurzelordner.
// Im gebündelten hoops-sync.mjs setzt scripts/release-vanilla.mjs die Werte zur Bauzeit ein (esbuild-Plugin ersetzt dieses Modul); sonst wird die Datei gelesen.
import { readFileSync } from 'node:fs';

export const PROJECT = JSON.parse(readFileSync(new URL('../../project.config.json', import.meta.url), 'utf8'));

/** Repository als `Besitzer/Name`. */
export const REPOSITORY = `${PROJECT.repository.owner}/${PROJECT.repository.name}`;
