import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from './cn';

export type CheckboxDensity = 'default' | 'compact';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label: ReactNode;
  /** Erklärender Zusatztext unter dem Label (wird per aria-describedby verknüpft). */
  hint?: ReactNode;
  density?: CheckboxDensity;
}

/**
 * Natives Kontrollkästchen im HoopsFoundry-UI-Look; die Klickfläche ist das gesamte Label (≥ 44 px, kompakt 36 px).
 * `className` landet auf dem `<input>`, nicht auf dem Wrapper (Wrapper-Klassen sind nicht vorgesehen).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, density = 'default', className, id, disabled, 'aria-describedby': describedByProp, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const describedBy = [describedByProp, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <label
      htmlFor={inputId}
      className={cn('hoops-check', density === 'compact' && 'hoops-check--compact', disabled && 'is-disabled')}
    >
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className={cn('hoops-check-input', className)}
        disabled={disabled}
        aria-describedby={describedBy}
        {...rest}
      />
      <span className="hoops-check-text">
        <span className="hoops-check-label">{label}</span>
        {hint ? (
          <span id={hintId} className="hoops-check-hint">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
});
