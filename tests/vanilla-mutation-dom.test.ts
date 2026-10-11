// Mutationstests der DOM-Bausteine des Vanilla-Pakets V1 (Seitennavigation, Nach-oben-Knopf, später Theme): Jede Regel muss kippen, wenn man den
// Quelltext gezielt verfälscht. Läuft unter jsdom; mutierte Module werden aus einem Text geladen (Importe zeigen auf die Dateien in js/).
import { describe, expect, it } from 'vitest';
import { loadModule, mutate, read, type Rules } from './helpers/mutation';
import { backtopLogicRules, pagenavCssRules, pagenavLogicRules, pagenavSourceRules } from './helpers/pagenav-rules';
import { themeCssRules, themeLogicRules, themeSourceRules } from './helpers/theme-rules';

type Mutation = { name: string; rule: string; from: string; to: string };

const pagenavJs = read('js/pagenav.js');
const backtopJs = read('js/backtop.js');
const themeJs = read('js/theme.js');
const css = read('css/components.css');
const cssStart = css.indexOf('/* ── Seitennavigation und Nach-oben-Knopf');
const themeCssStart = css.indexOf('/* ── Dunkelmodus-Umschalter');

const PAGENAV: Mutation[] = [
  { name: 'ä wird nicht aufgelöst', rule: 'PageNav: ids lösen Umlaute auf', from: ".replace(/ä/g, 'ae')", to: ".replace(/ä/g, 'a')" },
  { name: 'keine Suffixe bei gleichen Texten', rule: 'PageNav: gleiche Texte bekommen eindeutige ids', from: 'for (let n = 2; taken.has(id); n++)', to: 'for (let n = 2; false; n++)' },
  { name: 'belegte ids im Dokument werden ignoriert', rule: 'PageNav: bereits belegte ids im Dokument werden nicht vergeben', from: "new Set([...doc.querySelectorAll('[id]')].map((el) => el.id))", to: 'new Set()' },
  { name: 'schon ab zwei Einträgen', rule: 'PageNav: ab drei Einträgen', from: 'export const MIN_HEADINGS = 3;', to: 'export const MIN_HEADINGS = 2;' },
  { name: 'Ziele ohne Text bleiben', rule: 'PageNav: Ziele ohne Text entfallen', from: 'if (!text) continue;', to: '' },
  { name: 'skipAttribute nur am Ziel selbst', rule: 'PageNav: skipAttribute gilt auch über einen Vorfahren', from: 'for (let node = el; node && node !== root.parentElement; node = node.parentElement) if (node.hasAttribute(attr)) return true;', to: 'if (el.hasAttribute(attr)) return true;' },
  { name: 'ungültige Auswahl ohne Rückfall', rule: 'PageNav: eine ungültige Auswahl fällt auf den Standard zurück', from: 'found = [...root.querySelectorAll(DEFAULTS.selector)]; // ungültige Auswahl: Standard', to: 'found = [];' },
  { name: 'Links ohne Seitenadresse', rule: 'PageNav: Links tragen die Seitenadresse (sicher mit <base href>)', from: 'a.href = `${page}#${encodeURIComponent(entry.id)}`;', to: 'a.href = `#${encodeURIComponent(entry.id)}`;' },
  { name: 'Name als aria-label', rule: 'PageNav: Name der Navigation ist der sichtbare Text', from: "el.setAttribute('aria-labelledby', `${id}-label`);", to: "el.setAttribute('aria-label', label);" },
  { name: 'Sprung öffnet nichts', rule: 'PageNav: Sprung öffnet umgebende Bereiche', from: 'const opened = revealAround(target);', to: 'const opened = false;' },
  { name: 'Ziel bekommt keinen Fokus', rule: 'PageNav: nach dem Sprung hat das Ziel den Fokus und der Anker steht in der Adresse', from: 'target.focus({ preventScroll: true });', to: '' },
  { name: 'Anker nicht in der Adresse', rule: 'PageNav: nach dem Sprung hat das Ziel den Fokus und der Anker steht in der Adresse', from: 'win.history.replaceState(win.history.state,', to: 'void (win.history.state,' },
  { name: 'Klick mit Strg wird abgefangen', rule: 'PageNav: Klick mit Strg bleibt dem Browser', from: 'event.metaKey || event.ctrlKey || event.shiftKey', to: 'event.metaKey || event.shiftKey' },
  { name: 'reduzierte Bewegung ignoriert', rule: 'PageNav: bei reduzierter Bewegung sofort statt sanft', from: "behavior: opened || reducedMotion() ? 'auto' : 'smooth'", to: "behavior: opened ? 'auto' : 'smooth'" },
  { name: 'Nachgeladenes wird nicht gebaut', rule: 'PageNav: Nachgeladenes wird übernommen', from: 'timer = win.setTimeout(refresh, DEFAULTS.debounce);', to: 'timer = win.setTimeout(() => {}, DEFAULTS.debounce);' },
  { name: 'erzeugte ids bleiben', rule: 'PageNav: destroy räumt Navigation, ids und Klassen auf', from: "for (const el of ownIds) if (el.id.startsWith('abschnitt-')) el.removeAttribute('id');", to: '' },
  { name: 'zweiter Aufruf ersetzt nicht', rule: 'PageNav: ein zweiter Aufruf ersetzt den ersten', from: 'registry.release(root);', to: '' },
];
const BACKTOP: Mutation[] = [
  { name: 'schon bei einer Fensterhöhe', rule: 'BackToTop: sichtbar erst bei hoher Seite und genug Scrolltiefe', from: 'scrollHeight > innerHeight * 2', to: 'scrollHeight > innerHeight' },
  { name: 'kein Icon-Button', rule: 'BackToTop: 44-px-Icon-Button mit Namen, anfangs verborgen', from: 'dss-btn dss-btn--secondary dss-btn--icon dss-backtop', to: 'dss-btn dss-btn--secondary dss-backtop' },
  { name: 'Symbol nicht verborgen', rule: 'BackToTop: Symbol ist ein aria-hidden-SVG', from: "'aria-hidden': 'true', ", to: '' },
  { name: 'Knopf bleibt verborgen', rule: 'BackToTop: erscheint beim Scrollen', from: 'button.hidden = !visible;', to: 'button.hidden = true;' },
  { name: 'Klick scrollt sofort', rule: 'BackToTop: Klick scrollt nach oben, sanft', from: "behavior: reducedMotion() ? 'auto' : 'smooth'", to: "behavior: 'auto'" },
  { name: 'Klick ignoriert reduzierte Bewegung', rule: 'BackToTop: bei reduzierter Bewegung sofort', from: "behavior: reducedMotion() ? 'auto' : 'smooth'", to: "behavior: 'smooth'" },
  { name: 'kein Rückfall auf main', rule: 'BackToTop: Fokus auf die h1, Rückfall main', from: "?? doc.querySelector('main')", to: '?? null' },
  { name: 'Leiste nur sticky', rule: 'BackToTop: über einer festen unteren Leiste', from: "style.position === 'fixed' || style.position === 'sticky'", to: "style.position === 'sticky'" },
  { name: 'jede Leiste zählt', rule: 'BackToTop: eine nicht feste Leiste zählt nicht', from: "(style.position === 'fixed' || style.position === 'sticky') && ", to: '' },
  { name: 'Fokus geht verloren', rule: 'BackToTop: Fokus geht nicht verloren, wenn der Knopf verschwindet', from: 'if (!visible && !button.hidden && doc.activeElement === button) focusTarget();', to: '' },
  { name: 'Knopf bleibt nach destroy', rule: 'BackToTop: destroy entfernt den Knopf', from: '} else button.remove();', to: '} else {}' },
  { name: 'zweiter Aufruf ersetzt nicht', rule: 'BackToTop: ein zweiter Aufruf ersetzt den ersten', from: 'registry.release(key);', to: '' },
];
const CSS: Mutation[] = [
  { name: 'feste Ebene', rule: 'CSS: Ebene über Token', from: 'z-index: var(--dss-z-backtop, 20);', to: 'z-index: 20;' },
  { name: 'unten ohne Sicherheitsabstand', rule: 'CSS: Abstand von unten über Token und Sicherheitsabstand', from: ' + env(safe-area-inset-bottom, 0px))', to: ')' },
  { name: 'rechts ohne Token', rule: 'CSS: Abstand von rechts mit Sicherheitsabstand', from: 'right: calc(var(--dss-backtop-gap, 16px) + env(safe-area-inset-right, 0px))', to: 'right: 16px' },
  { name: 'im Druck sichtbar', rule: 'CSS: im Druck ausgeblendet', from: '@media print { .dss-pagenav, .dss-backtop { display: none; } }', to: '@media print { .dss-pagenav { display: none; } }' },
  { name: 'verborgener Knopf bleibt sichtbar', rule: 'CSS: Knopf fest positioniert und verborgen mit [hidden]', from: '.dss-backtop[hidden] { display: none; }', to: '' },
  { name: 'Links 40 px', rule: 'CSS: Links mindestens 44 px', from: 'min-height: var(--touch-sm); max-width: 100%;', to: 'min-height: 40px; max-width: 100%;' },
  { name: 'feste Schrift', rule: 'CSS: Schrift nur aus Tokens', from: 'font-size: var(--fs-body-sm); font-weight: 600; text-decoration: none; overflow-wrap: anywhere;', to: 'font-size: 13px; font-weight: 600; text-decoration: none; overflow-wrap: anywhere;' },
  { name: 'globales scroll-padding', rule: 'CSS: keine globalen Selektoren für Scrollen', from: '.dss-pagenav { margin: 1rem 0 1.5rem; }', to: 'html { scroll-padding-bottom: 4.5rem; }\n.dss-pagenav { margin: 1rem 0 1.5rem; }' },
  { name: 'globaler h2[id]-Abstand', rule: 'CSS: keine globalen Selektoren für Scrollen', from: '.dss-pagenav .dss-eyebrow { margin: 0 0 0.5rem; }', to: 'h2[id] { scroll-margin-top: 1rem; }\n.dss-pagenav .dss-eyebrow { margin: 0 0 0.5rem; }' },
  { name: 'Scroll-Abstand ohne Accordion-Token', rule: 'CSS: Scroll-Abstand der Ziele über Token, abgestimmt mit dem Accordion', from: 'var(--dss-scroll-offset, var(--dss-acc-sticky-top, 0px))', to: 'var(--dss-scroll-offset, 0px)' },
  { name: 'scroll-pad ohne unteren Abstand', rule: 'CSS: Opt-in-Klasse für scroll-padding', from: ' scroll-padding-bottom: var(--dss-scroll-offset-bottom, 4.5rem);', to: '' },
  { name: 'Links ohne Fokus-Ring', rule: 'CSS: Fokus-Ring der Links', from: '.dss-pagenav-link:focus-visible { outline: var(--ring-w) var(--ring-style) var(--ring-color); outline-offset: 2px; }', to: '.dss-pagenav-link:focus-visible { outline-offset: 2px; }' },
  { name: 'Liste ohne Umbruch', rule: 'CSS: Liste bricht um', from: 'display: flex; flex-wrap: wrap; gap: var(--space-2); }\n.dss-pagenav-link', to: 'display: flex; gap: var(--space-2); }\n.dss-pagenav-link' },
  { name: 'festes Hex', rule: 'kein festes Hex', from: 'background: var(--dss-surface); color: var(--dss-link);', to: 'background: var(--dss-surface); color: #0645ad;' },
];
const SOURCE: { name: string; rule: string; file: 'pagenav' | 'backtop'; from: string; to: string }[] = [
  { name: 'innerHTML im Knopf', rule: 'Quelltext: kein innerHTML, kein insertAdjacentHTML, kein document.write', file: 'backtop', from: 'svg.append(path);', to: "svg.append(path); svg['inner' + 'HTML'] = ''; svg.innerHTML = '';" },
  { name: 'Auto-Start in der Navigation', rule: 'Quelltext: kein Auto-Start beim Import', file: 'pagenav', from: 'const registry = createRegistry();', to: "const registry = createRegistry();\ndocument.addEventListener('DOMContentLoaded', () => {});" },
  { name: 'eigene Bewegungsabfrage im Knopf', rule: 'Quelltext: Bewegung über reducedMotion', file: 'backtop', from: "import { reducedMotion } from './motion.js';", to: '' },
  { name: 'Accordion nicht angebunden', rule: 'Quelltext: Zugriff auf Accordion über revealAround und hashTarget', file: 'pagenav', from: 'revealAround(target)', to: 'target.closest("details")' },
  { name: 'Lebenszyklus selbst gebaut', rule: 'Quelltext: Lebenszyklus über js/lifecycle.js', file: 'backtop', from: "from './lifecycle.js'", to: "from './lifecycle2.js'" },
  { name: 'SVG per innerHTML-freier Alternative entfällt', rule: 'Quelltext: SVG per createElementNS', file: 'backtop', from: 'doc.createElementNS(SVG_NS, \'svg\')', to: 'doc.createElement(\'svg\')' },
  { name: 'globale Zuweisung', rule: 'Quelltext: kein eigener globaler Zustand außer dem Register', file: 'pagenav', from: 'const registry = createRegistry();', to: 'const registry = createRegistry();\nwindow.__pagenav = 1;' },
];

