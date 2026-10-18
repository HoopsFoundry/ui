import * as Dialog from '@radix-ui/react-dialog';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { SeverityIcon, type Severity } from './SeverityIcon';
import { cn } from './cn';
import { useT } from './i18n';
import { HeadingLevelContext, type HeadingTag } from './HeadingLevel';
import { levelOfTag, nextLevel, resolveHeading } from '../js/heading.js';

export type ModalSeverity = 'default' | Severity;
export type ModalSize = 'sm' | 'md' | 'wide' | 'xwide';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /**
   * Ebene des Titels, h2 bis h6 (Standard h2). Titelkomponenten im Inhalt (Table, EmptyState …) bekommen die nächste
   * Ebene, bei h2 also h3; ein eigenes `HeadingLevel` im Inhalt oder `titleAs` an der Komponente gewinnt.
   */
  titleAs?: HeadingTag;
  subtitle?: string;
  severity?: ModalSeverity;
  size?: ModalSize;
  /** Zeigt den Schließen-Button und erlaubt Escape (Standard: true). */
  closable?: boolean;
  /** Schließen per Klick auf den Hintergrund (Standard: false: ein Klick daneben schließt das Modal nicht). */
  dismissOnBackdrop?: boolean;
  closeLabel?: string;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Modal({
  open,
  onOpenChange,
  title,
  titleAs = 'h2',
  subtitle,
  severity = 'default',
  size = 'md',
  closable = true,
  dismissOnBackdrop = false,
  closeLabel,
  footer,
  className,
  children,
}: ModalProps) {
  // Radix gibt den Fokus nur an einen Dialog.Trigger zurück; die Komponente hat keinen, also merken wir uns das Element, das beim Öffnen den Fokus hatte
  const returnTo = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    returnTo.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }, [open]);
  const i18n = useT();
  const blockOutsideDismiss = !closable || !dismissOnBackdrop;
  const TitleTag = resolveHeading(titleAs, 2);
  const contentLevel = nextLevel(levelOfTag(TitleTag));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="hoops-backdrop" />
        <div className="hoops-modal-wrap">
          <Dialog.Content
            aria-describedby={undefined}
            lang={i18n.lang}
            className={cn('hoops-modal', size !== 'md' && `hoops-modal--${size}`, className)}
            onInteractOutside={(event) => {
              if (blockOutsideDismiss) event.preventDefault();
            }}
            onCloseAutoFocus={(event) => {
              const target = returnTo.current;
              returnTo.current = null;
              if (target?.isConnected) {
                event.preventDefault();
                target.focus();
              }
            }}
            onEscapeKeyDown={(event) => {
              if (!closable) event.preventDefault();
            }}
          >
            <div className="hoops-m-head">
              {severity !== 'default' ? (
                <div className={`hoops-m-head-icon hoops-m-head-icon--${severity}`}>
                  <SeverityIcon severity={severity} />
                </div>
              ) : null}
              <div className="hoops-m-head-text">
                <Dialog.Title asChild>
                  <TitleTag className="hoops-m-title">{title}</TitleTag>
                </Dialog.Title>
                {subtitle ? <div className="hoops-m-subtitle">{subtitle}</div> : null}
              </div>
              {closable ? (
                <Dialog.Close className="hoops-m-close" aria-label={closeLabel ?? i18n.t('modal.close')}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </Dialog.Close>
              ) : null}
            </div>
            <HeadingLevelContext.Provider value={contentLevel}>
              <div className="hoops-m-body">{children}</div>
              {footer ? <div className="hoops-m-footer">{footer}</div> : null}
            </HeadingLevelContext.Provider>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
