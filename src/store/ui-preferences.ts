import { create } from 'zustand';
import { z } from 'zod';
import { getBrowserStorage, type StorageAdapter } from '@/services/storage';

export const UI_STORAGE_KEY = 'noor-textiles-erp-ui-v1';
export const demoRoleLabels = {
  owner: 'منتظم', purchase: 'خریداری مینیجر', warehouse: 'گودام مینیجر',
  production: 'پیداوار مینیجر', sales: 'فروخت مینیجر', accounts: 'اکاؤنٹنٹ',
} as const;
export type UIRole = keyof typeof demoRoleLabels;
export type ThemePreference = 'light' | 'dark' | 'system';
const preferenceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']), sidebarCollapsed: z.boolean(),
  preferredPageSize: z.union([z.literal(5), z.literal(10), z.literal(25), z.literal(50)]),
  selectedDemoRole: z.enum(['owner', 'purchase', 'warehouse', 'production', 'sales', 'accounts']),
  collapsedGroups: z.array(z.string().max(50)),
}).strict();
const envelopeSchema = z.object({ version: z.literal(1), preferences: preferenceSchema }).strict();
export type UIPreferences = z.infer<typeof preferenceSchema>;
export const defaultPreferences: UIPreferences = {
  theme: 'system', sidebarCollapsed: false, preferredPageSize: 10, selectedDemoRole: 'owner', collapsedGroups: [],
};
export function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  return theme === 'system' ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
}
export interface UIStore {
  exampleRecord: { id: 'ui-example:1'; name: string; quantity: number; totalPaisa: number } | null;
  saveExample: (record: { id: 'ui-example:1'; name: string; quantity: number; totalPaisa: number } | null) => void;
  preferences: UIPreferences;
  warning: string | null;
  updatePreferences: (patch: Partial<UIPreferences>) => void;
}
export function createUIStore(storage: StorageAdapter | null = getBrowserStorage()) {
  let preferences: UIPreferences = { ...defaultPreferences, collapsedGroups: [] };
  let warning: string | null = null;
  try {
    const raw = storage?.getItem(UI_STORAGE_KEY);
    if (raw) {
      const parsed = envelopeSchema.safeParse(JSON.parse(raw));
      if (parsed.success) preferences = parsed.data.preferences;
      else warning = 'ظاہری ترجیحات درست نہیں ہیں؛ کاروباری ڈیٹا محفوظ ہے۔ نئی ترجیح منتخب کر کے بحال کریں۔';
    }
  } catch { warning = 'ظاہری ترجیحات پڑھی نہیں جا سکیں؛ کاروباری ڈیٹا محفوظ ہے۔'; }
  return create<UIStore>()((set, get) => ({
    preferences, warning, exampleRecord: null, saveExample: (exampleRecord) => set({ exampleRecord }),
    updatePreferences: (patch) => {
      const next = preferenceSchema.safeParse({ ...get().preferences, ...patch });
      if (!next.success) return;
      let warning: string | null = null;
      try {
        if (!storage) throw new Error('Unavailable');
        storage.setItem(UI_STORAGE_KEY, JSON.stringify({ version: 1, preferences: next.data }));
      } catch { warning = 'ظاہری ترجیحات اس براؤزر میں محفوظ نہیں ہو سکیں۔'; }
      set({ preferences: next.data, warning });
    },
  }));
}
export const useUIStore = createUIStore();
