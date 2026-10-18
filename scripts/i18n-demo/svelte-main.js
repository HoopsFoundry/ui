// Demo-Seite für scripts/check-i18n-browser.mjs (Svelte): Sprache aus ?lang=, Wechsel zur Laufzeit über window.__setLocale.
import { mount } from 'svelte';
import { registerLocale, setLocale } from '/js/i18n/index.js';
import de from '/js/i18n/de.js';
import Demo from './Demo.svelte';

registerLocale('de', de);
const lang = new URL(location.href).searchParams.get('lang') === 'de' ? 'de' : 'en';
document.documentElement.lang = lang;
setLocale(lang);
window.__setLocale = (code) => setLocale(code);
mount(Demo, { target: document.getElementById('app') });
window.__ready = true;
