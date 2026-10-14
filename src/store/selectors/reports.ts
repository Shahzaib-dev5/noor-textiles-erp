import type { DomainState } from '@/domain/entities';
import { roundQuantity } from '@/domain/value-objects/quantity';
import { selectBatchCosts, selectInvoiceBalances, sum } from './business';
import { supplierLedger, receiptLineValue } from './procurement';
export function selectSupplierPurchases(data: DomainState) {
  return Object.values(data.suppliers).map((supplier) => {
    const receipts = Object.values(data.goodsReceipts).filter((r) => r.status === 'POSTED' && data.purchaseOrders[r.purchaseOrderId].supplierId === supplier.id);
    return { supplierId: supplier.id, meters: roundQuantity(sum(receipts, (r) => sum(r.lineIds, (id) => data.goodsReceiptLines[id].quantityMeters))), postedValuePaisa: sum(receipts, (r) => sum(r.lineIds, (id) => { return receiptLineValue(data,id); })), payablePaisa: supplierLedger(data,supplier.id).outstanding };
  });
}
export function selectContractorBalances(data: DomainState) {
  return Object.values(data.contractors).map((c) => {
    const movements = Object.values(data.movements).filter((m) => m.contractorId === c.id && m.category === 'PROCESSING_OUT');
    const issued = sum(movements.filter((m) => m.sourceType === 'PROCESSING_ISSUE'), (m) => m.quantityMeters), returned = -sum(movements.filter((m) => m.sourceType === 'PROCESSING_RECEIPT'), (m) => m.quantityMeters), loss = -sum(movements.filter((m) => m.sourceType === 'PROCESSING_LOSS'), (m) => m.quantityMeters);
    return { contractorId: c.id, issued: roundQuantity(issued), returned: roundQuantity(returned), loss: roundQuantity(loss), held: roundQuantity(issued - returned - loss), recordedChargesPaisa: sum(Object.values(data.history?.processingCharges ?? {}).filter((r) => r.contractorId === c.id), (r) => r.totalPaisa) };
  });
}
/** Receivable ledger projections retain source IDs. Unapplied cash is a separate credit projection. */
export function selectCustomerLedger(data: DomainState, customerId: string) {
  const h = data.history, customer = data.customers[customerId]; if (!customer) return null;
  const entries = [
    ...(customer.openingBalancePaisa ? [{ sourceId: customer.id, date: customer.createdAt.slice(0, 10), debitPaisa: customer.openingBalancePaisa, creditPaisa: 0, type: 'OPENING' }] : []),
    ...selectInvoiceBalances(data).filter((i) => i.customerId === customerId).map((i) => ({ sourceId: i.id, date: i.date, debitPaisa: i.totalPaisa, creditPaisa: 0, type: 'INVOICE' })),
    ...Object.values(h?.paymentAllocations ?? {}).filter((a) => h?.payments[a.paymentId].customerId === customerId).map((a) => ({ sourceId: a.id, date: h!.payments[a.paymentId].date, debitPaisa: 0, creditPaisa: a.amountPaisa, type: 'ALLOCATION' })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.sourceId.localeCompare(b.sourceId));
  const cash = sum(Object.values(h?.payments ?? {}).filter((p) => p.customerId === customerId), (p) => p.amountPaisa);
  return { customerId, entries, outstandingPaisa: sum(entries, (r) => r.debitPaisa - r.creditPaisa), unappliedCreditPaisa: cash - sum(entries, (r) => r.creditPaisa) };
}
export function selectCollectionContribution(data: DomainState) {
  const h = data.history; if (!h) return [];
  const costs = selectBatchCosts(data);
  return Object.values(h.collections).map((collection) => {
    let salesPaisa = 0, costPaisa = 0;
    for (const line of Object.values(h.invoiceLines)) {
      const skuId = h.dispatchLines[line.dispatchLineId].skuId;
      if (data.designs[data.finishedSKUs[skuId].designId].collectionId !== collection.id) continue;
      const pack = Object.values(h.packaging).find((p) => p.skuId === skuId), batch = costs.find((b) => b.id === pack?.batchId && b.fullyCosted);
      if (batch?.completedSuits) { salesPaisa += line.totalPaisa; costPaisa += Math.round(batch.totalCost * line.suits / batch.completedSuits); }
    }
    return { collectionId: collection.id, coveredInvoicedSalesPaisa: salesPaisa, attributedDirectCostPaisa: costPaisa, grossContributionPaisa: salesPaisa - costPaisa, excludesIndirectExpenses: true, excludesProcessingLossAbsorption: true };
  });
}
