/** Price in ILS, Hebrew locale, no decimals (₪1,890). */
const ilsFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return ilsFormatter.format(amount);
}

export type InstallmentCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const INSTALLMENT_COUNTS: InstallmentCount[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Split an integer total exactly, putting any remainder in the first payment. */
export function splitInstallments(amount: number, payments: InstallmentCount): number[] {
  if (payments === 1) return [amount];
  const regularPayment = Math.floor(amount / payments);
  const remainder = amount - regularPayment * payments;
  return [regularPayment + remainder, ...Array(payments - 1).fill(regularPayment)];
}

/** Payment option note used across product surfaces. */
export function installmentNote(): string {
  return 'עד 12 תשלומים ללא תוספת תשלום';
}

/** Exact checkout/confirmation wording for the selected payment schedule. */
export function installmentSummary(amount: number, payments: InstallmentCount): string {
  const amounts = splitInstallments(amount, payments);
  if (payments === 1) return `תשלום אחד של ${formatPrice(amount)}. סה״כ ${formatPrice(amount)}`;
  const [first, regular] = amounts;
  if (amounts.every((payment) => payment === first)) {
    return `${payments} תשלומים של ${formatPrice(first)}. סה״כ ${formatPrice(amount)}`;
  }
  if (payments === 2) {
    return `תשלום ראשון של ${formatPrice(first)} ותשלום נוסף של ${formatPrice(regular)}. סה״כ ${formatPrice(amount)}`;
  }
  return `תשלום ראשון של ${formatPrice(first)} ו־${payments - 1} תשלומים של ${formatPrice(regular)}. סה״כ ${formatPrice(amount)}`;
}
