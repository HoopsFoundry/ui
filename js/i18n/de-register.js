// Registriert den deutschen Katalog beim Import (Nebeneffekt); `@hoopsfoundry/ui/i18n/de`.
import { registerLocale } from './index.js';
import de from './de.js';

registerLocale('de', de);

export default de;
