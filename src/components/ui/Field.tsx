import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  optional?: boolean;
};

/** Labelled text input with accessible error wiring. */
export function Field({ label, error, optional, className = '', ...input }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm text-charcoal">
        {label}
        {optional && <span className="text-stone"> (לא חובה)</span>}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`mt-2 w-full rounded-md border bg-transparent px-4 py-2.5 text-charcoal placeholder:text-stone/50 focus:outline-none ${
          error ? 'border-red-700' : 'border-mist focus:border-gold'
        }`}
        {...input}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}

/** Labelled textarea sibling of Field. */
export function TextAreaField({
  label,
  optional,
  id: providedId,
  ...props
}: { label: string; optional?: boolean } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-charcoal">
        {label}
        {optional && <span className="text-stone"> (לא חובה)</span>}
      </label>
      <textarea
        id={id}
        rows={3}
        className="mt-2 w-full rounded-md border border-mist bg-transparent px-4 py-2.5 text-charcoal placeholder:text-stone/50 focus:border-gold focus:outline-none"
        {...props}
      />
    </div>
  );
}

/** Radio-card group for delivery / payment method selection. */
export function OptionCards({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; note?: ReactNode }[];
}) {
  return (
    <fieldset>
      <legend className="text-sm text-charcoal">{legend}</legend>
      <div className="mt-3 space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm transition-colors ${
              value === opt.value ? 'border-gold' : 'border-mist hover:border-stone'
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                className="accent-gold"
              />
              <span className="text-charcoal">{opt.label}</span>
            </span>
            {opt.note && <span className="text-stone">{opt.note}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
