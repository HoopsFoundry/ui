import { Children, isValidElement, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { DocsContext } from '@storybook/addon-docs/blocks';
import { activeStep, autoSwitchAllowed, breiteOf, previewLayout, previewSrc, READ_LINE_NARROW, READ_LINE_WIDE } from './preview-logic';

// Doku-Bausteine für Vorschauen in Gerätebreite (nur Storybook). `Preview` bettet eine Story als Iframe ein: Breite aus dem Umschalter
// „Breite“ (Global `breite`), Marke, Theme, Sprache, Bewegung, Fassung und Zustand aus den Globals der Seite, Höhe aus dem Inhalt
// (ResizeObserver im Iframe, gleiche Herkunft). `StickyPreview` stellt Text und Vorschau nebeneinander (ab 1100 px) oder die Vorschau
// feststehend über den Text und wechselt das Beispiel mit dem Abschnitt, der gerade im Blick ist.

/** Abstand der feststehenden Vorschau zum oberen und unteren Rand (px); dieselben Werte stehen in blocks.css. */
export const STICKY_GAP = 16;
/** Ab dieser Breite des Docs-Fensters stehen Text und Vorschau nebeneinander; darunter steht die Vorschau oben (höchstens 50 vh). */
export const WIDE_MIN = 1100;
const NARROW_SHARE = 0.5;
const FREE_SHARE = 0.8;

type Of = Parameters<NonNullable<React.ContextType<typeof DocsContext>>['resolveOf']>[0];
type Globals = Record<string, unknown>;

/**
 * Globals der Seite, folgt dem Umschalter. Das Ereignis `globalsUpdated` dient nur als Anstoß: Auch die eingebetteten Story-Iframes senden es
 * (Storybooks Kanal läuft per postMessage an das Elternfenster, also an diese Docs-Seite) mit ihren eigenen Globals. Gelesen wird deshalb
 * immer der Stand des Docs-Stores (`getStoryContext`), den nur die Werkzeugleiste ändert.
 */
function usePageGlobals(of: Of): { storyId: string; globals: Globals } {
  const ctx = useContext(DocsContext);
  const { story } = ctx.resolveOf(of, ['story']);
  const read = useCallback((): Globals => ({ ...(ctx.getStoryContext(story).globals ?? {}) }), [ctx, story]);
  const [globals, setGlobals] = useState<Globals>(read);
  useEffect(() => {
    const onUpdate = () => setGlobals((prev) => {
      const next = read();
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
    });
    onUpdate();
    ctx.channel.on('globalsUpdated', onUpdate);
    return () => ctx.channel.off('globalsUpdated', onUpdate);
  }, [ctx, read]);
  return { storyId: story.id, globals };
}

function useMedia(query: string): boolean {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const on = () => setMatches(mql.matches);
    on();
    mql.addEventListener('change', on);
    return () => mql.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** Höhe des Story-Inhalts im Iframe (Body samt Außenabstand), 0 solange unbekannt. */
function measure(frame: HTMLIFrameElement): number {
  const doc = frame.contentDocument;
  // vor dem Laden der Story steht im Iframe noch about:blank (nur Außenabstand des Bodys): nicht messen, die alte Höhe bleibt
  if (!doc?.body || !doc.body.classList.contains('sb-show-main')) return 0;
  const cs = doc.defaultView?.getComputedStyle(doc.body);
  const margin = cs ? parseFloat(cs.marginTop) + parseFloat(cs.marginBottom) : 0;
  return Math.ceil(doc.body.scrollHeight + margin);
}

export type PreviewProps = {
  /** Story aus der Stories-Datei (wie `<Canvas of>`) */
  of: Of;
  /** Name des Beispiels; der Iframe heißt „Vorschau: <title>“ und muss auf der Seite eindeutig sein (axe frame-title-unique) */
  title: string;
  /** kleinste Höhe in px, etwa für Modale (position: fixed meldet keine Höhe) */
  minHeight?: number;
  /** feste Globals statt der Werte der Seite, z. B. `{ theme: 'Dark' }` (nur Seite Dark Mode) */
  globals?: Record<string, string>;
};

/** Eine Story als Iframe in der gewählten Breite. Nur Storybook-Doku. */
export function Preview({ of, title, minHeight = 0, globals: overrides }: PreviewProps) {
  const { storyId, globals } = usePageGlobals(of);
  const breite = breiteOf(globals);
  const src = previewSrc(storyId, globals, overrides);
  const wide = useMedia(`(min-width: ${WIDE_MIN}px)`);
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [available, setAvailable] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [cap, setCap] = useState(600);

  // Grenze der sichtbaren Höhe: in der feststehenden Vorschau die Fensterhöhe (nebeneinander) bzw. die Hälfte (untereinander) abzüglich
  // allem, was in der Spalte über und unter dem Iframe steht (Liste, Beschriftung); sonst 80 % der Fensterhöhe.
  const updateCap = useCallback(() => {
    const aside = rootRef.current?.closest('.hoops-sp-aside');
    const box = boxRef.current;
    const vh = window.innerHeight;
    if (aside && box) {
      const overhead = aside.getBoundingClientRect().height - box.getBoundingClientRect().height;
      setCap(Math.max(160, Math.floor((wide ? vh - 2 * STICKY_GAP : vh * NARROW_SHARE) - overhead)));
    } else setCap(Math.max(160, Math.floor(vh * FREE_SHARE)));
  }, [wide]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const ro = new ResizeObserver(() => {
      setAvailable(stage.clientWidth);
      updateCap();
    });
    ro.observe(stage);
    setAvailable(stage.clientWidth);
    updateCap();
    window.addEventListener('resize', updateCap);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateCap);
    };
  }, [updateCap]);

  // Höhe des Inhalts nachziehen: beim Laden und bei jeder Größenänderung des Bodys im Iframe
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    let ro: ResizeObserver | undefined;
    const attach = () => {
      ro?.disconnect();
      const body = frame.contentDocument?.body;
      if (!body) return;
      const View = frame.contentWindow as (Window & typeof globalThis) | null;
      const take = () => {
        const h = measure(frame);
        if (h > 0) setContentHeight(h);
      };
      ro = new (View?.ResizeObserver ?? ResizeObserver)(take);
      ro.observe(body);
      take();
    };
    frame.addEventListener('load', attach);
    if (frame.contentDocument?.readyState === 'complete' && frame.contentDocument.body?.classList.contains('sb-show-main')) attach();
    return () => {
      frame.removeEventListener('load', attach);
      ro?.disconnect();
    };
  }, [src, available > 0]);

  useLayoutEffect(updateCap, [contentHeight, updateCap]);

  const layout = previewLayout({ breite, available, contentHeight, cap, minHeight });
  return (
    <figure className="hoops-preview" ref={rootRef} data-hoops-preview={storyId} data-breite={breite}>
      <figcaption className="hoops-preview-meta">
        <span className="hoops-preview-name">{title}</span> <span className="hoops-preview-size">{available > 0 ? layout.label : ''}</span>
      </figcaption>
      <div className="hoops-preview-stage" ref={stageRef}>
        <div className="hoops-preview-box" ref={boxRef} style={available > 0 ? { width: layout.visualWidth, height: layout.visualHeight } : undefined}>
          {available > 0 && (
            <iframe
              key={src}
              ref={frameRef}
              title={`Vorschau: ${title}`}
              src={src}
              loading="lazy"
              style={{ width: layout.width, height: layout.height, transform: layout.scale < 1 ? `scale(${layout.scale})` : undefined }}
            />
          )}
        </div>
      </div>
    </figure>
  );
}

