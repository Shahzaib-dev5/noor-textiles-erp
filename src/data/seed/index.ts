import type { DomainState } from '@/domain/entities';
import { seedMetadata as meta } from '@/data/factories/metadata';
import { issueProcessing, postGoodsReceipt, receiveProcessing } from '@/services/transactions';
import { validateDomainState } from '@/domain/validators/state';

export const DEMO_IDS = {
  company: 'company:noor', actor: 'employee:owner', supplier: 'supplier:lahore-fabrics', fabric: 'fabric:cotton-lawn-60',
  lot: 'lot:grey-2026-001', contractor: 'contractor:lahore-processing', purchaseOrder: 'po:2026-0001',
  purchaseOrderLine: 'po-line:2026-0001-1', goodsReceipt: 'grn:2026-0001', goodsReceiptLine: 'grn-line:2026-0001-1',
  challan: 'pc:2026-0001', challanLine: 'pc-line:2026-0001-1', receipt: 'pr:2026-0001', receiptLine: 'pr-line:2026-0001-1',
  greyLocation: 'location:grey-a', processedLocation: 'location:processed-a', contractorLocation: 'location:contractor-lahore',
  customer: 'customer:liberty-cloth', design: 'design:bahar-001', sku: 'sku:bahar-001-3pc',
} as const;

