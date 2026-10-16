import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Field, type FieldState } from './Field';
import { cn } from './cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  help?: ReactNode;
  state?: FieldState;
  density?: 'default' | 'compact';
  /** Optionen als Daten; alternativ <option>-Kinder. */
  options?: SelectOption[];
  /** Klassen für den äußeren Feld-Wrapper (className geht an das select). */
  fieldClassName?: string;
}

/** Natives <select> im HoopsFoundry-UI-Look — Tastatur und Screenreader-Verhalten kommen vom Browser. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    help,
    state = 'default',
    density = 'default',
    options,
    fieldClassName,
    className,
    id,
    required,
    children,
    'aria-describedby': describedByProp,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedBy = [describedByProp, help ? `${selectId}-help` : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <Field controlId={selectId} label={label} required={required} help={help} state={state} className={fieldClassName}>
      <select
        ref={ref}
        id={selectId}
        className={cn('hoops-select', density === 'compact' && 'hoops-select--compact', className)}
        required={required}
        aria-invalid={state === 'error' ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))
          : children}
      </select>
    </Field>
  );
});
