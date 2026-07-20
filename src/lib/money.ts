export function formatMoney(amount: number, currencyCode = 'USD'): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(amount);
}
