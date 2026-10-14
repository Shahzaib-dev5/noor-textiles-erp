import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';

const baseURL = process.env.NOOR_BASE_URL ?? 'http://127.0.0.1:5173';
const artifacts = resolve('artifacts');
const storageKey = 'noor-textiles-erp-demo-v1';
const errors = [];
let currentPage;
await mkdir(artifacts, { recursive: true });

function recordErrors(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`);
  });
}

async function storedSnapshot(page) {
  return page.evaluate((key) => localStorage.getItem(key), storageKey);
}

async function checkDashboard(page) {
  await expect(page.getByRole('heading', { name: 'کاروباری ڈیش بورڈ', exact: true })).toBeVisible();
  const stock = page.getByRole('region', { name: 'کپڑے کے موجودہ بیلنس' });
  await expect(stock.getByText('600', { exact: true })).toBeVisible();
  await expect(stock.getByText('380', { exact: true })).toBeVisible();
  await expect(stock.getByText('10', { exact: true })).toHaveCount(1);
  await expect(page.locator('p').filter({ hasText: 'تسلیم شدہ نقصان:' })).toContainText('10');
  assert.equal(await page.locator('html').getAttribute('dir'), 'rtl');
  assert.equal(await page.locator('html').getAttribute('lang'), 'ur');
}

const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1050 }, acceptDownloads: true });
  const page = await desktop.newPage();
  currentPage = page;
  recordErrors(page);
  await page.goto(`${baseURL}/dashboard`);
  await checkDashboard(page);
  await page.evaluate(() => document.fonts.ready);
  const initialSnapshot = await storedSnapshot(page);
  assert.ok(initialSnapshot, 'The fresh browser must have one persisted seed snapshot.');
  await page.reload();
  await checkDashboard(page);
  assert.equal(await storedSnapshot(page), initialSnapshot, 'Reload must not seed again or mutate persisted data.');
  await page.screenshot({ path: resolve(artifacts, 'dashboard-desktop.png'), fullPage: true });

  await page.locator('#erp-sidebar').getByRole('link', { name: 'انوینٹری جانچ', exact: true }).click();
  await page.getByRole('button', { name: 'آزمائشی منظرنامہ', exact: true }).click();
  for (let index = 0; index < 3; index += 1) {
    await page.getByRole('button', { name: 'لین دین پوسٹ کریں', exact: true }).click();
    await expect(page.getByRole('button', { name: 'پوسٹ ہو چکا ہے', exact: true })).toHaveCount(index + 1);
  }
  await expect(page.getByRole('button', { name: 'پوسٹ ہو چکا ہے', exact: true })).toHaveCount(3);
  await expect(page.getByText('600 + 380 + 10 + 10 = 1,000 m', { exact: true })).toBeVisible();
  assert.equal(await storedSnapshot(page), initialSnapshot, 'Diagnostics must remain isolated from saved records.');
  await page.screenshot({ path: resolve(artifacts, 'diagnostics-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'منظرنامہ ری سیٹ کریں', exact: true }).click();
  await expect(page.getByText('0 + 0 + 0 + 0 = 0 m', { exact: true })).toBeVisible();

  await page.goto(`${baseURL}/settings`);
  await expect(page.getByRole('button', { name: 'اصل ڈیمو ری سیٹ کریں', exact: true })).toBeDisabled();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON نقل ڈاؤن لوڈ کریں', exact: true }).click();
  const download = await downloadPromise;
  const exportedPath = resolve(artifacts, 'demo-export.json');
  await download.saveAs(exportedPath);
  const exported = JSON.parse(await readFile(exportedPath, 'utf8'));
  assert.deepEqual(exported.data, JSON.parse(initialSnapshot).data, 'Export must contain the current domain snapshot.');

  await page.getByLabel('ڈیمو JSON', { exact: true }).fill('{');
  await page.getByRole('checkbox', { name: 'میں سمجھتا ہوں کہ درست درآمد میرے موجودہ ڈیمو ریکارڈ کی جگہ لے گی۔' }).check();
  await page.getByRole('button', { name: 'جانچ کر کے درآمد کریں', exact: true }).click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  assert.equal(await storedSnapshot(page), initialSnapshot, 'Invalid imports must preserve the current snapshot.');

  const company = Object.values(exported.data.companies)[0];
  company.name = 'نور ٹیکسٹائلز — آزمائشی درآمد';
  await page.getByLabel('ڈیمو JSON', { exact: true }).fill(JSON.stringify(exported));
  await page.getByRole('button', { name: 'جانچ کر کے درآمد کریں', exact: true }).click();
  await expect(page.getByRole('status').first()).toContainText('ڈیمو ڈیٹا محفوظ ہو گیا');
  await page.goto(`${baseURL}/dashboard`);
  await expect(page.getByText(company.name, { exact: true })).toBeVisible();
  await checkDashboard(page);
  await page.reload();
  await expect(page.getByText(company.name, { exact: true })).toBeVisible();
  await page.goto(`${baseURL}/settings`);
  await page.getByRole('checkbox', { name: 'میں موجودہ ڈیمو ڈیٹا تبدیل کر کے ابتدائی ریکارڈ بحال کرنا چاہتا ہوں۔' }).check();
  await page.getByRole('button', { name: 'اصل ڈیمو ری سیٹ کریں', exact: true }).click();
  await page.getByRole('button', { name: 'تصدیق کر کے ری سیٹ کریں', exact: true }).click();
  await expect(page.getByRole('status').first()).toContainText('ڈیمو ڈیٹا محفوظ ہو گیا');
  assert.deepEqual(JSON.parse(await storedSnapshot(page)).data, JSON.parse(initialSnapshot).data, 'Explicit reset must restore deterministic domain data.');
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  currentPage = mobilePage;
  recordErrors(mobilePage);
  await mobilePage.goto(`${baseURL}/dashboard`);
  await checkDashboard(mobilePage);
  await expect(mobilePage.locator('#erp-sidebar')).toBeHidden();
  await mobilePage.getByRole('button', { name: 'مینو کھولیں', exact: true }).click();
  await expect(mobilePage.getByRole('dialog', { name: 'مرکزی نیویگیشن' })).toBeVisible();
  await mobilePage.getByRole('dialog', { name: 'مرکزی نیویگیشن' }).getByRole('link', { name: 'خریداری زیرِ تعمیر', exact: true }).click();
  await expect(mobilePage.getByRole('heading', { name: 'خریداری کا مکمل ماڈیول جلد آئے گا' })).toBeVisible();
  await expect(mobilePage.locator('#erp-sidebar')).toBeHidden();
  await mobilePage.getByRole('button', { name: 'مینو کھولیں', exact: true }).click();
  await mobilePage.getByRole('dialog', { name: 'مرکزی نیویگیشن' }).getByRole('link', { name: 'ڈیش بورڈ', exact: true }).click();
  await checkDashboard(mobilePage);
  await mobilePage.getByRole('button', { name: 'مینو کھولیں', exact: true }).click();
  await mobilePage.keyboard.press('Escape');
  await expect(mobilePage.locator('#erp-sidebar')).toBeHidden();
  await expect(mobilePage.getByRole('button', { name: 'مینو کھولیں', exact: true })).toBeFocused();
  const size = await mobilePage.evaluate(() => ({ width: window.innerWidth, scroll: document.documentElement.scrollWidth }));
  assert.ok(size.scroll <= size.width, `Mobile page must not overflow horizontally: ${JSON.stringify(size)}`);
  await mobilePage.evaluate(() => document.fonts.ready);
  await mobilePage.screenshot({ path: resolve(artifacts, 'dashboard-mobile.png'), fullPage: true });
  await mobile.close();

  const recovery = await browser.newContext();
  const recoveryPage = await recovery.newPage();
  currentPage = recoveryPage;
  recordErrors(recoveryPage);
  await recoveryPage.goto(`${baseURL}/dashboard`);
  await checkDashboard(recoveryPage);
  await recoveryPage.evaluate((key) => localStorage.setItem(key, '{broken-snapshot'), storageKey);
  await recoveryPage.reload();
  await expect(recoveryPage.getByRole('alert').first()).toContainText('محفوظ ڈیٹا پڑھا نہیں جا سکا');
  assert.equal(await storedSnapshot(recoveryPage), '{broken-snapshot', 'Corrupt saved data must never be silently overwritten.');
  await recovery.close();

  assert.deepEqual(errors, [], 'The browser must not report runtime or console errors.');
  console.log('PASS: desktop RTL dashboard, all three isolated transactions, scenario reset, reload persistence, export, invalid/valid import, explicit reset, mobile navigation and overflow, corrupt-data protection.');
  console.log(`Screenshots saved under ${artifacts}`);
} catch (error) {
  if (currentPage && !currentPage.isClosed()) {
    await currentPage.screenshot({ path: resolve(artifacts, 'browser-failure.png'), fullPage: true }).catch(() => undefined);
  }
  console.error('Browser runtime errors:', errors);
  throw error;
} finally {
  await browser.close();
}
