// Regeln für Seitennavigation und Nach-oben-Knopf als prüfbare Aussagen (tests/pagenav-rules.test.ts prüft sie am echten Quelltext,
// tests/vanilla-mutation.test.ts verfälscht den Quelltext und prüft, dass jede Aussage kippt). Läuft unter jsdom.
import { initAccordion } from '../../js/accordion.js';
import { bodyOf, cssSection, rulesOf, type Rules } from './mutation';

type PageNavMod = {
  slug: (t: unknown) => string;
  entries: (els: Element[], taken?: Set<string>) => { id: string }[];
  initPageNav: (root: Element, o?: Record<string, unknown>) => { destroy(): void };
};
type BackTopMod = {
  backTopVisible: (s: Record<string, number>) => boolean;
  initBackToTop: (o?: Record<string, unknown>) => { destroy(): void };
};

const html = (markup: string) => {
  document.body.replaceChildren(document.createRange().createContextualFragment(markup));
};
const links = () => [...document.querySelectorAll<HTMLAnchorElement>('.dss-pagenav-link')];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const safe = async (fn: () => unknown | Promise<unknown>) => {
  try {
    return await fn();
  } catch {
    return Symbol('wirft');
  }
};

/** Stellt Browser-Funktionen bereit, die jsdom nicht kennt, und gibt die Aufzeichnung der Scroll-Aufrufe zurück. */
function stubBrowser() {
  const scrolls: { id: string; behavior?: string }[] = [];
  const original = { scrollIntoView: Element.prototype.scrollIntoView, scrollTo: window.scrollTo, raf: window.requestAnimationFrame };
  Element.prototype.scrollIntoView = function (this: Element, arg?: ScrollIntoViewOptions) { scrolls.push({ id: this.id, behavior: arg?.behavior }); };
  const scrollTo: { top?: number; behavior?: string }[] = [];
  window.scrollTo = ((arg: { top?: number; behavior?: string }) => { scrollTo.push(arg); }) as never;
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => { cb(0); return 0; }) as never;
  return {
    scrolls, scrollTo,
    restore() {
      Element.prototype.scrollIntoView = original.scrollIntoView;
      window.scrollTo = original.scrollTo;
      window.requestAnimationFrame = original.raf;
      document.body.replaceChildren();
      delete document.documentElement.dataset.motion;
      window.history.replaceState(null, '', '/');
    },
  };
}

const PAGE = '<main><h1 id="t">T</h1><section id="c"><h2>Größe</h2><h2>Spielplan</h2><h2>Kader</h2></section></main>';
const ACC = `<main><h1>L</h1><div class="dss-acc" data-dss-acc><div class="dss-acc-item" id="a"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="a-t" aria-expanded="false" aria-controls="a-p"><span class="dss-acc-label">A</span></button></h3><div class="dss-acc-panel" id="a-p" hidden inert><div class="dss-acc-body"><h2 id="x">Stand</h2></div></div></div></div><h2>Zwei</h2><h2>Drei</h2></main>`;

