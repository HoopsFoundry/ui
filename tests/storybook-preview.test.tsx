// @vitest-environment jsdom
// Storybook aufräumen (Spec 2026-10-19): Marke und Schrift gekoppelt (.storybook/brand.ts), Umschalter „Breite“ (.storybook/breite.ts),
// Doku-Baustein Preview/StickyPreview (stories/docs/blocks/Preview.tsx, Regeln in preview-logic.ts). Die Regeln werden ausgeführt, nicht nur
// gelesen; Mutationsproben verfälschen Kopien der Quelltexte und müssen rot werden.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { act, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { DocsContext } from '@storybook/addon-docs/blocks';
import { applyBrand, brandFromGlobals } from '../.storybook/brand';
import { BREITEN, breiteFromGlobals, VIEWPORT_OPTIONS } from '../.storybook/breite';
import * as logic from '../stories/docs/blocks/preview-logic';
import { Preview, PreviewStep, StickyPreview, STICKY_GAP, WIDE_MIN } from '../stories/docs/blocks/Preview';
import { mutantDir, writeMutant } from './helpers/mutant-file';

const read = (path: string) => readFileSync(`${process.cwd()}/${path}`, 'utf8');
const preview = read('.storybook/preview.ts');
const blocksCss = read('stories/docs/blocks/blocks.css');

// ── Marke und Schrift ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
type BrandMod = { applyBrand: typeof applyBrand };
function brandRules(m: BrandMod) {
  const root = document.createElement('html');
  const seen: string[] = [];
  for (const g of [{ brand: 'dbb' }, { brand: 'bbv' }, {}, { brand: 'bbv', type: 'dbb' }, { brand: 'DBB' }, { brand: 'dbb', type: 'standard' }]) {
    const b = m.applyBrand(g, root);
    seen.push(`${b}:${root.getAttribute('data-brand') ?? '-'}/${root.getAttribute('data-type') ?? '-'}`);
  }
  return seen;
}
const BRAND_OK = ['dbb:dbb/dbb', 'bbv:-/-', 'bbv:-/-', 'bbv:-/-', 'bbv:-/-', 'dbb:dbb/dbb'];

