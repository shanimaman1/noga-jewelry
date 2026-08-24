/** Price in ILS, Hebrew locale, no decimals (₪1,890). */
const ilsFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return ilsFormatter.format(amount);
}

/** Split an integer total exactly, putting any remainder in the first payment. */
export function splitInstallments(amount: number, payments: 1 | 3): number[] {
  if (payments === 1) return [amount];
  const regularPayment = Math.floor(amount / payments);
  const remainder = amount - regularPayment * payments;
  return [regularPayment + remainder, ...Array(payments - 1).fill(regularPayment)];
}

/** Interest-free installment note used across product surfaces. */
export function installmentNote(amount: number): string {
  const [first, second, third] = splitInstallments(amount, 3);
  if (first === second && second === third) {
    return `או 3 תשלומים של ${formatPrice(first)} ללא ריבית`;
  }
  return `או 3 תשלומים ללא ריבית: תשלום ראשון של ${formatPrice(first)} ושני תשלומים של ${formatPrice(second)}`;
}

/** Exact checkout/confirmation wording for the selected payment schedule. */
export function installmentSummary(amount: number, payments: 1 | 3): string {
  const amounts = splitInstallments(amount, payments);
  if (payments === 1) return `תשלום אחד של ${formatPrice(amount)}`;
  const [first, second, third] = amounts;
  if (first === second && second === third) {
    return `3 תשלומים של ${formatPrice(first)}. סה״כ ${formatPrice(amount)}`;
  }
  return `תשלום ראשון של ${formatPrice(first)} ושני תשלומים של ${formatPrice(second)}. סה״כ ${formatPrice(amount)}`;
}
