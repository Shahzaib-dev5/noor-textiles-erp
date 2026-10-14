import { z } from 'zod';
import type { DomainState } from '@/domain/entities';
import { validateDomainState } from '@/domain/validators/state';
import { CURRENT_SCHEMA_VERSION, migrateSnapshot } from '@/store/migrations';

export const STORAGE_KEY = 'noor-textiles-erp-demo-v1';
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface Snapshot {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION;
  revision: number;
  data: DomainState;
}
export type StorageResult<T> = { ok: true; value: T } | { ok: false; message: string };

const envelopeSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  data: z.unknown(),
}).strict();

export function decodeSnapshot(raw: string): StorageResult<Snapshot> {
  if (new Blob([raw]).size > MAX_IMPORT_BYTES) {
    return { ok: false, message: 'ڈیمو فائل ۵ میگا بائٹ سے زیادہ نہیں ہو سکتی۔' };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    const envelope = envelopeSchema.safeParse(migrateSnapshot(parsed));
    if (!envelope.success) return { ok: false, message: 'محفوظ ڈیٹا کا ورژن یا ساخت درست نہیں ہے۔ اصل ڈیٹا تبدیل نہیں کیا گیا۔' };
    const validated = validateDomainState(envelope.data.data);
    if (!validated.ok) return { ok: false, message: 'ڈیٹا کے ریکارڈ، تعلقات یا اسٹاک کا حساب درست نہیں ہے۔ اصل ڈیٹا تبدیل نہیں کیا گیا۔' };
    return { ok: true, value: { ...envelope.data, data: validated.state } };
  } catch {
    return { ok: false, message: 'JSON فائل درست نہیں ہے۔ اصل ڈیٹا تبدیل نہیں کیا گیا۔' };
  }
}

export function encodeSnapshot(data: DomainState, revision = 0): StorageResult<string> {
  if (!Number.isSafeInteger(revision) || revision < 0) return { ok: false, message: 'ڈیٹا ورژن کی گنتی درست نہیں ہے۔' };
  const validated = validateDomainState(data);
  if (!validated.ok) return { ok: false, message: 'اسٹاک یا ریکارڈ کی جانچ ناکام ہوئی؛ تبدیلی محفوظ نہیں کی گئی۔' };
  const raw = JSON.stringify({ schemaVersion: CURRENT_SCHEMA_VERSION, revision, data: validated.state });
  if (new Blob([raw]).size > MAX_IMPORT_BYTES) return { ok: false, message: 'ڈیمو ڈیٹا ۵ میگا بائٹ سے زیادہ نہیں ہو سکتا۔' };
  return { ok: true, value: raw };
}

export function getBrowserStorage(): StorageAdapter | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { return null; }
}
