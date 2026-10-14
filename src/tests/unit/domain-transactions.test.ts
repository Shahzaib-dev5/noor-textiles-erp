import { describe, expect, it } from 'vitest';
import { createScenarioState, createSeedState, DEMO_IDS as ids } from '@/data/seed';
import type { DomainState } from '@/domain/entities';
import { domainStateSchema, validateDomainState } from '@/domain/validators/state';
import { getInventoryBalances, getInventorySummary, getReconciliation } from '@/services/inventory';
import { issueProcessing, postGoodsReceipt, receiveProcessing, type TransactionResult } from '@/services/transactions';

const context = { at: '2026-02-01T04:00:00.000Z', actorId: ids.actor };
function posted(result: TransactionResult): DomainState {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.state;
}
const receivedScenario = () => posted(postGoodsReceipt(createScenarioState(), ids.goodsReceipt, context));
const issuedScenario = () => posted(issueProcessing(receivedScenario(), ids.challan, context));

/** Add a second item in the same PO/GRN with its own fabric/lot, still sharing normalized parents. */
function multiItemScenario(): DomainState {
  const state = createScenarioState();
  state.fabrics['fabric:second'] = { ...state.fabrics[ids.fabric], id: 'fabric:second', name: 'کپاس', widthInches: 54 };
  state.purchaseOrderLines['po-line:second'] = { ...state.purchaseOrderLines[ids.purchaseOrderLine], id: 'po-line:second', fabricId: 'fabric:second', quantityMeters: 200, originalQuantity: 200 };
  state.purchaseOrders[ids.purchaseOrder].lineIds.push('po-line:second');
  state.lots['lot:second'] = { ...state.lots[ids.lot], id: 'lot:second', code: 'LOT-SECOND', fabricId: 'fabric:second', sourceGoodsReceiptLineId: 'grn-line:second' };
  state.goodsReceiptLines['grn-line:second'] = { ...state.goodsReceiptLines[ids.goodsReceiptLine], id: 'grn-line:second', purchaseOrderLineId: 'po-line:second', lotId: 'lot:second', quantityMeters: 200, originalQuantity: 200 };
  state.goodsReceipts[ids.goodsReceipt].lineIds.push('grn-line:second');
  return state;
}

function addSecondReceipt(state: DomainState, outputMeters: number, lossMeters = 0): string {
  const receiptId = 'pr:2026-0002'; const lineId = 'pr-line:2026-0002-1';
  state.processingReceipts[receiptId] = { ...state.processingReceipts[ids.receipt], id: receiptId, number: 'PR-2026-0002', status: 'APPROVED', lineIds: [lineId] };
  state.processingReceiptLines[lineId] = { ...state.processingReceiptLines[ids.receiptLine], id: lineId, processingReceiptId: receiptId, outputMeters, lossMeters, lossReason: lossMeters ? 'منظور شدہ اضافی نقصان' : '' };
  return receiptId;
}

