import type { DomainState } from '@/domain/entities';
import type { HistoricalDataset } from '@/domain/entities/history';
import { createSeedState, DEMO_IDS } from '@/data/seed';
import { seedMetadata } from '@/data/factories/metadata';
import { postGoodsReceipt, issueProcessing, receiveProcessing } from '@/services/transactions';
import { validateDomainState } from '@/domain/validators/state';
import { roundQuantity } from '@/domain/value-objects/quantity';
import { multiplyMoney } from '@/domain/value-objects/money';

const serial = (i: number) => String(i + 1).padStart(4, '0');
const identity = (kind: string, i: number) => kind + ':expanded-' + serial(i);
const date = (month: number, day = 1) => '2026-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
const m = seedMetadata;
const companyId = DEMO_IDS.company;
const historical = <S extends string>(id: string, status: S, day = '2026-01-01') => ({ id, status, companyId, origin: 'SEED' as const, createdBy: DEMO_IDS.actor, updatedBy: DEMO_IDS.actor, createdAt: day + 'T04:00:00.000Z', updatedAt: day + 'T04:00:00.000Z' });
const doc = (id: string, number: string, day: string) => ({ ...historical(id, 'POSTED' as const, day), number, date: day });
const supplierNames = ['لاہور گری فیبرک ٹریڈرز', 'پنجاب کاٹن سپلائرز', 'فیصل آباد لوم ہاؤس', 'راوی ٹیکسٹائل سپلائی', 'ایسٹرن فیبرک مرچنٹس', 'سیالکوٹ ٹیکسٹائل ٹریڈرز', 'ملتان کاٹن لنک', 'شالیمار فیبرک ٹریڈنگ', 'الحمد کلاتھ سپلائرز', 'کشمیر ویونگ ٹریڈرز', 'پاک کاٹن ڈسٹری بیوشن', 'سپیریئر ٹیکسٹائل سپلائی'];
const englishSuppliers = ['Lahore Grey Fabric Traders', 'Punjab Cotton Suppliers', 'Faisalabad Loom House', 'Ravi Textile Supply', 'Eastern Fabric Merchants', 'Sialkot Textile Traders', 'Multan Cotton Link', 'Shalimar Fabric Trading', 'Al-Hamd Cloth Suppliers', 'Kashmir Weaving Traders', 'Pak Cotton Distribution', 'Superior Textile Supply'];
const fabricNames = ['کاٹن لان', 'فائن لان', 'کیمبرک', 'کاٹن', 'کھدر', 'لینن بلینڈ', 'وائل', 'ڈوبی کاٹن', 'کاٹن سلب', 'شفون', 'آرگنزا', 'وسکوس'];
const compositions = ['Cotton Lawn', 'Fine Cotton Lawn', 'Cotton Cambric', 'Cotton', 'Cotton Khaddar', 'Cotton Linen Blend', 'Cotton Voile', 'Dobby Cotton', 'Cotton Slub', 'Polyester Chiffon', 'Polyester Organza', 'Viscose'];
const contractorNames = ['لاہور ڈائینگ ورکس', 'راوی ٹیکسٹائل پروسیسنگ', 'پنجاب ڈیجیٹل پرنٹس', 'شالیمار فیبرک فنشنگ', 'فیصل آباد فیبرک فنشرز', 'رائل کیلنڈر ورکس', 'الفلاح فنشنگ', 'ایسٹرن ٹیکسٹائل پرنٹنگ'];
const cities = ['لاہور', 'فیصل آباد', 'ملتان', 'راولپنڈی', 'گوجرانوالہ', 'سیالکوٹ', 'کراچی', 'اسلام آباد', 'بہاولپور', 'سرگودھا'];

