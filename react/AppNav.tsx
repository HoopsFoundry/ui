import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icon } from './Icon';
import { cn } from './cn';

export interface AppNavLink {
  id: string;
  label: string;
  href: string;
  /** Gesperrt: nicht fokussierbar, mit Hinweis (Tooltip + Screenreader). */
  disabled?: boolean;
  hint?: string;
}

export interface AppNavGroup {
  id: string;
  label: string;
  items: AppNavLink[];
  /** Gesperrt: die ganze Gruppe ist nicht verfügbar (kein Dropdown, Hinweis wie bei Links). */
  disabled?: boolean;
  hint?: string;
}

export type AppNavItem = AppNavLink | AppNavGroup;
export type AppNavTone = 'light' | 'dark';

export interface AppNavLinkRenderProps {
  item: AppNavLink;
  className: string;
  ariaCurrent: 'page' | undefined;
  /** Beim Navigieren aufrufen (schließt Dropdown und mobiles Menü). */
  onNavigate: () => void;
  children: ReactNode;
}

export interface AppNavProps {
  items: AppNavItem[];
  /** Aktueller Pfad; ein Link mit gleichem `href` ist aktiv (`aria-current="page"`). */
  currentHref?: string;
  tone?: AppNavTone;
  ariaLabel?: string;
  /** Beschriftung des Hamburger-Buttons (unter 720 px). */
  menuLabel?: string;
  /** Platz rechts in der Leiste, z. B. für einen späteren Turnierumschalter. */
  context?: ReactNode;
  /** Eigene Link-Darstellung, z. B. für React Router (`Link` statt `a`). */
  renderLink?: (props: AppNavLinkRenderProps) => ReactNode;
  /** Begrenzt den Inhalt auf --hoops-shell-max (Hintergrund bleibt voll breit). */
  contained?: boolean;
  className?: string;
}

const isGroup = (item: AppNavItem): item is AppNavGroup => 'items' in item;
const slug = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '-');

/** Hauptnavigation mit Gruppen-Dropdowns (Disclosure), gesperrten Einträgen und mobilem Hamburger-Menü. */
export function AppNav({
  items,
  currentHref,
  tone = 'light',
  ariaLabel = 'Hauptnavigation',
  menuLabel = 'Menü',
  context,
  renderLink,
  contained = false,
  className,
}: AppNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const baseId = useId();

  useEffect(() => {
    if (!openGroup) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [openGroup]);

  const closeAll = () => {
    setOpenGroup(null);
    setMenuOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return;
    if (openGroup) {
      const id = openGroup;
      setOpenGroup(null);
      triggers.current[id]?.focus();
    } else if (menuOpen) {
      setMenuOpen(false);
      toggleRef.current?.focus();
    }
  };

  const isCurrent = (item: AppNavLink) => currentHref !== undefined && item.href === currentHref;

  const renderItemLink = (item: AppNavLink): ReactNode => {
    if (item.disabled) {
      return (
        <span role="link" aria-disabled="true" className="dss-appnav-link is-disabled" title={item.hint}>
          {item.label}
          {item.hint ? <span className="dss-sr-only"> – {item.hint}</span> : null}
        </span>
      );
    }
    const current = isCurrent(item);
    const linkClass = cn('dss-appnav-link', current && 'is-active');
    const ariaCurrent = current ? 'page' : undefined;
    if (renderLink) {
      return renderLink({ item, className: linkClass, ariaCurrent, onNavigate: closeAll, children: item.label });
    }
    return (
      <a href={item.href} className={linkClass} aria-current={ariaCurrent} onClick={closeAll}>
        {item.label}
      </a>
    );
  };

  return (
    <nav
      ref={rootRef}
      aria-label={ariaLabel}
      className={cn('dss-appnav', `dss-appnav--${tone}`, contained && 'dss-appnav--contained', menuOpen && 'is-open', className)}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        // Nur schließen, wenn der Fokus auf ein Element außerhalb wandert (relatedTarget null = z. B. Safari-Klick, nicht schließen).
        const next = event.relatedTarget as Node | null;
        if (openGroup && next && !event.currentTarget.contains(next)) setOpenGroup(null);
      }}
    >
      <div className="dss-appnav-bar">
        <button
          ref={toggleRef}
          type="button"
          className="dss-appnav-toggle"
          aria-expanded={menuOpen}
          aria-controls={`${baseId}-list`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
          <span>{menuLabel}</span>
        </button>
        <ul id={`${baseId}-list`} className="dss-appnav-list">
          {items.map((item) => {
            if (!isGroup(item)) {
              return (
                <li key={item.id} className="dss-appnav-item">
                  {renderItemLink(item)}
                </li>
              );
            }
            if (item.disabled) {
              return (
                <li key={item.id} className="dss-appnav-item">
                  <button type="button" className="dss-appnav-group-btn is-disabled" disabled title={item.hint}>
                    {item.label}
                    {item.hint ? <span className="dss-sr-only"> – {item.hint}</span> : null}
                  </button>
                </li>
              );
            }
            const open = openGroup === item.id;
            const panelId = `${baseId}-${slug(item.id)}`;
            return (
              <li key={item.id} className="dss-appnav-item">
                <button
                  ref={(el) => {
                    triggers.current[item.id] = el;
                  }}
                  type="button"
                  className={cn('dss-appnav-group-btn', item.items.some(isCurrent) && 'is-active', open && 'is-open')}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenGroup(open ? null : item.id)}
                >
                  {item.label}
                  <Icon name="chevron-d" size={16} className="dss-appnav-chev" />
                </button>
                <ul id={panelId} className="dss-appnav-panel" hidden={!open}>
                  {item.items.map((child) => (
                    <li key={child.id}>{renderItemLink(child)}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        {context ? <div className="dss-appnav-context">{context}</div> : null}
      </div>
    </nav>
  );
}
