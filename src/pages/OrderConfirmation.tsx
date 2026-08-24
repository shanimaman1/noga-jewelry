import { Link, Navigate, useLocation } from 'react-router-dom';
import type { CartLine } from '@/lib/cart/store';
import { ROUTES } from '@/lib/constants';
import { formatPrice, installmentSummary, type InstallmentCount } from '@/lib/format';
import { shippingCostText } from '@/lib/fulfillment';
import { METAL_LABELS } from '@/types/catalog';
import { Container } from '@/components/common/Container';
import { Seo } from '@/components/seo/Seo';

type OrderSnapshot = {
  orderNumber: string;
  email: string;
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  delivery: string;
  giftWrap: boolean;
  installments: InstallmentCount;
};

export function OrderConfirmation() {
  const { state } = useLocation();
  const order = state as OrderSnapshot | null;

  // Reached directly (no order in navigation state) — nothing to confirm.
  if (!order?.orderNumber) return <Navigate to={ROUTES.home} replace />;

  return (
    <div className="py-16 sm:py-24">
      <Seo title="אישור הזמנה" description="תודה על ההזמנה." path="/order-confirmation" />
      <Container className="max-w-2xl">
        <div className="text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold text-gold">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="mt-6 text-xs tracking-luxury text-gold">תודה</p>
          <h1 className="mt-3 text-3xl sm:text-4xl">ההזמנה התקבלה</h1>
          <p className="mt-4 leading-relaxed text-stone">
            שלחנו אישור עם כל הפרטים לכתובת{' '}
            <span dir="ltr" className="text-charcoal">
              {order.email}
            </span>
            . נעדכן אותך כשההזמנה יוצאת לדרך.
          </p>
          <p className="mt-4 text-sm text-stone">
            מספר הזמנה: <span className="text-charcoal">{order.orderNumber}</span>
          </p>
        </div>

        <div className="mt-10 rounded-sm border border-mist p-6">
          <h2 className="text-lg">פרטי ההזמנה</h2>
          <ul className="mt-5 space-y-4">
            {order.lines.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="text-charcoal">{line.name}</span>
                  <span className="text-stone">
                    {' '}
                    · {METAL_LABELS[line.metal]} · {line.karat} קראט
                    {line.size && ` · מידה ${line.size}`} · כמות {line.quantity}
                  </span>
                </span>
                <span className="shrink-0 text-charcoal">
                  {formatPrice(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-mist pt-5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-stone">אופן משלוח</dt>
              <dd className="text-charcoal">{order.delivery}</dd>
            </div>
            {order.giftWrap && (
              <div className="flex items-center justify-between">
                <dt className="text-stone">אריזה</dt>
                <dd className="text-charcoal">אריזת מתנה</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-stone">סכום ביניים</dt>
              <dd className="text-charcoal">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-stone">משלוח</dt>
              <dd className="text-charcoal">{shippingCostText(order.shipping)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-mist pt-3 text-base">
              <dt className="text-charcoal">סה״כ</dt>
              <dd className="text-charcoal">{formatPrice(order.total)}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="shrink-0 text-stone">תשלומים</dt>
              <dd className="text-end leading-relaxed text-charcoal">
                {installmentSummary(order.total, order.installments)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 text-center">
          <Link
            to={ROUTES.catalog}
            className="inline-block rounded-full border border-charcoal px-8 py-3 text-sm tracking-wide transition-colors hover:bg-charcoal hover:text-cream"
          >
            המשך לגלישה
          </Link>
        </div>
      </Container>
    </div>
  );
}