export type PreviewStepProps = { of: Of; title: string; minHeight?: number; globals?: Record<string, string>; children?: ReactNode };

/** Ein Abschnitt der feststehenden Vorschau: Text links (bzw. darunter), das Beispiel in der Vorschau. Nur innerhalb von `StickyPreview`. */
export function PreviewStep(_props: PreviewStepProps): null {
  return null;
}

/** Wechselt das Beispiel automatisch, solange keine reduzierte Bewegung gewünscht ist (System oder Umschalter „Bewegung“). */
function useAutoSwitch(): boolean {
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const [motion, setMotion] = useState<string | undefined>(() => (typeof document === 'undefined' ? undefined : document.documentElement.dataset.motion));
  useEffect(() => {
    const read = () => setMotion(document.documentElement.dataset.motion);
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] });
    read();
    return () => mo.disconnect();
  }, []);
  return autoSwitchAllowed(reduced, motion);
}

/**
 * Text und feststehende Vorschau. Die Kinder sind `PreviewStep`s; die Vorschau zeigt das Beispiel des Abschnitts, der gerade im Blick ist
 * (IntersectionObserver auf einem Band des Fensters), der Abschnitt trägt dann die Marke „In der Vorschau“. Bei reduzierter Bewegung bleibt
 * das gewählte Beispiel stehen; die Liste über der Vorschau wählt immer. Fokus-Reihenfolge: Text, dann Liste und Vorschau.
 */