type ThemeMutation = Mutation & { after?: string };
const THEME: ThemeMutation[] = [
  { name: 'jede Zeichenkette ist ein Modus', rule: 'Theme: nur light, dark und system sind Modi', from: "typeof value === 'string' && MODES.includes(value) ? value : null", to: "typeof value === 'string' ? value : null" },
  { name: 'system bleibt immer hell', rule: 'Theme: system folgt der Systemeinstellung', from: "if (m === 'system') return prefersDark ? 'dark' : 'light';", to: "if (m === 'system') return 'light';" },
  { name: 'Klick ohne Blick auf das System', rule: 'Theme: der Klick wechselt den tatsächlichen Zustand', from: "return resolveTheme(mode, prefersDark) === 'dark' ? 'light' : 'dark';", to: "return mode === 'dark' ? 'light' : 'dark';" },
  { name: 'Speicherfehler beim Lesen werden geworfen', rule: 'Theme: blockierter Speicher bleibt ohne Fehler', from: '} catch {\n    return null;\n  }', to: '} catch (e) {\n    throw e;\n  }' },
  { name: 'system schreibt statt zu löschen', rule: 'Theme: Speicher kennt den Schlüssel dss-theme und system löscht ihn', from: "if (mode === 'system') storage?.removeItem(key);", to: "if (mode === 'system') storage?.setItem(key, mode);" },
  { name: 'anderer Standardschlüssel', rule: 'Theme: Speicher kennt den Schlüssel dss-theme und system löscht ihn', from: "export const THEME_KEY = 'dss-theme';", to: "export const THEME_KEY = 'theme';" },
  { name: 'Rückfall hell statt system', rule: 'Theme: ein ungültiger gemerkter Wert gilt als system', from: "readTheme(storage, key) ?? 'system';", to: "readTheme(storage, key) ?? 'light';" },
  { name: 'aria-pressed bleibt falsch', rule: 'Theme: Klick setzt Attribut, aria-pressed und Zustand', from: "button.setAttribute('aria-pressed', String(theme === 'dark'));", to: "button.setAttribute('aria-pressed', 'false');" },
  { name: 'kein Zustand am Button', rule: 'Theme: Klick setzt Attribut, aria-pressed und Zustand', from: "button.setAttribute('data-theme-state', theme);", to: '' },
  { name: 'Beschriftung folgt dem Modus', rule: 'Theme: feste Beschriftung „Dunkelmodus“, auch nach dem Umschalten', from: "button.setAttribute('aria-label', label);\n  button.hidden", to: "button.setAttribute('aria-label', mode);\n  button.hidden" },
  { name: 'Button mit Text bekommt aria-label', rule: 'Theme: ein Button mit eigenem Text behält seinen Namen', from: '!button.textContent.trim() && ', to: '' },
  { name: 'system setzt ein Attribut', rule: 'Theme: system setzt kein Attribut, auch bei dunklem System', from: "if (mode === 'system') target.removeAttribute(attribute);", to: "if (mode === 'system') target.setAttribute(attribute, resolveTheme(mode, prefersDark()));" },
  { name: 'Systemeinstellung wird nicht gehört', rule: 'Theme: Änderungen der Systemeinstellung werden gehört (nur im Modus system)', from: "cleanups.add(listen(query, 'change', onScheme))", to: "cleanups.add(listen(query, 'changex', onScheme))" },
  { name: 'Systemänderung auch bei gewählter Wahl', rule: 'Theme: Änderungen der Systemeinstellung werden gehört (nur im Modus system)', from: "const onScheme = () => { if (mode === 'system') {", to: 'const onScheme = () => { if (true) {' },
  { name: 'Symbole nicht verborgen', rule: 'Theme: Symbole sind aria-hidden-SVG, eigene Symbole bleiben', from: "'aria-hidden': 'true', focusable: 'false' }", to: "focusable: 'false' }" },
  { name: 'eigene Symbole werden ergänzt', rule: 'Theme: Symbole sind aria-hidden-SVG, eigene Symbole bleiben', from: "if (!button.querySelector('.dss-theme-icon')) {", to: 'if (true) {' },
  { name: 'andere Tabs werden nicht gehört', rule: 'Theme: ein anderer Tab ändert die Wahl', from: "listen(win, 'storage',", to: "listen(win, 'storagex'," },
  { name: 'Symbole bleiben nach destroy', rule: 'Theme: destroy entfernt Listener und Ergänzungen', from: 'for (const icon of created) icon.remove();', to: '' },
  { name: 'Klick-Listener bleibt nach destroy', rule: 'Theme: destroy entfernt Listener und Ergänzungen', from: 'cleanups.run();\n    for (const icon', to: 'for (const icon' },
  { name: 'zweiter Aufruf ersetzt nicht', rule: 'Theme: ein zweiter Aufruf ersetzt den ersten', from: 'registry.release(button);', to: '' },
  { name: 'ungültiger Attributname wird übernommen', rule: 'Theme: ein ungültiger Attributname fällt auf data-theme zurück', from: "typeof opts.attribute === 'string' && /^[a-z][a-z0-9-]*$/.test(opts.attribute) ? opts.attribute : THEME_ATTRIBUTE;\n  const target", to: "typeof opts.attribute === 'string' ? opts.attribute : THEME_ATTRIBUTE;\n  const target" },
  { name: 'Boot setzt system als Attribut', rule: 'Boot: system, ungültig und leer setzen nichts', from: 'if(m==="light"||m==="dark")document', to: 'if(m)document' },
  { name: 'Boot ohne try', rule: 'Boot: blockierter Speicher wirft nicht und defaultMode gilt', from: 'try{m=localStorage.getItem(${lit(key)})}catch(e){}', to: 'm=localStorage.getItem(${lit(key)});' },
  { name: 'Boot: defaultMode gewinnt immer', rule: 'Boot: die gemerkte Wahl gewinnt gegen defaultMode', from: 'if(m!=="light"&&m!=="dark")m=${lit(fallback)};', to: 'm=${lit(fallback)};' },
  { name: 'Boot: Schlüssel nicht maskiert', rule: 'Boot: Schlüssel und Attribut sind konfigurierbar und maskiert', from: ".replace(/</g, '\\\\u003c')", to: '' },
  { name: 'Boot: Attribut nicht geprüft', rule: 'Boot: Schlüssel und Attribut sind konfigurierbar und maskiert', after: 'export function themeBootScript', from: "typeof opts.attribute === 'string' && /^[a-z][a-z0-9-]*$/.test(opts.attribute) ? opts.attribute : THEME_ATTRIBUTE;", to: "typeof opts.attribute === 'string' ? opts.attribute : THEME_ATTRIBUTE;" },
  { name: 'Boot wird lang', rule: 'Boot: kurz und ohne let, const, Pfeilfunktion', from: '(function(){var m;', to: `(function(){/* ${'x'.repeat(300)} */var m;` },
];
const THEME_CSS: Mutation[] = [
  { name: 'beide Symbole sichtbar', rule: 'CSS: Symbole wechseln über den Zustand (Mond im Dunkelmodus, Sonne sonst)', from: '.dss-theme-toggle:not([data-theme-state="dark"]) .dss-theme-icon--moon { display: none; }', to: '.dss-theme-toggle:not([data-theme-state="dark"]) .dss-theme-icon--moon { display: block; }' },
  { name: 'Symbol 24 px', rule: 'CSS: Symbolgröße 20 px', from: 'width: 20px; height: 20px; }\n.dss-theme-toggle[data-theme-state', to: 'width: 24px; height: 24px; }\n.dss-theme-toggle[data-theme-state' },
  { name: 'gedrückt ohne Fläche', rule: 'CSS: gedrückt zeigt die Auswahlfläche', from: 'background: var(--dss-selected-bg); }', to: 'background: transparent; }' },
  { name: 'festes Hex', rule: 'CSS: kein festes Hex', from: 'background: var(--dss-selected-bg); }', to: 'background: #eeeeee; }' },
];
const THEME_SRC: Mutation[] = [
  { name: 'Inline-onclick', rule: 'Quelltext: kein innerHTML, kein Inline-onclick, kein eval', from: 'button.hidden = false;', to: "button.setAttribute('onclick', 'x'); button.hidden = false;" },
  { name: 'globaler Zustand', rule: 'Quelltext: kein globaler Zustand', from: 'const registry = createRegistry();', to: 'const registry = createRegistry();\nwindow.__theme = 1;' },
  { name: 'Speicherzugriff ohne try', rule: 'Quelltext: Speicherzugriff nur in try', from: 'try {\n      storage = opts.storage ?? win.localStorage;', to: 'if (true) {\n      storage = opts.storage ?? win.localStorage;' },
  { name: 'Lebenszyklus selbst gebaut', rule: 'Quelltext: Lebenszyklus über js/lifecycle.js', from: "from './lifecycle.js'", to: "from './own.js'" },
  { name: 'anderer Schlüssel im Quelltext', rule: 'Quelltext: Standardschlüssel dss-theme', from: "'dss-theme'", to: "'theme'" },
];

