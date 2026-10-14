import { beforeAll, describe, expect, it } from 'vitest';
import type { DomainState } from '@/domain/entities';
import { createExpandedSeed } from '@/data/seed/expanded-seed';
import { createSeedState } from '@/data/seed';
import { validateDomainState } from '@/domain/validators/state';
import { inspectHistory } from '@/services/validation/history';
import { getReconciliation } from '@/services/inventory';
let seed: DomainState;
beforeAll(() => { seed = createExpandedSeed(); });
describe('expanded history foundation', () => {
  it('generates valid connected historical data and conserves material', () => {
    expect(inspectHistory(seed)).toEqual([]);
    expect(validateDomainState(seed).ok).toBe(true);
    expect(getReconciliation(seed).balanced).toBe(true);
  });
  it('is reproducible without mutating the golden fixture', () => {
    expect(createExpandedSeed()).toEqual(seed);
    expect(getReconciliation(createSeedState())).toMatchObject({ grey: 600, processed: 380, contractor: 10, loss: 10, finished: 0 });
  });
  it('meets the requested counts', () => {
    for (const [key, count] of Object.entries({ companies: 1, employees: 6, suppliers: 12, contractors: 8, customers: 20, fabrics: 12, purchaseOrders: 20, goodsReceipts: 20, challans: 18, designs: 30, finishedSKUs: 30 })) expect(Object.keys(seed[key as keyof Omit<DomainState, 'history' | 'procurement' | 'warehouse'>])).toHaveLength(count);
    expect(Object.keys(seed.rolls)).toHaveLength(800);
    for (const [key, count] of Object.entries({ collections: 4, batches: 10, salesOrders: 30, invoices: 20, payments: 30 })) expect(Object.keys(seed.history![key as 'collections'])).toHaveLength(count);
  });
});
