import type { DocumentMeta, EntityID, EntityMeta, FabricLotID, FabricUnit, Money, Quantity } from '@/types/common';

export interface Supplier extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; city: string; phone: string; openingBalancePaisa: Money }
export interface SupplierContact extends EntityMeta<'ACTIVE' | 'INACTIVE'> { supplierId: EntityID; name: string; phone: string; email?: string }
export interface FabricMaster extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; composition: string; widthInches: number; inventoryUnit: 'METER'; specificationId?: EntityID }
export interface FabricSpecification extends EntityMeta<'ACTIVE' | 'INACTIVE'> { fabricId: EntityID; gsm: number; weave: string; widthInches: number; shrinkagePercent: number }
export interface FabricRoll extends EntityMeta<'ACTIVE' | 'INACTIVE'> { lotId: FabricLotID; label: string; packagingUnit: 'ROLL' | 'THAAN'; actualLengthMeters: Quantity; originalUnit: 'METER' | 'YARD'; originalLength: Quantity }
export interface PurchaseRequest extends DocumentMeta { requestedById: EntityID; fabricId: EntityID; quantityMeters: Quantity; requiredOn: string }
export interface PurchaseOrder extends DocumentMeta { supplierId: EntityID; lineIds: EntityID[]; orderDate: string }
export interface PurchaseOrderLine extends EntityMeta<'ACTIVE'> { purchaseOrderId: EntityID; fabricId: EntityID; quantityMeters: Quantity; originalQuantity: Quantity; originalUnit: FabricUnit; conversionMetersPerUnit: number; unitPricePaisaPerMeter: Money }
export interface GoodsReceipt extends DocumentMeta { purchaseOrderId: EntityID; warehouseLocationId: EntityID; lineIds: EntityID[]; receivedOn: string }
export interface GoodsReceiptLine extends EntityMeta<'ACTIVE'> { goodsReceiptId: EntityID; purchaseOrderLineId: EntityID; lotId: FabricLotID; quantityMeters: Quantity; originalQuantity: Quantity; originalUnit: 'METER' | 'YARD'; conversionMetersPerUnit: number }
export interface SupplierInvoice extends DocumentMeta { supplierId: EntityID; goodsReceiptIds: EntityID[]; totalPaisa: Money; dueOn: string }
export interface PurchaseReturn extends DocumentMeta { supplierId: EntityID; goodsReceiptLineId: EntityID; quantityMeters: Quantity; amountPaisa: Money; reason: string }
export interface SupplierPayment extends DocumentMeta { supplierId: EntityID; amountPaisa: Money; allocations: { supplierInvoiceId: EntityID; amountPaisa: Money }[]; paidOn: string }
