// Demo-Seite für scripts/check-i18n-browser.mjs (React): Sprache aus ?lang=, Wechsel zur Laufzeit über window.__setLocale; ein HoopsProvider mit eigener Sprache.
import { createRoot } from 'react-dom/client';
import { registerLocale, setLocale } from '../../js/i18n/index.js';
import de from '../../js/i18n/de.js';
import { Demo } from './Demo';

registerLocale('de', de);
const lang = new URL(location.href).searchParams.get('lang') === 'de' ? 'de' : 'en';
document.documentElement.lang = lang;
setLocale(lang);
(window as unknown as { __setLocale: (code: string) => void }).__setLocale = (code) => setLocale(code);
createRoot(document.getElementById('app')!).render(<Demo />);
(window as unknown as { __ready: boolean }).__ready = true;
