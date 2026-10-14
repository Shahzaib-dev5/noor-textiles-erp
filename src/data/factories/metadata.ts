import type { EntityMeta, EntityStatus } from '@/types/common';

export const SEED_CREATED_AT = '2026-01-01T04:00:00.000Z';
export const SEED_ACTOR_ID = 'employee:owner';
export function seedMetadata<S extends EntityStatus>(id: string, status: S, origin: 'SEED' | 'USER' = 'SEED'): EntityMeta<S> {
  return { id, status, origin, createdAt: SEED_CREATED_AT, updatedAt: SEED_CREATED_AT, createdBy: SEED_ACTOR_ID, updatedBy: SEED_ACTOR_ID };
}