describe('goods receipt transaction', () => {
  it('posts all receipt movements and PO completion atomically, without mutating its input', () => {
    const initial = createScenarioState(); const before = JSON.stringify(initial);
    const next = posted(postGoodsReceipt(initial, ids.goodsReceipt, context));
    expect(JSON.stringify(initial)).toBe(before);
    expect(getInventorySummary(next)).toEqual({ grey: 1000, processed: 0, contractor: 0, loss: 0, finished: 0 });
    expect(next.goodsReceipts[ids.goodsReceipt].status).toBe('POSTED');
    expect(next.purchaseOrders[ids.purchaseOrder].status).toBe('COMPLETED');
    expect(Object.values(next.movements)).toHaveLength(1);
    expect(Object.values(next.movements)[0]).toMatchObject({ sourceDocumentId: ids.goodsReceipt, sourceLineId: ids.goodsReceiptLine, lotId: ids.lot, quantityMeters: 1000, origin: 'USER' });
  });
  it('rejects duplicate posting without changing the ledger', () => {
    const state = receivedScenario(); const before = JSON.stringify(state);
    expect(postGoodsReceipt(state, ids.goodsReceipt, context)).toMatchObject({ ok: false, error: { code: 'ALREADY_POSTED' } });
    expect(JSON.stringify(state)).toBe(before);
  });
  it.each(['DRAFT', 'CANCELLED'] as const)('rejects a %s receipt', (status) => {
    const state = createScenarioState(); state.goodsReceipts[ids.goodsReceipt].status = status;
    expect(postGoodsReceipt(state, ids.goodsReceipt, context)).toMatchObject({ ok: false, error: { code: 'INVALID_STATUS' } });
  });
  it('rejects receipt quantities larger than the purchase order', () => {
    const state = createScenarioState();
    state.goodsReceiptLines[ids.goodsReceiptLine].quantityMeters = 1001;
    state.goodsReceiptLines[ids.goodsReceiptLine].originalQuantity = 1001;
    expect(postGoodsReceipt(state, ids.goodsReceipt, context)).toMatchObject({ ok: false, error: { code: 'OVER_RECEIPT' } });
    expect(Object.keys(state.movements)).toHaveLength(0);
  });
  it('supports multiple fabric items and preserves their distinct lots', () => {
    const state = posted(postGoodsReceipt(multiItemScenario(), ids.goodsReceipt, context));
    expect(getInventorySummary(state).grey).toBe(1200);
    expect(getInventoryBalances(state).map((balance) => [balance.lotId, balance.onHandMeters])).toEqual([[ids.lot, 1000], ['lot:second', 200]]);
    expect(state.purchaseOrders[ids.purchaseOrder].status).toBe('COMPLETED');
  });
  it('keeps the order partially received until all its items are received', () => {
    const state = createScenarioState();
    state.purchaseOrderLines[ids.purchaseOrderLine].quantityMeters = 1500;
    state.purchaseOrderLines[ids.purchaseOrderLine].originalQuantity = 1500;
    const next = posted(postGoodsReceipt(state, ids.goodsReceipt, context));
    expect(next.purchaseOrders[ids.purchaseOrder].status).toBe('PARTIALLY_RECEIVED');
    expect(getInventorySummary(next).grey).toBe(1000);
  });
  it('checks cumulative quantities across separate GRNs and completes only at the ordered total', () => {
    const initial = createScenarioState();
    initial.purchaseOrderLines[ids.purchaseOrderLine].quantityMeters = 1500;
    initial.purchaseOrderLines[ids.purchaseOrderLine].originalQuantity = 1500;
    const state = posted(postGoodsReceipt(initial, ids.goodsReceipt, context));
    state.goodsReceipts['grn:2026-0002'] = { ...state.goodsReceipts[ids.goodsReceipt], id: 'grn:2026-0002', number: 'GRN-2026-0002', status: 'APPROVED', lineIds: ['grn-line:2026-0002-1'] };
    state.goodsReceiptLines['grn-line:2026-0002-1'] = { ...state.goodsReceiptLines[ids.goodsReceiptLine], id: 'grn-line:2026-0002-1', goodsReceiptId: 'grn:2026-0002', lotId: 'lot:second-grn', quantityMeters: 501, originalQuantity: 501 };
    state.lots['lot:second-grn'] = { ...state.lots[ids.lot], id: 'lot:second-grn', code: 'LOT-SECOND-GRN', sourceGoodsReceiptLineId: 'grn-line:2026-0002-1' };
    expect(postGoodsReceipt(state, 'grn:2026-0002', context)).toMatchObject({ ok: false, error: { code: 'OVER_RECEIPT' } });
    expect(getInventorySummary(state).grey).toBe(1000);
    state.goodsReceiptLines['grn-line:2026-0002-1'].quantityMeters = 500;
    state.goodsReceiptLines['grn-line:2026-0002-1'].originalQuantity = 500;
    const completed = posted(postGoodsReceipt(state, 'grn:2026-0002', context));
    expect(getInventorySummary(completed).grey).toBe(1500);
    expect(completed.purchaseOrders[ids.purchaseOrder].status).toBe('COMPLETED');
  });
});

