import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';

const baseURL = process.env.NOOR_BASE_URL ?? 'http://127.0.0.1:5173';
const artifacts = resolve('artifacts/phase4');
await mkdir(artifacts, { recursive: true });
const key = 'noor-textiles-erp-demo-v1', uiKey = 'noor-textiles-erp-ui-v1';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
let page;
const watch = (p) => { p.on('dialog', (dialog) => dialog.accept()); p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); };
const state = async () => JSON.parse(await page.evaluate((k) => localStorage.getItem(k), key)).data;
const go = async (path) => { await page.goto(baseURL + path); await page.getByRole('heading', { level: 1 }).waitFor(); };
const fill = async (label, value) => page.getByLabel(new RegExp('^' + label + '(?:\\*|لازمی)?$')).fill(String(value));
const save = async () => { await page.getByRole('button', { name: 'محفوظ کریں', exact: true }).click(); await expect(page.locator('form')).toHaveCount(0); };
const action = async (label, p = page) => { await p.getByRole('button', { name: label, exact: true }).click(); await p.getByRole('dialog', { name: 'خریداری کارروائی کی تصدیق' }).getByRole('button', { name: 'تصدیق کریں', exact: true }).click(); };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page = await context.newPage(); watch(page);
  await go('/suppliers/new');
  const original = await state();
  await fill('سپلائر کا نام', 'براؤزر ٹیسٹ سپلائر'); await fill('سپلائر کوڈ', 'SUP-BROWSER');
  await fill('شہر', 'لاہور'); await fill('رابطہ شخص', 'علی'); await fill('فون نمبر', '03001234567');
  await fill('پتہ', 'اعظم کلاتھ مارکیٹ'); await fill('سپلائر / کپڑے کی کیٹیگری', 'لان'); await save();
  let s = await state(); const supplierId = Object.values(s.suppliers).find((r) => r.name === 'براؤزر ٹیسٹ سپلائر').id;
  await go('/fabrics/new'); await fill('کپڑے کا نام', 'براؤزر ٹیسٹ لان'); await fill('کپڑے کا کوڈ', 'FAB-BROWSER');
  await fill('ترکیب', 'کاٹن'); await fill('کپڑے کی کیٹیگری', 'لان'); await fill('چوڑائی', 58);
  await page.locator('#proc-supplierId').selectOption(supplierId); await fill('فی میٹر خریداری قیمت — روپے', 250); await save();
  s = await state(); const fabricId = Object.values(s.fabrics).find((r) => r.name === 'براؤزر ٹیسٹ لان').id;
  assert.deepEqual(s.movements, original.movements, 'Master creation does not create stock');
  await go('/purchases/new'); await page.locator('#proc-supplierId').selectOption(supplierId);
  await page.getByLabel('کپڑا', { exact: true }).selectOption(fabricId); await fill('مقدار', 1000); await fill('فی میٹر قیمت — روپے', 250); await save();
  s = await state(); const po = Object.values(s.purchaseOrders).find((r) => r.origin === 'USER');
  await action('آرڈر منظور کریں');
  async function draftReceipt(meters, label) {
    await go('/purchases/receipts/new?po=' + encodeURIComponent(po.id));
    await fill('سپلائر چالان حوالہ', 'CH-' + label); await fill('رول نمبر', label); await fill('پیمائش', meters); await save();
    return Object.values((await state()).goodsReceipts).find((r) => r.origin === 'USER' && r.status === 'DRAFT');
  }
  const first = await draftReceipt(400, 'ROLL-A');
  assert.deepEqual((await state()).movements, original.movements, 'Draft GRN creates no inventory movements');
  const stale = await context.newPage(); watch(stale); await stale.goto(page.url());
  await stale.getByRole('button', { name: 'مال وصولی پوسٹ کریں', exact: true }).click();
  await action('مال وصولی پوسٹ کریں');
  const count = Object.keys((await state()).movements).length;
  await stale.getByRole('dialog').getByRole('button', { name: 'تصدیق کریں', exact: true }).click();
  assert.equal(Object.keys(JSON.parse(await stale.evaluate((k) => localStorage.getItem(k), key)).data.movements).length, count, 'Stale duplicate posting creates no extra movement');
  await expect(stale.getByRole('alert').first()).toBeVisible(); await stale.close();
  const second = await draftReceipt(350, 'ROLL-B'); await action('مال وصولی پوسٹ کریں');
  s = await state();
  assert.equal(s.purchaseOrders[po.id].status, 'PARTIALLY_RECEIVED');
  const received = Object.values(s.goodsReceiptLines).filter((r) => r.purchaseOrderLineId === po.lineIds[0]).reduce((sum, r) => sum + r.quantityMeters, 0);
  assert.equal(received, 750); assert.equal(s.purchaseOrderLines[po.lineIds[0]].quantityMeters - received, 250);
  await go('/purchases/receipts/new?po=' + encodeURIComponent(po.id)); await fill('سپلائر چالان حوالہ', 'OVER'); await fill('رول نمبر', 'OVER'); await fill('پیمائش', 251);
  const beforeOver = await page.evaluate((k) => localStorage.getItem(k), key);
  await page.getByRole('button', { name: 'محفوظ کریں', exact: true }).click(); await expect(page.getByRole('alert').first()).toBeVisible();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), beforeOver);
  await go('/purchases/bills/new?grn=' + encodeURIComponent(first.id)); await fill('سپلائر انوائس حوالہ', 'INV-BROWSER'); await save();
  const bill = Object.values((await state()).procurement.bills)[0]; assert.equal(bill.totalPaisa, 10000000);
  await action('سپلائر بل پوسٹ کریں'); await page.getByRole('link', { name: 'اس بل کی ادائیگی', exact: true }).click();
  await fill('ادائیگی حوالہ', 'PAY-BROWSER'); await fill('ادائیگی کی رقم — روپے', 31000); await fill('مختص رقم — روپے', 30000); await save();
  await action('سپلائر ادائیگی پوسٹ کریں');
  s = await state(); const payment = Object.values(s.procurement.payments)[0];
  assert.equal(payment.amountPaisa - payment.allocations.reduce((sum, a) => sum + a.amountPaisa, 0), 100000);
  const receiptLineId = s.goodsReceipts[first.id].lineIds[0];
  await go('/purchases/returns/new?line=' + encodeURIComponent(receiptLineId));
  await fill('واپسی کی مقدار — میٹر', 50); await fill('واپسی کی وجہ', 'معیار کی واپسی'); await fill('مال کی حالت', 'غیر استعمال شدہ'); await save();
  await action('واپسی منظور کریں'); await action('واپسی پوسٹ کریں');
  s = await state(); const returned = Object.values(s.procurement.returns)[0];
  assert.equal(returned.creditPaisa, 1250000); assert.equal(bill.totalPaisa - payment.allocations[0].amountPaisa - returned.creditPaisa, 5750000);
  const lotId = s.goodsReceiptLines[receiptLineId].lotId;
  assert.equal(Object.values(s.movements).filter((m) => m.lotId === lotId && m.category === 'GREY').reduce((sum, m) => sum + m.quantityMeters, 0), 350);
  assert.deepEqual(s.history, original.history); assert.equal(s.goodsReceipts[first.id].status, 'POSTED');
  await go('/suppliers/' + encodeURIComponent(supplierId) + '/ledger');
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: /CSV/ }).click(); await (await download).saveAs(resolve(artifacts, 'supplier-ledger.csv'));
  const ledgerCSV = await readFile(resolve(artifacts, 'supplier-ledger.csv'), 'utf8');
  assert.ok(ledgerCSV.includes('"100000.00"') && ledgerCSV.includes('"57500.00"'), 'Ledger CSV money is rupees, matching its headings');
  await go('/purchases/' + encodeURIComponent(po.id)); await page.getByRole('button', { name: 'پرنٹ پیش منظر', exact: true }).click();
  await expect(page.locator('.print-document')).toContainText(po.number); await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.app-header').evaluate((e) => getComputedStyle(e).display), 'none');
  await page.pdf({ path: resolve(artifacts, 'purchase-order.pdf'), format: 'A4', preferCSSPageSize: true });
  await page.emulateMedia({ media: 'screen' }); await page.keyboard.press('Escape');
  const snapshot = await page.evaluate((k) => localStorage.getItem(k), key), preferences = await page.evaluate((k) => localStorage.getItem(k), uiKey);
  await page.reload(); await page.getByRole('heading', { level: 1 }).waitFor();
  assert.equal(await page.evaluate((k) => localStorage.getItem(k), key), snapshot); assert.equal(await page.evaluate((k) => localStorage.getItem(k), uiKey), preferences);
  for (const document of [po, first, bill]) {
    await page.getByRole('button', { name: 'عالمی تلاش کھولیں' }).click();
    const search = page.getByRole('dialog', { name: 'عالمی تلاش', exact: true });
    await search.getByRole('combobox').fill(document.number);
    await search.getByRole('option').first().getByRole('button').click();
    await expect(page.locator('main')).toContainText(document.number);
  }
  await writeFile(resolve(artifacts, 'posted-snapshot.json'), snapshot, 'utf8');
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    for (const theme of ['تاریک', 'روشن']) {
      await page.getByRole('button', { name: theme + ' تھیم', exact: true }).click();
      for (const path of ['/suppliers', '/purchases/new', '/purchases/receipts/' + encodeURIComponent(second.id), '/purchases/reports']) {
        console.log(`Checking ${width} ${theme} ${path}`);
        await go(path); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow: ${width}, ${theme}, ${path}`);
      }
      await page.screenshot({ path: resolve(artifacts, `reports-${width}-${theme === 'روشن' ? 'light' : 'dark'}.png`), fullPage: true });
    }
  }
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl'); assert.deepEqual(errors, []);
  console.log('PASS Phase 4: supplier/fabric creation, PO approval, measured draft/post receipts, 400+350/250 remaining, stale duplicate/over-receipt rejection, bill, partial payment/advance, return/credit/stock, ledger CSV, A4 PDF, persistence, Urdu RTL, 375/768/1024/1440 light/dark layouts.');
  await context.close();
} catch (error) {
  if (page && !page.isClosed()) await page.screenshot({ path: resolve(artifacts, 'failure.png'), fullPage: true }).catch(() => {});
  console.error('Browser errors:', errors); throw error;
} finally { await browser.close(); }
