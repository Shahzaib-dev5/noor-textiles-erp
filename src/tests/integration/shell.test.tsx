import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/router';
import { useERPStore } from '@/store';
import { selectDashboard } from '@/store/selectors';
import { formatDate, formatPKR, formatQuantity } from '@/lib/formatters';
// Preload page chunks so the UI wait measures rendering, not Vite's cold module transform.
import '@/features/dashboard/DashboardPage';
import '@/features/diagnostics/DiagnosticsPage';
import '@/features/settings/SettingsPage';

async function renderRoute(path = '/dashboard') {
  const result = render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
  await screen.findByRole('heading', { level: 1 });
  return result;
}

beforeEach(() => {
  useERPStore.getState().resetScenario();
  useERPStore.getState().setTheme('light');
});

describe('Urdu foundation application', () => {
  it('renders an RTL dashboard with live stored balances and navigation', async () => {
    await renderRoute();
    expect(document.documentElement).toHaveAttribute('lang', 'ur');
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { level: 1, name: 'کاروبار، ایک نظر میں' })).toBeInTheDocument();
    const balances = screen.getByRole('region', { name: 'کپڑے کے موجودہ بیلنس' });
    expect(within(balances).getByText('600')).toBeInTheDocument();
    expect(within(balances).getByText('380')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'خریداری زیرِ تعمیر' }));
    expect(screen.getByRole('heading', { name: 'خریداری کا مکمل ماڈیول جلد آئے گا' })).toBeInTheDocument();
    expect(screen.getByText('زیرِ تعمیر · مرحلہ 4')).toBeInTheDocument();
  });

  it('executes the three isolated scenario transactions without changing the dashboard', async () => {
    const original = selectDashboard(useERPStore.getState().data);
    await renderRoute('/diagnostics');
    fireEvent.click(screen.getByRole('button', { name: 'آزمائشی منظرنامہ' }));
    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'لین دین پوسٹ کریں' }));
    }
    expect(screen.getAllByRole('button', { name: 'پوسٹ ہو چکا ہے' })).toHaveLength(3);
    expect(screen.getByText('600 + 380 + 10 + 10 = 1,000 m')).toBeInTheDocument();
    expect(selectDashboard(useERPStore.getState().data)).toEqual(original);
    fireEvent.click(screen.getByRole('button', { name: 'منظرنامہ ری سیٹ کریں' }));
    expect(screen.getByText('0 + 0 + 0 + 0 = 0 m')).toBeInTheDocument();
  });

  it('navigates to reserved detail routes', async () => {
    await renderRoute('/suppliers/example-supplier');
    expect(screen.getByRole('heading', { level: 1, name: 'سپلائرز' })).toBeInTheDocument();
    expect(screen.getByText('example-supplier')).toBeInTheDocument();
  });

  it('requires explicit reset confirmation and identifies roles as demo roles', async () => {
    await renderRoute('/settings');
    expect(screen.getByRole('button', { name: 'اصل ڈیمو ری سیٹ کریں' })).toBeDisabled();
    expect(screen.getByLabelText('ڈیمو کردار')).toHaveValue('owner');
    fireEvent.change(screen.getByLabelText('ڈیمو کردار'), { target: { value: 'warehouse' } });
    expect(useERPStore.getState().role).toBe('warehouse');
    fireEvent.click(screen.getByRole('button', { name: 'تاریک' }));
    expect(document.documentElement).toHaveClass('dark');
  });
});

describe('locale formatting', () => {
  it('formats canonical meters, integer paisa and invalid values safely', () => {
    expect(formatQuantity(1000)).toBe('1,000');
    expect(formatQuantity(0.9144)).toBe('0.9144');
    expect(formatQuantity(Number.NaN)).toBe('—');
    expect(formatPKR(12345)).toMatch(/123[.,]45/);
    expect(formatPKR(12.5)).toBe('—');
    expect(formatDate('2026-10-13T00:00:00.000Z')).not.toBe('—');
    expect(formatDate('2026-10-13')).toBe(formatDate('2026-10-13T00:00:00.000Z'));
    expect(formatDate('not-a-date')).toBe('—');
  });
});
