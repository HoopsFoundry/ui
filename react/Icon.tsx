import { useEffect, type SVGAttributes } from 'react';
import { SPRITE_ID, parseSprite, type IconName } from '../icons/sprite';
import { cn } from './cn';

export { ICON_NAMES, type IconName } from '../icons/sprite';

/** Fügt den gemeinsamen Sprite einmal pro Dokument ein. */
export function ensureSprite(): void {
  if (typeof document === 'undefined' || document.getElementById(SPRITE_ID)) return;
  const wrap = document.createElement('div');
  wrap.id = SPRITE_ID;
  wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.appendChild(document.importNode(parseSprite(), true));
  document.body.insertBefore(wrap, document.body.firstChild);
}

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number | string;
  /** Mit title wird das Icon als Bild angesagt, ohne title ist es dekorativ. */
  title?: string;
}

export function Icon({ name, size = 24, title, className, ...rest }: IconProps) {
  useEffect(ensureSprite, []);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('hoops-icon', className)}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <use href={`#i-${name}`} />
    </svg>
  );
}
