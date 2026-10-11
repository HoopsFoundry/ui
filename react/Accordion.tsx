import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { cn } from './cn';
import { HeadingLevelContext, type HeadingTag } from './HeadingLevel';
import { levelOfTag, nextLevel, resolveHeading } from '../js/heading.js';
import { createCollapsible, moveFocus, scrollToElement, summaryText, writeHash } from '../js/accordion.js';

export type AccordionVariant = 'card' | 'flat';

/** Ein angemeldeter Bereich (Werte als Getter, damit sie aktuell bleiben). `anchor: false`: kein öffentlicher Anker (keine Sprungleiste). */
export interface AccordionEntry {
  readonly id: string;
  readonly title: string;
  readonly open: boolean;
  readonly disabled: boolean;
  readonly anchor?: boolean;
  readonly el: HTMLElement | null | undefined;
  readonly trigger: HTMLElement | null | undefined;
  reveal: () => void;
  setOpen: (open: boolean) => void;
}
type Entry = AccordionEntry;

/** Intern: die Gruppe, bei der sich Bereiche (und einklappbare Rahmen) anmelden. */
export interface GroupApi {
  exclusive: boolean;
  syncHash: boolean;
  titleAs?: HeadingTag;
  /** Anzahl angemeldeter Bereiche (0 beim Server-Rendering). */
  count: number;
  register: (entry: Entry) => () => void;
  touch: () => void;
  closeOthers: (id: string) => void;
  opened: (id: string, open: boolean) => void;
  onKey: (event: KeyboardEvent<HTMLElement>) => void;
}

export const GroupContext = createContext<GroupApi | undefined>(undefined);
/**
 * Der Bereich, in dessen Inhalt wir stehen: für verschachtelte Gruppen und das Öffnen der Eltern. `group` ist die Gruppe, die der Bereich
 * im Kontext fand: so erkennt ein einklappbarer Rahmen im Inhalt, ob er direkt im Bereich steht (dann bleibt er einzeln).
 */
export const ItemContext = createContext<{ reveal: () => void; group?: GroupApi } | undefined>(undefined);

export interface AccordionProps {
  /** Nur ein Bereich gleichzeitig offen (Standard false); „Alle öffnen/schließen“ entfällt dann. */
  exclusive?: boolean;
  /** Karte (Rand, Radius, Schatten) oder flach (nur Trennlinien). */
  variant?: AccordionVariant;
  /** Zeigt „Alle öffnen“ und „Alle schließen“ mit Ansage. */
  expandAll?: boolean;
  /** Sprungleiste mit Links auf die Bereiche (unter 640 px selbst einklappbar). */
  nav?: boolean;
  /** Deep-Link: `#id` öffnet den Bereich samt Eltern; Klick setzt den Anker (Standard true). */
  syncHash?: boolean;
  /** Kopf des offenen Bereichs klebt oben (Abstand: `--dss-acc-sticky-top`). */
  sticky?: boolean;
  /** Name der Sprungleiste (`aria-label` der Navigation und Text des Handy-Schalters), Standard „Bereiche“. Mehrere Sprungleisten auf einer Seite brauchen verschiedene Namen. */
  navLabel?: string;
  /** Ebene der Bereichsüberschriften, h2 bis h6; ein `titleAs` am Bereich gewinnt. Ohne Angabe gilt `HeadingLevel`, sonst h3. */
  titleAs?: HeadingTag;
  className?: string;
  children?: ReactNode;
}

/**
 * Fasst `AccordionItem`-Bereiche zusammen: nur ein Bereich offen (`exclusive`), „Alle öffnen/schließen“ (`expandAll`), Sprungleiste
 * (`nav`), Deep-Link per URL-Anker (`syncHash`), klebender Kopf (`sticky`) und Pfeiltasten zwischen den Köpfen. Eine Gruppe in
 * einem Bereich ist verschachtelt (kleiner) und zählt die Überschriftenebene hoch. Sprungleiste und „Alle öffnen/schließen“ entstehen im
 * Browser (sie kennen die Bereiche erst nach dem Anmelden).
 */
