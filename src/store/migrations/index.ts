/** Each future migration must validate both its input and its resulting schema. */
export const CURRENT_SCHEMA_VERSION = 1 as const;
export interface SnapshotMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (snapshot: unknown) => unknown;
}

/** Version 1 is the first released format. Unknown formats are never guessed/reset. */
export const migrations: readonly SnapshotMigration[] = [];

/** Registered migrations are sequential and explicit; future/unknown formats fail closed. */
export function migrateSnapshot(
  input: unknown,
  registry: readonly SnapshotMigration[] = migrations,
  targetVersion: number = CURRENT_SCHEMA_VERSION,
): unknown {
  let snapshot = input;
  const seen = new Set<number>();
  while (true) {
    if (snapshot === null || typeof snapshot !== 'object' || !('schemaVersion' in snapshot)) {
      throw new Error('Missing snapshot version');
    }
    const version = snapshot.schemaVersion;
    if (typeof version !== 'number' || !Number.isSafeInteger(version) || version < 1 || version > targetVersion) {
      throw new Error('Unsupported snapshot version');
    }
    if (version === targetVersion) return snapshot;
    if (seen.has(version)) throw new Error('Migration cycle');
    seen.add(version);
    const matching = registry.filter((migration) => migration.fromVersion === version);
    if (matching.length !== 1 || matching[0].toVersion !== version + 1) throw new Error('Missing sequential migration');
    snapshot = matching[0].migrate(structuredClone(snapshot));
    if (snapshot === null || typeof snapshot !== 'object' || !('schemaVersion' in snapshot)
      || snapshot.schemaVersion !== matching[0].toVersion) throw new Error('Migration did not produce its declared version');
  }
}
