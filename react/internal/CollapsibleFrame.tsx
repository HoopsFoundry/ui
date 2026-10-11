import { useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '../cn';
import { HeadingLevelContext, type HeadingTag } from '../HeadingLevel';
import { GroupContext, ItemContext } from '../Accordion';
import { levelOfTag, nextLevel, resolveHeading } from '../../js/heading.js';
import { createCollapsible } from '../../js/accordion.js';

export interface CollapsibleFrameProps {
  /** `frame`: Rahmen der Tabellen (`dss-frame`); `league`: Karte der Liga (`dss-league`). */
  kind?: 'frame' | 'league';
  /** Alle Klassen des äußeren Elements (ohne `is-collapsible`/`is-open`). */
  rootClass: string;
  /** Anker für Deep-Link und Sprungleiste; ohne `id` gibt es keinen. */
  id?: string;
  /** Text oder Knoten; für die Sprungleiste einer Gruppe zählt nur Text. */
  title: ReactNode;
  /** Untertitel unter dem Titel (nur `league`). */
  sub?: string;
  titleAs?: HeadingTag;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Zusatzinfo rechts im Kopf (mit eigenem Wrapper des Aufrufers); Teil des zugänglichen Namens. */
  meta?: ReactNode;
  children?: ReactNode;
}

/**
 * Intern (nicht Teil der öffentlichen Exporte): der einklappbare Rahmen von `Table`, `ScheduleTable`, `ScheduleGrid` (`kind="frame"`)
 * und `LeagueCard` (`kind="league"`). Der Kopf ist eine Überschrift mit Button, der Inhalt das Panel. Titel, Untertitel und Zusatzinfo
 * stehen im Button (Teil des Namens). Der Inhalt bekommt die Ebene unter dem Titel. Im Kontext einer `Accordion`-Gruppe meldet sich der
 * Rahmen an (Sprungleiste, „Alle öffnen“, `exclusive`, Deep-Link, Tastatur); steht er direkt im Panel eines `AccordionItem`, bleibt er
 * einzeln. Ohne `id` gibt es keinen Anker. Das Panel trägt keine eigene Region: der Inhalt bringt schon eine benannte mit.
 */
export function CollapsibleFrame({
  kind = 'frame',
  rootClass,
  id,
  title,
  sub = '',
  titleAs,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  meta,
  children,
}: CollapsibleFrameProps) {
  const outer = useContext(GroupContext);
  const parent = useContext(ItemContext);
  const outerLevel = useContext(HeadingLevelContext);
  // Direkt im Panel eines Bereichs (die Gruppe ist die des Bereichs): einzeln bleiben, sonst schlösse `exclusive` den Elternbereich
  const group = outer && !(parent && parent.group === outer) ? outer : undefined;
  const Tag = resolveHeading(titleAs ?? group?.titleAs, outerLevel);
  const contentLevel = nextLevel(levelOfTag(Tag));

  const uid = useId();
  const key = id ?? `dss-cf-${uid}`;
  const controlled = openProp !== undefined;
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ? openProp : inner;
  const el = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const titleText = typeof title === 'string' || typeof title === 'number' ? String(title) : '';
  const latest = useRef({ key, title: titleText, open, hasId: id !== undefined, controlled, onOpenChange, group, parent });
  latest.current = { key, title: titleText, open, hasId: id !== undefined, controlled, onOpenChange, group, parent };

  const collapsible = useMemo(
    () =>
      createCollapsible({
        id: () => latest.current.key,
        title: () => latest.current.title,
        open: () => latest.current.open,
        disabled: () => false,
        anchor: () => latest.current.hasId,
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
  useEffect(() => touch?.(), [touch, key, titleText, open]);
  const opened = group?.opened;
  useEffect(() => opened?.(key, open), [opened, key, open]);

  const syncHash = group?.syncHash ?? true;
  const hasId = id !== undefined;
  useEffect(() => {
    if (!hasId || !syncHash) return;
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [hasId, syncHash, key, checkHash]);

  const itemApi = useMemo(() => ({ reveal, group: outer }), [reveal, outer]);
  const base = kind === 'league' ? 'dss-league' : 'dss-frame';
  const triggerId = `${key}-trigger`;
  const panelId = `${key}-panel`;
  // React 18 kennt `inert` nicht als Prop; als Attribut mit leerem Wert wird es gesetzt
  const inert = open ? {} : ({ inert: '' } as Record<string, string>);

  return (
    <div ref={el} className={cn(rootClass, 'is-collapsible', open && 'is-open')} id={id}>
      <div className={`${base}-head ${base}-head--acc`}>
        <Tag className={`${base}-title`}>
          <button
            ref={trigger}
            type="button"
            className="dss-acc-trigger"
            id={triggerId}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen(!open, true)}
            onKeyDown={(event) => group?.onKey(event)}
          >
            <span className="dss-acc-label">
              {title}
              {sub ? (
                <>
                  <span className="dss-acc-sep">,</span>
                  <span className="dss-acc-sub">
                    {sub}
                    {meta ? <span className="dss-acc-sep">,</span> : null}
                  </span>
                </>
              ) : meta ? (
                <span className="dss-acc-sep">,</span>
              ) : null}
            </span>
            {meta}
            <svg className="dss-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
              <path d="M5 7.5l5 5 5-5" />
            </svg>
          </button>
        </Tag>
      </div>
      <div ref={panel} className="dss-acc-panel" id={panelId} hidden={!open} {...inert}>
        <div className="dss-acc-panel-inner">
          <ItemContext.Provider value={itemApi}>
            <HeadingLevelContext.Provider value={contentLevel}>{children}</HeadingLevelContext.Provider>
          </ItemContext.Provider>
        </div>
      </div>
    </div>
  );
}