export function Accordion({
  exclusive = false,
  variant = 'card',
  expandAll = false,
  nav = false,
  syncHash = true,
  sticky = false,
  navLabel = 'Bereiche',
  titleAs,
  className,
  children,
}: AccordionProps) {
  const uid = useId();
  const listId = `dss-acc-nav-${uid}`;
  const nested = useContext(ItemContext) !== undefined;
  const root = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [, touch] = useReducer((n: number) => n + 1, 0);
  const [current, setCurrent] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  // Sofort aktuell (anders als der State): beim Start melden sich die Bereiche nacheinander an, und der Hash-Check des einen muss die schon angemeldeten anderen sehen
  const entriesRef = useRef<Entry[]>([]);

  const register = useCallback((entry: Entry) => {
    entriesRef.current = [...entriesRef.current, entry];
    setEntries((list) =>
      [...list, entry].sort((a, b) =>
        a.el && b.el ? (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1) : 0,
      ),
    );
    return () => {
      entriesRef.current = entriesRef.current.filter((e) => e !== entry);
      setEntries((list) => list.filter((e) => e !== entry));
      setCurrent((now) => (now === entry.id ? null : now));
    };
  }, []);
  const closeOthers = useCallback((id: string) => {
    for (const e of entriesRef.current) if (e.id !== id && e.open) e.setOpen(false);
  }, []);
  const opened = useCallback((id: string, open: boolean) => {
    setCurrent((now) => (open ? id : now === id ? null : now));
  }, []);
  const onKey = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (root.current && moveFocus(root.current, event.currentTarget, event.key, event)) event.preventDefault();
  }, []);

  const api = useMemo<GroupApi>(
    () => ({ exclusive, syncHash, titleAs, count: entries.length, register, touch, closeOthers, opened, onKey }),
    [exclusive, syncHash, titleAs, entries.length, register, closeOthers, opened, onKey],
  );

  // Bei `exclusive` bleibt nur der erste offene Bereich (in Dokumentreihenfolge) offen; läuft beim Start und wenn sich Bereiche oder `exclusive` ändern
  useEffect(() => {
    if (!exclusive) return;
    for (const e of entries.filter((x) => x.open).slice(1)) e.setOpen(false);
  }, [exclusive, entries]);

  const showAll = expandAll && !exclusive;
  const panelIds = entries.map((e) => `${e.id}-panel`).join(' ');

  const setAll = (flag: boolean) => {
    // Gesperrte Bereiche behalten ihren Zustand; die Ansage nennt, wie viele danach offen sind
    const after = entries.filter((e) => (e.disabled ? e.open : flag)).length;
    for (const e of entries) if (!e.disabled) e.setOpen(flag);
    setAnnouncement(summaryText(after, entries.length));
  };

  const jump = (event: MouseEvent<HTMLAnchorElement>, entry: Entry) => {
    event.preventDefault();
    entry.reveal();
    if (syncHash) writeHash(entry.id, true);
    scrollToElement(entry.el);
    entry.trigger?.focus({ preventScroll: true });
  };

  return (
    <GroupContext.Provider value={api}>
      <div ref={root} className={cn('dss-acc', `dss-acc--${variant}`, sticky && 'dss-acc--sticky', nested && 'dss-acc--nested', className)}>
        {entries.length === 0 && (showAll || nav) ? (
          // Platz für Leiste und Sprungleiste schon im Server-Markup: kein Sprung nach dem Hydrieren
          <div className="dss-acc-tools dss-acc-tools--pending" data-parts={showAll && nav ? 'both' : showAll ? 'bar' : 'nav'} aria-hidden="true" />
        ) : entries.length > 0 && (showAll || nav) ? (
          <div className="dss-acc-tools">
            {showAll ? (
              <div className="dss-acc-bar">
                <button type="button" className="dss-btn dss-btn--secondary dss-btn--sm" aria-controls={panelIds} onClick={() => setAll(true)}>
                  Alle öffnen
                </button>
                <button type="button" className="dss-btn dss-btn--secondary dss-btn--sm" aria-controls={panelIds} onClick={() => setAll(false)}>
                  Alle schließen
                </button>
                <span className="dss-sr-only" aria-live="polite" aria-atomic="true">
                  {announcement}
                </span>
              </div>
            ) : null}
            {nav ? (
              <nav className={cn('dss-acc-nav', navOpen && 'is-open')} aria-label={navLabel}>
                <button type="button" className="dss-acc-nav-toggle" aria-expanded={navOpen} aria-controls={listId} onClick={() => setNavOpen((v) => !v)}>
                  {navLabel}
                </button>
                <ul className="dss-acc-nav-list" id={listId}>
                  {entries.filter((e) => e.anchor !== false).map((entry) => (
                    <li key={entry.id} className="dss-acc-nav-item">
                      <a
                        className="dss-acc-nav-link"
                        href={`#${encodeURIComponent(entry.id)}`}
                        aria-current={current === entry.id ? 'true' : undefined}
                        onClick={(event) => jump(event, entry)}
                      >
                        {entry.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>
    </GroupContext.Provider>
  );
}

export interface AccordionItemProps {
  /** Pflicht: Anker für den Deep-Link und die Sprungleiste; Grundlage der ids von Kopf und Bereich. */
  id: string;
  title: string;
  /** Geöffnet, kontrolliert (zusammen mit `onOpenChange`). */
  open?: boolean;
  /** Anfangszustand, wenn unkontrolliert. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Gesperrt: kein Klick, gedämpft, wird von der Tastatur übersprungen (bleibt mit Tab erreichbar). */
  disabled?: boolean;
  /** Zusatzinfo rechts im Kopf (Zähler, Chip, Live-Tag); Teil des zugänglichen Namens. */
  meta?: ReactNode;
  /** Ebene der Überschrift, h2 bis h6. */
  titleAs?: HeadingTag;
  children?: ReactNode;
}

/**
 * Ein Bereich: Kopf als Überschrift mit Button (`<h3><button aria-expanded aria-controls>`), darunter der Inhalt. Ebene der Überschrift:
 * `titleAs` > `titleAs` der Gruppe > `HeadingLevel` > h3; der Inhalt bekommt die Ebene darunter. Funktioniert auch allein ohne
 * `Accordion`. `role="region"` trägt der Bereich nur bei höchstens 6 Bereichen in der Gruppe.
 */
export function AccordionItem({ id, title, open: openProp, defaultOpen = false, onOpenChange, disabled = false, meta, titleAs, children }: AccordionItemProps) {
  const group = useContext(GroupContext);
  const parent = useContext(ItemContext);
  const outerLevel = useContext(HeadingLevelContext);
  const TitleTag = resolveHeading(titleAs ?? group?.titleAs, outerLevel);
  const contentLevel = nextLevel(levelOfTag(TitleTag));

  const controlled = openProp !== undefined;
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ? openProp : inner;
  const el = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Neuester Stand für Funktionen, die später (Ereignis, hashchange, Gruppe) laufen
  const latest = useRef({ id, title, open, disabled, controlled, onOpenChange, group, parent });
  latest.current = { id, title, open, disabled, controlled, onOpenChange, group, parent };

  // Verhalten (Öffnen, exclusive, Anker, Eltern, Eintrag für die Gruppe): gemeinsamer Baustein in js/accordion.js; einmal erzeugt, liest über `latest`
  const collapsible = useMemo(
    () =>
      createCollapsible({
        id: () => latest.current.id,
        title: () => latest.current.title,
        open: () => latest.current.open,
        disabled: () => latest.current.disabled,
        anchor: () => true,
        group: () => latest.current.group,
        parent: () => latest.current.parent,
        el: () => el.current,
        trigger: () => trigger.current,
        panel: () => panel.current,
        commit: (next) => {
          const now = latest.current;
          if (!now.controlled) setInner(next);
          now.onOpenChange?.(next);
        },
      }),
    [],
  );
  const { setOpen, reveal, checkHash } = collapsible;

  const register = group?.register;
  useEffect(() => {
    if (!register) return;
    return register(collapsible.entry);
  }, [register, collapsible]);
  const touch = group?.touch;
  useEffect(() => touch?.(), [touch, id, title, open, disabled]);
  const opened = group?.opened;
  useEffect(() => opened?.(id, open), [opened, id, open]);

  // Deep-Link: passender Anker beim Laden und bei hashchange
  const syncHash = group?.syncHash ?? true;
  useEffect(() => {
    if (!syncHash) return;
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [syncHash, id, checkHash]);

  const itemApi = useMemo(() => ({ reveal, group }), [reveal, group]);
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;
  // Allein: immer eine Region; in einer Gruppe nur bis 6 Bereiche (die Anzahl ist erst im Browser bekannt)
  const region = group ? group.count > 0 && group.count <= 6 : true;
  // React 18 kennt `inert` nicht als Prop; als Attribut mit leerem Wert wird es gesetzt
  const inert = open ? {} : ({ inert: '' } as Record<string, string>);

  return (
    <div ref={el} className={cn('dss-acc-item', open && 'is-open', disabled && 'is-disabled')} id={id}>
      <TitleTag className="dss-acc-title">
        <button
          ref={trigger}
          type="button"
          className="dss-acc-trigger"
          id={triggerId}
          aria-expanded={open}
          aria-controls={panelId}
          aria-disabled={disabled ? 'true' : undefined}
          onClick={() => setOpen(!open, true)}
          onKeyDown={(event) => group?.onKey(event)}
        >
          <span className="dss-acc-label">
            {title}
            {meta ? <span className="dss-acc-sep">,</span> : null}
          </span>
          {meta ? <span className="dss-acc-meta">{meta}</span> : null}
          <svg className="dss-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M5 7.5l5 5 5-5" />
          </svg>
        </button>
      </TitleTag>
      <div ref={panel} className="dss-acc-panel" id={panelId} role={region ? 'region' : undefined} aria-labelledby={region ? triggerId : undefined} hidden={!open} {...inert}>
        <div className="dss-acc-panel-inner">
          <div className="dss-acc-body">
            <ItemContext.Provider value={itemApi}>
              <HeadingLevelContext.Provider value={contentLevel}>{children}</HeadingLevelContext.Provider>
            </ItemContext.Provider>
          </div>
        </div>
      </div>
    </div>
  );
}
