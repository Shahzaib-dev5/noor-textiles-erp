import type { Money } from '@/types/common';

export function assertMoney(value: number, allowNegative = false): asserts value is Money {
  if (!Number.isSafeInteger(value) || (!allowNegative && value < 0)) throw new Error('رقم صحیح عدد پیسے میں اور مقررہ حد کے اندر ہونی چاہیے۔');
}
/** Decimal input parsed as digits. Half-paisa rounds away from zero; no binary float multiplication. */
export function rupeesToPaisa(value: string | number): Money {
  const text = String(value).trim();
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw new Error('رقم درست اعشاری صورت میں درج کریں۔');
  const decimals = (match[3] ?? '').padEnd(3, '0');
  let amount = BigInt(match[2]) * 100n + BigInt(decimals.slice(0, 2));
  if (Number(decimals[2]) >= 5) amount += 1n;
  if (match[1]) amount = -amount;
  const result = Number(amount);
  assertMoney(result, true);
  return result;
}
export function multiplyMoney(unitPaisa: Money, quantity: number): Money {
  assertMoney(unitPaisa);
  if (!Number.isFinite(quantity) || quantity < 0 || Math.abs(quantity * 10_000 - Math.round(quantity * 10_000)) > 1e-6) throw new Error('مقدار درست نہیں۔');
  const scaledQuantity = Math.round(quantity * 10_000);
  if (!Number.isSafeInteger(scaledQuantity)) throw new Error('مقدار مقررہ حد سے زیادہ ہے۔');
  const result = Number((BigInt(unitPaisa) * BigInt(scaledQuantity) + 5_000n) / 10_000n);
  assertMoney(result);
  return result;
}
