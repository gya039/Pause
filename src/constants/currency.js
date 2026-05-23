export const CURRENCIES = [
  { code: 'GBP', symbol: '£', label: 'GBP £' },
  { code: 'USD', symbol: '$', label: 'USD $' },
  { code: 'EUR', symbol: '€', label: 'EUR €' },
  { code: 'AUD', symbol: 'A$', label: 'AUD A$' },
];

export function getCurrencySymbol(code) {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? '£';
}
