import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/router';
import { useERPStore } from '@/store';
import { useUIStore, defaultPreferences, UI_STORAGE_KEY } from '@/store/ui-preferences';
import { selectDashboard } from '@/store/selectors';
import { useToast } from '@/store/toasts';
import { DataTable, type TableColumn } from '@/components/tables/DataTable';
import '@/features/design-system/DesignSystemPage';
import '@/features/dashboard/DashboardPage';
import '@/features/diagnostics/DiagnosticsPage';
import '@/features/settings/SettingsPage';

beforeEach(() => {
  useUIStore.getState().updatePreferences({ ...defaultPreferences, theme: 'light' });
  useUIStore.getState().saveExample(null); useToast.setState({ items: [] });
});
async function openRoute(path = '/dashboard') {
  render(<MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter>);
  await screen.findByRole('heading', { level: 1 });
}
describe('Phase 2 shell and protected business state', () => {
  it('persists collapsed sidebar and group states while preserving the golden inventory', async () => {
    const before = JSON.stringify(useERPStore.getState().data); await openRoute();
    fireEvent.click(screen.getByRole('button', { name: 'سائیڈبار سمیٹیں' }));
    expect(screen.getByLabelText('مرکزی سائیڈبار')).toHaveAttribute('data-collapsed', 'true');
    expect(JSON.parse(localStorage.getItem(UI_STORAGE_KEY)!).preferences.sidebarCollapsed).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'سائیڈبار پھیلائیں' }));
    const group = screen.getByRole('button', { name: 'حسابات' }); fireEvent.click(group);
    expect(group).toHaveAttribute('aria-expanded', 'false');
    expect(JSON.stringify(useERPStore.getState().data)).toBe(before);
  });
  it('opens mobile navigation, navigates, and closes through the drawer', async () => {
    await openRoute(); fireEvent.click(screen.getByRole('button', { name: 'مینو کھولیں' }));
    const drawer = screen.getByRole('dialog', { name: 'مرکزی نیویگیشن' });
    expect(drawer).toHaveAttribute('open'); fireEvent.click(within(drawer).getByRole('link', { name: 'خریداری' }));
    expect(drawer).not.toHaveAttribute('open'); expect(await screen.findByRole('heading', { name: 'خریداری کا ڈیش بورڈ', level: 1 })).toBeInTheDocument();
  });
  it('supports Ctrl+K keyboard search, empty results and record result navigation', async () => {
    await openRoute(); fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    const dialog = screen.getByRole('dialog', { name: 'عالمی تلاش' }); const input = within(dialog).getByRole('combobox'); expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'not-found-xxx' } }); expect(within(dialog).getByText('کوئی نتیجہ نہیں ملا')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'فیبرک سپلائرز' } }); fireEvent.keyDown(input, { key: 'Enter' });
    expect(dialog).not.toHaveAttribute('open'); expect(await screen.findByText('موجودہ ماسٹر ریکارڈ کا پیش منظر')).toBeInTheDocument();
  });
  it('persists theme and six demo roles without changing inventory', async () => {
    const before = selectDashboard(useERPStore.getState().data); await openRoute('/settings');
    fireEvent.click(screen.getByRole('button', { name: 'تاریک' })); expect(document.documentElement).toHaveClass('dark');
    fireEvent.click(screen.getByLabelText('ڈیمو صارف'));
    const roles = screen.getByLabelText('ڈیمو کردار'); expect(within(roles).getAllByRole('option')).toHaveLength(6);
    fireEvent.change(roles, { target: { value: 'sales' } });
    expect(JSON.parse(localStorage.getItem(UI_STORAGE_KEY)!).preferences).toMatchObject({ theme: 'dark', selectedDemoRole: 'sales' });
    expect(selectDashboard(useERPStore.getState().data)).toEqual(before);
  });
  it('shows notifications derived from pending contractor-held quantity', async () => {
    await openRoute(); fireEvent.click(screen.getByRole('button', { name: 'اطلاعات (1)' }));
    const drawer = screen.getByRole('dialog', { name: 'موجودہ ڈیمو اطلاعات' });
    expect(within(drawer).getByText(/10 میٹر باقی/)).toBeInTheDocument();
    fireEvent(within(drawer).getByRole('button', { name: 'بند کریں' }), new MouseEvent('click', { bubbles: true }));
    expect(drawer).not.toHaveAttribute('open');
  });
  it('requires an actual reset confirmation dialog and lets the user cancel safely', async () => {
    const before = JSON.stringify(useERPStore.getState().data); await openRoute('/settings');
    fireEvent.click(screen.getByRole('checkbox', { name: 'میں موجودہ ڈیمو ڈیٹا تبدیل کر کے ابتدائی ریکارڈ بحال کرنا چاہتا ہوں۔' }));
    fireEvent.click(screen.getByRole('button', { name: 'اصل ڈیمو ری سیٹ کریں' }));
    const dialog = screen.getByRole('dialog', { name: 'اصل ڈیمو بحال کریں؟' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'منسوخ کریں' }));
    expect(dialog).not.toHaveAttribute('open'); expect(JSON.stringify(useERPStore.getState().data)).toBe(before);
  });
});
describe('interactive component showcase', () => {
  it('validates and saves a UI-only form, displays feedback and keeps inventory unchanged', async () => {
    const before = JSON.stringify(useERPStore.getState().data); const user = userEvent.setup();
    await openRoute('/design-system'); await user.click(screen.getByRole('button', { name: 'فارم کھولیں' }));
    const dialog = screen.getByRole('dialog', { name: 'UI مثال کا فارم' });
    await user.click(within(dialog).getByRole('button', { name: 'نمونہ محفوظ کریں' }));
    expect(await within(dialog).findByText('کم از کم دو حروف درج کریں۔')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^نام/), 'نمونہ');
    await user.type(within(dialog).getByLabelText(/^ای میل/), 'demo@example.test');
    await user.type(within(dialog).getByLabelText(/^فون نمبر/), '03000000000');
    await user.type(within(dialog).getByLabelText(/^دستاویز کا کوڈ/), 'UI-001');
    fireEvent.change(within(dialog).getByLabelText(/^تاریخ/), { target: { value: '2026-10-14' } });
    await user.click(within(dialog).getByRole('combobox', { name: 'موجودہ کپڑا' }));
    await user.click(within(dialog).getByRole('option', { name: 'کاٹن لان' }));
    await user.click(within(dialog).getByRole('checkbox', { name: 'یہ صرف UI مثال ہے' }));
    await user.click(within(dialog).getByRole('button', { name: 'نمونہ محفوظ کریں' }));
    expect(useUIStore.getState().exampleRecord).toMatchObject({ id: 'ui-example:1', name: 'نمونہ', quantity: 1, totalPaisa: 25000 });
    expect(JSON.stringify(useERPStore.getState().data)).toBe(before);
    expect(useToast.getState().items.some((item) => item.message.includes('محفوظ ہوا'))).toBe(true);
  });
  it('protects dirty form changes and supports confirmed discard', async () => {
    await openRoute('/design-system'); fireEvent.click(screen.getByRole('button', { name: 'فارم کھولیں' }));
    const dialog = screen.getByRole('dialog', { name: 'UI مثال کا فارم' });
    fireEvent.change(within(dialog).getByLabelText(/^نام/), { target: { value: 'نام' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'بند کریں' }));
    const confirmation = screen.getByRole('dialog', { name: 'غیر محفوظ تبدیلیاں' });
    fireEvent.click(within(confirmation).getByRole('button', { name: 'تبدیلیاں چھوڑ دیں' }));
    expect(dialog).not.toHaveAttribute('open');
  });
  it('opens the actual records table and print foundation through tabs', async () => {
    await openRoute('/design-system'); fireEvent.click(screen.getByRole('tab', { name: 'جدول اور فلٹر' }));
    expect(screen.getByRole('table', { name: 'اصل ریکارڈ کا جدول' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'طباعت کا نمونہ' }));
    expect(screen.getByText('PO-2026-0001')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'طباعت کریں' })).toBeInTheDocument();
  });
});