/** A separate deterministic builder; never changes the original golden fixture. */
export function createExpandedSeed(): DomainState {
  let state = createSeedState();
  for (const key of Object.keys(state) as (keyof DomainState)[]) {
    if (!['companies', 'roles', 'warehouses'].includes(key)) Object.assign(state, { [key]: {} });
  }
  for (let i = 0; i < 6; i++) { const id = i === 0 ? DEMO_IDS.actor : identity('employee', i); state.employees[id] = { ...m(id, 'ACTIVE'), companyId, roleId: i ? 'role:viewer' : 'role:owner', name: ['احمد نور', 'نمونہ خریداری افسر', 'نمونہ گودام افسر', 'نمونہ پیداوار افسر', 'نمونہ فروخت افسر', 'نمونہ اکاؤنٹس افسر'][i] }; }
  state.locations[DEMO_IDS.greyLocation] = { ...m(DEMO_IDS.greyLocation, 'ACTIVE'), name: 'کورا گودام', warehouseId: 'warehouse:main', category: 'GREY' };
  state.locations[DEMO_IDS.processedLocation] = { ...m(DEMO_IDS.processedLocation, 'ACTIVE'), name: 'پروسیس شدہ گودام', warehouseId: 'warehouse:main', category: 'PROCESSED' };
  const finishedLocation = 'location:finished-expanded';
  state.locations[finishedLocation] = { ...m(finishedLocation, 'ACTIVE'), name: 'تیار سوٹ گودام', warehouseId: 'warehouse:main', category: 'FINISHED_GOODS' };
  const h: HistoricalDataset = { version: 3, seedVersion: 'noor-expanded-2026-v1', companyId, asOf: '2026-10-01', supplierProfiles: {}, fabricProfiles: {}, customerProfiles: {}, contractorProfiles: {}, collections: {}, designProfiles: {}, variants: {}, boms: {}, bomLines: {}, processingSchedules: {}, processingCharges: {}, batches: {}, materialAllocations: {}, componentOutputs: {}, packaging: {}, finishedMovements: {}, salesOrders: {}, salesLines: {}, reservations: {}, dispatches: {}, dispatchLines: {}, invoices: {}, invoiceLines: {}, payments: {}, paymentAllocations: {}, supplierInvoices: {}, expenses: {} };
  for (let i = 0; i < 12; i++) {
    const supplier = identity('supplier', i), fabric = identity('fabric', i);
    state.suppliers[supplier] = { ...m(supplier, 'ACTIVE'), name: supplierNames[i], city: cities[i % cities.length], phone: '0000-DEMO-' + serial(i), openingBalancePaisa: 0 };
    const profile = identity('supplier-profile', i);
    h.supplierProfiles[profile] = { ...historical(profile, 'ACTIVE'), supplierId: supplier, code: 'SUP-' + serial(i), nameEnglish: englishSuppliers[i], contact: 'فرضی رابطہ ' + serial(i), email: 'supplier' + i + '@example.test', address: 'نمونہ کلاتھ مارکیٹ، ' + cities[i % cities.length], categories: [compositions[i]], termDays: 30, creditLimitPaisa: 500000000 };
    state.fabrics[fabric] = { ...m(fabric, 'ACTIVE'), name: fabricNames[i], composition: compositions[i], widthInches: [60, 58, 54, 56, 54, 58, 60, 54, 58, 44, 44, 56][i], inventoryUnit: 'METER' };
    const fp = identity('fabric-profile', i);
    h.fabricProfiles[fp] = { ...historical(fp, 'ACTIVE'), fabricId: fabric, supplierId: supplier, code: 'FAB-' + serial(i), category: compositions[i], gsm: [85, 75, 120, 110, 180, 150, 65, 130, 140, 45, 35, 95][i], ratePaisa: 18000 + i * 1800, reorderMeters: i > 9 ? 4000 : 250, grade: 'A' };
  }
  for (let i = 0; i < 8; i++) {
    const id = identity('contractor', i), location = identity('custody', i);
    const services = (i % 3 === 0 ? ['BLEACHING', 'DYEING'] : i % 3 === 1 ? ['DYEING', 'FINISHING'] : ['DIGITAL_PRINTING', 'FINISHING']) as DomainState['contractors'][string]['services'];
    state.contractors[id] = { ...m(id, 'ACTIVE'), name: contractorNames[i], city: cities[i % 3], phone: '0000-CONTRACTOR-' + serial(i), services };
    state.locations[location] = { ...m(location, 'ACTIVE'), name: contractorNames[i] + ' تحویل', category: 'PROCESSING_OUT', contractorId: id };
    const cp = identity('contractor-profile', i); h.contractorProfiles[cp] = { ...historical(cp, 'ACTIVE'), contractorId: id, termDays: 30, ratePaisaPerMeter: 2000 + i * 250 };
  }
  for (let i = 0; i < 20; i++) {
    const id = identity('customer', i); state.customers[id] = { ...m(id, 'ACTIVE'), name: ['بہار', 'مہک', 'رنگ', 'ستارہ', 'روشن'][i % 5] + ' نمونہ کلاتھ ہاؤس ' + serial(i), city: cities[i % 10], phone: '0000-CUSTOMER-' + serial(i), openingBalancePaisa: 0 };
    const p = identity('customer-profile', i); h.customerProfiles[p] = { ...historical(p, 'ACTIVE'), customerId: id, owner: 'فرضی تاجر ' + serial(i), address: 'نمونہ بازار، ' + cities[i % 10], termDays: 30, creditLimitPaisa: i % 4 === 0 ? 1000000 : 10000000 };
  }
  // All purchases post before processing to preserve the public reducer's chronological guard.
  for (let i = 0; i < 20; i++) {
    const po = identity('po', i), pol = identity('po-line', i), grn = identity('grn', i), grnl = identity('grn-line', i), lot = identity('lot', i);
    let quantity = 0;
    for (let r = 0; r < 40; r++) { const length = [48.5, 55, 62.25, 75, 90][(r + i) % 5]; const id = identity('roll', i * 40 + r); state.rolls[id] = { ...m(id, 'ACTIVE'), lotId: lot, label: 'ROLL-' + serial(i * 40 + r), packagingUnit: 'ROLL', actualLengthMeters: length, originalLength: length, originalUnit: 'METER' }; quantity += length; }
    state.lots[lot] = { ...m(lot, 'ACTIVE'), code: 'LOT-2026-' + serial(i), fabricId: identity('fabric', i % 12), supplierId: identity('supplier', i % 12), sourceGoodsReceiptLineId: grnl };
    state.purchaseOrders[po] = { ...m(po, 'APPROVED'), number: 'PO-2026-' + serial(i), supplierId: identity('supplier', i % 12), lineIds: [pol], orderDate: date(1 + Math.floor(i / 5), 1 + i % 5) };
    state.purchaseOrderLines[pol] = { ...m(pol, 'ACTIVE'), purchaseOrderId: po, fabricId: identity('fabric', i % 12), quantityMeters: quantity + (i > 17 ? 300 : 0), originalQuantity: quantity + (i > 17 ? 300 : 0), originalUnit: 'METER', conversionMetersPerUnit: 1, unitPricePaisaPerMeter: 18000 + (i % 12) * 1800 };
    const receivedOn = date(1 + Math.floor(i / 5), 2 + i % 5);
    state.goodsReceipts[grn] = { ...m(grn, 'APPROVED'), number: 'GRN-2026-' + serial(i), purchaseOrderId: po, warehouseLocationId: DEMO_IDS.greyLocation, lineIds: [grnl], receivedOn };
    state.goodsReceiptLines[grnl] = { ...m(grnl, 'ACTIVE'), goodsReceiptId: grn, purchaseOrderLineId: pol, lotId: lot, quantityMeters: quantity, originalQuantity: quantity, originalUnit: 'METER', conversionMetersPerUnit: 1 };
    const result = postGoodsReceipt(state, grn, { actorId: DEMO_IDS.actor, at: receivedOn + 'T04:00:00.000Z', origin: 'SEED' });
    if (!result.ok) throw new Error(result.error.message); state = result.state;
    const invoice = identity('supplier-invoice', i); h.supplierInvoices[invoice] = { ...doc(invoice, 'PINV-2026-' + serial(i), receivedOn), supplierId: identity('supplier', i % 12), goodsReceiptId: grn, dueOn: date(2 + Math.floor(i / 5), 2 + i % 5), totalPaisa: multiplyMoney(18000 + (i % 12) * 1800, quantity) };
  }
  for (let i = 0; i < 18; i++) {
    const id = identity('pc', i), line = identity('pc-line', i), contractor = identity('contractor', i % 8);
    state.challans[id] = { ...m(id, i === 17 ? 'CANCELLED' : 'APPROVED'), number: 'PC-2026-' + serial(i), contractorId: contractor, fromLocationId: DEMO_IDS.greyLocation, contractorLocationId: identity('custody', i % 8), serviceType: state.contractors[contractor].services[0], lineIds: [line] };
    state.challanLines[line] = { ...m(line, 'ACTIVE'), challanId: id, lotId: identity('lot', i), quantityMeters: 2200 };
    const issued = date(5, i + 1); const schedule = identity('processing-schedule', i);
    h.processingSchedules[schedule] = { ...historical(schedule, 'ACTIVE'), challanId: id, issuedOn: issued, dueOn: i < 15 ? date(6, i + 1) : '2026-09-01', workflow: (['A', 'B', 'C'] as const)[i % 3] };
    if (i === 17) continue;
    const result = issueProcessing(state, id, { actorId: DEMO_IDS.actor, at: issued + 'T04:00:00.000Z', origin: 'SEED' }); if (!result.ok) throw new Error(result.error.message); state = result.state;
  }
  for (let i = 0; i < 15; i++) {
    const receipt = identity('pr', i), line = identity('pr-line', i), loss = 22 + (i % 3) * 11, output = i < 12 ? 2200 - loss : 1800;
    state.processingReceipts[receipt] = { ...m(receipt, 'APPROVED'), number: 'PR-2026-' + serial(i), challanId: identity('pc', i), destinationLocationId: DEMO_IDS.processedLocation, lineIds: [line] };
    state.processingReceiptLines[line] = { ...m(line, 'ACTIVE'), processingReceiptId: receipt, challanLineId: identity('pc-line', i), outputMeters: output, lossMeters: loss, lossReason: 'تاریخی نمونہ: منظور شدہ سکڑاؤ', lossApprovedById: DEMO_IDS.actor };
    const received = date(6, i + 1); const result = receiveProcessing(state, receipt, { actorId: DEMO_IDS.actor, at: received + 'T04:00:00.000Z', origin: 'SEED' }); if (!result.ok) throw new Error(result.error.message); state = result.state;
    const charge = identity('processing-charge', i), rate = 2000 + (i % 8) * 250;
    h.processingCharges[charge] = { ...doc(charge, 'PCH-2026-' + serial(i), received), receiptId: receipt, contractorId: identity('contractor', i % 8), meters: output, ratePaisaPerMeter: rate, totalPaisa: multiplyMoney(rate, output) };
  }
  const collectionNames = ['بہار لان ۲۰۲۶', 'سمر پرنٹس ۲۰۲۶', 'تہوار ایمبرائیڈری ۲۰۲۶', 'ونٹر کاٹن ۲۰۲۶'];
  for (let i = 0; i < 4; i++) { const id = identity('collection', i); h.collections[id] = { ...historical(id, 'ACTIVE'), name: collectionNames[i], season: ['SPRING', 'SUMMER', 'FESTIVE', 'WINTER'][i] }; }
  for (let i = 0; i < 30; i++) {
    const id = identity('design', i), bom = identity('bom', i), pieceCount = i % 2 ? 2 : 3;
    state.designs[id] = { ...m(id, 'APPROVED'), code: 'NT-' + ['LN', 'SP', 'FS', 'WN'][i % 4] + '-26' + serial(i), name: 'نمونہ ڈیزائن ' + serial(i), pieceCount, imagePath: '/images/lawn-sample.svg', collectionId: identity('collection', i % 4), bomId: bom };
    h.boms[bom] = { ...historical(bom, 'ACTIVE'), designId: id, pieceCount, lineIds: [] };
    const designProfile = identity('design-profile', i);
    h.designProfiles[designProfile] = { ...historical(designProfile, 'ACTIVE'), designId: id, targetSuits: 120, targetPricePaisaPerSuit: 340000 + (i % 5) * 20000, productionBatchIds: i < 10 ? [identity('batch', i)] : [] };
    for (let c = 0; c < pieceCount; c++) {
      const line = identity('bom-line', i * 3 + c); const fi = c === 0 ? i % 10 : c === 1 ? (i + 1) % 10 : 10 + i % 2;
      h.bomLines[line] = { ...historical(line, 'ACTIVE'), bomId: bom, component: (['SHIRT', 'TROUSER', 'DUPATTA'] as const)[c], fabricId: identity('fabric', fi), widthInches: state.fabrics[identity('fabric', fi)].widthInches, consumptionMetersPerSuit: [2.8 + (i % 3) * .1, 2.4, 2.5][c], wastePercent: 2 };
      h.boms[bom].lineIds.push(line);
    }
    for (let v = 0; v < 3; v++) { const variant = identity('variant', i * 3 + v); h.variants[variant] = { ...historical(variant, 'ACTIVE'), designId: id, name: ['گلابی', 'سبز', 'نیلا'][v], colorHex: ['#C98199', '#458276', '#527FA9'][v] }; }
  }
  for (let i = 0; i < 10; i++) {
    const batch = identity('batch', i), design = identity('design', i), bom = h.boms[identity('bom', i)];
    const completed = i < 6 ? 120 : i < 8 ? 90 : 0; const rejected = i < 6 ? 0 : i < 9 ? 3 : 0; const inProgress = i < 6 || i === 9 ? 0 : 120 - completed - rejected;
    h.batches[batch] = { ...historical(batch, i < 6 ? 'COMPLETED' : i < 8 ? 'PACKING' : i === 8 ? 'CUTTING' : 'PLANNED', date(7, i + 1)), number: 'PB-2026-' + serial(i), designId: design, bomId: bom.id, date: date(7, i + 1), dueOn: date(8, i + 1), targetSuits: 120, completedSuits: completed, rejectedSuits: rejected, inProgressSuits: inProgress, plannedSuits: i === 9 ? 120 : 0, allocationIds: [], estimatedCostPaisa: 360000 + bom.lineIds.reduce((sum, id) => { const line = h.bomLines[id], fi = Number(line.fabricId.slice(-4)) - 1; return sum + multiplyMoney(18000 + fi * 1800 + 2000 + (fi % 8) * 250, roundQuantity(120 * line.consumptionMetersPerSuit * 1.02)); }, 0) };
    if (i < 9) for (const lineId of bom.lineIds) {
      const line = h.bomLines[lineId], fi = Number(line.fabricId.slice(-4)) - 1, allocation = 'material:' + line.id;
      const consumed = roundQuantity(120 * line.consumptionMetersPerSuit * 1.02), embedded = roundQuantity((completed + rejected) * line.consumptionMetersPerSuit), wip = roundQuantity(inProgress * line.consumptionMetersPerSuit);
      const rate = 18000 + fi * 1800 + 2000 + (fi % 8) * 250;
      h.materialAllocations[allocation] = { ...doc(allocation, 'MAT-' + line.id, date(7, i + 1)), batchId: batch, bomLineId: lineId, lotId: identity('lot', fi), sourceLocationId: DEMO_IDS.processedLocation, quantityMeters: consumed, embeddedMeters: embedded, wasteMeters: roundQuantity(consumed - embedded - wip), wipMeters: wip, costPaisa: multiplyMoney(rate, consumed) };
      h.batches[batch].allocationIds.push(allocation);
      const componentOutput = 'component:' + line.id;
      h.componentOutputs[componentOutput] = { ...doc(componentOutput, 'CUT-' + line.id, date(7, i + 1)), batchId: batch, bomLineId: lineId, acceptedPieces: completed, rejectedPieces: rejected, wipPieces: inProgress };
    }
    for (let v = 0; v < 3; v++) {
      const sku = identity('sku', i * 3 + v), variant = identity('variant', i * 3 + v);
      state.finishedSKUs[sku] = { ...m(sku, 'ACTIVE'), code: 'NT-LN-' + serial(i) + '-' + ['A', 'B', 'C'][v], name: state.designs[design].name + ' ' + h.variants[variant].name, designId: design, pieceCount: bom.pieceCount, unit: 'SUIT', colorVariantId: variant, catalogueOnly: completed === 0 };
      if (!completed) continue;
      const pack = identity('pack', i * 3 + v), packed = completed / 3, damaged = v === 2 ? 1 : 0;
      h.packaging[pack] = { ...doc(pack, 'PKG-2026-' + serial(i * 3 + v), date(7, i + 12)), batchId: batch, skuId: sku, variantId: variant, warehouseLocationId: finishedLocation, packedSuits: packed, rejectedSuits: rejected / 3, damagedSuits: damaged, inspectionPassedSuits: packed };
      const fm = identity('finished-package', i * 3 + v); h.finishedMovements[fm] = { ...doc(fm, 'FM-P-' + serial(i * 3 + v), date(7, i + 12)), skuId: sku, locationId: finishedLocation, sourceId: pack, sourceType: 'PACKAGING', quantitySuits: packed };
      if (damaged) { const dm = identity('finished-damage', i); h.finishedMovements[dm] = { ...doc(dm, 'FM-D-' + serial(i), date(7, i + 12)), skuId: sku, locationId: finishedLocation, sourceId: pack, sourceType: 'DAMAGE', quantitySuits: -damaged }; }
    }
    for (const [e, category] of (['CUTTING', 'EMBROIDERY', 'PACKAGING'] as const).entries()) { const id = identity('expense', i * 3 + e); h.expenses[id] = { ...doc(id, 'EXP-2026-' + serial(i * 3 + e), date(7, i + 22)), category, batchId: batch, amountPaisa: i === 9 ? 0 : [120000, 180000, 60000][e], description: 'فرضی براہِ راست پیداواری لاگت؛ کوئی ٹیکس نہیں' }; }
  }
  for (let i = 0; i < 30; i++) {
    const order = identity('so', i), line = identity('so-line', i), sku = identity('sku', i % 24), customer = identity('customer', i % 20);
    const shipped = i < 20 ? (i % 4 === 0 ? 6 : 10) : 0;
    const status = i < 20 ? shipped === 10 ? 'COMPLETED' : 'PARTIALLY_DISPATCHED' : i < 25 ? 'CONFIRMED' : i < 28 ? 'DRAFT' : 'CANCELLED';
    h.salesOrders[order] = { ...historical(order, status, date(8, i % 20 + 1)), number: 'SO-2026-' + serial(i), customerId: customer, date: date(8, i % 20 + 1), requiredOn: date(9, i % 20 + 1), status, lineIds: [line] };
    h.salesLines[line] = { ...historical(line, 'ACTIVE'), salesOrderId: order, skuId: sku, suits: 10, unitPricePaisa: 340000 + (i % 5) * 20000, discountPaisa: i % 3 === 0 ? 100000 : 0 };
    if (shipped) {
      const reservation = identity('reservation-done', i); h.reservations[reservation] = { ...historical(reservation, 'COMPLETED'), reservedOn: date(8, i % 20 + 1), salesLineId: line, skuId: sku, locationId: finishedLocation, suits: shipped };
      const dispatch = identity('dispatch', i), dl = identity('dispatch-line', i);
      h.dispatches[dispatch] = { ...doc(dispatch, 'DC-2026-' + serial(i), date(8, i + 2)), salesOrderId: order, customerId: customer, lineIds: [dl] };
      h.dispatchLines[dl] = { ...historical(dl, 'ACTIVE'), dispatchId: dispatch, salesLineId: line, reservationId: reservation, skuId: sku, suits: shipped };
      const move = identity('finished-dispatch', i); h.finishedMovements[move] = { ...doc(move, 'FM-S-' + serial(i), date(8, i + 2)), skuId: sku, locationId: finishedLocation, sourceId: dl, sourceType: 'DISPATCH', quantitySuits: -shipped };
      const invoice = identity('invoice', i), il = identity('invoice-line', i), discount = Math.round(h.salesLines[line].discountPaisa * shipped / 10);
      h.invoices[invoice] = { ...doc(invoice, 'INV-2026-' + serial(i), date(8, i + 3)), customerId: customer, dispatchIds: [dispatch], lineIds: [il], dueOn: i < 15 ? date(9, i + 3) : date(10, i - 13), totalPaisa: shipped * h.salesLines[line].unitPricePaisa - discount };
      h.invoiceLines[il] = { ...historical(il, 'ACTIVE'), invoiceId: invoice, dispatchLineId: dl, suits: shipped, unitPricePaisa: h.salesLines[line].unitPricePaisa, discountPaisa: discount, totalPaisa: h.invoices[invoice].totalPaisa };
    }
    if (status === 'CONFIRMED' || status === 'PARTIALLY_DISPATCHED') { const r = identity('reservation-active', i); h.reservations[r] = { ...historical(r, 'ACTIVE'), reservedOn: date(8, i % 20 + 1), salesLineId: line, skuId: sku, locationId: finishedLocation, suits: 10 - shipped }; }
  }
  // Two payments each for fifteen invoices: ten fully paid, five half paid, five unpaid.
  for (let i = 0; i < 30; i++) {
    const invoice = h.invoices[identity('invoice', Math.floor(i / 2))], id = identity('payment', i), allocation = identity('payment-allocation', i), amount = Math.floor(invoice.totalPaisa / (Math.floor(i / 2) < 10 ? 2 : 4));
    h.payments[id] = { ...doc(id, 'PAY-2026-' + serial(i), date(9, 1 + i)), customerId: invoice.customerId, amountPaisa: amount + (i === 0 ? 50000 : 0), allocationIds: [allocation], method: (['CASH', 'BANK', 'CHEQUE'] as const)[i % 3], reference: 'DEMO-' + serial(i) };
    h.paymentAllocations[allocation] = { ...historical(allocation, 'ACTIVE'), paymentId: id, invoiceId: invoice.id, amountPaisa: amount };
  }
  for (let i = 0; i < 3; i++) { const id = identity('indirect-expense', i); h.expenses[id] = { ...doc(id, 'OVERHEAD-' + serial(i), date(9, i + 1)), category: (['TRANSPORT', 'RENT', 'OVERHEAD'] as const)[i], amountPaisa: [350000, 800000, 450000][i], description: 'غیر مختص فرضی کاروباری خرچ' }; }
  state.history = h;
  const validated = validateDomainState(state);
  if (!validated.ok) throw new Error('Expanded seed: ' + validated.error.message);
  return validated.state;
}