describe('processing issue transaction', () => {
  it('moves 400 meters into contractor custody with paired category-specific movements', () => {
    const state = issuedScenario();
    expect(getInventorySummary(state)).toEqual({ grey: 600, processed: 0, contractor: 400, loss: 0, finished: 0 });
    expect(state.challans[ids.challan].status).toBe('POSTED');
    expect(Object.values(state.movements).filter((movement) => movement.sourceType === 'PROCESSING_ISSUE').map((movement) => movement.quantityMeters)).toEqual([-400, 400]);
  });
  it('rejects insufficient and zero stock before any movement is committed', () => {
    const noStock = createScenarioState();
    expect(issueProcessing(noStock, ids.challan, context)).toMatchObject({ ok: false, error: { code: 'INSUFFICIENT_STOCK' } });
    const state = receivedScenario(); state.challanLines[ids.challanLine].quantityMeters = 1001;
    const before = JSON.stringify(state);
    expect(issueProcessing(state, ids.challan, context)).toMatchObject({ ok: false, error: { code: 'INSUFFICIENT_STOCK' } });
    expect(JSON.stringify(state)).toBe(before);
  });
  it('aggregates lines for the same lot to prevent two individually-valid lines overissuing it', () => {
    const state = receivedScenario();
    state.challanLines['pc-line:second'] = { ...state.challanLines[ids.challanLine], id: 'pc-line:second', quantityMeters: 700 };
    state.challans[ids.challan].lineIds.push('pc-line:second');
    expect(issueProcessing(state, ids.challan, context)).toMatchObject({ ok: false, error: { code: 'INSUFFICIENT_STOCK' } });
    expect(getInventorySummary(state).grey).toBe(1000);
  });
  it('supports a challan carrying multiple lots without mixing their balances', () => {
    const state = posted(postGoodsReceipt(multiItemScenario(), ids.goodsReceipt, context));
    state.challanLines['pc-line:second'] = { ...state.challanLines[ids.challanLine], id: 'pc-line:second', lotId: 'lot:second', quantityMeters: 100 };
    state.challans[ids.challan].lineIds.push('pc-line:second');
    const next = posted(issueProcessing(state, ids.challan, context));
    expect(getInventorySummary(next)).toMatchObject({ grey: 700, contractor: 500 });
    expect(getInventoryBalances(next).filter((balance) => balance.lotId === 'lot:second').map((balance) => balance.onHandMeters)).toEqual([100, 100]);
  });
  it('rejects duplicate issues', () => {
    expect(issueProcessing(issuedScenario(), ids.challan, context)).toMatchObject({ ok: false, error: { code: 'ALREADY_POSTED' } });
  });
});