export function StickyPreview({ children, level = 3, listLabel = 'Beispiel in der Vorschau' }: { children: ReactNode; level?: 3 | 4; listLabel?: string }) {
  const steps = Children.toArray(children).filter((c): c is ReactElement<PreviewStepProps> => isValidElement(c) && c.type === PreviewStep);
  const [active, setActive] = useState(0);
  const auto = useAutoSwitch();
  const wide = useMedia(`(min-width: ${WIDE_MIN}px)`);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!auto || steps.length < 2) return undefined;
    // Der IntersectionObserver beobachtet den Fensterbereich über der Lesezeile: Er meldet, sobald der Anfang eines Abschnitts die Zeile
    // überquert (auch bei schnellem Scrollen über mehrere hinweg). Aktiv ist dann der letzte Abschnitt, dessen Anfang die Lesezeile erreicht
    // hat (activeStep in preview-logic.ts).
    const share = wide ? READ_LINE_WIDE : READ_LINE_NARROW;
    const update = () => setActive(activeStep(stepRefs.current.map((el) => (el ? el.getBoundingClientRect().top : Infinity)), window.innerHeight * share));
    const io = new IntersectionObserver(update, { rootMargin: `0px 0px -${Math.round((1 - share) * 100)}% 0px`, threshold: 0 });
    for (const el of stepRefs.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [auto, wide, steps.length]);

  const current = steps[Math.min(active, steps.length - 1)];
  if (!current) return null;
  const H = level === 4 ? 'h4' : 'h3';
  return (
    <div className="hoops-sp" data-auto={auto ? 'true' : 'false'} data-steps={steps.length}>
      <div className="hoops-sp-text">
        {steps.map((s, i) => (
          <div key={s.props.title} className="hoops-sp-step" data-step={i} data-active={i === active ? 'true' : undefined} ref={(el) => { stepRefs.current[i] = el; }}>
            <H className="hoops-sp-title">
              {s.props.title}
              {steps.length > 1 && i === active && <span className="hoops-sp-badge">In der Vorschau</span>}
            </H>
            {s.props.children}
          </div>
        ))}
      </div>
      <div className="hoops-sp-aside">
        {steps.length > 1 && (
          <div className="hoops-sp-list" role="group" aria-label={listLabel}>
            {steps.map((s, i) => (
              <button key={s.props.title} type="button" className="hoops-sp-pick" aria-pressed={i === active} onClick={() => setActive(i)}>
                {s.props.title}
              </button>
            ))}
          </div>
        )}
        <Preview of={current.props.of} title={current.props.title} minHeight={current.props.minHeight} globals={current.props.globals} />
      </div>
    </div>
  );
}
