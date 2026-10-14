import { describe, expect, it } from 'vitest';
import { createUIStore, UI_STORAGE_KEY } from '@/store/ui-preferences';
import { MemoryStorage } from '@/tests/fixtures/memory-storage';
import { createSeedState, createScenarioState } from '@/data/seed';
import { STORAGE_KEY } from '@/services/storage';
import { selectEnterpriseDashboard, selectGlobalSearch, selectNotifications } from '@/store/selectors/ui';
import { buildCSV, csvCell } from '@/lib/csv';
import { routeRegistry } from '@/routes/registry';

describe('separate versioned UI preferences', () => {
  it('persists sidebar, groups, theme, role and page size without touching business records', () => {
    const storage = new MemoryStorage(); storage.setItem(STORAGE_KEY, 'existing-business-records');
    const store = createUIStore(storage);
    store.getState().updatePreferences({ theme: 'dark', sidebarCollapsed: true, collapsedGroups: ['accounts'], selectedDemoRole: 'production', preferredPageSize: 25 });
    expect(createUIStore(storage).getState().preferences).toMatchObject({ theme: 'dark', sidebarCollapsed: true, collapsedGroups: ['accounts'], selectedDemoRole: 'production', preferredPageSize: 25 });
    expect(storage.getItem(STORAGE_KEY)).toBe('existing-business-records');
  });
  it('preserves malformed preferences until an explicit preference change', () => {
    const storage = new MemoryStorage(); storage.setItem(UI_STORAGE_KEY, '{corrupt');
    const store = createUIStore(storage);
    expect(store.getState().warning).toBeTruthy(); expect(storage.getItem(UI_STORAGE_KEY)).toBe('{corrupt');
    store.getState().updatePreferences({ theme: 'light' }); expect(store.getState().warning).toBeNull();
    expect(createUIStore(storage).getState().preferences.theme).toBe('light');
  });
  it('does not save an invalid preference and reports a storage failure', () => {
    const storage = new MemoryStorage(); const store = createUIStore(storage);
    store.getState().updatePreferences({ preferredPageSize: 7 as 5 }); expect(storage.writes).toBe(0);
    storage.failWrites = true; store.getState().updatePreferences({ theme: 'dark' });
    expect(store.getState().warning).toBeTruthy(); expect(store.getState().preferences.theme).toBe('dark');
  });
  it('keeps the UI form example out of persisted preferences and the domain ledger', () => {
    const storage = new MemoryStorage(); const store = createUIStore(storage);
    store.getState().saveExample({ id: 'ui-example:1', name: 'مثال', quantity: 2, totalPaisa: 50000 });
    store.getState().updatePreferences({ theme: 'light' });
    expect(storage.getItem(UI_STORAGE_KEY)).not.toContain('ui-example'); expect(createUIStore(storage).getState().exampleRecord).toBeNull();
  });
});
describe('real dashboard/search/notification selectors', () => {
  it('derives golden inventory and purchase valuation without fictional sales or profits', () => {
    const summary = selectEnterpriseDashboard(createSeedState());
    expect(summary).toMatchObject({ grey: 600, processed: 380, contractor: 10, loss: 10, finishedSuits: 0, purchaseValuePaisa: 25000000, purchased: 1000 });
    expect(summary.trend).toHaveLength(1); expect(summary.trend[0].value).toBe(25000000);
    expect(summary.recent).toHaveLength(3); expect(summary.contractors[0]).toMatchObject({ held: 10, issued: 400, settled: 390 });
    expect(summary).not.toHaveProperty('salesValuePaisa');
  });
  it('uses changed active data rather than hardcoded golden totals', () => {
    const scenario = selectEnterpriseDashboard(createScenarioState());
    expect(scenario).toMatchObject({ grey: 0, processed: 0, contractor: 0, loss: 0, purchaseValuePaisa: 0 });
    expect(scenario.trend).toEqual([]); expect(scenario.recent).toEqual([]);
  });
  it('finds Urdu records, English fabric descriptions and module paths with valid destinations', () => {
    const seed = createSeedState();
    expect(selectGlobalSearch(seed, 'فیبرک سپلائرز').some((r) => r.type === 'سپلائر')).toBe(true);
    expect(selectGlobalSearch(seed, 'cotton').some((r) => r.type === 'کپڑا')).toBe(true);
    expect(selectGlobalSearch(seed, 'purchases').some((r) => r.path === '/purchases')).toBe(true);
    expect(selectGlobalSearch(seed, 'missing-xyz')).toEqual([]);
    expect(selectGlobalSearch(seed, 'پروسیسنگ').some((r) => r.type === 'ٹھیکیدار')).toBe(true);
  });
  it('only reports a pending processing condition and no fabricated overdue event', () => {
    const notices = selectNotifications(createSeedState());
    expect(notices).toHaveLength(1); expect(notices[0].description).toContain('10');
    expect(notices.some((r) => r.title.includes('تاخیر'))).toBe(false);
    expect(selectNotifications(createScenarioState()).filter((r) => r.tone === 'warning')).toHaveLength(2);
  });
  it('retains all unique Phase 1 paths and adds the showcase/jobs paths', () => {
    expect(new Set(routeRegistry.map((r) => r.path)).size).toBe(routeRegistry.length);
    expect(routeRegistry.some((r) => r.path === '/design-system')).toBe(true);
    expect(routeRegistry.some((r) => r.path === '/processing/challans/:id')).toBe(true);
  });
});
describe('Urdu CSV export integrity', () => {
  it('quotes commas, line breaks and double quotes and adds an Excel Urdu BOM', () => {
    expect(buildCSV(['نام'], [['نور، لاہور'], ['"quoted"'], ['a\nb']])).toBe('\uFEFF"نام"\r\n"نور، لاہور"\r\n"""quoted"""\r\n"a\nb"');
  });
  it.each(['=1+1', '+cmd', '-cmd', '@formula', '  =1', '\ttext'])('neutralizes formula input: %s', (input) => {
    expect(csvCell(input)).toContain("'");
  });
});
