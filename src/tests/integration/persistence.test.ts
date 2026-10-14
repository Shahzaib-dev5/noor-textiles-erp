import { describe, expect, it } from 'vitest';
import { createERPStore } from '@/store';
import { createScenarioState, createSeedState, DEMO_IDS } from '@/data/seed';
import { decodeSnapshot, encodeSnapshot, STORAGE_KEY } from '@/services/storage';
import { postGoodsReceipt } from '@/services/transactions';
import { selectDashboard, selectInspector, selectScenarioStep } from '@/store/selectors';
import { MemoryStorage } from '@/tests/fixtures/memory-storage';

function serialize(data = createSeedState()) {
  const result = encodeSnapshot(data);
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

describe('versioned local persistence', () => {
  it('serializes and deserializes a connected golden state without losing precision or IDs', () => {
    const data = createSeedState();
    const decoded = decodeSnapshot(serialize(data));
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value.data).toEqual(data);
  });

  it('seeds once and restores on refresh without re-inserting historical transactions', () => {
    const storage = new MemoryStorage();
    const first = createERPStore(storage);
    const second = createERPStore(storage);
    expect(storage.writes).toBe(1);
    expect(second.getState().data).toEqual(first.getState().data);
    expect(selectDashboard(second.getState().data)).toMatchObject({ grey: 600, processed: 380, contractor: 10, loss: 10 });
  });

  it('persists a transaction as one complete snapshot that survives a new store instance', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, serialize(createScenarioState()));
    const store = createERPStore(storage);
    const writesBefore = storage.writes;
    const result = store.getState().applyTransaction((data) => postGoodsReceipt(data, DEMO_IDS.goodsReceipt, {
      at: '2026-10-13T07:00:00.000Z', actorId: DEMO_IDS.actor,
    }));
    expect(result.ok).toBe(true);
    expect(storage.writes).toBe(writesBefore + 1);
    expect(selectScenarioStep(createERPStore(storage).getState().data)).toBe(1);
    expect(selectDashboard(store.getState().data).grey).toBe(1000);
  });

  it('restores deterministic balances after reset', () => {
    const store = createERPStore(new MemoryStorage());
    expect(store.getState().importDemo(serialize(createScenarioState())).ok).toBe(true);
    expect(selectDashboard(store.getState().data).grey).toBe(0);
    expect(store.getState().resetDemo().ok).toBe(true);
    expect(store.getState().data).toEqual(createSeedState());
  });

  it.each(['{broken', '{}', '{"schemaVersion":99,"revision":0,"data":{}}'])('rejects invalid imports atomically: %s', (raw) => {
    const storage = new MemoryStorage();
    const store = createERPStore(storage);
    const before = store.getState().data;
    const saved = storage.getItem(STORAGE_KEY);
    expect(store.getState().importDemo(raw).ok).toBe(false);
    expect(store.getState().data).toBe(before);
    expect(storage.getItem(STORAGE_KEY)).toBe(saved);
  });

  it('rejects an orphaned supplier reference and inconsistent posted inventory', () => {
    const store = createERPStore(new MemoryStorage());
    const missingSupplier = createSeedState();
    missingSupplier.suppliers = {};
    expect(store.getState().importDemo(JSON.stringify({ schemaVersion: 1, revision: 0, data: missingSupplier })).ok).toBe(false);
    const fabricatedStock = createSeedState();
    const movement = Object.values(fabricatedStock.movements)[0];
    movement.quantityMeters += 1;
    expect(store.getState().importDemo(JSON.stringify({ schemaVersion: 1, revision: 0, data: fabricatedStock })).ok).toBe(false);
  });

  it('keeps corrupt saved data intact until explicit recovery', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{corrupt');
    const store = createERPStore(storage);
    expect(store.getState().storageWarning).toBeTruthy();
    store.getState().setRole('warehouse');
    store.getState().runScenario('goodsReceipt');
    expect(storage.getItem(STORAGE_KEY)).toBe('{corrupt');
    expect(store.getState().applyTransaction((data) => ({ ok: true, state: data })).ok).toBe(false);
    expect(store.getState().resetDemo().ok).toBe(true);
    expect(store.getState().storageWarning).toBeNull();
    expect(decodeSnapshot(storage.getItem(STORAGE_KEY)!).ok).toBe(true);
  });

  it('preserves unsupported versions without silently migrating or resetting', () => {
    const storage = new MemoryStorage();
    const raw = '{"schemaVersion":2,"revision":2,"data":{}}';
    storage.setItem(STORAGE_KEY, raw);
    const store = createERPStore(storage);
    expect(store.getState().storageWarning).toBeTruthy();
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
  });

  it('does not commit in-memory state when a write fails', () => {
    const storage = new MemoryStorage();
    const store = createERPStore(storage);
    const before = store.getState().data;
    const saved = storage.getItem(STORAGE_KEY);
    storage.failWrites = true;
    expect(store.getState().importDemo(serialize(createScenarioState())).ok).toBe(false);
    expect(store.getState().data).toBe(before);
    expect(storage.getItem(STORAGE_KEY)).toBe(saved);
    expect(store.getState().storageWarning).toBeTruthy();
  });

  it('allows an in-memory diagnostics scenario when browser persistence is unavailable', () => {
    const store = createERPStore(null);
    expect(store.getState().storageWarning).toBeTruthy();
    expect(store.getState().runScenario('goodsReceipt').ok).toBe(true);
    expect(store.getState().resetDemo().ok).toBe(false);
    expect(decodeSnapshot(store.getState().exportDemo()).ok).toBe(true);
  });

  it('protects live state even if a future transaction callback mutates its input and then fails', () => {
    const storage = new MemoryStorage();
    const store = createERPStore(storage);
    const before = structuredClone(store.getState().data);
    const saved = storage.getItem(STORAGE_KEY);
    expect(store.getState().applyTransaction((draft) => {
      draft.suppliers = {};
      return { ok: false, error: { code: 'REJECTED', message: 'Rejected' } };
    }).ok).toBe(false);
    expect(store.getState().data).toEqual(before);
    expect(store.getState().applyTransaction((draft) => {
      draft.movements = {};
      throw new Error('Unexpected future callback failure');
    }).ok).toBe(false);
    expect(store.getState().data).toEqual(before);
    expect(storage.getItem(STORAGE_KEY)).toBe(saved);
  });

  it('rejects a detected stale-tab write', () => {
    const storage = new MemoryStorage();
    const tabA = createERPStore(storage);
    const tabB = createERPStore(storage);
    expect(tabA.getState().importDemo(serialize(createScenarioState())).ok).toBe(true);
    const newer = storage.getItem(STORAGE_KEY);
    expect(tabB.getState().resetDemo().ok).toBe(false);
    expect(storage.getItem(STORAGE_KEY)).toBe(newer);
    expect(tabB.getState().storageWarning).toBeTruthy();
  });

  it('never persists transient role, theme or diagnostic actions', () => {
    const storage = new MemoryStorage();
    const store = createERPStore(storage);
    const saved = storage.getItem(STORAGE_KEY);
    store.getState().setRole('accounts');
    store.getState().setTheme('dark');
    store.getState().runScenario('goodsReceipt');
    expect(storage.getItem(STORAGE_KEY)).toBe(saved);
    expect(createERPStore(storage).getState()).toMatchObject({ role: 'owner', theme: 'light' });
  });
});