describe('Marke bringt ihre Schrift mit (Global brand, kein Global type)', () => {
  it('DBB setzt data-brand und data-type, BBV entfernt beide; ein altes Global type wird nicht ausgewertet', () => {
    expect(brandRules({ applyBrand })).toEqual(BRAND_OK);
    expect(brandFromGlobals(undefined)).toBe('bbv');
  });
  it.each([
    ['Schrift fehlt bei DBB', "    root.setAttribute('data-type', 'dbb');\n", ''],
    ['Schrift bleibt bei BBV stehen', "    root.removeAttribute('data-type');\n", ''],
    ['altes Global type zählt wieder', "return globals?.brand === 'dbb' ? 'dbb' : 'bbv';", "return globals?.brand === 'dbb' || globals?.type === 'dbb' ? 'dbb' : 'bbv';"],
  ])('Mutationsprobe applyBrand: %s wird rot', async (_name, from, to) => {
    const m = mutantDir();
    try {
      const file = writeMutant(m.dir, 'brand.ts', '.storybook/brand.ts', [[from, to]]);
      expect(brandRules((await import(/* @vite-ignore */ pathToFileURL(file).href)) as BrandMod)).not.toEqual(BRAND_OK);
    } finally {
      m.drop();
    }
  });
  it('preview.ts: kein Global type mehr, Marke nennt beide Schriften, der Decorator ruft applyBrand', () => {
    expect(preview).not.toMatch(/^\s{4}type: \{/m);
    expect(preview).not.toMatch(/globals\.type/);
    expect(preview).not.toMatch(/initialGlobals: \{[^}]*\btype:/);
    expect(preview).toMatch(/brand: \{[\s\S]*?title: 'Marke'[\s\S]*?Sora · Manrope[\s\S]*?Rubik · Sucrose/);
    expect(preview.slice(preview.indexOf('decorators:'))).toContain('applyBrand(context.globals)');
  });
});

// ── Breite ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
describe('Umschalter „Breite“ (Global breite)', () => {
  it('Geräte Handy 390, Tablet 768, Desktop 1280 und Vollbreite; Unbekanntes ergibt Vollbreite', () => {
    expect(Object.fromEntries(Object.entries(BREITEN).map(([k, v]) => [k, v.width]))).toEqual({ voll: null, handy: 390, tablet: 768, desktop: 1280 });
    expect(breiteFromGlobals({ breite: 'tablet' })).toBe('tablet');
    expect(breiteFromGlobals({ breite: 'toString' })).toBe('voll');
    expect(breiteFromGlobals({})).toBe('voll');
    expect(Object.keys(VIEWPORT_OPTIONS)).toEqual(['handy', 'tablet', 'desktop']);
    expect(VIEWPORT_OPTIONS.handy.styles.width).toBe('390px');
  });
  it('preview.ts: Global breite in der Leiste (Start voll), Viewport-Werkzeug der Story-Ansicht mit denselben Geräten', () => {
    expect(preview).toMatch(/breite: \{[\s\S]*?title: 'Breite'/);
    expect(preview).toMatch(/initialGlobals: \{[\s\S]*?breite: 'voll'/);
    expect(preview).toContain('viewport: { options: VIEWPORT_OPTIONS }');
  });
});

// ── Regeln der Vorschau ───────────────────────────────────────────────────────────────────────────────────────────────────────────
type Logic = typeof logic;
function logicRules(m: Logic) {
  return {
    src: m.previewSrc('components-tabs--handy', { brand: 'dbb', theme: 'Dark', locale: 'en', motion: 'reduce', framework: 'react', state: 'hover', breite: 'handy', fremd: 'x' }),
    override: m.previewGlobals({ theme: 'Light', brand: 'bbv' }, { theme: 'Dark' }),
    unsafe: m.previewGlobals({ brand: 'dbb;theme:Dark', locale: 'de' }),
    handy: m.previewLayout({ breite: 'handy', available: 600, contentHeight: 500, cap: 400 }),
    desktop: m.previewLayout({ breite: 'desktop', available: 640, contentHeight: 300, cap: 400 }),
    voll: m.previewLayout({ breite: 'voll', available: 581.6, contentHeight: 200, cap: 700, minHeight: 300 }),
    // Docs-Seite bei Fenster 320 px: Spalte 240 px, der Iframe sieht trotzdem 320 px und wird auf 75 % verkleinert
    vollSchmal: m.previewLayout({ breite: 'voll', available: 240, contentHeight: 200, cap: 700 }),
    tall: m.previewLayout({ breite: 'desktop', available: 640, contentHeight: 2000, cap: 400 }),
    fixed: m.previewLayout({ breite: 'handy', available: 600, contentHeight: 2000, cap: 700, fixedHeight: 350 }),
    cap: {
      // Zoom 200 % (Fenster 450 px hoch), Spalte mit 100 px Überbau
      narrowFixedLow: m.previewCap({ inAside: true, wide: false, viewportHeight: 450, overhead: 100, fixedHeight: 560 }),
      narrowLow: m.previewCap({ inAside: true, wide: false, viewportHeight: 450, overhead: 100 }),
      narrowFixedTall: m.previewCap({ inAside: true, wide: false, viewportHeight: 900, overhead: 100, fixedHeight: 560 }),
      narrowFixedSmall: m.previewCap({ inAside: true, wide: false, viewportHeight: 900, overhead: 100, fixedHeight: 200 }),
      narrowTall: m.previewCap({ inAside: true, wide: false, viewportHeight: 900, overhead: 100 }),
      wideFixed: m.previewCap({ inAside: true, wide: true, viewportHeight: 450, overhead: 100, fixedHeight: 560 }),
      wide: m.previewCap({ inAside: true, wide: true, viewportHeight: 900, overhead: 100 }),
      free: m.previewCap({ inAside: false, wide: false, viewportHeight: 450, overhead: 0 }),
      freeFixed: m.previewCap({ inAside: false, wide: false, viewportHeight: 450, overhead: 0, fixedHeight: 560 }),
    },
    // Zoom 400 % (320×256, 320×225), Handy quer, Zoom 200 % (640×450), Handy hoch (320×568); Überbau der Spalte 100 bis 210 px, wide: Text daneben
    pinned: [
      m.previewPinned({ wide: false, viewportHeight: 256, overhead: 100 }),
      m.previewPinned({ wide: false, viewportHeight: 225, overhead: 150 }),
      m.previewPinned({ wide: false, viewportHeight: 390, overhead: 100 }),
      m.previewPinned({ wide: false, viewportHeight: 450, overhead: 100 }),
      m.previewPinned({ wide: false, viewportHeight: 450, overhead: 160 }),
      m.previewPinned({ wide: false, viewportHeight: 568, overhead: 210 }),
      m.previewPinned({ wide: false, viewportHeight: 568, overhead: 240 }),
      m.previewPinned({ wide: false, viewportHeight: 340, overhead: 20 }),
      m.previewPinned({ wide: true, viewportHeight: 225, overhead: 200 }),
    ],
    active: [m.activeStep([100, 400, 900], 270), m.activeStep([300, 400], 270), m.activeStep([-500, -100, 260], 270)],
    auto: [m.autoSwitchAllowed(false, undefined), m.autoSwitchAllowed(true, undefined), m.autoSwitchAllowed(false, 'reduce')],
  };
}
const LOGIC_OK = {
  src: 'iframe.html?viewMode=story&id=components-tabs--handy&globals=brand:dbb;theme:Dark;locale:en;motion:reduce;framework:react;state:hover',
  override: 'brand:bbv;theme:Dark',
  unsafe: 'locale:de',
  handy: { width: 390, height: 400, scale: 1, visualWidth: 390, visualHeight: 400, label: 'Handy · 390 px' },
  desktop: { width: 1280, height: 300, scale: 0.5, visualWidth: 640, visualHeight: 150, label: 'Desktop · 1280 px, verkleinert auf 50 %' },
  voll: { width: 581, height: 300, scale: 1, visualWidth: 581, visualHeight: 300, label: 'Vollbreite · 581 px' },
  // sichtbare Höhe bleibt bei der Grenze (400), im Iframe also 800 px bei halber Größe
  tall: { width: 1280, height: 800, scale: 0.5, visualWidth: 640, visualHeight: 400, label: 'Desktop · 1280 px, verkleinert auf 50 %' },
  vollSchmal: { width: 320, height: 200, scale: 0.75, visualWidth: 240, visualHeight: 150, label: 'Vollbreite · 320 px, verkleinert auf 75 %' },
  fixed: { width: 390, height: 350, scale: 1, visualWidth: 390, visualHeight: 350, label: 'Handy · 390 px' },
  // untereinander höchstens 60 vh samt Überbau (450 * 0,6 - 100 = 170), mit Mindesthöhe 160; nebeneinander bis zur Fensterhöhe
  cap: { narrowFixedLow: 170, narrowLow: 160, narrowFixedTall: 440, narrowFixedSmall: 350, narrowTall: 350, wideFixed: 418, wide: 768, free: 360, freeFixed: 418 },
  // fest: 390 hoch (100 + 160 <= 273), 450 hoch mit 100 (<= 315), 568 mit 210 (370 <= 397.6); nicht fest: 256, 225, 450 mit 160 (320 > 315), 568 mit 240 (400 > 397.6), unter 360 immer, nebeneinander immer fest
  pinned: [false, false, true, true, false, true, false, false, true],
  active: [0, 0, 2],
  auto: [true, false, false],
};

describe('Regeln der Vorschau (preview-logic.ts)', () => {
  it('Adresse mit den übernommenen Globals, Überschreibung, nur einfache Werte; Maße mit Verkleinerung und Höhengrenze; aktiver Abschnitt; automatischer Wechsel', () => {
    expect(logicRules(logic)).toEqual(LOGIC_OK);
  });
  it.each([
    ['ohne Verkleinerung', 'const scale = width > avail ? avail / width : 1;', 'const scale = 1;'],
    ['Breite nicht übernommen', 'const width = device ?? Math.max(avail, MIN_FULL_WIDTH);', 'const width = avail;'],
    ['Vollbreite schmaler als 320 px', 'const width = device ?? Math.max(avail, MIN_FULL_WIDTH);', 'const width = device ?? avail;'],
    ['Vorschau steht bei jedem Fenster fest', 'return viewportHeight >= PIN_MIN_VIEWPORT && overhead + MIN_CAP <= viewportHeight * PIN_MAX_SHARE;', 'return true;'],
    ['Überbau bei der Schwelle vergessen', 'overhead + MIN_CAP <= viewportHeight * PIN_MAX_SHARE', 'MIN_CAP <= viewportHeight * PIN_MAX_SHARE'],
    ['Mindesthöhe bei der Schwelle vergessen', 'overhead + MIN_CAP <= viewportHeight * PIN_MAX_SHARE', 'overhead <= viewportHeight * PIN_MAX_SHARE'],
    ['Schwelle zu großzügig', 'export const PIN_MAX_SHARE = 0.7;', 'export const PIN_MAX_SHARE = 1;'],
    ['niedrige Fenster auch fest', 'viewportHeight >= PIN_MIN_VIEWPORT &&', 'true &&'],
    ['nebeneinander nicht fest', 'if (wide) return true;', 'if (wide) return false;'],
    ['Grenze ohne Skalierung', 'Math.min(wanted, visualCap / scale)', 'Math.min(wanted, visualCap)'],
    ['feste Höhe übergangen', 'const wanted = fixedHeight ?? Math.max(', 'const wanted = Math.max('],
    ['Mindesthöhe vergessen', 'Math.max(minHeight, contentHeight || minHeight || 320);', 'Math.max(contentHeight || 320);'],
    ['feste Höhe untereinander bis zur Fensterhöhe (Reflow)', 'Math.floor(vh * NARROW_FIXED_SHARE - overhead)', 'vh - 2 * STICKY_GAP'],
    ['feste Höhe untereinander ohne Überbau', 'Math.floor(vh * NARROW_FIXED_SHARE - overhead)', 'Math.floor(vh * NARROW_FIXED_SHARE)'],
    ['Mindesthöhe der Vorschau fehlt', 'return Math.max(MIN_CAP, next);', 'return next;'],
    ['Theme nicht übernommen', "'brand', 'theme', 'locale'", "'brand', 'locale'"],
    ['Überschreibung verloren', 'const merged: Record<string, unknown> = { ...globals, ...overrides };', 'const merged: Record<string, unknown> = { ...overrides, ...globals };'],
    ['Trennzeichen eingeschleust', "const SAFE = /^[A-Za-z0-9_-]+$/;", 'const SAFE = /./;'],
    ['erster statt letzter Abschnitt', 'if (top <= line) active = i;', 'if (top <= line && active === 0) active = i;'],
    ['Bewegung des Umschalters übersehen', "return !prefersReducedMotion && dataMotion !== 'reduce';", 'return !prefersReducedMotion;'],
  ])('Mutationsprobe preview-logic: %s wird rot', async (_name, from, to) => {
    const m = mutantDir();
    try {
      const file = writeMutant(m.dir, 'preview-logic.ts', 'stories/docs/blocks/preview-logic.ts', [[from, to]]);
      expect(logicRules((await import(/* @vite-ignore */ pathToFileURL(file).href)) as Logic)).not.toEqual(LOGIC_OK);
    } finally {
      m.drop();
    }
  });
});

// ── Baustein im DOM ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Listener = (payload: unknown) => void;
function fakeDocs(initial: Record<string, unknown>) {
  let globals = { ...initial };
  const listeners = new Set<Listener>();
  const ctx = {
    resolveOf: (of: { id: string }) => ({ type: 'story', story: { id: of.id } }),
    getStoryContext: () => ({ globals }),
    channel: { on: (_e: string, fn: Listener) => listeners.add(fn), off: (_e: string, fn: Listener) => listeners.delete(fn) },
  };
  return {
    ctx: ctx as never,
    /** Werkzeugleiste: ändert den Store und meldet es */
    setGlobals(next: Record<string, unknown>) {
      globals = { ...globals, ...next };
      for (const fn of listeners) fn({ globals });
    },
    /** ein eingebetteter Iframe meldet seine eigenen Globals: der Store bleibt, die Vorschau darf nicht folgen */
    foreign(payload: Record<string, unknown>) {
      for (const fn of listeners) fn({ globals: payload });
    },
  };
}

class FakeRO {
  constructor(public cb: () => void) {}
  observe() {}
  disconnect() {}
}
const ios: { cb: () => void; options: IntersectionObserverInit }[] = [];
class FakeIO {
  constructor(public cb: () => void, public options: IntersectionObserverInit) {
    ios.push(this);
  }
  observe() {}
  disconnect() {}
}
let reduced = false;
let wideMq = true; // Docs-Fenster mindestens WIDE_MIN breit
const scrollBy = vi.fn();
beforeAll(() => {
  vi.stubGlobal('scrollBy', scrollBy);
  vi.stubGlobal('ResizeObserver', FakeRO);
  vi.stubGlobal('IntersectionObserver', FakeIO);
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduced-motion') ? reduced : q.includes(`${WIDE_MIN}px`) ? wideMq : false, addEventListener() {}, removeEventListener() {} }));
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return this.classList?.contains('hoops-preview-stage') ? 640 : 0; } });
});
afterEach(() => {
  cleanup();
  scrollBy.mockClear();
  ios.length = 0;
  reduced = false;
  wideMq = true;
  window.innerHeight = 768;
  delete document.documentElement.dataset.motion;
});

const A = { id: 'components-tabs--handy' };
const B = { id: 'components-tabs--handy-verein' };

describe('Preview', () => {
  it('Iframe mit Titel, Adresse aus den Globals, Breite aus „Breite“; folgt der Werkzeugleiste, nicht den Meldungen eingebetteter Iframes', async () => {
    const docs = fakeDocs({ brand: 'dbb', theme: 'Dark', breite: 'handy' });
    render(<DocsContext.Provider value={docs.ctx}><Preview of={A as never} title="Register" /></DocsContext.Provider>);
    const frame = screen.getByTitle('Vorschau: Register') as HTMLIFrameElement;
    expect(frame.getAttribute('src')).toBe('iframe.html?viewMode=story&id=components-tabs--handy&globals=brand:dbb;theme:Dark');
    expect(frame.style.width).toBe('390px');
    expect(frame.getAttribute('loading')).toBe('lazy'); // freistehend: lädt erst beim Hinscrollen
    expect(screen.getByText('Handy · 390 px')).toBeInTheDocument();
    await act(async () => docs.foreign({ brand: 'bbv', theme: 'Light' }));
    expect((screen.getByTitle('Vorschau: Register') as HTMLIFrameElement).getAttribute('src')).toContain('brand:dbb;theme:Dark');
    await act(async () => docs.setGlobals({ breite: 'desktop', theme: 'Light' }));
    const after = screen.getByTitle('Vorschau: Register') as HTMLIFrameElement;
    expect(after.getAttribute('src')).toContain('theme:Light');
    expect(after.style.width).toBe('1280px');
    expect(after.style.transform).toBe('scale(0.5)');
    expect(screen.getByText('Desktop · 1280 px, verkleinert auf 50 %')).toBeInTheDocument();
  });
  it('eine feste Höhe gilt bis zur Fensterhöhe, auch über die übliche Grenze (80 % bzw. 50 vh) hinaus', () => {
    const docs = fakeDocs({ breite: 'handy' });
    render(<DocsContext.Provider value={docs.ctx}><Preview of={A as never} title="Modal" height={700} /><Preview of={B as never} title="Zu hoch" height={5000} /></DocsContext.Provider>);
    // jsdom: Fensterhöhe 768 px; ohne feste Höhe gälte 80 % = 614 px
    expect(window.innerHeight).toBe(768);
    expect((screen.getByTitle('Vorschau: Modal') as HTMLIFrameElement).style.height).toBe('700px');
    expect((screen.getByTitle('Vorschau: Zu hoch') as HTMLIFrameElement).style.height).toBe(`${768 - 2 * STICKY_GAP}px`);
  });
  it('feste Globals (Seite Dark Mode) haben Vorrang vor der Werkzeugleiste', () => {
    const docs = fakeDocs({ theme: 'Light' });
    render(<DocsContext.Provider value={docs.ctx}><Preview of={A as never} title="Dunkel" globals={{ theme: 'Dark' }} /></DocsContext.Provider>);
    expect(screen.getByTitle('Vorschau: Dunkel').getAttribute('src')).toContain('theme:Dark');
  });
});

describe('StickyPreview', () => {
  const page = (docs: ReturnType<typeof fakeDocs>) => (
    <DocsContext.Provider value={docs.ctx}>
      <StickyPreview>
        <PreviewStep of={A as never} title="Register">Text A</PreviewStep>
        <PreviewStep of={B as never} title="Verein">Text B</PreviewStep>
      </StickyPreview>
    </DocsContext.Provider>
  );
  it('Text vor der Vorschau im DOM (Fokus-Reihenfolge), Liste mit aria-pressed, Marke „In der Vorschau“ am aktiven Abschnitt', async () => {
    const { container } = render(page(fakeDocs({})));
    const sp = container.querySelector('.hoops-sp')!;
    expect([...sp.children].map((c) => c.className)).toEqual(['hoops-sp-text', 'hoops-sp-aside']);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([['Register', 'true'], ['Verein', 'false']]);
    expect(screen.getByRole('group', { name: 'Beispiel in der Vorschau' })).toBeInTheDocument();
    expect(container.querySelector('.hoops-sp-step[data-active] .hoops-sp-badge')?.textContent).toBe('In der Vorschau');
    await act(async () => buttons[1].click());
    expect(screen.getByTitle('Vorschau: Verein').getAttribute('src')).toContain('components-tabs--handy-verein');
    // automatischer Wechsel: der gewählte Abschnitt rückt ohne Animation an die Lesezeile
    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy.mock.calls[0][0]).toMatchObject({ behavior: 'instant' });
    expect(screen.getAllByRole('button')[1].getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelectorAll('.hoops-sp-step')[1].hasAttribute('data-active')).toBe(true);
  });
  it('wechselt mit dem Abschnitt an der Lesezeile (IntersectionObserver auf dem Bereich darüber)', async () => {
    const { container } = render(page(fakeDocs({})));
    expect(ios).toHaveLength(1);
    expect(ios[0].options.rootMargin).toBe(`0px 0px -${Math.round((1 - logic.READ_LINE_WIDE) * 100)}% 0px`);
    const steps = [...container.querySelectorAll<HTMLElement>('.hoops-sp-step')];
    steps[0].getBoundingClientRect = () => ({ top: -200 }) as DOMRect;
    steps[1].getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
    await act(async () => ios[0].cb());
    expect(screen.getByTitle('Vorschau: Verein')).toBeInTheDocument();
  });
  it.each([
    ['prefers-reduced-motion', () => { reduced = true; }],
    ['Umschalter Bewegung (data-motion="reduce")', () => { document.documentElement.dataset.motion = 'reduce'; }],
  ])('bei reduzierter Bewegung (%s) kein automatischer Wechsel, die Liste bleibt', (_n, setup) => {
    setup();
    const { container } = render(page(fakeDocs({})));
    expect(ios).toHaveLength(0);
    expect(container.querySelector('.hoops-sp')?.getAttribute('data-auto')).toBe('false');
    expect(screen.getAllByRole('button')).toHaveLength(2);
    act(() => screen.getAllByRole('button')[1].click());
    expect(screen.getByTitle('Vorschau: Verein')).toBeInTheDocument();
    expect(scrollBy).not.toHaveBeenCalled();
  });
  it('der Rahmen schrumpft beim Wechsel nicht (kein Aufschaukeln untereinander), eine neue Breite setzt ihn zurück', async () => {
    const docs = fakeDocs({ breite: 'handy' });
    const { container } = render(
      <DocsContext.Provider value={docs.ctx}>
        <StickyPreview>
          <PreviewStep of={A as never} title="Hoch" height={500}>a</PreviewStep>
          <PreviewStep of={B as never} title="Flach" height={300}>b</PreviewStep>
        </StickyPreview>
      </DocsContext.Provider>,
    );
    const box = () => container.querySelector<HTMLElement>('.hoops-preview-box')!;
    expect(box().style.height).toBe('500px');
    await act(async () => screen.getAllByRole('button')[1].click());
    expect((screen.getByTitle('Vorschau: Flach') as HTMLIFrameElement).style.height).toBe('300px');
    expect(box().style.height).toBe('500px');
    // Tablet (768 px) in 640 px Spalte: verkleinert auf 5/6, 300 px werden sichtbar 250 px; die alte Höhe gilt nicht mehr
    await act(async () => docs.setGlobals({ breite: 'tablet' }));
    expect(box().style.height).toBe('250px');
  });
  it('untereinander steht die Spalte nur bei genug Fensterhöhe fest (Zoom 400 %: 320×256 verdeckte sonst den ganzen Text)', () => {
    wideMq = false;
    window.innerHeight = 256;
    const low = render(page(fakeDocs({})));
    expect(low.container.querySelector('.hoops-sp')?.getAttribute('data-pinned')).toBe('false');
    cleanup();
    window.innerHeight = 900;
    const tall = render(page(fakeDocs({})));
    expect(tall.container.querySelector('.hoops-sp')?.getAttribute('data-pinned')).toBe('true');
  });
  it('nebeneinander steht die Spalte auch bei niedrigem Fenster fest (der Text steht daneben)', () => {
    window.innerHeight = 256;
    const { container } = render(page(fakeDocs({})));
    expect(container.querySelector('.hoops-sp')?.getAttribute('data-pinned')).toBe('true');
  });
  it('in der Spalte lädt der Iframe sofort (kein Wachsen beim Hinscrollen unter dem Leser), freistehend erst beim Hinscrollen', () => {
    render(page(fakeDocs({})));
    expect(screen.getByTitle('Vorschau: Register').getAttribute('loading')).toBe('eager');
  });
  it('untereinander gleicht der Rahmen Höhenänderungen aus, solange die Spalte oben steht (der Text bleibt an der Lesezeile)', async () => {
    wideMq = false;
    const docs = fakeDocs({ breite: 'handy' });
    render(
      <DocsContext.Provider value={docs.ctx}>
        <StickyPreview>
          <PreviewStep of={A as never} title="Flach" height={300}>a</PreviewStep>
          <PreviewStep of={B as never} title="Hoch" height={440}>b</PreviewStep>
        </StickyPreview>
      </DocsContext.Provider>,
    );
    scrollBy.mockClear();
    await act(async () => screen.getAllByRole('button')[1].click());
    // der erste Aufruf ist die Wahl über die Liste (Abschnitt an die Lesezeile); danach folgt der Rahmen in einem oder mehreren Schritten
    // von 300 auf 440 px: zusammen 140 px
    const tops = scrollBy.mock.calls.slice(1).map((c) => c[0]);
    expect(tops.every((o) => o.behavior === 'instant' && o.top > 0)).toBe(true);
    expect(tops.reduce((sum, o) => sum + o.top, 0)).toBe(140);
  });
  it('nebeneinander kein Ausgleich: der Text steht neben der Vorschau', async () => {
    const docs = fakeDocs({ breite: 'handy' });
    render(
      <DocsContext.Provider value={docs.ctx}>
        <StickyPreview>
          <PreviewStep of={A as never} title="Flach" height={300}>a</PreviewStep>
          <PreviewStep of={B as never} title="Hoch" height={440}>b</PreviewStep>
        </StickyPreview>
      </DocsContext.Provider>,
    );
    scrollBy.mockClear();
    await act(async () => screen.getAllByRole('button')[1].click());
    // nur der Aufruf der Wahl über die Liste, kein Ausgleich
    expect(scrollBy).toHaveBeenCalledTimes(1);
  });
  it('ein einzelnes Beispiel braucht keine Liste und keine Marke', () => {
    const docs = fakeDocs({});
    const { container } = render(<DocsContext.Provider value={docs.ctx}><StickyPreview><PreviewStep of={A as never} title="Allein">x</PreviewStep></StickyPreview></DocsContext.Provider>);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelector('.hoops-sp-badge')).toBeNull();
  });
});

