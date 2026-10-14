import type { StorageAdapter } from '@/services/storage';

export class MemoryStorage implements StorageAdapter {
  readonly values = new Map<string, string>();
  writes = 0;
  failWrites = false;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('Quota exceeded', 'QuotaExceededError');
    this.writes += 1;
    this.values.set(key, value);
  }
}