interface Row { id: string; name: string; quantity: number; status: string }
const tableRows: Row[] = Array.from({ length: 9 }, (_, i) => ({ id: `row-${i + 1}`, name: `نام ${i + 1}`, quantity: 9 - i, status: i < 5 ? 'ACTIVE' : 'INACTIVE' }));
const tableColumns: TableColumn<Row>[] = [{ id: 'name', label: 'نام', value: (r) => r.name }, { id: 'quantity', label: 'مقدار', value: (r) => r.quantity }];
function renderTable() { return render(<DataTable title="ٹیسٹ جدول" rows={tableRows} columns={tableColumns} rowId={(r) => r.id} initialPageSize={5} filters={[{ id: 'status', label: 'حالت', options: [{ label: 'فعال', value: 'ACTIVE' }], matches: (r, value) => r.status === value }]} />); }
describe('generic table behavior', () => {
  it('sorts numbers, paginates, searches, filters and controls visible columns', () => {
    const original = JSON.stringify(tableRows); renderTable();
    const table = screen.getByRole('table'); expect(within(table).getAllByRole('row')).toHaveLength(6);
    fireEvent.click(screen.getByRole('button', { name: 'مقدار' })); expect(within(table).getAllByRole('row')[1]).toHaveTextContent('نام 9');
    fireEvent.click(screen.getByRole('button', { name: 'اگلا صفحہ' })); expect(within(table).getAllByRole('row')).toHaveLength(5);
    fireEvent.change(screen.getByLabelText('جدول میں تلاش'), { target: { value: 'نام 1' } }); expect(within(table).getAllByRole('row')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('جدول میں تلاش'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('حالت'), { target: { value: 'ACTIVE' } }); expect(within(table).getAllByRole('row')).toHaveLength(6);
    fireEvent.click(screen.getByText('کالم', { selector: 'summary' })); fireEvent.click(screen.getByRole('checkbox', { name: 'مقدار' }));
    expect(within(table).queryByRole('button', { name: 'مقدار' })).not.toBeInTheDocument(); expect(JSON.stringify(tableRows)).toBe(original);
  });
  it('bulk-selects only filtered records and exports with a real download action', () => {
    const download = vi.fn(() => 'blob:csv'); vi.stubGlobal('URL', { createObjectURL: download, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderTable(); fireEvent.change(screen.getByLabelText('حالت'), { target: { value: 'ACTIVE' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'تمام فلٹر شدہ ریکارڈ منتخب کریں' }));
    expect(screen.getByText('5 ریکارڈ منتخب')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'منتخب CSV' })); expect(download).toHaveBeenCalledOnce(); expect(click).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
