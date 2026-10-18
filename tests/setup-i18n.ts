// Vitest-Setup: Die Bibliothek startet mit Englisch, die bestehenden Tests erwarten deutsche Texte. Darum registriert dieses Setup `de` und
// setzt es als globale Sprache, bevor eine Testdatei läuft. Neue Tests für die Standardsprache oder für Englisch setzen den Zustand selbst
// (`__resetForTests()`, danach ausdrücklich `en` oder `de`); der Beweis, dass es ohne dieses Setup englisch ist, steht in tests/i18n-default.test.ts.
import { registerLocale, setLocale } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';

registerLocale('de', de);
setLocale('de');
