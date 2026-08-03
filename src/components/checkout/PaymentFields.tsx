import { useId } from 'react';

export type CardState = {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
};

export type CardErrors = Partial<Record<keyof CardState, string>>;

// ── Formatters ────────────────────────────────────────────────────────────
/** Digits only, grouped in 4s, max 19 digits (→ "1234 5678 9012 3456"). */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** "MM/YY" with a slash inserted after the month. */
export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCvv(value: string): string {
  return value.replace(/\D/g, '').slice(0, 4);
}

// ── Validators (format-only — this never contacts a real processor) ─────────
/** Luhn check + length, so obviously-fake numbers are caught in the demo. */
function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function validateCard(card: CardState): CardErrors {
  const errors: CardErrors = {};
  const digits = card.number.replace(/\D/g, '');

  if (!digits) errors.number = 'צריך למלא מספר כרטיס';
  else if (digits.length < 13 || !luhnValid(digits)) errors.number = 'מספר כרטיס לא תקין';

  if (!card.holder.trim()) errors.holder = 'צריך למלא שם בעל הכרטיס';

  const exp = card.expiry.replace(/\D/g, '');
  if (exp.length < 4) {
    errors.expiry = 'תוקף לא תקין';
  } else {
    const month = Number(exp.slice(0, 2));
    const year = 2000 + Number(exp.slice(2, 4));
    const now = new Date();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    if (month < 1 || month > 12) errors.expiry = 'חודש לא תקין';
    else if (endOfMonth < now) errors.expiry = 'הכרטיס פג תוקף';
  }

  if (card.cvv.length < 3) errors.cvv = 'CVV לא תקין';

  return errors;
}

// ── Component ───────────────────────────────────────────────────────────────
export function PaymentFields({
  card,
  errors,
  onChange,
}: {
  card: CardState;
  errors: CardErrors;
  onChange: (patch: Partial<CardState>) => void;
}) {
  const ids = {
    number: useId(),
    holder: useId(),
    expiry: useId(),
    cvv: useId(),
  };

  const inputClass = (err?: string) =>
    `mt-2 w-full rounded-md border bg-transparent px-4 py-2.5 text-charcoal placeholder:text-stone/50 focus:outline-none ${
      err ? 'border-red-700' : 'border-mist focus:border-gold'
    }`;

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {/* Card number */}
      <div className="sm:col-span-2">
        <label htmlFor={ids.number} className="block text-sm text-charcoal">
          מספר כרטיס
        </label>
        <input
          id={ids.number}
          name="cardNumber"
          inputMode="numeric"
          autoComplete="cc-number"
          dir="ltr"
          placeholder="1234 5678 9012 3456"
          value={card.number}
          onChange={(e) => onChange({ number: formatCardNumber(e.target.value) })}
          aria-invalid={errors.number ? true : undefined}
          aria-describedby={errors.number ? `${ids.number}-err` : undefined}
          className={`${inputClass(errors.number)} text-start`}
        />
        {errors.number && (
          <p id={`${ids.number}-err`} role="alert" className="mt-1.5 text-xs text-red-800">
            {errors.number}
          </p>
        )}
      </div>

      {/* Cardholder */}
      <div className="sm:col-span-2">
        <label htmlFor={ids.holder} className="block text-sm text-charcoal">
          שם בעל הכרטיס
        </label>
        <input
          id={ids.holder}
          name="cardHolder"
          autoComplete="cc-name"
          placeholder="כפי שמופיע על הכרטיס"
          value={card.holder}
          onChange={(e) => onChange({ holder: e.target.value })}
          aria-invalid={errors.holder ? true : undefined}
          aria-describedby={errors.holder ? `${ids.holder}-err` : undefined}
          className={inputClass(errors.holder)}
        />
        {errors.holder && (
          <p id={`${ids.holder}-err`} role="alert" className="mt-1.5 text-xs text-red-800">
            {errors.holder}
          </p>
        )}
      </div>

      {/* Expiry */}
      <div>
        <label htmlFor={ids.expiry} className="block text-sm text-charcoal">
          תוקף
        </label>
        <input
          id={ids.expiry}
          name="cardExpiry"
          inputMode="numeric"
          autoComplete="cc-exp"
          dir="ltr"
          placeholder="MM/YY"
          value={card.expiry}
          onChange={(e) => onChange({ expiry: formatExpiry(e.target.value) })}
          aria-invalid={errors.expiry ? true : undefined}
          aria-describedby={errors.expiry ? `${ids.expiry}-err` : undefined}
          className={`${inputClass(errors.expiry)} text-start`}
        />
        {errors.expiry && (
          <p id={`${ids.expiry}-err`} role="alert" className="mt-1.5 text-xs text-red-800">
            {errors.expiry}
          </p>
        )}
      </div>

      {/* CVV */}
      <div>
        <label htmlFor={ids.cvv} className="block text-sm text-charcoal">
          CVV
        </label>
        <input
          id={ids.cvv}
          name="cardCvv"
          inputMode="numeric"
          autoComplete="cc-csc"
          dir="ltr"
          placeholder="123"
          value={card.cvv}
          onChange={(e) => onChange({ cvv: formatCvv(e.target.value) })}
          aria-invalid={errors.cvv ? true : undefined}
          aria-describedby={errors.cvv ? `${ids.cvv}-err` : undefined}
          className={`${inputClass(errors.cvv)} text-start`}
        />
        {errors.cvv && (
          <p id={`${ids.cvv}-err`} role="alert" className="mt-1.5 text-xs text-red-800">
            {errors.cvv}
          </p>
        )}
      </div>
    </div>
  );
}
