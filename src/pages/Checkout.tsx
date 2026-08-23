import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCart,
  useCartSubtotal,
} from '@/lib/cart/store';
import { ROUTES } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { Container } from '@/components/common/Container';
import { Seo } from '@/components/seo/Seo';
import { Field, TextAreaField, OptionCards } from '@/components/ui/Field';
import {
  PaymentFields,
  validateCard,
  type CardState,
  type CardErrors,
} from '@/components/checkout/PaymentFields';
import { getProduct, productImage } from '@/data/products';
import { METAL_LABELS } from '@/types/catalog';
import { DELIVERY_TIMES, SHIPPING, homeDeliveryCharge } from '@/lib/fulfillment';
import { Cart } from './Cart';

type Errors = Record<string, string>;

const FULFILLMENT = {
  courier: {
    label: 'משלוח עד הבית',
    price: SHIPPING.home,
    time: DELIVERY_TIMES.home,
  },
  pickup: {
    label: 'איסוף מהסטודיו',
    price: SHIPPING.collection,
    time: DELIVERY_TIMES.collection,
  },
} as const;
type FulfillmentKey = keyof typeof FULFILLMENT;

// Israeli mobile: 05X followed by 7 digits, with optional separators.
const PHONE_RE = /^0(5\d|[2-489])[-\s]?\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Checkout() {
  const navigate = useNavigate();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const subtotal = useCartSubtotal();

  const [delivery, setDelivery] = useState<FulfillmentKey>('courier');
  const [payment, setPayment] = useState('card');
  const [giftWrap, setGiftWrap] = useState(false);
  const [card, setCard] = useState<CardState>({ number: '', holder: '', expiry: '', cvv: '' });
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const shipping = useMemo(() => {
    if (delivery === 'pickup') return 0;
    return homeDeliveryCharge(subtotal);
  }, [delivery, subtotal]);

  const total = subtotal + shipping;
  const needsAddress = delivery !== 'pickup';
  const hasMadeToOrder = lines.some(
    (line) => getProduct(line.slug)?.availability === 'made-to-order',
  );

  // An empty cart has nothing to check out — show the empty cart view.
  if (lines.length === 0) return <Cart />;

  const validate = (form: HTMLFormElement): Errors => {
    const data = new FormData(form);
    const get = (k: string) => (data.get(k) as string | null)?.trim() ?? '';
    const e: Errors = {};

    if (!get('fullName')) e.fullName = 'צריך למלא שם מלא';
    if (!get('phone')) e.phone = 'צריך למלא טלפון';
    else if (!PHONE_RE.test(get('phone'))) e.phone = 'מספר טלפון לא תקין';
    if (!get('email')) e.email = 'צריך למלא כתובת מייל';
    else if (!EMAIL_RE.test(get('email'))) e.email = 'כתובת המייל לא נראית תקינה';

    if (needsAddress) {
      if (!get('city')) e.city = 'צריך למלא עיר';
      if (!get('street')) e.street = 'צריך למלא רחוב ומספר';
    }
    return e;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const found = validate(form);
    setErrors(found);

    // Card is validated only when paying by card (Bit / Apple Pay would hand
    // off to the wallet). Format-only checks — no real authorization.
    const foundCard = payment === 'card' ? validateCard(card) : {};
    setCardErrors(foundCard);

    if (Object.keys(found).length > 0) {
      const firstKey = Object.keys(found)[0];
      form.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
      return;
    }
    if (Object.keys(foundCard).length > 0) {
      // Focus by stable name — aria-invalid isn't in the DOM until re-render.
      const nameByKey: Record<string, string> = {
        number: 'cardNumber',
        holder: 'cardHolder',
        expiry: 'cardExpiry',
        cvv: 'cardCvv',
      };
      const firstCardKey = Object.keys(foundCard)[0];
      form.querySelector<HTMLElement>(`[name="${nameByKey[firstCardKey]}"]`)?.focus();
      return;
    }

    setSubmitting(true);

    // ── SIMULATED CHECKOUT ─────────────────────────────────────────────────
    // Demo only: nothing is charged and no data leaves the browser.
    // In production this step would:
    //   1. Tokenize the card / open the wallet via an Israeli PSP —
    //      Cardcom, Grow (מקס/Meshulam), or Tranzila — never handling raw PAN
    //      in our own code (PCI). Bit / Apple Pay go through the same PSP.
    //   2. On payment success, create the order server-side and send the
    //      confirmation email (EmailJS / Formspree for a static build, or a
    //      transactional provider like Resend / SendGrid via a serverless fn).
    const email = (new FormData(form).get('email') as string)?.trim();
    const orderNumber = `NOGA-${new Date().getFullYear().toString().slice(2)}${String(
      Date.now(),
    ).slice(-5)}`;

    const snapshot = {
      orderNumber,
      email,
      lines: lines.map((l) => ({ ...l })),
      subtotal,
      shipping,
      total,
      delivery: `${FULFILLMENT[delivery].label} · ${FULFILLMENT[delivery].time}`,
      giftWrap,
    };

    window.setTimeout(() => {
      clear();
      navigate(ROUTES.orderConfirmation, { state: snapshot });
    }, 1200);
  };

  return (
    <div className="py-12 sm:py-16">
      <Seo
        title="תשלום"
        description="השלמת ההזמנה - אתר הדגמה, ללא חיוב אמיתי."
        path="/checkout"
      />
      <Container>
        <h1 className="text-3xl sm:text-4xl">תשלום</h1>

        <form onSubmit={handleSubmit} noValidate className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
          {/* ── Left: details ── */}
          <div className="space-y-12">
            {/* Shipping details */}
            <section aria-labelledby="ship-title">
              <h2 id="ship-title" className="text-lg">
                פרטי משלוח
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="שם מלא" name="fullName" autoComplete="name" error={errors.fullName} className="sm:col-span-2" />
                <Field label="טלפון" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="050-0000000" error={errors.phone} />
                <Field label="אימייל" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" placeholder="your@email.com" error={errors.email} />
                {needsAddress && (
                  <>
                    <Field label="עיר" name="city" autoComplete="address-level2" error={errors.city} />
                    <Field label="רחוב ומספר" name="street" autoComplete="address-line1" error={errors.street} />
                    <Field label="דירה / כניסה" name="apartment" optional autoComplete="address-line2" />
                  </>
                )}
                <div className="sm:col-span-2">
                  <TextAreaField label="הערות להזמנה" name="notes" optional placeholder="קומה, קוד כניסה, שעות נוחות למסירה" />
                </div>
              </div>
            </section>

            {/* Fulfilment method */}
            <section aria-labelledby="delivery-title">
              <h2 id="delivery-title" className="text-lg">
                אופן קבלת ההזמנה
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone">
                משלוח עד הבית בתוך {DELIVERY_TIMES.home}, או איסוף מהסטודיו בתוך{' '}
                {DELIVERY_TIMES.collection} וללא עלות.
              </p>
              {hasMadeToOrder && (
                <p className="mt-3 rounded-sm border border-mist p-4 text-sm leading-relaxed text-charcoal">
                  בהזמנה יש פריט שנוצר בהזמנה. יש להוסיף {DELIVERY_TIMES.madeToOrder},
                  ולאחר מכן חל זמן המסירה שבחרת.
                </p>
              )}
              <div className="mt-5">
                <OptionCards
                  legend="בחירת אופן קבלת ההזמנה"
                  name="delivery"
                  value={delivery}
                  onChange={(v) => setDelivery(v as FulfillmentKey)}
                  options={(Object.keys(FULFILLMENT) as FulfillmentKey[]).map((k) => ({
                    value: k,
                    label: FULFILLMENT[k].label,
                    note: (
                      <span className="text-end leading-relaxed">
                        <span className="block">{FULFILLMENT[k].time}</span>
                        <span className="block text-xs">
                          {k === 'courier' && subtotal >= SHIPPING.freeThreshold
                            ? 'חינם'
                            : FULFILLMENT[k].price === 0
                              ? 'חינם'
                              : formatPrice(FULFILLMENT[k].price)}
                        </span>
                      </span>
                    ),
                  }))}
                />
              </div>
            </section>

            {/* Gift wrapping */}
            <section aria-labelledby="gift-title">
              <h2 id="gift-title" className="text-lg">
                אריזת מתנה
              </h2>
              <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="accent-gold"
                />
                <span className="text-charcoal">
                  לארוז כמתנה, קופסה, סרט וכרטיס בכתב יד <span className="text-stone">(ללא תוספת תשלום)</span>
                </span>
              </label>
              {giftWrap && (
                <div className="mt-4">
                  <TextAreaField label="הקדשה לכרטיס" name="giftMessage" optional placeholder="מה לכתוב בכרטיס" />
                </div>
              )}
            </section>

            {/* Payment — real, editable fields; simulated authorization only */}
            <section id="payment-section" aria-labelledby="pay-title">
              <h2 id="pay-title" className="text-lg">
                תשלום
              </h2>
              <p className="mt-2 text-xs text-stone">
                זהו אתר הדגמה - לא מתבצע חיוב אמיתי ואין להזין פרטי כרטיס אמיתיים.
              </p>
              <div className="mt-5">
                <OptionCards
                  legend="אמצעי תשלום"
                  name="payment"
                  value={payment}
                  onChange={setPayment}
                  options={[
                    { value: 'card', label: 'כרטיס אשראי' },
                    { value: 'bit', label: 'Bit' },
                    { value: 'apple', label: 'Apple Pay' },
                  ]}
                />
              </div>

              {payment === 'card' && (
                // Editable demo fields with format-only validation. In
                // production these would be replaced by a PCI-compliant PSP
                // iframe (Cardcom / Grow / Tranzila) so the raw card number
                // never touches our code — see the SIMULATED CHECKOUT note in
                // handleSubmit for where authorization plugs in.
                <PaymentFields
                  card={card}
                  errors={cardErrors}
                  onChange={(patch) => {
                    setCard((c) => ({ ...c, ...patch }));
                    setCardErrors({});
                  }}
                />
              )}
              {payment !== 'card' && (
                <p className="mt-5 rounded-md border border-mist px-4 py-3 text-sm text-stone">
                  בהמשך היית מועברת ל{payment === 'bit' ? '-Bit' : '-Apple Pay'} להשלמת התשלום.
                </p>
              )}
            </section>
          </div>

          {/* ── Right: order summary ── */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-sm border border-mist p-6">
              <h2 className="text-lg">סיכום הזמנה</h2>
              <ul className="mt-5 space-y-4">
                {lines.map((line) => (
                  <li key={line.id} className="flex gap-3">
                    <img
                      src={productImage(line.image, '600')}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-sm bg-mist/40 object-cover"
                      style={{ width: 56, height: 56 }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-charcoal">{line.name}</p>
                      <p className="mt-0.5 text-xs text-stone">
                        {METAL_LABELS[line.metal]}
                        {line.size && ` · מידה ${line.size}`} · כמות {line.quantity}
                      </p>
                    </div>
                    <p className="text-sm text-charcoal">{formatPrice(line.price * line.quantity)}</p>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 space-y-3 border-t border-mist pt-5 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-stone">סכום ביניים</dt>
                  <dd className="text-charcoal">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-stone">משלוח</dt>
                  <dd className="text-charcoal">{shipping === 0 ? 'חינם' : formatPrice(shipping)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-mist pt-3 text-base">
                  <dt className="text-charcoal">סה״כ לתשלום</dt>
                  <dd className="text-charcoal">{formatPrice(total)}</dd>
                </div>
              </dl>

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-charcoal px-8 py-4 text-sm tracking-wide text-cream transition-colors hover:bg-charcoal/90 disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream" aria-hidden="true" />
                    מעבד הזמנה...
                  </>
                ) : (
                  `לתשלום · ${formatPrice(total)}`
                )}
              </button>
              <p className="mt-3 text-center text-xs text-stone">
                בלחיצה מתבצעת הזמנת הדגמה בלבד, ללא חיוב.
              </p>
            </div>
          </aside>
        </form>
      </Container>
    </div>
  );
}
