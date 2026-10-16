import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import { cn } from './cn';
import { useHeadingTag, type HeadingTag } from './HeadingLevel';

export type EmptyStateTone = 'neutral' | 'action' | 'error';

export interface EmptyStateProps {
  tone?: EmptyStateTone;
  title: string;
  body?: ReactNode;
  /** Sprite-Icon; ohne Angabe ein tonalitätsabhängiges Standard-Symbol. */
  icon?: IconName;
  /** Einfacher CTA-Button; für mehrere/andere Aktionen `actions` nutzen. */
  cta?: string;
  onCta?: () => void;
  actions?: ReactNode;
  /** Überschriftenebene des Titels, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
  titleAs?: HeadingTag;
  className?: string;
  /** Zusatz-Inhalt unter den Aktionen. */
  children?: ReactNode;
}

const CTA_VARIANT = { neutral: 'primary', action: 'amber', error: 'danger' } as const;

function ToneIcon({ tone }: { tone: EmptyStateTone }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 28,
    height: 28,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  if (tone === 'error') {
    return (
      <svg {...common}>
        <path d="m12 4 10 17H2L12 4Z" />
        <path d="M12 10v5" />
        <circle cx="12" cy="18.2" r=".7" fill="currentColor" />
      </svg>
    );
  }
  if (tone === 'action') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <circle cx="12" cy="16.5" r=".7" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M4 10h16" />
    </svg>
  );
}

/** Leer-, Hinweis- oder Fehlerzustand mit klarem nächsten Schritt. */
export function EmptyState({
  tone = 'neutral',
  title,
  body,
  icon,
  cta,
  onCta,
  actions,
  titleAs,
  className,
  children,
}: EmptyStateProps) {
  const Heading = useHeadingTag(titleAs);
  return (
    <div className={cn('hoops-empty', `hoops-empty--${tone}`, className)}>
      <div className="hoops-empty-icon">{icon ? <Icon name={icon} size={28} /> : <ToneIcon tone={tone} />}</div>
      <Heading className="hoops-empty-title">{title}</Heading>
      {body ? <p className="hoops-empty-body">{body}</p> : null}
      {cta || actions ? (
        <div className="hoops-empty-actions">
          {cta ? (
            <button type="button" className={cn('hoops-btn', 'hoops-btn--md', `hoops-btn--${CTA_VARIANT[tone]}`)} onClick={onCta}>
              {cta}
            </button>
          ) : null}
          {actions}
        </div>
      ) : null}
      {children ? <div className="hoops-empty-extra">{children}</div> : null}
    </div>
  );
}
