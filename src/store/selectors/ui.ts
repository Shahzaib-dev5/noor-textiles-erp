import type { DomainState } from '@/domain/entities';
import { routeRegistry, getRoute } from '@/routes/registry';
import { t } from '@/locales/ur';
import { selectDashboard, selectInspector } from '@/store/selectors';
import { roundQuantity } from '@/domain/value-objects/quantity';
import { formatDate } from '@/lib/formatters';
import { selectBusinessAlerts } from './business';
import { supplierProfile, fabricProfile, supplierBills, receiptLineValue } from './procurement';
import { selectProcurementAlerts } from './procurement-alerts';

export interface SearchResult { id: string; title: string; type: string; description: string; path: string }
export const normalizeSearch = (value: string) => value.normalize('NFKC').toLocaleLowerCase().replace(/[\u064B-\u065F]/g, '').replace(/ك/g, 'ک').replace(/ي/g, 'ی').trim();
export function selectGlobalSearch(data: DomainState, query: string): SearchResult[] {
  const results: SearchResult[] = [
    ...routeRegistry.filter((route) => !('detail' in route)).map((route) => ({ id: `route:${route.id}`, title: t(route.title), type: 'ماڈیول', description: route.module, path: route.path })),
    ...Object.values(data.suppliers).map((record) => ({ id: record.id, title: record.name, type: 'سپلائر', description: `${supplierProfile(data,record.id).code} · ${record.city} · ${record.phone}`, path: getRoute('supplier-detail').path.replace(':id', encodeURIComponent(record.id)) })),
    ...Object.values(data.fabrics).map((record) => ({ id: record.id, title: record.name, type: 'کپڑا', description: `${fabricProfile(data,record.id).code} · ${record.composition} · ${record.widthInches}″`, path: getRoute('fabric-detail').path.replace(':id',encodeURIComponent(record.id)) })),
    ...Object.values(data.purchaseOrders).map((record)=>({id:record.id,title:record.number,type:'خریداری آرڈر',description:data.suppliers[record.supplierId].name,path:getRoute('purchase-detail').path.replace(':id',encodeURIComponent(record.id))})),
    ...Object.values(data.goodsReceipts).map((record)=>({id:record.id,title:record.number,type:'مال وصولی',description:data.purchaseOrders[record.purchaseOrderId].number,path:getRoute('receipt-detail').path.replace(':id',encodeURIComponent(record.id))})),
    ...supplierBills(data).map((record)=>({id:record.id,title:record.number,type:'سپلائر بل',description:data.suppliers[record.supplierId].name,path:getRoute('supplier-bill-detail').path.replace(':id',encodeURIComponent(record.id))})),
    ...Object.values(data.contractors).map((record) => ({ id: record.id, title: record.name, type: 'ٹھیکیدار', description: record.city, path: `${getRoute('contractors').path}?record=${encodeURIComponent(record.id)}` })),
  ];
  const term = normalizeSearch(query);
  return results.filter((result) => !term || normalizeSearch(`${result.title} ${result.description} ${result.type} ${result.path}`).includes(term)).slice(0, 30);
}
export function selectEnterpriseDashboard(data: DomainState) {
  const stock = selectDashboard(data); const inspection = selectInspector(data);
  const postedReceipts = Object.values(data.goodsReceipts).filter((receipt) => receipt.status === 'POSTED');
  let purchaseValuePaisa: number | null = 0;
  const daily = new Map<string, number>();
  try {
    postedReceipts.forEach((receipt) => {
      const value = receipt.lineIds.reduce((sum, id) => {
        const total = sum + receiptLineValue(data,id);
        if (!Number.isSafeInteger(total)) throw new Error('Unsafe total');
        return total;
      }, 0);
      if (!Number.isSafeInteger((purchaseValuePaisa ?? 0) + value)) throw new Error('Unsafe total');
      purchaseValuePaisa = (purchaseValuePaisa ?? 0) + value;
      const subtotal = (daily.get(receipt.receivedOn) ?? 0) + value;
      if (!Number.isSafeInteger(subtotal)) throw new Error('Unsafe total');
      daily.set(receipt.receivedOn, subtotal);
    });
  } catch { purchaseValuePaisa = null; daily.clear(); }
  const contractors = Object.values(data.contractors).map((contractor) => {
    const movements = Object.values(data.movements).filter((m) => m.contractorId === contractor.id && m.category === 'PROCESSING_OUT');
    const held = roundQuantity(movements.reduce((sum, m) => sum + m.quantityMeters, 0));
    const issued = roundQuantity(movements.filter((m) => m.sourceType === 'PROCESSING_ISSUE').reduce((sum, m) => sum + m.quantityMeters, 0));
    return { id: contractor.id, name: contractor.name, held, issued, settled: roundQuantity(issued - held) };
  });
  const recent = [
    ...Object.values(data.goodsReceipts).filter((r) => r.status === 'POSTED').map((r) => ({ id: r.id, number: r.number, type: 'مال وصولی', status: r.status, date: r.updatedAt, quantity: roundQuantity(r.lineIds.reduce((sum, id) => sum + data.goodsReceiptLines[id].quantityMeters, 0)), source: 'خریداری' })),
    ...Object.values(data.challans).filter((r) => ['POSTED', 'PARTIALLY_RECEIVED', 'COMPLETED'].includes(r.status)).map((r) => ({ id: r.id, number: r.number, type: 'پروسیسنگ چالان', status: r.status, date: r.updatedAt, quantity: roundQuantity(r.lineIds.reduce((sum, id) => sum + data.challanLines[id].quantityMeters, 0)), source: data.contractors[r.contractorId].name })),
    ...Object.values(data.processingReceipts).filter((r) => r.status === 'POSTED').map((r) => ({ id: r.id, number: r.number, type: 'پروسیسنگ وصولی', status: r.status, date: r.updatedAt, quantity: roundQuantity(r.lineIds.reduce((sum, id) => sum + data.processingReceiptLines[id].outputMeters, 0)), source: data.contractors[data.challans[r.challanId].contractorId].name })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return { ...stock, purchased: inspection.purchased, issued: inspection.issued, reconciled: inspection.reconciled, purchaseValuePaisa, finishedSuits: 0,
    trend: [...daily.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, value]) => ({ day, label: formatDate(day), value })),
    distribution: [{ label: t('grey'), value: stock.grey }, { label: t('processed'), value: stock.processed }, { label: t('contractor'), value: stock.contractor }, { label: t('loss'), value: stock.loss }],
    contractors, recent, activities: Object.values(data.activityLogs).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
export interface DemoNotification { id: string; title: string; description: string; path: string; tone: 'warning' | 'info' }
export function selectNotifications(data: DomainState, asOf?:string): DemoNotification[] {
  const reportDate=asOf??Object.values(data.procurement?.audits??{}).reduce((max,r)=>r.createdAt.slice(0,10)>max?r.createdAt.slice(0,10):max,data.history?.asOf??'1970-01-01');
  const purchasing=selectProcurementAlerts(data,reportDate);
  if (data.history) return [...selectBusinessAlerts(data),...purchasing];
  const summary = selectEnterpriseDashboard(data);
  const notifications: DemoNotification[] = summary.contractors.filter((c) => c.held > 0).map((c) => ({ id: `custody:${c.id}`, title: 'پروسیسنگ کی وصولی باقی ہے', description: `${c.name} · ${c.held} میٹر باقی`, path: getRoute('processing').path, tone: 'info' }));
  // UI warning threshold, not a new inventory rule or a fabricated reorder document.
  for (const [label, value] of [[t('grey'), summary.grey], [t('processed'), summary.processed]] as const) {
    if (value <= 100) notifications.push({ id: `stock:${label}`, title: `${label}: کم اسٹاک`, description: `موجودہ مقدار ${value} میٹر؛ نمائشی انتباہی حد ۱۰۰ میٹر۔`, path: getRoute('diagnostics').path, tone: 'warning' });
  }
  return [...notifications,...purchasing];
}
