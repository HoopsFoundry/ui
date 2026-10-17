// Deutsche Standardsprache für Module, die ein Test außerhalb des Vitest-Modulgraphen lädt (data:-URLs, natives import()):
// sie haben eine eigene Instanz des Sprachkerns, die das Setup tests/setup-i18n.ts nicht erreicht. Der Import dieser Datei registriert `de` und setzt es.
import { registerLocale, setLocale } from '../../js/i18n/index.js';
import de from '../../js/i18n/de.js';

registerLocale('de', de);
setLocale('de');