export async function pagenavLogicRules(mod: PageNavMod): Promise<Rules> {
  const stub = stubBrowser();
  const out: Rules = {};
  const rule = async (name: string, fn: () => unknown | Promise<unknown>) => {
    window.history.replaceState(null, '', '/seite');
    out[name] = (await safe(fn)) === true;
    document.body.replaceChildren();
  };
  try {
    await rule('PageNav: ids lösen Umlaute auf', () => mod.slug('Größe & Ärger') === 'groesse-aerger' && mod.slug('Straße') === 'strasse' && mod.slug('!!') === 'abschnitt');
    await rule('PageNav: gleiche Texte bekommen eindeutige ids', () => {
      html('<main><h2>Kader</h2><h2>Kader</h2></main>');
      const list = mod.entries([...document.querySelectorAll('h2')], new Set());
      return list[0].id === 'abschnitt-kader' && list[1].id === 'abschnitt-kader-2';
    });
    await rule('PageNav: bereits belegte ids im Dokument werden nicht vergeben', () => {
      html('<div id="abschnitt-kader"></div><main><h2>Kader</h2><h2>B</h2><h2>C</h2></main>');
      const h = mod.initPageNav(document.querySelector('main')!);
      const ok = links()[0].getAttribute('href')!.endsWith('#abschnitt-kader-2');
      h.destroy();
      return ok;
    });
    await rule('PageNav: ab drei Einträgen', () => {
      html('<main><h2>A</h2><h2>B</h2></main>');
      const h = mod.initPageNav(document.querySelector('main')!);
      const two = document.querySelector('.dss-pagenav') === null;
      h.destroy();
      html(PAGE);
      const h3 = mod.initPageNav(document.querySelector('main')!);
      const three = document.querySelector('.dss-pagenav') !== null;
      h3.destroy();
      return two && three;
    });
    await rule('PageNav: Ziele ohne Text entfallen', () => {
      html('<main><h2>A</h2><h2> </h2><h2>B</h2><h2>C</h2></main>');
      const h = mod.initPageNav(document.querySelector('main')!);
      const ok = links().length === 3;
      h.destroy();
      return ok;
    });
    await rule('PageNav: skipAttribute gilt auch über einen Vorfahren', () => {
      html('<main><h2>A</h2><div data-pagenav-skip><h2>X</h2></div><h2 data-pagenav-skip>Y</h2><h2>B</h2><h2>C</h2></main>');
      const h = mod.initPageNav(document.querySelector('main')!);
      const ok = links().map((a) => a.textContent).join() === 'A,B,C';
      h.destroy();
      return ok;
    });
    await rule('PageNav: eine ungültige Auswahl fällt auf den Standard zurück', () => {
      html(PAGE);
      const h = mod.initPageNav(document.querySelector('main')!, { selector: '[[x' });
      const ok = links().length === 3;
      h.destroy();
      return ok;
    });
    await rule('PageNav: Links tragen die Seitenadresse (sicher mit <base href>)', () => {
      html(PAGE);
      const h = mod.initPageNav(document.querySelector('main')!);
      const ok = links().every((a) => a.getAttribute('href')!.startsWith(`${window.location.origin}/seite#`));
      h.destroy();
      return ok;
    });
    await rule('PageNav: Name der Navigation ist der sichtbare Text', () => {
      html(PAGE);
      const h = mod.initPageNav(document.querySelector('main')!, { label: 'Hier' });
      const nav = document.querySelector('nav.dss-pagenav')!;
      const ok = document.getElementById(nav.getAttribute('aria-labelledby')!)?.textContent === 'Hier' && !nav.hasAttribute('aria-label');
      h.destroy();
      return ok;
    });
    await rule('PageNav: Sprung öffnet umgebende Bereiche', () => {
      html(ACC);
      const acc = initAccordion(document.querySelector('[data-dss-acc]')!, { syncHash: false });
      const h = mod.initPageNav(document.querySelector('main')!);
      links().find((a) => a.textContent === 'Stand')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const ok = document.getElementById('a-t')!.getAttribute('aria-expanded') === 'true';
      h.destroy();
      acc.destroy();
      return ok;
    });
    await rule('PageNav: nach dem Sprung hat das Ziel den Fokus und der Anker steht in der Adresse', () => {
      html(PAGE);
      const h = mod.initPageNav(document.querySelector('main')!);
      links()[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const target = document.getElementById('abschnitt-spielplan');
      const ok = document.activeElement === target && window.location.hash === '#abschnitt-spielplan' && target!.getAttribute('tabindex') === '-1';
      h.destroy();
      return ok;
    });
    await rule('PageNav: der Fokus kommt auch an, wenn sich der Bereich erst nach dem Klick öffnet', async () => {
      html('<main><h1>L</h1><div class="dss-acc-item" id="sp"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="sp-t" aria-expanded="false"><span class="dss-acc-label">Spät</span></button></h3><div class="dss-acc-panel" id="sp-p" hidden inert><h2 id="drin">Drin</h2></div></div><h2>Zwei</h2><h2>Drei</h2></main>');
      const queue: FrameRequestCallback[] = [];
      const raf = window.requestAnimationFrame;
      window.requestAnimationFrame = ((cb: FrameRequestCallback) => { queue.push(cb); return 0; }) as never;
      try {
        document.getElementById('sp-t')!.addEventListener('click', () => queueMicrotask(() => { document.getElementById('sp-p')!.removeAttribute('inert'); document.getElementById('sp-t')!.setAttribute('aria-expanded', 'true'); }));
        const target = document.getElementById('drin')!;
        const real = HTMLElement.prototype.focus;
        target.focus = function (this: HTMLElement, o?: FocusOptions) { if (this.closest('[inert]')) return; real.call(this, o); };
        const h = mod.initPageNav(document.querySelector('main')!);
        links().find((a) => a.textContent === 'Drin')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await Promise.resolve();
        queue.splice(0).forEach((cb) => cb(0));
        const ok = document.activeElement === target;
        h.destroy();
        return ok;
      } finally {
        window.requestAnimationFrame = raf;
      }
    });
    await rule('PageNav: nach der Höhenanimation wird erneut gescrollt', () => {
      html('<main><h1>L</h1><div class="dss-acc-item" id="a"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="a-t" aria-expanded="false"><span class="dss-acc-label">A</span></button></h3><div class="dss-acc-panel" id="a-p" hidden inert style="transition-duration: 200ms"><div class="dss-acc-panel-inner"><h2 id="drin">Drin</h2></div></div></div><h2>Zwei</h2><h2>Drei</h2></main>');
      document.getElementById('a-t')!.addEventListener('click', () => { document.getElementById('a-p')!.removeAttribute('hidden'); document.getElementById('a-p')!.removeAttribute('inert'); });
      const h = mod.initPageNav(document.querySelector('main')!);
      links().find((a) => a.textContent === 'Drin')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const before = stub.scrolls.length;
      document.getElementById('a-p')!.dispatchEvent(new Event('transitionend'));
      const ok = stub.scrolls.length === before + 1 && document.activeElement?.id === 'drin';
      h.destroy();
      return ok;
    });
    await rule('PageNav: ohne Animation kein zweites Scrollen', async () => {
      html('<main><h1>L</h1><div class="dss-acc-item" id="a"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="a-t" aria-expanded="false"><span class="dss-acc-label">A</span></button></h3><div class="dss-acc-panel" id="a-p" hidden inert style="transition-duration: 0s"><div class="dss-acc-panel-inner"><h2 id="drin">Drin</h2></div></div></div><h2>Zwei</h2><h2>Drei</h2></main>');
      document.getElementById('a-t')!.addEventListener('click', () => { document.getElementById('a-p')!.removeAttribute('hidden'); });
      const h = mod.initPageNav(document.querySelector('main')!);
      links().find((a) => a.textContent === 'Drin')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const before = stub.scrolls.length;
      document.getElementById('a-p')!.dispatchEvent(new Event('transitionend'));
      await wait(150);
      const ok = stub.scrolls.length === before;
      h.destroy();
      return ok;
    });
    await rule('PageNav: ein umbenannter Text (characterData) wird übernommen', async () => {
      html(PAGE);
      const h = mod.initPageNav(document.querySelector('main')!);
      (document.getElementById('abschnitt-kader')!.firstChild as Text).data = 'Mannschaft';
      await wait(260);
      const ok = links().map((a) => a.textContent).join() === 'Größe,Spielplan,Mannschaft';
      h.destroy();
      return ok;
    });
    await rule('PageNav: geändertes data-pagenav wird übernommen', async () => {
      html('<main><h2>A</h2><div data-pagenav="Alt">x</div><h2>B</h2><h2>C</h2></main>');
      const h = mod.initPageNav(document.querySelector('main')!);
      document.querySelector('[data-pagenav]')!.setAttribute('data-pagenav', 'Neu');
      await wait(260);
      const ok = links().map((a) => a.textContent).join() === 'A,Neu,B,C';
      h.destroy();
      return ok;
    });
    await rule('PageNav: die eigene Navigation löst keinen Neuaufbau aus', async () => {
      html(PAGE);
      const h = mod.initPageNav(document.querySelector('main')!);
      const first = document.querySelector('nav.dss-pagenav');
      (links()[0].firstChild as Text).data = 'Fremd';
      await wait(300);
      const ok = document.querySelector('nav.dss-pagenav') === first;
      h.destroy();
      return ok;
    });
    await rule('PageNav: Höchstwartezeit des Beobachters', async () => {
      html('<main><h2>A</h2><h2>B</h2><h2>C</h2></main>');
      const main = document.querySelector('main')!;
      const h = mod.initPageNav(main);
      main.append(Object.assign(document.createElement('h2'), { textContent: 'D' }));
      // alle 100 ms eine Änderung: ohne Höchstwartezeit käme der Neuaufbau nie
      for (let i = 0; i < 12; i++) { await wait(100); main.append(document.createElement('p')); }
      const ok = links().length === 4;
      h.destroy();
      return ok;
    });
    await rule('PageNav: Klick mit Strg bleibt dem Browser', () => {
      html(PAGE);
      const h = mod.initPageNav(document.querySelector('main')!);
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
      links()[0].dispatchEvent(ev);
      h.destroy();
      return ev.defaultPrevented === false;
    });
    await rule('PageNav: bei reduzierter Bewegung sofort statt sanft', () => {
      html(PAGE);
      const h = mod.initPageNav(document.querySelector('main')!);
      links()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const smooth = stub.scrolls.at(-1)?.behavior === 'smooth';
      document.documentElement.dataset.motion = 'reduce';
      links()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      const calm = stub.scrolls.at(-1)?.behavior === 'auto';
      h.destroy();
      return smooth && calm;
    });
    await rule('PageNav: Nachgeladenes wird übernommen', async () => {
      html('<main><h2>A</h2><h2>B</h2></main>');
      const main = document.querySelector('main')!;
      const h = mod.initPageNav(main);
      main.append(Object.assign(document.createElement('h2'), { textContent: 'C' }));
      await wait(260);
      const ok = links().length === 3;
      h.destroy();
      return ok;
    });
    await rule('PageNav: destroy räumt Navigation, ids und Klassen auf', () => {
      html(PAGE);
      const before = document.body.innerHTML;
      const h = mod.initPageNav(document.querySelector('main')!);
      h.destroy();
      return document.body.innerHTML === before;
    });
    await rule('PageNav: ein zweiter Aufruf ersetzt den ersten', () => {
      html(PAGE);
      const main = document.querySelector('main')!;
      mod.initPageNav(main);
      const h = mod.initPageNav(main);
      const ok = document.querySelectorAll('nav.dss-pagenav').length === 1;
      h.destroy();
      return ok;
    });
  } finally {
    stub.restore();
  }
  return out;
}

export async function backtopLogicRules(mod: BackTopMod): Promise<Rules> {
  const stub = stubBrowser();
  const out: Rules = {};
  const setScroll = (y: number, height = 3000, inner = 800) => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: inner, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: height, configurable: true });
    window.dispatchEvent(new Event('scroll'));
  };
  const btn = () => document.querySelector<HTMLButtonElement>('.dss-backtop')!;
  const rule = async (name: string, fn: () => unknown | Promise<unknown>) => {
    html('<main id="m"><h1 id="t">T</h1></main>');
    setScroll(0);
    out[name] = (await safe(fn)) === true;
    document.body.replaceChildren();
  };
  try {
    await rule('BackToTop: sichtbar erst bei hoher Seite und genug Scrolltiefe', () => {
      const v = mod.backTopVisible;
      return v({ scrollY: 500, innerHeight: 800, scrollHeight: 3000 }) && !v({ scrollY: 480, innerHeight: 800, scrollHeight: 3000 }) && !v({ scrollY: 900, innerHeight: 800, scrollHeight: 1600 });
    });
    await rule('BackToTop: 44-px-Icon-Button mit Namen, anfangs verborgen', () => {
      const h = mod.initBackToTop();
      const ok = btn().classList.contains('dss-btn--icon') && btn().getAttribute('aria-label') === 'Nach oben' && btn().hidden && btn().type === 'button';
      h.destroy();
      return ok;
    });
    await rule('BackToTop: Symbol ist ein aria-hidden-SVG', () => {
      const h = mod.initBackToTop();
      const svg = btn().querySelector('svg');
      const ok = svg?.namespaceURI === 'http://www.w3.org/2000/svg' && svg.getAttribute('aria-hidden') === 'true';
      h.destroy();
      return ok;
    });
    await rule('BackToTop: erscheint beim Scrollen', () => {
      const h = mod.initBackToTop();
      setScroll(900);
      const shown = !btn().hidden;
      setScroll(100);
      const hidden = btn().hidden;
      h.destroy();
      return shown && hidden;
    });
    await rule('BackToTop: Klick scrollt nach oben, sanft', () => {
      const h = mod.initBackToTop();
      btn().click();
      const last = stub.scrollTo.at(-1);
      h.destroy();
      return last?.top === 0 && last.behavior === 'smooth';
    });
    await rule('BackToTop: bei reduzierter Bewegung sofort', () => {
      const h = mod.initBackToTop();
      document.documentElement.dataset.motion = 'reduce';
      btn().click();
      const ok = stub.scrollTo.at(-1)?.behavior === 'auto';
      h.destroy();
      return ok;
    });
    await rule('BackToTop: Fokus auf die h1, Rückfall main', () => {
      const h = mod.initBackToTop();
      btn().click();
      const onH1 = document.activeElement === document.getElementById('t');
      document.getElementById('t')!.remove();
      btn().click();
      const onMain = document.activeElement === document.getElementById('m');
      h.destroy();
      return onH1 && onMain;
    });
    await rule('BackToTop: ein verstecktes h1 zählt im Browser nicht', () => {
      html('<div><h1 id="weg">V</h1></div><main id="m"><h1 id="da">S</h1></main>');
      const shown = (el: Element, yes: boolean) => Object.defineProperty(el, 'getClientRects', { value: () => (yes ? [{}] : []), configurable: true });
      shown(document.documentElement, true);
      shown(document.getElementById('weg')!, false);
      shown(document.getElementById('da')!, true);
      const h = mod.initBackToTop();
      btn().click();
      const ok = document.activeElement?.id === 'da';
      h.destroy();
      delete (document.documentElement as unknown as { getClientRects?: unknown }).getClientRects;
      return ok;
    });
    await rule('BackToTop: über einer festen unteren Leiste', () => {
      const bar = document.createElement('nav');
      bar.className = 'dss-bnav';
      bar.style.position = 'fixed';
      bar.getBoundingClientRect = () => ({ height: 64 }) as DOMRect;
      document.body.append(bar);
      const h = mod.initBackToTop();
      const ok = btn().style.getPropertyValue('--dss-backtop-offset') === '80px';
      h.destroy();
      return ok;
    });
    await rule('BackToTop: eine nicht feste Leiste zählt nicht', () => {
      const bar = document.createElement('nav');
      bar.className = 'dss-bnav';
      bar.getBoundingClientRect = () => ({ height: 64 }) as DOMRect;
      document.body.append(bar);
      const h = mod.initBackToTop();
      const ok = btn().style.getPropertyValue('--dss-backtop-offset') === '';
      h.destroy();
      return ok;
    });
    await rule('BackToTop: Fokus geht nicht verloren, wenn der Knopf verschwindet', () => {
      const h = mod.initBackToTop();
      setScroll(900);
      btn().focus();
      setScroll(0);
      const ok = document.activeElement === document.getElementById('t');
      h.destroy();
      return ok;
    });
    await rule('BackToTop: destroy entfernt den Knopf', () => {
      const h = mod.initBackToTop();
      h.destroy();
      return document.querySelector('.dss-backtop') === null;
    });
    await rule('BackToTop: ein zweiter Aufruf ersetzt den ersten', () => {
      mod.initBackToTop();
      const h = mod.initBackToTop();
      const ok = document.querySelectorAll('.dss-backtop').length === 1;
      h.destroy();
      return ok;
    });
  } finally {
    stub.restore();
  }
  return out;
}