describe('CSS der Vorschau (blocks.css)', () => {
  // Hinweis: Dieser Test prüft Sticky nur am CSS-Text. Ob die Vorschau beim Scrollen wirklich oben steht (auch bei kurzem Text) und den Text
  // bei Zoom 200 % nicht verdeckt, messen nur scripts/check-preview-docs.mjs im Browser und die Mutationsproben von previewCap oben.
  it('feststehend: untereinander oben (top 0), ab WIDE_MIN zweispaltig mit top STICKY_GAP; keine Übergänge', () => {
    expect(blocksCss).toMatch(/\.hoops-sp-aside \{ position: sticky; top: 0;[^}]*order: -1;/);
    expect(blocksCss).toContain(`@media (min-width: ${WIDE_MIN}px) {`);
    expect(blocksCss).toMatch(new RegExp(`\\.hoops-sp-aside \\{ top: ${STICKY_GAP}px; order: 0;`));
    const own = blocksCss.slice(blocksCss.indexOf('/* Vorschau in Gerätebreite'));
    expect(own).not.toMatch(/transition|animation/);
  });
  it('nicht feststehend bei niedrigem Fenster (data-pinned="false" ist static); Überschriften brechen lange Wörter um; der Browser gleicht nichts doppelt aus', () => {
    expect(blocksCss).toMatch(/\.hoops-sp\[data-pinned="false"\] \.hoops-sp-aside \{ position: static; \}/);
    expect(blocksCss).toMatch(/\.hoops-sp \{[^}]*overflow-anchor: none;/);
    expect(blocksCss).toMatch(/\.sbdocs-content :is\(h1, h2, h3, h4\) \{ overflow-wrap: anywhere; \}/);
  });
  it('Auswahl-Schalter: mindestens 24 px hoch, gestrichelter Fokus-Ring aus den Ring-Tokens, Zustand nicht nur über Farbe', () => {
    const min = Number(blocksCss.match(/\.hoops-sp-pick \{ min-height: (\d+)px/)?.[1]);
    expect(min).toBeGreaterThanOrEqual(24);
    expect(blocksCss).toMatch(/\.hoops-sp-pick:focus-visible \{ outline: var\(--hoops-ring-w\) var\(--hoops-ring-style\) var\(--hoops-ring-color\)/);
    expect(blocksCss).toMatch(/\.hoops-sp-pick\[aria-pressed="true"\]::before \{ content: '✓ ' \/ ''; \}/);
    expect(blocksCss).toMatch(/\.hoops-sp-pick\[aria-pressed="true"\] \{[^}]*font-weight: 700/);
  });
  it('die alten Handy-Rahmen sind entfernt', () => {
    expect(blocksCss).not.toMatch(/\.hoops-phone/);
  });
});