describe('Mutationstests: Dunkelmodus-Umschalter', () => {
  it('Ausgangslage', async () => {
    const mod = await loadModule(themeJs);
    expect(Object.entries(await themeLogicRules(mod as never)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(THEME)('$name', async ({ rule, from, to, after }) => {
    const start = after ? themeJs.indexOf(after) : 0;
    const mutated = await themeLogicRules((await loadModule(mutate(themeJs, from, to, start))) as never);
    expect(rule in mutated, `Regel fehlt: ${rule}`).toBe(true);
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
  it('CSS: Ausgangslage', () => {
    expect(Object.entries(themeCssRules(css)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(THEME_CSS)('CSS: $name', ({ rule, from, to }) => {
    expect(themeCssRules(css)[rule], `Regel fehlt: ${rule}`).toBe(true);
    expect(themeCssRules(mutate(css, from, to, themeCssStart))[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
  it('Quelltext: Ausgangslage', () => {
    expect(Object.entries(themeSourceRules(themeJs)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(THEME_SRC)('Quelltext: $name', ({ rule, from, to }) => {
    expect(themeSourceRules(themeJs)[rule], `Regel fehlt: ${rule}`).toBe(true);
    expect(themeSourceRules(mutate(themeJs, from, to))[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});

describe('Mutationstests: Seitennavigation', () => {
  it('Ausgangslage', async () => {
    const mod = await loadModule(pagenavJs);
    expect(Object.entries(await pagenavLogicRules(mod as never)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(PAGENAV)('$name', async ({ rule, from, to }) => {
    const mutated = await pagenavLogicRules((await loadModule(mutate(pagenavJs, from, to))) as never);
    expect(rule in mutated, `Regel fehlt: ${rule}`).toBe(true);
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});

describe('Mutationstests: Nach-oben-Knopf', () => {
  it('Ausgangslage', async () => {
    const mod = await loadModule(backtopJs);
    expect(Object.entries(await backtopLogicRules(mod as never)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(BACKTOP)('$name', async ({ rule, from, to }) => {
    const mutated = await backtopLogicRules((await loadModule(mutate(backtopJs, from, to))) as never);
    expect(rule in mutated, `Regel fehlt: ${rule}`).toBe(true);
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});

describe('Mutationstests: CSS der Seitennavigation', () => {
  it('Ausgangslage', () => {
    expect(Object.entries(pagenavCssRules(css)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(CSS)('$name', ({ rule, from, to }) => {
    const base: Rules = pagenavCssRules(css);
    expect(base[rule], `Regel fehlt: ${rule}`).toBe(true);
    expect(pagenavCssRules(mutate(css, from, to, cssStart))[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});

describe('Mutationstests: Quelltext der DOM-Bausteine', () => {
  it('Ausgangslage', () => {
    expect(Object.entries(pagenavSourceRules({ pagenav: pagenavJs, backtop: backtopJs })).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(SOURCE)('$name', ({ rule, file, from, to }) => {
    const files = { pagenav: pagenavJs, backtop: backtopJs };
    expect(pagenavSourceRules(files)[rule], `Regel fehlt: ${rule}`).toBe(true);
    expect(pagenavSourceRules({ ...files, [file]: mutate(files[file], from, to) })[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});
