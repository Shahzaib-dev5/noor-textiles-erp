import { beforeAll, afterEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/router';
import { createExpandedSeed } from '@/data/seed/expanded-seed';
import { createSeedState } from '@/data/seed';
import type { DomainState } from '@/domain/entities';
import { useERPStore } from '@/store';
import { useUIStore, defaultPreferences } from '@/store/ui-preferences';
import '@/features/dashboard/DashboardPage';
import '@/features/settings/SettingsPage';
let seed: DomainState;
beforeAll(() => { seed = createExpandedSeed(); });
afterEach(() => useERPStore.setState({ data: createSeedState() }));
async function open(path: string) {
  useERPStore.setState({ data: seed }); useUIStore.getState().updatePreferences(defaultPreferences);
  render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
  await screen.findByRole('heading', { level: 1 });
}
describe('Urdu RTL expanded business dashboard', () => {
  it('renders real financial/stock cards, all required charts and independent reconciliation', async () => {
    await open('/dashboard');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('region', { name: 'کاروباری اشاریے' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'تیار سوٹ کا جسمانی اسٹاک' })).toHaveTextContent('712');
    expect(screen.getByRole('button', { name: 'محفوظ سوٹ' })).toHaveTextContent('70');
    expect(screen.getByRole('heading', { name: 'ماہانہ انوائس شدہ فروخت' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ریکارڈ شدہ اخراجات کی تقسیم' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'مکمل کاروباری مصالحت' })).toBeInTheDocument();
  });
  it('applies scoped filters, rejects an invalid date range, resets without changing the ledger', async () => {
    await open('/dashboard'); const before = JSON.stringify(seed);
    fireEvent.change(screen.getByRole('combobox', { name: 'خریدار' }), { target: { value: Object.keys(seed.customers)[0] } });
    fireEvent.click(screen.getByRole('button', { name: 'فلٹرز لاگو کریں' }));
    expect(screen.getByText(/فعال فلٹرز:/)).toHaveTextContent(Object.values(seed.customers)[0].name);
    expect(screen.getByRole('button', { name: 'تیار سوٹ کا جسمانی اسٹاک' })).toHaveTextContent('712');
    fireEvent.change(screen.getByLabelText('ابتدائی تاریخ'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('آخری تاریخ'), { target: { value: '2026-08-01' } });
    expect(screen.getByRole('button', { name: 'فلٹرز لاگو کریں' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'فلٹرز صاف کریں' }));
    expect(screen.getByText(/فعال فلٹرز:/)).toHaveTextContent('تمام ریکارڈ');
    expect(JSON.stringify(useERPStore.getState().data)).toBe(before);
  });
  it('offers export in the replacement dialog and cancels without mutation', async () => {
    await open('/settings'); const before = JSON.stringify(seed);
    fireEvent.click(screen.getByRole('button', { name: 'مکمل نمونہ ڈیٹا لوڈ کریں' }));
    const dialog = screen.getByRole('dialog', { name: 'مکمل نمونہ لوڈ کریں؟' });
    expect(within(dialog).getByRole('button', { name: 'پہلے JSON نقل برآمد کریں' })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'منسوخ کریں' }));
    expect(dialog).not.toHaveAttribute('open'); expect(JSON.stringify(useERPStore.getState().data)).toBe(before);
  });
});
