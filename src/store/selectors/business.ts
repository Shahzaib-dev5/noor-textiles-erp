import { finishedBalances,finishedMovements,finishedReconciliation,total } from '@/services/finished-goods/inventory';
import { greyCategories } from '@/services/inventory/warehouse';
import type { DomainState } from '@/domain/entities';
import { getInventoryBalances, getReconciliation } from '@/services/inventory';
import { roundQuantity } from '@/domain/value-objects/quantity';
import { receiptLineValue, supplierLedger, procurementReportingDate } from './procurement';
import { getRoute } from '@/routes/registry';
import type { DemoNotification } from './ui';

export interface DashboardFilters { from: string; to: string; collectionId: string; fabricId: string; warehouseId: string; contractorId: string; customerId: string; pieceCount: string }
export const emptyFilters: DashboardFilters = { from: '', to: '', collectionId: '', fabricId: '', warehouseId: '', contractorId: '', customerId: '', pieceCount: '' };
export const sum = <T>(rows: readonly T[], value: (r: T) => number) => rows.reduce((n, r) => n + value(r), 0);
const values = Object.values;
const monthly = <T>(rows: T[], day: (r: T) => string, amount: (r: T) => number) => {
  const totals = new Map<string, number>(); rows.forEach((r) => { const month = day(r).slice(0, 7); totals.set(month, (totals.get(month) ?? 0) + amount(r)); });
  return [...totals].sort(([a], [b]) => a.localeCompare(b)).map(([month, value]) => ({ label: new Intl.DateTimeFormat('ur-PK', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(month + '-01')), value }));
};
export function selectFinishedStock(data: DomainState, warehouseId = '') {
  const h = data.history;
  if(data.finishing){const balances=finishedBalances(data).filter(b=>!warehouseId||data.locations[b.locationId].warehouseId===warehouseId),movements=finishedMovements(data).filter(m=>!warehouseId||data.locations[m.locationId].warehouseId===warehouseId);return values(data.finishedSKUs).map(sku=>{const rows=balances.filter(b=>b.skuId===sku.id),events=movements.filter(m=>m.skuId===sku.id);return{id:sku.id,sku,physical:total(rows,b=>b.physical),reserved:total(rows,b=>b.reserved),available:total(rows,b=>b.available),produced:total(events.filter(m=>['PACKAGING','RECEIPT'].includes(m.sourceType)),m=>m.quantity),dispatched:-total(events.filter(m=>m.sourceType==='DISPATCH'),m=>m.quantity),damaged:-total(events.filter(m=>m.sourceType==='DAMAGE'),m=>m.quantity)};});}
  return values(data.finishedSKUs).map((sku) => {
    const events = values(h?.finishedMovements ?? {}).filter((m) => m.skuId === sku.id && (!warehouseId || data.locations[m.locationId].warehouseId === warehouseId));
    const physical = sum(events, (m) => m.quantitySuits), reserved = sum(values(h?.reservations ?? {}).filter((r) => r.skuId === sku.id && r.status === 'ACTIVE' && (!warehouseId || data.locations[r.locationId].warehouseId === warehouseId)), (r) => r.suits);
    return { id: sku.id, sku, physical, reserved, available: physical - reserved, produced: sum(events.filter((m) => m.sourceType === 'PACKAGING'), (m) => m.quantitySuits), dispatched: -sum(events.filter((m) => m.sourceType === 'DISPATCH'), (m) => m.quantitySuits), damaged: -sum(events.filter((m) => m.sourceType === 'DAMAGE'), (m) => m.quantitySuits) };
  });
}
export function selectInvoiceBalances(data: DomainState) {
  const h = data.history; if (!h) return [];
  return values(h.invoices).map((i) => {
    const paid = sum(values(h.paymentAllocations).filter((a) => a.invoiceId === i.id), (a) => a.amountPaisa), outstanding = i.totalPaisa - paid;
    return { ...i, paid, outstanding, overdue: outstanding > 0 && i.dueOn < procurementReportingDate(data), paymentStatus: paid === i.totalPaisa ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID' };
  });
}
export function selectBatchCosts(data: DomainState) {
  const h = data.history; if (!h) return [];
  return values(h.batches).map((b) => {
    const materialCost = sum(b.allocationIds, (id) => h.materialAllocations[id].costPaisa);
    const directCost = sum(values(h.expenses).filter((e) => e.batchId === b.id), (e) => e.amountPaisa);
    const totalCost = materialCost + directCost;
    return { ...b, materialCost, directCost, totalCost, costPerAcceptedPaisa: b.completedSuits ? Math.round(totalCost / b.completedSuits) : null, fullyCosted: b.status === 'COMPLETED' };
  });
}
export function selectReconciliationReport(data: DomainState) {
  const fabric = getReconciliation(data), h = data.history;
  const allocations = values(h?.materialAllocations ?? {});
  const stock = selectFinishedStock(data), invoice = selectInvoiceBalances(data);
  const payments = values(h?.payments ?? {});
  const paid = sum(values(h?.paymentAllocations ?? {}), (a) => a.amountPaisa), cash = sum(payments, (p) => p.amountPaisa);
  const produced = sum(stock, (s) => s.produced), dispatched = sum(stock, (s) => s.dispatched), damaged = sum(stock, (s) => s.damaged), physical = sum(stock, (s) => s.physical), reserved = sum(stock, (s) => s.reserved);
  return { fabric, production: { consumed: fabric.productionConsumed ?? 0, embedded: roundQuantity(sum(allocations, (a) => a.embeddedMeters)), waste: roundQuantity(sum(allocations, (a) => a.wasteMeters)), wip: roundQuantity(sum(allocations, (a) => a.wipMeters)) },
    finished: { produced, dispatched, damaged, physical, reserved, available: sum(stock,s=>s.available), difference: data.finishing?finishedReconciliation(data).difference:produced - dispatched - damaged - physical },
    financial: { openingReceivable: sum(values(data.customers), (c) => c.openingBalancePaisa), invoiced: sum(invoice, (i) => i.totalPaisa), allocated: paid, collections: cash, unappliedCredit: cash - paid, outstanding: sum(invoice, (i) => i.outstanding) + sum(values(data.customers), (c) => c.openingBalancePaisa), supplierPayable: sum(values(data.suppliers), (s) => supplierLedger(data,s.id).outstanding) } };
}
export function selectBusinessAlerts(data: DomainState): DemoNotification[] {
  const h = data.history; if (!h) return [];
  const alerts: DemoNotification[] = [];
  const add = (id: string, title: string, description: string, route: Parameters<typeof getRoute>[0]) => alerts.push({ id, title, description, path: getRoute(route).path + '?record=' + encodeURIComponent(id), tone: 'warning' });
  for (const p of values(h.fabricProfiles)) {
    const grey = sum(getInventoryBalances(data).filter((b) => b.category === 'GREY' && data.lots[b.lotId].fabricId === p.fabricId), (b) => b.availableMeters);
    if (grey < p.reorderMeters) add(p.fabricId, 'کورا کپڑا: کم اسٹاک', data.fabrics[p.fabricId].name + ' · ' + grey + ' / حد ' + p.reorderMeters + ' میٹر', 'fabrics');
  }
  for (const s of values(h.processingSchedules)) { const c = data.challans[s.challanId]; if (s.dueOn < procurementReportingDate(data) && ['POSTED', 'PARTIALLY_RECEIVED'].includes(c.status)) add(c.id, 'پروسیسنگ کی واپسی میں تاخیر', c.number + ' · متوقع ' + s.dueOn, 'processing'); }
  for (const i of selectInvoiceBalances(data).filter((i) => i.overdue)) add(i.id, 'خریدار کی واجب الادا رقم', i.number + ' · آخری تاریخ ' + i.dueOn, 'invoices');
  for (const b of values(h.batches).filter((b) => b.dueOn < procurementReportingDate(data) && !['COMPLETED', 'PLANNED'].includes(b.status))) add(b.id, 'پیداواری بیچ میں تاخیر', b.number + ' · متوقع ' + b.dueOn, 'production');
  for (const p of values(h.customerProfiles)) {
    const balance = data.customers[p.customerId].openingBalancePaisa + sum(selectInvoiceBalances(data).filter((i) => i.customerId === p.customerId), (i) => i.outstanding);
    if (p.creditLimitPaisa && balance >= p.creditLimitPaisa * .8) add(p.customerId, 'خریدار کریڈٹ حد کے قریب', data.customers[p.customerId].name + ' · حد کا ۸۰٪ یا زیادہ', 'customers');
  }
  for (const r of values(data.processingReceiptLines)) if (r.lossMeters / data.challanLines[r.challanLineId].quantityMeters > .03) add(r.id, 'پروسیسنگ کا نقصان زیادہ', 'جاری مقدار کا ۳٪ سے زیادہ نقصان', 'processing');
  for (const s of values(data.suppliers)) {
    const payable = supplierLedger(data,s.id).outstanding;
    if (payable > 0) add(s.id, 'سپلائر کی ادائیگی باقی', s.name + ' · پوسٹ شدہ بل اور مختص ادائیگیوں سے', 'suppliers');
  }
  return alerts;
}
function buildBusinessDashboard(data: DomainState, f: DashboardFilters) {
  const h = data.history;
  if (!h) return null;
  const inRange = (day: string) => (!f.from || day >= f.from) && (!f.to || day <= f.to);
  const skuMatch = (skuId: string) => { const s = data.finishedSKUs[skuId], d = data.designs[s.designId]; return (!f.collectionId || d.collectionId === f.collectionId) && (!f.pieceCount || s.pieceCount === Number(f.pieceCount)) && (!f.fabricId || values(h.bomLines).some((l) => l.bomId === d.bomId && l.fabricId === f.fabricId)); };
  const customerMatch = (id: string) => !f.customerId || id === f.customerId;
  const invoiceRows = selectInvoiceBalances(data).filter((i) => customerMatch(i.customerId) && inRange(i.date));
  const invoiceLines = values(h.invoiceLines).filter((l) => invoiceRows.some((i) => i.id === l.invoiceId) && skuMatch(h.dispatchLines[l.dispatchLineId].skuId));
  // Invoice amounts remain whole documents unless a product dimension selects a subset of lines.
  const includedIds = new Set(invoiceLines.map((l) => l.invoiceId));
  const productFilter = Boolean(f.collectionId || f.pieceCount || f.fabricId);
  const invoiceValue = (id: string) => sum(invoiceLines.filter((l) => l.invoiceId === id), (l) => l.totalPaisa);
  const includedInvoices = invoiceRows.filter((i) => includedIds.has(i.id));
  const invoiced = sum(invoiceLines, (l) => l.totalPaisa);
  const openingReceivable = sum(values(data.customers).filter((c) => customerMatch(c.id)), (c) => c.openingBalancePaisa);
  const outstanding = openingReceivable + sum(includedInvoices, (i) => productFilter ? Math.round(i.outstanding * invoiceValue(i.id) / i.totalPaisa) : i.outstanding);
  const overdue = sum(includedInvoices.filter((i) => i.overdue), (i) => productFilter ? Math.round(i.outstanding * invoiceValue(i.id) / i.totalPaisa) : i.outstanding);
  // Cash and allocations have no SKU ownership: product filters intentionally do not slice cash.
  const payments = values(h.payments).filter((p) => customerMatch(p.customerId) && inRange(p.date));
  const purchases = values(data.goodsReceipts).filter((r) => r.status === 'POSTED' && inRange(r.receivedOn) && (!f.warehouseId || data.locations[r.warehouseLocationId].warehouseId === f.warehouseId));
  const purchaseValue = (r: typeof purchases[number]) => sum(r.lineIds.filter((id) => !f.fabricId || data.purchaseOrderLines[data.goodsReceiptLines[id].purchaseOrderLineId].fabricId === f.fabricId), (id) => { return receiptLineValue(data,id); });
  const balances = getInventoryBalances(data).filter((b) => (!f.fabricId || data.lots[b.lotId].fabricId === f.fabricId) && (!f.warehouseId || data.locations[b.locationId].warehouseId === f.warehouseId) && (!f.contractorId || b.category !== 'PROCESSING_OUT' || data.locations[b.locationId].contractorId === f.contractorId));
  const stock = selectFinishedStock(data, f.warehouseId).filter((s) => skuMatch(s.id));
  const batchRows = selectBatchCosts(data).filter((b) => inRange(b.date) && (!f.collectionId || data.designs[b.designId].collectionId === f.collectionId) && (!f.pieceCount || data.designs[b.designId].pieceCount === Number(f.pieceCount)) && (!f.fabricId || values(h.bomLines).some((l) => l.bomId === b.bomId && l.fabricId === f.fabricId)));
  const jobs = values(data.challans).filter((c) => (!f.contractorId || c.contractorId === f.contractorId) && (!f.fabricId || c.lineIds.some((id) => data.lots[data.challanLines[id].lotId].fabricId === f.fabricId)));
  const selectedJobIds = new Set(jobs.map((c) => c.id));
  const returns = values(data.processingReceiptLines).filter((r) => selectedJobIds.has(data.processingReceipts[r.processingReceiptId].challanId) && inRange(data.processingReceipts[r.processingReceiptId].updatedAt.slice(0, 10)));
  const expenses = values(h.expenses).filter((e) => inRange(e.date) && (!f.collectionId || (e.batchId && data.designs[h.batches[e.batchId].designId].collectionId === f.collectionId)));
  const charges = values(h.processingCharges).filter((e) => inRange(e.date) && (!f.contractorId || e.contractorId === f.contractorId) && (!f.fabricId || data.challans[data.processingReceipts[e.receiptId].challanId].lineIds.some((id) => data.lots[data.challanLines[id].lotId].fabricId === f.fabricId)));
  const customers = values(data.customers).filter((c) => customerMatch(c.id)).map((c) => {
    const inv = includedInvoices.filter((i) => i.customerId === c.id);
    return { id: c.id, name: c.name, sales: sum(inv, (i) => invoiceValue(i.id)), outstanding: c.openingBalancePaisa + sum(inv, (i) => productFilter ? Math.round(i.outstanding * invoiceValue(i.id) / i.totalPaisa) : i.outstanding) };
  });
  const topDesigns = values(data.designs).map((d) => ({ label: d.name, value: sum(invoiceLines.filter((l) => data.finishedSKUs[h.dispatchLines[l.dispatchLineId].skuId].designId === d.id), (l) => l.suits) })).filter((d) => d.value).sort((a, b) => b.value - a.value).slice(0, 8);
  const orders = values(h.salesOrders).filter((r) => customerMatch(r.customerId) && inRange(r.date) && r.lineIds.some((id) => skuMatch(h.salesLines[id].skuId)));
  const allCosts = selectBatchCosts(data);
  let contribution = 0, contributionSales = 0;
  invoiceLines.forEach((l) => {
    const sku = h.dispatchLines[l.dispatchLineId].skuId, packageRow = values(h.packaging).find((p) => p.skuId === sku), cost = allCosts.find((b) => b.id === packageRow?.batchId && b.fullyCosted);
    if (cost && cost.completedSuits) { contributionSales += l.totalPaisa; contribution += l.totalPaisa - Math.round(cost.totalCost * l.suits / cost.completedSuits); }
  });
  const activity = [
    ...values(data.goodsReceipts).filter((r) => r.status === 'POSTED').map((r) => ({ id: r.id, number: r.number, date: r.receivedOn, label: 'خریداری وصول ہوئی', path: getRoute('purchases').path })),
    ...values(data.challans).filter((r) => !['CANCELLED', 'DRAFT', 'APPROVED'].includes(r.status)).map((r) => ({ id: r.id, number: r.number, date: r.updatedAt.slice(0, 10), label: 'کپڑا پروسیسنگ کو جاری ہوا', path: getRoute('processing').path })),
    ...values(data.processingReceipts).filter((r) => r.status === 'POSTED').map((r) => ({ id: r.id, number: r.number, date: r.updatedAt.slice(0, 10), label: 'پروسیس شدہ کپڑا وصول ہوا', path: getRoute('processing').path })),
    ...values(h.packaging).map((r) => ({ id: r.id, number: r.number, date: r.date, label: 'معائنہ شدہ سوٹ پیک ہوئے', path: getRoute('finished-inventory').path })),
    ...values(h.salesOrders).map((r) => ({ id: r.id, number: r.number, date: r.date, label: 'ہول سیل آرڈر درج ہوا', path: getRoute('sales').path })),
    ...values(h.invoices).map((r) => ({ id: r.id, number: r.number, date: r.date, label: 'انوائس جاری ہوئی', path: getRoute('invoices').path })),
    ...values(h.payments).map((r) => ({ id: r.id, number: r.number, date: r.date, label: 'ادائیگی وصول ہوئی', path: getRoute('payments').path })),
    ...values(h.batches).filter((r) => r.status === 'COMPLETED').map((r) => ({ id: r.id, number: r.number, date: values(h.packaging).find((p) => p.batchId === r.id)?.date ?? r.date, label: 'پیداواری بیچ مکمل ہوا', path: getRoute('production').path })),
  ].filter((r) => inRange(r.date)).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const collectionStock = values(h.collections).filter((c) => !f.collectionId || c.id === f.collectionId).map((c) => ({ label: c.name, value: sum(stock.filter((s) => data.designs[s.sku.designId].collectionId === c.id), (s) => s.available) }));
  const expenseDistribution = [...new Set(expenses.map((e) => e.category))].map((category) => ({ label: ({ CUTTING: 'کٹنگ', EMBROIDERY: 'ایمبرائیڈری', PACKAGING: 'پیکنگ', TRANSPORT: 'ٹرانسپورٹ', LABOR: 'مزدوری', RENT: 'کرایہ', OVERHEAD: 'عمومی اخراجات' })[category], value: sum(expenses.filter((e) => e.category === category), (e) => e.amountPaisa) }));
  if (charges.length) expenseDistribution.push({ label: 'پروسیسنگ', value: sum(charges, (c) => c.totalPaisa) });
  return { asOf: procurementReportingDate(data), financial: { invoiced, collections: sum(payments, (p) => p.amountPaisa), purchases: sum(purchases, purchaseValue), expenses: sum(expenses, (e) => e.amountPaisa) + sum(charges, (e) => e.totalPaisa), outstanding, overdue, openingReceivable, current: outstanding - overdue - openingReceivable, contribution, contributionSales, averageInvoice: includedInvoices.length ? Math.round(invoiced / includedInvoices.length) : 0 },
    inventory: { grey: roundQuantity(sum(balances.filter((b) => greyCategories.includes(b.category)), (b) => b.onHandMeters)), processed: roundQuantity(sum(balances.filter((b) => b.category === 'PROCESSED'), (b) => b.onHandMeters)), contractor: roundQuantity(sum(balances.filter((b) => b.category === 'PROCESSING_OUT'), (b) => b.onHandMeters)), finished: sum(stock, (s) => s.physical), available: sum(stock, (s) => s.available), reserved: sum(stock, (s) => s.reserved), damaged: sum(stock, (s) => s.damaged), wip: roundQuantity(sum(values(h.materialAllocations).filter((a) => (!f.collectionId || data.designs[h.batches[a.batchId].designId].collectionId === f.collectionId) && (!f.pieceCount || data.designs[h.batches[a.batchId].designId].pieceCount === Number(f.pieceCount)) && (!f.fabricId || data.lots[a.lotId].fabricId === f.fabricId) && (!f.warehouseId || data.locations[a.sourceLocationId].warehouseId === f.warehouseId)), (a) => a.wipMeters)) },
    processing: { open: jobs.filter((c) => ['POSTED', 'PARTIALLY_RECEIVED'].includes(c.status)).length, partial: jobs.filter((c) => c.status === 'PARTIALLY_RECEIVED').length, late: values(h.processingSchedules).filter((s) => selectedJobIds.has(s.challanId) && s.dueOn < procurementReportingDate(data) && ['POSTED', 'PARTIALLY_RECEIVED'].includes(data.challans[s.challanId].status)).length, returned: roundQuantity(sum(returns, (r) => r.outputMeters)), loss: roundQuantity(sum(returns, (r) => r.lossMeters)) },
    production: { active: batchRows.filter((b) => !['PLANNED', 'COMPLETED'].includes(b.status)).length, planned: sum(batchRows, (b) => b.plannedSuits), completed: sum(batchRows, (b) => b.completedSuits), rejected: sum(batchRows, (b) => b.rejectedSuits), target: sum(batchRows, (b) => b.targetSuits), inProgress: sum(batchRows, (b) => b.inProgressSuits), completion: sum(batchRows, (b) => b.targetSuits) ? Math.round(sum(batchRows, (b) => b.completedSuits) / sum(batchRows, (b) => b.targetSuits) * 100) : 0 },
    sales: { orders: orders.length, open: orders.filter((r) => ['CONFIRMED', 'PARTIALLY_DISPATCHED'].includes(r.status)).length, dispatched: orders.filter((r) => ['COMPLETED', 'PARTIALLY_DISPATCHED'].includes(r.status)).length, invoices: includedInvoices.length }, customers, invoices: includedInvoices, stock, batches: batchRows, activity, alerts: selectBusinessAlerts(data),
    charts: { purchases: monthly(purchases, (r) => r.receivedOn, purchaseValue), sales: monthly(includedInvoices, (r) => r.date, (r) => invoiceValue(r.id)), collections: monthly(payments, (r) => r.date, (r) => r.amountPaisa), inventory: ['GREY', 'PROCESSED', 'PROCESSING_OUT'].map((category, i) => ({ label: ['کورا', 'پروسیس شدہ', 'ٹھیکیدار کی تحویل'][i], value: roundQuantity(sum(balances.filter((b) => b.category === category), (b) => b.onHandMeters)) })), production: ['PLANNED', 'CUTTING', 'PACKING', 'COMPLETED'].map((status, i) => ({ label: ['منصوبہ بند', 'کٹنگ', 'پیکنگ', 'مکمل'][i], value: batchRows.filter((b) => b.status === status).length })), contractors: values(data.contractors).filter((c) => !f.contractorId || c.id === f.contractorId).map((c) => ({ label: c.name, value: jobs.filter((j) => j.contractorId === c.id && ['POSTED', 'PARTIALLY_RECEIVED'].includes(j.status)).length })), topDesigns, outstanding: customers.filter((c) => c.outstanding > 0).map((c) => ({ label: c.name, value: c.outstanding })), collectionStock, expenses: expenseDistribution, collectionProduction: values(h.collections).map((c) => ({ label: c.name, value: sum(batchRows.filter((b) => data.designs[b.designId].collectionId === c.id), (b) => b.completedSuits) })) } };
}
const cache = new WeakMap<DomainState, Map<string, ReturnType<typeof buildBusinessDashboard>>>();
export function selectBusinessDashboard(data: DomainState, filters: DashboardFilters = emptyFilters) {
  let entries = cache.get(data); if (!entries) { entries = new Map(); cache.set(data, entries); }
  const key = JSON.stringify(filters); if (entries.has(key)) return entries.get(key)!;
  const view = buildBusinessDashboard(data, filters); if (entries.size >= 32) entries.clear(); entries.set(key, view); return view;
}
