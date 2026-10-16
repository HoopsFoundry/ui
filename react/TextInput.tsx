import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Field, type FieldState } from './Field';
import { cn } from './cn';

export type { FieldState } from './Field';
export type TextInputDensity = 'touch' | 'default' | 'compact';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: ReactNode;
  /** Kleiner Hinweis rechts im Label-Bereich, z. B. "optional". */
  optional?: string;
  help?: ReactNode;
  state?: FieldState;
  density?: TextInputDensity;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Klassen für den äußeren Feld-Wrapper (className geht an das Input). */
  fieldClassName?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    label,
    optional,
    help,
    state = 'default',
    density = 'default',
    prefix,
    suffix,
    fieldClassName,
    className,
    id,
    required,
    'aria-describedby': describedByProp,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = [describedByProp, help ? `${inputId}-help` : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <Field
      controlId={inputId}
      label={label}
      optional={optional}
      required={required}
      help={help}
      state={state}
      className={fieldClassName}
    >
      <div className="hoops-input-group">
        {prefix ? <span className="hoops-addon">{prefix}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn('hoops-input', density !== 'touch' && `hoops-input--${density}`, className)}
          required={required}
          aria-invalid={state === 'error' ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {suffix ? <span className="hoops-addon hoops-addon--right">{suffix}</span> : null}
      </div>
    </Field>
  );
});