/** Same connected documents as the golden dataset, deliberately unposted for an isolated inspector session. */
export function createScenarioState(origin: 'SEED' | 'USER' = 'USER'): DomainState {
  const m: typeof meta = (id, status) => meta(id, status, origin);
  const ids = DEMO_IDS;
  const state: DomainState = {
    companies: { [ids.company]: { ...m(ids.company, 'ACTIVE'), name: 'نور ٹیکسٹائلز لاہور', city: 'لاہور', address: 'اعظم کلاتھ مارکیٹ، لاہور، پاکستان', currency: 'PKR', locale: 'ur-PK' } },
    roles: {
      'role:owner': { ...m('role:owner', 'ACTIVE'), name: 'مالک / منتظم', permissionKeys: ['demo.read', 'demo.post', 'demo.manage'] },
      'role:viewer': { ...m('role:viewer', 'ACTIVE'), name: 'مشاہدہ کنندہ', permissionKeys: ['demo.read'] },
    },
    employees: {
      [ids.actor]: { ...m(ids.actor, 'ACTIVE'), companyId: ids.company, name: 'احمد نور', roleId: 'role:owner' },
      'employee:viewer': { ...m('employee:viewer', 'ACTIVE'), companyId: ids.company, name: 'علی حسن', roleId: 'role:viewer' },
    },
    warehouses: { 'warehouse:main': { ...m('warehouse:main', 'ACTIVE'), companyId: ids.company, name: 'مرکزی گودام' } },
    locations: {
      [ids.greyLocation]: { ...m(ids.greyLocation, 'ACTIVE'), name: 'کورا کپڑا — ریک اے', warehouseId: 'warehouse:main', category: 'GREY' },
      [ids.processedLocation]: { ...m(ids.processedLocation, 'ACTIVE'), name: 'پروسیس شدہ کپڑا — ریک اے', warehouseId: 'warehouse:main', category: 'PROCESSED' },
      [ids.contractorLocation]: { ...m(ids.contractorLocation, 'ACTIVE'), name: 'لاہور پروسیسنگ — تحویل', contractorId: ids.contractor, category: 'PROCESSING_OUT' },
    },
    suppliers: { [ids.supplier]: { ...m(ids.supplier, 'ACTIVE'), name: 'لاہور فیبرک سپلائرز', city: 'لاہور', phone: '0300-0000001', openingBalancePaisa: 0 } },
    fabrics: { [ids.fabric]: { ...m(ids.fabric, 'ACTIVE'), name: 'کاٹن لان', composition: '100% Cotton Lawn', widthInches: 60, inventoryUnit: 'METER' } },
    lots: { [ids.lot]: { ...m(ids.lot, 'ACTIVE'), code: 'LOT-2026-001', fabricId: ids.fabric, supplierId: ids.supplier, sourceGoodsReceiptLineId: ids.goodsReceiptLine } },
    rolls: Object.fromEntries(Array.from({ length: 10 }, (_, index) => { const id = `roll:2026-${String(index + 1).padStart(3, '0')}`; return [id, { ...m(id, 'ACTIVE'), lotId: ids.lot, label: `ROLL-${String(index + 1).padStart(3, '0')}`, packagingUnit: 'ROLL', actualLengthMeters: 100, originalUnit: 'METER', originalLength: 100 }]; })),
    purchaseOrders: { [ids.purchaseOrder]: { ...m(ids.purchaseOrder, 'APPROVED'), number: 'PO-2026-0001', supplierId: ids.supplier, lineIds: [ids.purchaseOrderLine], orderDate: '2026-01-01' } },
    purchaseOrderLines: { [ids.purchaseOrderLine]: { ...m(ids.purchaseOrderLine, 'ACTIVE'), purchaseOrderId: ids.purchaseOrder, fabricId: ids.fabric, quantityMeters: 1000, originalQuantity: 1000, originalUnit: 'METER', conversionMetersPerUnit: 1, unitPricePaisaPerMeter: 25000 } },
    goodsReceipts: { [ids.goodsReceipt]: { ...m(ids.goodsReceipt, 'APPROVED'), number: 'GRN-2026-0001', purchaseOrderId: ids.purchaseOrder, warehouseLocationId: ids.greyLocation, lineIds: [ids.goodsReceiptLine], receivedOn: '2026-01-02' } },
    goodsReceiptLines: { [ids.goodsReceiptLine]: { ...m(ids.goodsReceiptLine, 'ACTIVE'), goodsReceiptId: ids.goodsReceipt, purchaseOrderLineId: ids.purchaseOrderLine, lotId: ids.lot, quantityMeters: 1000, originalQuantity: 1000, originalUnit: 'METER', conversionMetersPerUnit: 1 } },
    contractors: { [ids.contractor]: { ...m(ids.contractor, 'ACTIVE'), name: 'لاہور ٹیکسٹائل پروسیسنگ', city: 'لاہور', phone: '0300-0000002', services: ['BLEACHING', 'DYEING', 'DIGITAL_PRINTING', 'FINISHING'] } },
    challans: { [ids.challan]: { ...m(ids.challan, 'APPROVED'), number: 'PC-2026-0001', contractorId: ids.contractor, fromLocationId: ids.greyLocation, contractorLocationId: ids.contractorLocation, serviceType: 'DYEING', lineIds: [ids.challanLine] } },
    challanLines: { [ids.challanLine]: { ...m(ids.challanLine, 'ACTIVE'), challanId: ids.challan, lotId: ids.lot, quantityMeters: 400 } },
    processingReceipts: { [ids.receipt]: { ...m(ids.receipt, 'APPROVED'), number: 'PR-2026-0001', challanId: ids.challan, destinationLocationId: ids.processedLocation, lineIds: [ids.receiptLine] } },
    processingReceiptLines: { [ids.receiptLine]: { ...m(ids.receiptLine, 'ACTIVE'), processingReceiptId: ids.receipt, challanLineId: ids.challanLine, outputMeters: 380, lossMeters: 10, lossReason: 'منظور شدہ رنگائی سکڑاؤ', lossApprovedById: ids.actor } },
    processingLosses: {}, movements: {}, reservations: {}, activityLogs: {},
    customers: { [ids.customer]: { ...m(ids.customer, 'ACTIVE'), name: 'لبرٹی کلاتھ ہاؤس', city: 'لاہور', phone: '0300-0000003', openingBalancePaisa: 0 } },
    designs: { [ids.design]: { ...m(ids.design, 'APPROVED'), code: 'DSN-BAHAR-001', name: 'بہار لان — گلابی', pieceCount: 3, imagePath: '/images/lawn-sample.svg' } },
    finishedSKUs: { [ids.sku]: { ...m(ids.sku, 'ACTIVE'), code: 'BAHAR-001-3PC', designId: ids.design, name: 'بہار لان تین پیس سوٹ', pieceCount: 3, unit: 'SUIT', catalogueOnly: true } },
  };
  const validation = validateDomainState(state);
  if (!validation.ok) throw new Error(`Invalid scenario: ${validation.error.message}`);
  return validation.state;
}

/** Replays the public transaction reducers; there is no disconnected hand-written stock fixture. */
export function createSeedState(): DomainState {
  let state = createScenarioState('SEED');
  const operations = [
    () => postGoodsReceipt(state, DEMO_IDS.goodsReceipt, { at: '2026-01-02T04:00:00.000Z', actorId: DEMO_IDS.actor, origin: 'SEED' }),
    () => issueProcessing(state, DEMO_IDS.challan, { at: '2026-01-03T04:00:00.000Z', actorId: DEMO_IDS.actor, origin: 'SEED' }),
    () => receiveProcessing(state, DEMO_IDS.receipt, { at: '2026-01-05T04:00:00.000Z', actorId: DEMO_IDS.actor, origin: 'SEED' }),
  ];
  operations.forEach((operation) => { const result = operation(); if (!result.ok) throw new Error(`Invalid seed posting: ${result.error.message}`); state = result.state; });
  return state;
}
