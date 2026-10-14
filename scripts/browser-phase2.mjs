import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';

const baseURL = process.env.NOOR_BASE_URL ?? 'http://127.0.0.1:5173';
const artifacts = resolve('artifacts/phase2'); await mkdir(artifacts, { recursive: true });
const businessKey = 'noor-textiles-erp-demo-v1'; const uiKey = 'noor-textiles-erp-ui-v1';
const errors = []; let currentPage;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const watch = (page) => {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`); });
};
async function saved(page) { return page.evaluate((key) => localStorage.getItem(key), businessKey); }
async function noOverflow(page, label) { const sizes = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth })); assert.ok(sizes.content <= sizes.viewport, `${label} page overflow: ${JSON.stringify(sizes)}`); }
async function dashboard(page) { await expect(page.getByRole('heading', { level: 1, name: 'کاروباری ڈیش بورڈ' })).toBeVisible(); const stock = page.getByRole('region', { name: 'کپڑے کے موجودہ بیلنس' }); await expect(stock.getByText('600', { exact: true })).toBeVisible(); await expect(stock.getByText('380', { exact: true })).toBeVisible(); }
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage(); currentPage = page; watch(page); await page.goto(`${baseURL}/dashboard`); await dashboard(page);
  const original = await saved(page);
  await page.getByRole('button', { name: 'سائیڈبار سمیٹیں' }).click();
  await expect(page.locator('#erp-sidebar')).toHaveAttribute('data-collapsed', 'true');
  await page.reload(); await dashboard(page); await expect(page.locator('#erp-sidebar')).toHaveAttribute('data-collapsed', 'true');
  await page.getByRole('button', { name: 'سائیڈبار پھیلائیں' }).click();
  await page.getByRole('button', { name: 'حسابات', exact: true }).click(); await page.reload(); await dashboard(page);
  await expect(page.getByRole('button', { name: 'حسابات', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'حسابات', exact: true }).click();
  await page.getByRole('button', { name: 'تاریک تھیم' }).click();
  await page.getByLabel('ڈیمو صارف').click(); await page.getByLabel('ڈیمو کردار').selectOption('production');
  await page.reload(); await dashboard(page); await expect(page.locator('html')).toHaveClass(/dark/);
  await page.getByLabel('ڈیمو صارف').click(); await expect(page.getByLabel('ڈیمو کردار')).toHaveValue('production');
  await page.getByLabel('ڈیمو صارف').click();
  await page.screenshot({ path: resolve(artifacts, 'dashboard-dark-1440.png'), fullPage: true });
  await page.getByRole('button', { name: 'روشن تھیم' }).click();
  await page.keyboard.press('Control+k');
  const search = page.getByRole('dialog', { name: 'عالمی تلاش' }); const searchField = search.getByRole('combobox');
  await expect(searchField).toBeFocused();
  await searchField.fill('فیبرک سپلائرز'); await searchField.press('Enter');
  await expect(page.getByRole('heading', { name: 'موجودہ ماسٹر ریکارڈ کا پیش منظر' })).toBeVisible();
  await page.goto(`${baseURL}/dashboard`); await dashboard(page);
  await page.getByRole('link', { name: 'نئی خریداری دستیاب' }).click();
  await expect(page.getByRole('heading', { name: 'نیا ریکارڈ — خریداری کے آرڈرز' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'محفوظ کریں', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'صفحے کا راستہ' }).getByRole('link', { name: 'ڈیش بورڈ' }).click();
  await dashboard(page);
  await page.getByRole('button', { name: 'اطلاعات (1)' }).click();
  await expect(page.getByRole('dialog', { name: 'موجودہ ڈیمو اطلاعات' }).getByText(/10 میٹر باقی/)).toBeVisible(); await page.keyboard.press('Escape');
  await page.goto(`${baseURL}/design-system?tab=tables`);
  const table = page.getByRole('table', { name: 'اصل ریکارڈ کا جدول' }); await expect(table).toBeVisible();
  await page.getByLabel('فی صفحہ ریکارڈ').selectOption('5');
  await table.getByRole('button', { name: 'حوالہ', exact: true }).click(); await table.getByRole('button', { name: 'حوالہ', exact: true }).click();
  await expect(table.getByRole('row').nth(1)).toContainText('ROLL-010');
  await page.getByRole('button', { name: 'اگلا صفحہ' }).click(); await expect(table.getByRole('row').nth(1)).toContainText('ROLL-005');
  await page.getByLabel('جدول میں تلاش').fill('ROLL-009'); await expect(table.getByRole('row')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'حالت', exact: true }).selectOption('COMPLETED'); await expect(page.getByText('کوئی ریکارڈ نہیں ملا', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'حالت', exact: true }).selectOption('ACTIVE');
  await page.getByRole('checkbox', { name: 'تمام فلٹر شدہ ریکارڈ منتخب کریں' }).check();
  const downloading = page.waitForEvent('download'); await page.getByRole('button', { name: 'منتخب CSV' }).click();
  const download = await downloading; const csvPath = resolve(artifacts, 'roll-export.csv'); await download.saveAs(csvPath);
  const csv = await readFile(csvPath, 'utf8'); assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes('ROLL-009')); assert.ok(!csv.includes('ROLL-008'));
  await page.getByText('کالم', { exact: true }).click(); await page.getByRole('checkbox', { name: 'میٹر / پیمائش', exact: true }).uncheck();
  await expect(table.getByRole('columnheader', { name: 'میٹر / پیمائش' })).toHaveCount(0);
  await page.getByLabel('جدول میں تلاش').fill(''); await page.getByLabel('فی صفحہ ریکارڈ').selectOption('25');
  await page.reload(); await expect(page.getByLabel('فی صفحہ ریکارڈ')).toHaveValue('25');
  await page.screenshot({ path: resolve(artifacts, 'table-1440.png'), fullPage: true });
  await page.goto(`${baseURL}/design-system`); await page.getByRole('button', { name: 'فارم کھولیں' }).click();
  const form = page.getByRole('dialog', { name: 'UI مثال کا فارم' });
  await form.getByRole('button', { name: 'نمونہ محفوظ کریں' }).click(); await expect(form.getByText('کم از کم دو حروف درج کریں۔')).toBeVisible();
  await form.getByLabel(/^نام/).fill('نمونہ'); await form.getByLabel(/^ای میل/).fill('demo@example.test');
  await form.getByLabel(/^فون نمبر/).fill('03000000000'); await form.getByLabel(/^دستاویز کا کوڈ/).fill('UI-001');
  await form.getByLabel(/^تاریخ/).fill('2026-10-14');
  await form.getByRole('combobox', { name: 'موجودہ کپڑا' }).click(); await form.getByRole('combobox', { name: 'موجودہ کپڑا' }).press('Enter');
  await form.getByRole('checkbox', { name: 'یہ صرف UI مثال ہے' }).check();
  await page.screenshot({ path: resolve(artifacts, 'form-1440.png'), fullPage: true });
  await form.getByRole('button', { name: 'نمونہ محفوظ کریں' }).click(); await expect(form).toBeHidden();
  await expect(page.getByText(/محفوظ UI نمونہ: نمونہ/)).toBeVisible();
  await page.getByRole('button', { name: 'UI نمونہ حذف کریں' }).click();
  await page.getByRole('dialog', { name: 'عارضی UI نمونہ حذف کریں؟' }).getByRole('button', { name: 'UI نمونہ حذف کریں' }).click();
  await expect(page.getByRole('button', { name: 'UI نمونہ حذف کریں' })).toBeDisabled();
  await page.getByRole('button', { name: 'فارم کھولیں' }).click();
  await form.getByLabel(/^نام/).fill('غیر محفوظ'); await form.getByRole('button', { name: 'بند کریں' }).click();
  const unsaved = page.getByRole('dialog', { name: 'غیر محفوظ تبدیلیاں' }); await expect(unsaved).toBeVisible();
  await unsaved.getByRole('button', { name: 'تبدیلیاں چھوڑ دیں' }).click(); await expect(form).toBeHidden();
  await page.goto(`${baseURL}/design-system?tab=charts`); await expect(page.getByRole('heading', { name: 'کپڑے کی تقسیم — ڈونٹ' })).toBeVisible();
  await page.screenshot({ path: resolve(artifacts, 'charts-1440.png'), fullPage: true });
  await page.goto(`${baseURL}/design-system?tab=print`); await expect(page.getByText('PO-2026-0001')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.app-header')).toBeHidden(); await expect(page.locator('.print-document')).toBeVisible();
  await page.pdf({ path: resolve(artifacts, 'purchase-order-print.pdf'), format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  assert.equal(await saved(page), original, 'Every Phase 2 UI action must preserve the original business ledger.');
  await context.close();

  for (const width of [375, 768, 1024, 1440]) {
    const responsiveContext = await browser.newContext({ viewport: { width, height: 900 } });
    const responsive = await responsiveContext.newPage(); currentPage = responsive; watch(responsive);
    await responsive.goto(`${baseURL}/dashboard`); await dashboard(responsive); await noOverflow(responsive, `${width} dashboard`);
    await responsive.evaluate(() => document.fonts.ready);
    await responsive.screenshot({ path: resolve(artifacts, `dashboard-${width}.png`), fullPage: true });
    if (width < 1024) {
      const trigger = responsive.getByRole('button', { name: 'مینو کھولیں' }); await trigger.click();
      const nav = responsive.getByRole('dialog', { name: 'مرکزی نیویگیشن' }); await expect(nav).toBeVisible();
      await responsive.keyboard.press('Shift+Tab');
      assert.equal(await responsive.evaluate(() => document.activeElement?.closest('dialog')?.id), 'mobile-navigation', 'Keyboard focus stays in the native drawer.');
      await responsive.keyboard.press('Escape'); await expect(nav).toBeHidden(); await expect(trigger).toBeFocused();
    }
    await responsive.goto(`${baseURL}/design-system?tab=tables`); await expect(responsive.getByRole('table')).toBeVisible(); await noOverflow(responsive, `${width} table`);
    await responsive.goto(`${baseURL}/design-system`); await responsive.getByRole('button', { name: 'فارم کھولیں' }).click();
    await expect(responsive.getByRole('dialog', { name: 'UI مثال کا فارم' })).toBeVisible(); await noOverflow(responsive, `${width} form`);
    await responsive.keyboard.press('Escape');
    const prefs = await responsive.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), uiKey);
    assert.ok(prefs === null || prefs.version === 1);
    await responsiveContext.close();
  }
  assert.deepEqual(errors, []);
  console.log('PASS Phase 2: desktop preferences/reload, keyboard search, quick actions/breadcrumbs, real notifications, table sorting/filtering/pagination/CSV/visibility, isolated form validation/save/delete/unsaved guard, all charts and A4 print; 375/768/1024/1440 viewport overflow checks and mobile focus trapping. Business ledger unchanged.');
} catch (error) {
  if (currentPage && !currentPage.isClosed()) await currentPage.screenshot({ path: resolve(artifacts, 'failure.png'), fullPage: true }).catch(() => undefined);
  console.error('Browser errors:', errors); throw error;
} finally { await browser.close(); }
