import { isValid, parseISO } from 'date-fns';

const numeric = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 4 });
const money = new Intl.NumberFormat('ur-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 2 });
const date = new Intl.DateTimeFormat('ur-PK', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Karachi' });

export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return numeric.format(value);
}

/** Domain money is stored in integer paisa. */
export function formatPKR(paisa: number): string {
  if (!Number.isSafeInteger(paisa)) return '—';
  return money.format(paisa / 100);
}

export function formatDate(value: string): string {
  const parsed = parseISO(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value);
  return isValid(parsed) ? date.format(parsed) : '—';
}