describe('partial processing receipt and explicit loss', () => {
  it('records 380 meters physical output and 10 meters explicit approved loss, leaving 10 in custody', () => {
    const initial = issuedScenario(); const before = JSON.stringify(initial);
    const state = posted(receiveProcessing(initial, ids.receipt, context));
    expect(getInventorySummary(state)).toEqual({ grey: 600, processed: 380, contractor: 10, loss: 10, finished: 0 });
    expect(state.challans[ids.challan].status).toBe('PARTIALLY_RECEIVED');
    expect(Object.values(state.processingLosses)).toHaveLength(1);
    expect(Object.values(state.processingLosses)[0]).toMatchObject({ quantityMeters: 10, approvedById: ids.actor, lotId: ids.lot, receiptId: ids.receipt });
    expect(Object.values(state.movements).filter((movement) => movement.sourceType === 'PROCESSING_LOSS')).toHaveLength(1);
    expect(JSON.stringify(initial)).toBe(before);
  });
  it('does not infer shrinkage as a loss when it was not explicitly recorded', () => {
    const state = issuedScenario(); state.processingReceiptLines[ids.receiptLine].lossMeters = 0;
    const next = posted(receiveProcessing(state, ids.receipt, context));
    expect(getInventorySummary(next)).toMatchObject({ processed: 380, contractor: 20, loss: 0 });
    expect(Object.keys(next.processingLosses)).toHaveLength(0);
  });
  it('requires a reason and valid approver for every positive loss', () => {
    const state = issuedScenario();
    delete state.processingReceiptLines[ids.receiptLine].lossApprovedById;
    expect(receiveProcessing(state, ids.receipt, context).ok).toBe(false);
    state.processingReceiptLines[ids.receiptLine].lossApprovedById = ids.actor;
    state.processingReceiptLines[ids.receiptLine].lossReason = ' ';
    expect(receiveProcessing(state, ids.receipt, context).ok).toBe(false);
  });
  it('rejects output plus loss above issued quantity even when output alone fits', () => {
    const state = issuedScenario(); state.processingReceiptLines[ids.receiptLine].outputMeters = 395;
    const before = JSON.stringify(state);
    expect(receiveProcessing(state, ids.receipt, context)).toMatchObject({ ok: false, error: { code: 'OVER_RECEIPT' } });
    expect(JSON.stringify(state)).toBe(before);
  });
  it('aggregates multiple receipt lines for a single challan line before posting', () => {
    const state = issuedScenario();
    state.processingReceiptLines['pr-line:extra'] = { ...state.processingReceiptLines[ids.receiptLine], id: 'pr-line:extra', outputMeters: 20, lossMeters: 0 };
    state.processingReceipts[ids.receipt].lineIds.push('pr-line:extra');
    expect(receiveProcessing(state, ids.receipt, context)).toMatchObject({ ok: false, error: { code: 'OVER_RECEIPT' } });
  });
  it('returns an atomic failure for unsafe aggregate arithmetic instead of throwing', () => {
    const state = issuedScenario();
    state.processingReceiptLines[ids.receiptLine].outputMeters = 600_000_000_000;
    state.processingReceiptLines[ids.receiptLine].lossMeters = 600_000_000_000;
    expect(validateDomainState(state).ok).toBe(true);
    const before = JSON.stringify(state);
    expect(() => receiveProcessing(state, ids.receipt, context)).not.toThrow();
    expect(receiveProcessing(state, ids.receipt, context)).toMatchObject({ ok: false, error: { code: 'TRANSACTION_REJECTED' } });
    expect(JSON.stringify(state)).toBe(before);
  });
  it('accepts subsequent partial receipts and completes only when all issued meters are settled', () => {
    const state = createSeedState();
    const receiptId = addSecondReceipt(state, 10);
    const next = posted(receiveProcessing(state, receiptId, context));
    expect(getInventorySummary(next)).toEqual({ grey: 600, processed: 390, contractor: 0, loss: 10, finished: 0 });
    expect(next.challans[ids.challan].status).toBe('COMPLETED');
    expect(receiveProcessing(next, receiptId, context)).toMatchObject({ ok: false, error: { code: 'ALREADY_POSTED' } });
  });
  it('allows explicit loss-only settlement with no fabricated physical output', () => {
    const state = createSeedState(); const receiptId = addSecondReceipt(state, 0, 10);
    const next = posted(receiveProcessing(state, receiptId, context));
    expect(getInventorySummary(next)).toMatchObject({ processed: 380, contractor: 0, loss: 20 });
    expect(next.challans[ids.challan].status).toBe('COMPLETED');
  });
  it('rejects subsequent receipts exceeding the remaining contractor balance', () => {
    const state = createSeedState(); const receiptId = addSecondReceipt(state, 11);
    expect(receiveProcessing(state, receiptId, context)).toMatchObject({ ok: false, error: { code: 'OVER_RECEIPT' } });
  });
  it('rejects duplicates and receiving a challan that was never issued', () => {
    expect(receiveProcessing(createSeedState(), ids.receipt, context)).toMatchObject({ ok: false, error: { code: 'ALREADY_POSTED' } });
    expect(receiveProcessing(createScenarioState(), ids.receipt, context)).toMatchObject({ ok: false, error: { code: 'INVALID_STATUS' } });
  });
});

