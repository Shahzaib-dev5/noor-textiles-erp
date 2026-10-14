import { describe, expect, it } from 'vitest';
import { migrateSnapshot } from '@/store/migrations';

describe('explicit schema migration boundary', () => {
  it('passes the current format through and rejects unknown historical/future versions', () => {
    const snapshot = { schemaVersion: 1, data: {} };
    expect(migrateSnapshot(snapshot)).toBe(snapshot);
    expect(() => migrateSnapshot({ schemaVersion: 0 })).toThrow();
    expect(() => migrateSnapshot({ schemaVersion: 2 })).toThrow();
    expect(() => migrateSnapshot({ schemaVersion: 1 }, [], 2)).toThrow();
  });
  it('runs only an explicitly registered sequential migration without mutating input', () => {
    const snapshot = { schemaVersion: 1, data: { name: 'original' } };
    const upgraded = migrateSnapshot(snapshot, [{ fromVersion: 1, toVersion: 2, migrate: (input) => {
      const current = input as typeof snapshot;
      current.data.name = 'migrated';
      return { ...current, schemaVersion: 2 };
    } }], 2);
    expect(upgraded).toEqual({ schemaVersion: 2, data: { name: 'migrated' } });
    expect(snapshot.data.name).toBe('original');
  });
  it('rejects migrations with wrong output versions', () => {
    expect(() => migrateSnapshot({ schemaVersion: 1 }, [{ fromVersion: 1, toVersion: 2, migrate: (input) => input }], 2)).toThrow();
  });
});
