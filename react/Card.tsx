import { forwardRef, type ElementType, type HTMLAttributes, type KeyboardEvent, type ReactNode, type Ref, type SyntheticEvent } from 'react';
import { cn } from './cn';

export type CardVariant = 'default' | 'elevated' | 'flat' | 'hoverable';
export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick' | 'title'> {
  variant?: CardVariant;
  padding?: CardPadding;
  as?: 'div' | 'article' | 'section' | 'a' | 'button';
  /** Mit href wird die Karte automatisch zum Link. */
  href?: string;
  onClick?: (event: SyntheticEvent<HTMLElement>) => void;
  header?: ReactNode;
  footer?: ReactNode;
}

export const Card = forwardRef<HTMLElement, CardProps>(function Card(
  { variant = 'default', padding = 'md', as = 'div', href, onClick, onKeyDown, header, footer, className, children, ...rest },
  ref,
) {
  const tagName = href ? 'a' : as;
  const Tag: ElementType = tagName;
  const interactiveDiv = tagName === 'div' && Boolean(onClick);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    if (event.target !== event.currentTarget) return;
    if (!event.defaultPrevented && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick?.(event);
    }
  };

  return (
    <Tag
      ref={ref as Ref<never>}
      href={href}
      onClick={onClick}
      onKeyDown={interactiveDiv ? handleKeyDown : onKeyDown}
      role={interactiveDiv ? 'button' : undefined}
      tabIndex={interactiveDiv ? 0 : undefined}
      className={cn('hoops-card', `hoops-card--${variant}`, `hoops-card--pad-${padding}`, className)}
      {...rest}
    >
      {header ? <div className="hoops-card-head">{header}</div> : null}
      <div className="hoops-card-body">{children}</div>
      {footer ? <div className="hoops-card-foot">{footer}</div> : null}
    </Tag>
  );
});