describe('golden dataset and strict imported-state integrity', () => {
  it('replays deterministic linked postings and reconciles all meters exactly', () => {
    const state = createSeedState();
    expect(state).toEqual(createSeedState());
    expect(validateDomainState(state).ok).toBe(true);
    expect(getReconciliation(state)).toEqual({ purchased: 1000, issued: 400, grey: 600, processed: 380, contractor: 10, loss: 10, finished: 0, difference: 0, balanced: true });
    expect(Object.values(state.movements)).toHaveLength(6);
    expect(Object.values(state.movements).every((movement) => movement.origin === 'SEED')).toBe(true);
    expect(Object.values(state.finishedSKUs)[0].catalogueOnly).toBe(true);
    expect(getInventoryBalances(state).some((balance) => balance.category === 'FINISHED_GOODS')).toBe(false);
  });
  it('validates a fresh isolated scenario with no authoritative starting quantity', () => {
    const state = createScenarioState();
    expect(validateDomainState(state).ok).toBe(true);
    expect(getInventorySummary(state)).toEqual({ grey: 0, processed: 0, contractor: 0, loss: 0, finished: 0 });
    expect(Object.values(state.lots)).toHaveLength(1);
    expect(Object.values(state.rolls)).toHaveLength(10);
  });
  it.each([
    ['orphan fabric', (state: DomainState) => { state.lots[ids.lot].fabricId = 'fabric:missing'; }],
    ['second company', (state: DomainState) => { state.companies['company:other'] = { ...state.companies[ids.company], id: 'company:other' }; }],
    ['fabricated posted movement', (state: DomainState) => { const movement = Object.values(state.movements)[0]; state.movements['movement:fake'] = { ...movement, id: 'movement:fake' }; }],
    ['deleted movement history', (state: DomainState) => { delete state.movements[Object.keys(state.movements)[0]]; }],
    ['negative stock movement', (state: DomainState) => { Object.values(state.movements)[0].quantityMeters = -1000; }],
    ['missing explicit loss', (state: DomainState) => { state.processingLosses = {}; }],
    ['false completed challan', (state: DomainState) => { state.challans[ids.challan].status = 'COMPLETED'; }],
    ['changed posted source quantity', (state: DomainState) => { state.challanLines[ids.challanLine].quantityMeters = 401; }],
    ['invalid source metadata', (state: DomainState) => { state.goodsReceipts[ids.goodsReceipt].createdBy = 'employee:missing'; }],
    ['inherited prototype key actor', (state: DomainState) => { state.goodsReceipts[ids.goodsReceipt].createdBy = 'constructor'; }],
    ['inherited prototype key fabric', (state: DomainState) => { state.lots[ids.lot].fabricId = 'toString'; }],
    ['mislabelled inventory category', (state: DomainState) => { Object.values(state.movements)[0].category = 'PROCESSED'; }],
    ['dangling future BOM reference', (state: DomainState) => { state.designs[ids.design].bomId = 'bom:missing'; }],
    ['unimplemented reservation', (state: DomainState) => { state.reservations['reservation:one'] = { ...state.challanLines[ids.challanLine], id: 'reservation:one', locationId: ids.greyLocation, category: 'GREY', sourceDocumentId: ids.challan }; }],
  ] as const)('rejects %s', (_name, corrupt) => {
    const state = createSeedState(); corrupt(state);
    expect(validateDomainState(state).ok).toBe(false);
  });
  it('returns a typed failure rather than throwing for invalid quantity refinements', () => {
    const state = createSeedState(); Object.values(state.rolls)[0].originalLength = -1;
    expect(() => validateDomainState(state)).not.toThrow();
    expect(() => domainStateSchema.safeParse(state)).not.toThrow();
    expect(validateDomainState(state).ok).toBe(false);
  });
  it('rejects dishonest histories where a later receipt hides an earlier negative balance', () => {
    const state = createSeedState();
    const receiptMovement = Object.values(state.movements).find((movement) => movement.sourceType === 'GOODS_RECEIPT');
    if (!receiptMovement) throw new Error('Missing fixture movement');
    receiptMovement.createdAt = receiptMovement.updatedAt = receiptMovement.occurredAt = '2026-01-06T04:00:00.000Z';
    expect(validateDomainState(state).ok).toBe(false);
  });
  it('rejects unknown keys, invalid timestamps, quantities and primitive input', () => {
    expect(validateDomainState({ ...createSeedState(), hiddenStock: 100 }).ok).toBe(false);
    expect(validateDomainState(null).ok).toBe(false);
    const state = createScenarioState(); state.goodsReceipts[ids.goodsReceipt].receivedOn = '2026-02-30';
    expect(validateDomainState(state).ok).toBe(false);
    state.goodsReceipts[ids.goodsReceipt].receivedOn = '2026-01-02';
    state.challanLines[ids.challanLine].quantityMeters = 0.00001;
    expect(validateDomainState(state).ok).toBe(false);
  });
  it('rejects a transaction against corrupt existing state and invalid actor/time', () => {
    const corrupt = receivedScenario(); corrupt.movements = {};
    expect(issueProcessing(corrupt, ids.challan, context)).toMatchObject({ ok: false, error: { code: 'INVALID_STATE' } });
    expect(postGoodsReceipt(createScenarioState(), ids.goodsReceipt, { ...context, actorId: 'employee:unknown' })).toMatchObject({ ok: false, error: { code: 'INVALID_CONTEXT' } });
    expect(postGoodsReceipt(createScenarioState(), ids.goodsReceipt, { ...context, at: 'not-a-date' })).toMatchObject({ ok: false, error: { code: 'INVALID_CONTEXT' } });
    expect(issueProcessing(receivedScenario(), ids.challan, { ...context, at: '2026-01-01T05:00:00.000Z' })).toMatchObject({ ok: false, error: { code: 'BACKDATED_TRANSACTION' } });
  });
});
