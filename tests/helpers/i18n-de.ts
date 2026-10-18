// URL der Datei tests/helpers/i18n-de-setup.mjs und eine Zeile `import '…';`, die Tests vor Quelltext setzen, der als Modul (data:-URL) geladen wird.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const deSetupUrl = pathToFileURL(resolve(process.cwd(), 'tests/helpers/i18n-de-setup.mjs')).href;
export const deSetupImport = `import '${deSetupUrl}';\n`;