describe('central selectors and isolated diagnostics', () => {
  it('reconciles the complete golden chain from movement-derived balances', () => {
    const view = selectInspector(createSeedState());
    expect(view).toMatchObject({ purchased: 1000, issued: 400, reconciled: true });
    expect(view.balances).toMatchObject({ supplierCount: 1, lotCount: 1, grey: 600, processed: 380, contractor: 10, loss: 10 });
    expect(view.movements.every((m) => Boolean(m.sourceDocumentId && m.documentNumber))).toBe(true);
  });

  it('walks 0→1→2→3, rejects duplicate/out-of-order actions, then resets the scenario', () => {
    const store = createERPStore(new MemoryStorage());
    const data = store.getState().data;
    expect(store.getState().runScenario('processingReceipt').ok).toBe(false);
    expect(selectScenarioStep(store.getState().scenario)).toBe(0);
    expect(store.getState().runScenario('goodsReceipt').ok).toBe(true);
    expect(selectScenarioStep(store.getState().scenario)).toBe(1);
    const receiptState = store.getState().scenario;
    expect(store.getState().runScenario('goodsReceipt').ok).toBe(false);
    expect(store.getState().scenario).toBe(receiptState);
    expect(store.getState().runScenario('processingIssue').ok).toBe(true);
    expect(selectScenarioStep(store.getState().scenario)).toBe(2);
    expect(store.getState().runScenario('processingReceipt').ok).toBe(true);
    expect(selectScenarioStep(store.getState().scenario)).toBe(3);
    expect(selectInspector(store.getState().scenario)).toMatchObject({ purchased: 1000, issued: 400, reconciled: true });
    expect(store.getState().runScenario('processingReceipt').ok).toBe(false);
    expect(store.getState().data).toBe(data);
    store.getState().resetScenario();
    expect(selectScenarioStep(store.getState().scenario)).toBe(0);
    expect(store.getState().data).toBe(data);
  });
});
