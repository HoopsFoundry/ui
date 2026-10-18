import { Fragment } from 'react';
import { Icon } from './Icon';
import { cn } from './cn';
import { useT } from './i18n';

export interface BreadcrumbItem {
  label: string;
  /** Ohne href wird der Eintrag als Text gerendert (Zwischenschritt ohne Seite). */
  href?: string;
  /** Kontext-Kürzel, nur in der Variante `tagged` sichtbar. */
  tag?: string;
}

export type BreadcrumbVariant = 'plain' | 'tagged' | 'chip';

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  variant?: BreadcrumbVariant;
  ariaLabel?: string;
  className?: string;
}

/** Pfadanzeige: plain (Seitenkopf), tagged (mit Kontext-Kürzeln) oder chip (mobil). Das letzte Element ist die aktuelle Seite. */
export function Breadcrumbs({ items, variant = 'plain', ariaLabel, className }: BreadcrumbsProps) {
  const i18n = useT();
  const base = variant === 'chip' ? 'hoops-crumbs-chip' : 'hoops-crumbs-item';

  return (
    <nav aria-label={ariaLabel ?? i18n.t('breadcrumbs.label')} lang={i18n.lang} className={cn('hoops-crumbs', `hoops-crumbs--${variant}`, className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const content = (
          <>
            {variant === 'tagged' && item.tag ? <span className="hoops-crumbs-tag">{item.tag}</span> : null}
            {item.label}
          </>
        );
        return (
          <Fragment key={`${item.label}-${index}`}>
            {isLast ? (
              <span className={cn(base, 'is-current')} aria-current="page">
                {content}
              </span>
            ) : item.href ? (
              <a className={base} href={item.href}>
                {content}
              </a>
            ) : (
              <span className={base}>{content}</span>
            )}
            {isLast ? null : <Icon name="chevron-r" size={14} className="hoops-crumbs-sep" />}
          </Fragment>
        );
      })}
    </nav>
  );
}