export function pagenavCssRules(css: string): Rules {
  const text = cssSection(css, 'Seitennavigation und Nach-oben-Knopf');
  const rules = rulesOf(text);
  const body = (s: string) => bodyOf(rules, s);
  const print = text.slice(text.indexOf('@media print'));
  return {
    'Abschnitt vorhanden': text.length > 400,
    'CSS: Ebene über Token': /z-index:\s*var\(--dss-z-backtop,\s*20\)/.test(body('.dss-backtop')),
    'CSS: Abstand von unten über Token und Sicherheitsabstand': /bottom:\s*calc\(var\(--dss-backtop-offset,\s*16px\)\s*\+\s*env\(safe-area-inset-bottom,\s*0px\)\)/.test(body('.dss-backtop')),
    'CSS: Abstand vom Rand der Leserichtung mit Sicherheitsabstand (logische Eigenschaft, auch rechts-nach-links)': /inset-inline-end:\s*calc\(var\(--dss-backtop-gap,\s*16px\)\s*\+\s*env\(safe-area-inset-right,\s*0px\)\)/.test(body('.dss-backtop')) && !/(^|[;\s])right:/.test(body('.dss-backtop')) && /env\(safe-area-inset-left,\s*0px\)/.test(body('.dss-backtop:dir(rtl)')),
    'CSS: im Druck ausgeblendet': /\.dss-pagenav, \.dss-backtop \{ display: none; \}/.test(print),
    'CSS: Knopf fest positioniert und verborgen mit [hidden]': /position:\s*fixed/.test(body('.dss-backtop')) && /display:\s*none/.test(body('.dss-backtop[hidden]')),
    'CSS: Links mindestens 44 px': /min-height:\s*var\(--touch-sm\)/.test(body('.dss-pagenav-link')),
    'CSS: Schrift nur aus Tokens': !/font-size:\s*[\d.]+(px|rem|em)/.test(text),
    'CSS: keine globalen Selektoren für Scrollen': !/(^|\n)\s*html\s*\{/.test(text) && !/h2\[id\]/.test(text) && !/(^|\n)\s*:root\s*\{[^}]*scroll-/.test(text),
    'CSS: Scroll-Abstand der Ziele über Token, abgestimmt mit dem Accordion': /scroll-margin-top:\s*calc\(var\(--dss-scroll-offset,\s*var\(--dss-acc-sticky-top,\s*0px\)\)\s*\+\s*1rem\)/.test(body('.dss-pagenav-target')),
    'CSS: Opt-in-Klasse für scroll-padding': /scroll-padding-top:\s*var\(--dss-scroll-offset/.test(body('.dss-scroll-pad')) && /scroll-padding-bottom:\s*var\(--dss-scroll-offset-bottom,\s*4\.5rem\)/.test(body('.dss-scroll-pad')),
    'CSS: Fokus-Ring der Links': /outline:\s*var\(--ring-w\) var\(--ring-style\) var\(--ring-color\)/.test(body('.dss-pagenav-link:focus-visible')),
    'CSS: Liste bricht um': /flex-wrap:\s*wrap/.test(body('.dss-pagenav-list')),
    'CSS: lange Links brechen um': /overflow-wrap:\s*anywhere/.test(body('.dss-pagenav-link')) && /max-width:\s*100%/.test(body('.dss-pagenav-link')),
    'kein festes Hex': !/#[0-9a-fA-F]{3,8}\b/.test(text),
  };
}

/** Quelltext ohne Kommentare (Kommentare dürfen verbotene Namen erwähnen). */
const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

export function pagenavSourceRules(files: { pagenav: string; backtop: string }): Rules {
  const pagenav = code(files.pagenav);
  const backtop = code(files.backtop);
  return {
    'Quelltext: kein innerHTML, kein insertAdjacentHTML, kein document.write': ![pagenav, backtop].some((t) => /innerHTML|outerHTML|insertAdjacentHTML|document\.write|createContextualFragment/.test(t)),
    'Quelltext: kein Auto-Start beim Import': !/^(?:if \(typeof document|document\.addEventListener|window\.addEventListener|DOMContentLoaded)/m.test(pagenav) && !/^(?:if \(typeof document|document\.addEventListener|window\.addEventListener|DOMContentLoaded)/m.test(backtop),
    'Quelltext: Bewegung über reducedMotion': pagenav.includes("from './motion.js'") && backtop.includes("from './motion.js'") && pagenav.includes('reducedMotion()') && backtop.includes('reducedMotion()'),
    'Quelltext: Zugriff auf Accordion über revealAround und hashTarget': pagenav.includes("import { hashTarget, isAccordionItem, revealAround, scrollToElement } from './accordion.js'") && (pagenav.match(/revealAround\(target\)/g) ?? []).length === 2,
    'Quelltext: Lebenszyklus über js/lifecycle.js': pagenav.includes("from './lifecycle.js'") && backtop.includes("from './lifecycle.js'"),
    'Quelltext: SVG per createElementNS': (backtop.match(/createElementNS\(SVG_NS/g) ?? []).length === 2,
    'Quelltext: kein eigener globaler Zustand außer dem Register': !/\bwindow\.\w+\s*=/.test(pagenav) && !/\bwindow\.\w+\s*=/.test(backtop),
  };
}
