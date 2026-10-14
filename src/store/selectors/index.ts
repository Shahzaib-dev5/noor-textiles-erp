import type { DomainState } from '@/domain/entities';
import { getInventorySummary, getProductionConsumedMeters, getReconciliation } from '@/services/inventory';

export function selectDashboard(data: DomainState) {
  const balances = getInventorySummary(data);
  return {
    companyName: Object.values(data.companies)[0]?.name ?? 'نور ٹیکسٹائلز لاہور',
    supplierCount: Object.keys(data.suppliers).length,
    lotCount: Object.keys(data.lots).length,
    grey: balances.grey,
    processed: balances.processed,
    contractor: balances.contractor,
    loss: balances.loss,
  };
}

export function selectInspector(data: DomainState) {
  const balances = selectDashboard(data);
  const movements = Object.values(data.movements).map((movement) => {
    const document = movement.sourceType === 'GOODS_RECEIPT'
      ? data.goodsReceipts[movement.sourceDocumentId]
      : movement.sourceType === 'PROCESSING_ISSUE'
        ? data.challans[movement.sourceDocumentId]
        : data.processingReceipts[movement.sourceDocumentId];
    return {
      id: movement.id,
      documentNumber: document?.number ?? movement.sourceDocumentId,
      category: movement.category,
      quantity: movement.quantityMeters,
      unit: 'METER',
      sourceDocumentId: movement.sourceDocumentId,
    };
  });
  const purchased = Object.values(data.movements)
    .filter((movement) => movement.sourceType === 'GOODS_RECEIPT')
    .reduce((sum, movement) => sum + movement.quantityMeters, 0);
  const issued = Object.values(data.movements)
    .filter((movement) => movement.sourceType === 'PROCESSING_ISSUE' && movement.quantityMeters > 0)
    .reduce((sum, movement) => sum + movement.quantityMeters, 0);
  const records = [
    ...Object.values(data.suppliers).map((r) => ({ label: 'سپلائر', value: r.name })),
    ...Object.values(data.fabrics).map((r) => ({ label: 'کپڑے کی قسم', value: `${r.name} · ${r.widthInches}″` })),
    ...Object.values(data.purchaseOrders).map((r) => ({ label: 'خریداری آرڈر', value: r.number })),
    ...Object.values(data.goodsReceipts).map((r) => ({ label: 'مال وصولی', value: r.number })),
    ...Object.values(data.lots).map((r) => ({ label: 'لاٹ', value: r.code })),
    ...Object.values(data.contractors).map((r) => ({ label: 'پروسیسنگ ٹھیکیدار', value: r.name })),
    ...Object.values(data.challans).map((r) => ({ label: 'پروسیسنگ چالان', value: r.number })),
    ...Object.values(data.processingReceipts).map((r) => ({ label: 'پروسیسنگ وصولی', value: r.number })),
    ...Object.values(data.customers).map((r) => ({ label: 'خریدار', value: r.name })),
    ...Object.values(data.designs).map((r) => ({ label: 'ڈیزائن', value: r.name })),
    ...Object.values(data.finishedSKUs).map((r) => ({ label: 'تیار مال کا کیٹلاگ — اسٹاک نہیں', value: r.code })),
  ];
  const accounted = balances.grey + balances.processed + balances.contractor + balances.loss + getProductionConsumedMeters(data) + (getReconciliation(data).returned ?? 0);
  return { balances, movements, records, purchased, issued, reconciled: Math.abs(purchased - accounted) < 0.00005 };
}

export function selectScenarioStep(data: DomainState): 0 | 1 | 2 | 3 {
  const movements = Object.values(data.movements);
  if (movements.some((m) => m.sourceType === 'PROCESSING_RECEIPT')) return 3;
  if (movements.some((m) => m.sourceType === 'PROCESSING_ISSUE')) return 2;
  if (movements.some((m) => m.sourceType === 'GOODS_RECEIPT')) return 1;
  return 0;
}
