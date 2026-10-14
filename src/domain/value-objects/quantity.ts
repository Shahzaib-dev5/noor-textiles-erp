import type { FabricUnit, Quantity } from '@/types/common';

export const QUANTITY_SCALE = 10_000;
export const roundQuantity = (value: number): Quantity => {
  const scaled = Math.round(value * QUANTITY_SCALE);
  if (!Number.isSafeInteger(scaled)) throw new Error('کپڑے کی مقدار محفوظ عددی حد سے زیادہ ہے۔');
  return scaled / QUANTITY_SCALE;
};
export function isQuantity(value: unknown, allowZero = true): value is Quantity {
  return typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(Math.round(value * QUANTITY_SCALE))
    && value >= (allowZero ? 0 : 0.0001) && Math.abs(value - roundQuantity(value)) < 1e-9;
}
export function assertQuantity(value: number, allowZero = true): void {
  if (!isQuantity(value, allowZero)) throw new Error('مقدار مثبت اور زیادہ سے زیادہ چار اعشاری ہندسوں میں ہونی چاہیے۔');
}
export function yardsToMeters(yards: number): Quantity { assertQuantity(yards); return roundQuantity(yards * 0.9144); }
export function metersToYards(meters: number): Quantity { assertQuantity(meters); return roundQuantity(meters / 0.9144); }
/** Containers have no fixed conversion factor: each roll/thaan requires an actual measured length. */
export function toMeters(quantity: number, unit: FabricUnit, measuredLengthsMeters?: readonly number[]): Quantity {
  assertQuantity(quantity);
  if (unit === 'METER') return quantity;
  if (unit === 'YARD') return yardsToMeters(quantity);
  if (unit === 'ROLL' || unit === 'THAAN') {
    if (!Number.isSafeInteger(quantity) || measuredLengthsMeters?.length !== quantity) throw new Error('ہر رول یا تھان کی اصل پیمائش درج کریں۔');
    measuredLengthsMeters.forEach((length) => assertQuantity(length, false));
    return roundQuantity(measuredLengthsMeters.reduce((sum, length) => sum + length, 0));
  }
  throw new Error('پیس، سوٹ اور کارٹن کو کپڑے کی لمبائی میں تبدیل نہیں کیا جا سکتا۔');
}
