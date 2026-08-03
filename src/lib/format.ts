/** Price in ILS, Hebrew locale, no decimals (₪1,890). */
const ilsFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return ilsFormatter.format(amount);
}

/** Interest-free installment note used across product surfaces. */
export function installmentNote(amount: number, payments = 3): string {
  return `או ${payments} תשלומים של ${formatPrice(Math.round(amount / payments))} ללא ריבית`;
}
