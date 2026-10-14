import { create } from 'zustand';
import type { DomainState } from '@/domain/entities';
import { createScenarioState, createSeedState, DEMO_IDS } from '@/data/seed';
import { issueProcessing, postGoodsReceipt, receiveProcessing } from '@/services/transactions';
import type { TransactionResult } from '@/services/transactions';
import { decodeSnapshot, encodeSnapshot, getBrowserStorage, STORAGE_KEY } from '@/services/storage';
import type { StorageAdapter } from '@/services/storage';
import { useUIStore, resolveTheme, type UIRole } from '@/store/ui-preferences';

export type DemoRole = UIRole;
export type ScenarioAction = 'goodsReceipt' | 'processingIssue' | 'processingReceipt';
export interface ActionResult { ok: boolean; message: string }
export interface ERPStore {
  data: DomainState;
  scenario: DomainState;
  role: DemoRole;
  theme: 'light' | 'dark';
  storageWarning: string | null;
  runScenario: (action: ScenarioAction) => ActionResult;
  resetScenario: () => void;
  resetDemo: () => ActionResult;
  loadExpandedDemo: () => Promise<ActionResult>;
  importDemo: (json: string) => ActionResult;
  exportDemo: () => string;
  setRole: (role: DemoRole) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  applyTransaction: (transaction: (data: DomainState) => TransactionResult) => ActionResult;
}

const unavailableMessage = 'براؤزر میں محفوظ کرنا دستیاب نہیں ہے۔ دکھایا گیا ڈیٹا عارضی ہے؛ برآمد کر کے ایک نقل رکھیں۔';
const corruptMessage = 'محفوظ ڈیٹا پڑھا نہیں جا سکا۔ اصل نقل محفوظ ہے؛ فی الحال نمونہ دکھایا جا رہا ہے۔ ترتیبات سے درست فائل درآمد کریں یا واضح طور پر ری سیٹ کریں۔';

/** One domain snapshot per write. Pure domain code never calls browser APIs. */
export function createERPStore(storage: StorageAdapter | null = getBrowserStorage()) {
  let data = createSeedState();
  let revision = 0;
  let lastRaw: string | null = null;
  let storageWarning: string | null = null;
  let recoveryRequired = false;
  if (!storage) storageWarning = unavailableMessage;
  else {
    try {
      lastRaw = storage.getItem(STORAGE_KEY);
      if (lastRaw === null) {
        const seeded = encodeSnapshot(data);
        if (!seeded.ok) throw new Error(seeded.message);
        storage.setItem(STORAGE_KEY, seeded.value);
        lastRaw = seeded.value;
      } else {
        const restored = decodeSnapshot(lastRaw);
        if (restored.ok) {
          data = restored.value.data;
          revision = restored.value.revision;
        } else { storageWarning = corruptMessage; recoveryRequired = true; }
      }
    } catch { storageWarning = unavailableMessage; recoveryRequired = true; }
  }

  return create<ERPStore>()((set, get) => {
    const persist = (next: DomainState, explicitRecovery = false): ActionResult => {
      if (recoveryRequired && !explicitRecovery) return { ok: false, message: corruptMessage };
      const encoded = encodeSnapshot(next, revision + 1);
      if (!encoded.ok) return encoded;
      if (!storage) return { ok: false, message: unavailableMessage };
      try {
        // Best-effort stale-tab guard, not an atomic cross-tab compare-and-swap.
        if (storage.getItem(STORAGE_KEY) !== lastRaw) {
          const message = 'دوسرے ٹیب میں ڈیٹا بدل گیا ہے۔ تازہ ڈیٹا کے لیے صفحہ دوبارہ کھولیں۔';
          set({ storageWarning: message });
          return { ok: false, message };
        }
        storage.setItem(STORAGE_KEY, encoded.value);
      } catch {
        set({ storageWarning: unavailableMessage });
        return { ok: false, message: unavailableMessage };
      }
      lastRaw = encoded.value;
      revision += 1;
      recoveryRequired = false;
      set({ data: next, storageWarning: null });
      return { ok: true, message: 'ڈیمو ڈیٹا محفوظ ہو گیا۔' };
    };

    return {
      data, scenario: createScenarioState(), role: 'owner', theme: 'light', storageWarning,
      setRole: (role) => set({ role }),
      setTheme: (theme) => set({ theme }),
      runScenario: (action) => {
        const state = get().scenario;
        const context = { at: new Date().toISOString(), actorId: DEMO_IDS.actor };
        const result = action === 'goodsReceipt'
          ? postGoodsReceipt(state, DEMO_IDS.goodsReceipt, context)
          : action === 'processingIssue'
            ? issueProcessing(state, DEMO_IDS.challan, context)
            : receiveProcessing(state, DEMO_IDS.receipt, context);
        if (!result.ok) return { ok: false, message: result.error.message };
        set({ scenario: result.state });
        return { ok: true, message: 'آزمائشی لین دین مکمل ہو گیا؛ مرکزی ریکارڈ محفوظ ہے۔' };
      },
      resetScenario: () => set({ scenario: createScenarioState() }),
      resetDemo: () => persist(createSeedState(), true),
      loadExpandedDemo: async () => {
        try { const { createExpandedSeed } = await import('@/data/seed/expanded-seed'); return persist(createExpandedSeed(), true); }
        catch { return { ok: false, message: 'مکمل نمونہ ڈیٹا کی جانچ یا محفوظ کرنا ناکام ہوا؛ موجودہ ریکارڈ برقرار ہیں۔' }; }
      },
      importDemo: (json) => {
        const imported = decodeSnapshot(json);
        return imported.ok ? persist(imported.value.data, true) : imported;
      },
      exportDemo: () => {
        const exported = encodeSnapshot(get().data, revision);
        if (!exported.ok) throw new Error(exported.message);
        return exported.value;
      },
      applyTransaction: (transaction) => {
        if (recoveryRequired) return { ok: false, message: corruptMessage };
        try {
          // Keep the boundary atomic even if a future callback accidentally mutates its input.
          const result = transaction(structuredClone(get().data));
          return result.ok ? persist(result.state) : { ok: false, message: result.error.message };
        } catch {
          return { ok: false, message: 'لین دین مکمل نہیں ہو سکا۔ موجودہ ریکارڈ تبدیل نہیں کیا گیا۔' };
        }
      },
    };
  });
}

export const useERPStore = createERPStore();

// Preserve the Phase 1 factory's transient defaults; only the live app mirrors UI preferences.
useERPStore.setState({
  role: useUIStore.getState().preferences.selectedDemoRole,
  theme: resolveTheme(useUIStore.getState().preferences.theme),
  setRole: (selectedDemoRole) => useUIStore.getState().updatePreferences({ selectedDemoRole }),
  setTheme: (theme) => useUIStore.getState().updatePreferences({ theme }),
});
useUIStore.subscribe(({ preferences }) => useERPStore.setState({
  role: preferences.selectedDemoRole, theme: resolveTheme(preferences.theme),
}));
