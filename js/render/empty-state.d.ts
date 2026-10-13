import type { HeadingTag } from '../heading.js';
import type { MountHandle, MountOptions } from './mount.js';

export interface EmptyStateAction {
  label: string;
  /** Ziel; nur sichere Ziele (`safeHref`), Einträge ohne gültiges Ziel entfallen. */
  href: string;
  /** Standard `ghost`. */
  variant?: 'primary' | 'amber' | 'secondary' | 'danger' | 'ghost';
}
export interface EmptyStateProps {
  tone?: 'neutral' | 'action' | 'error';
  title: string;
  body?: string;
  /** Sprite-ID mit Vorsatz, z. B. `i-calendar`; ohne Angabe ein Standard-Symbol je Tonalität. */
  icon?: string;
  /** Text des Buttons (Klick: `options.onCta` von `mountEmptyState`). */
  cta?: string;
  /** Weitere Aktionen als Links. */
  actions?: EmptyStateAction[];
  /** Zusatztext unter den Aktionen (nur Text). */
  extra?: string;
  /** h2 bis h6, Standard h3. */
  titleAs?: HeadingTag;
  className?: string;
}
export interface MountEmptyStateOptions extends MountOptions {
  onCta?: (event: Event) => void;
}

export function renderEmptyState(props: EmptyStateProps): string;
export function mountEmptyState(el: Element, props: EmptyStateProps, options?: MountEmptyStateOptions): MountHandle<EmptyStateProps>;
