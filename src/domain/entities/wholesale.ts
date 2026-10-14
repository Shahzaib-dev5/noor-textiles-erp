import type { DocumentMeta, EntityID, EntityMeta, Money } from '@/types/common';
import type { ReturnDisposition } from '@/domain/enums';

export interface Customer extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; city: string; phone: string; openingBalancePaisa: Money }
export interface CustomerCreditProfile extends EntityMeta<'ACTIVE' | 'INACTIVE'> { customerId: EntityID; creditLimitPaisa: Money; paymentTermDays: number; holdNewOrders: boolean }
export interface WholesalePriceList extends EntityMeta<'ACTIVE' | 'INACTIVE'> { name: string; effectiveFrom: string; prices: { skuId: EntityID; minimumSuits: number; unitPricePaisa: Money }[] }
export interface Quotation extends DocumentMeta { customerId: EntityID; priceListId: EntityID; lineIds: EntityID[]; validUntil: string }
export interface QuotationLine extends EntityMeta<'ACTIVE'> { quotationId: EntityID; skuId: EntityID; suits: number; unitPricePaisa: Money; discountPaisa: Money }
export interface SalesOrder extends DocumentMeta { customerId: EntityID; quotationId?: EntityID; lineIds: EntityID[]; requiredOn: string }
export interface SalesOrderLine extends EntityMeta<'ACTIVE'> { salesOrderId: EntityID; skuId: EntityID; suits: number; unitPricePaisa: Money; discountPaisa: Money }
export interface StockReservation extends EntityMeta<'ACTIVE' | 'COMPLETED' | 'CANCELLED'> { salesOrderLineId: EntityID; skuId: EntityID; warehouseLocationId: EntityID; suits: number }
export interface DispatchChallan extends DocumentMeta { salesOrderId: EntityID; customerId: EntityID; lineIds: EntityID[]; dispatchedOn: string }
export interface DispatchLine extends EntityMeta<'ACTIVE'> { dispatchChallanId: EntityID; salesOrderLineId: EntityID; reservationId: EntityID; skuId: EntityID; suits: number }
export interface SalesInvoice extends DocumentMeta { customerId: EntityID; dispatchChallanIds: EntityID[]; lineIds: EntityID[]; totalPaisa: Money; dueOn: string }
export interface SalesInvoiceLine extends EntityMeta<'ACTIVE'> { salesInvoiceId: EntityID; dispatchLineId: EntityID; suits: number; unitPricePaisa: Money; discountPaisa: Money; totalPaisa: Money }
export interface PaymentReceipt extends DocumentMeta { customerId: EntityID; amountPaisa: Money; allocationIds: EntityID[]; method: 'CASH' | 'BANK' | 'CHEQUE'; receivedOn: string }
export interface PaymentAllocation extends EntityMeta<'ACTIVE' | 'REVERSED'> { paymentReceiptId: EntityID; salesInvoiceId: EntityID; amountPaisa: Money }
export interface CustomerReturn extends DocumentMeta { customerId: EntityID; salesInvoiceLineId: EntityID; suits: number; disposition: ReturnDisposition; inspectionId?: EntityID; reason: string }
export interface CreditNote extends DocumentMeta { customerId: EntityID; customerReturnId: EntityID; amountPaisa: Money }
export interface Expense extends DocumentMeta { category: 'RENT' | 'SALARY' | 'UTILITIES' | 'TRANSPORT' | 'OTHER'; amountPaisa: Money; incurredOn: string; description: string }
export interface CostAllocation extends EntityMeta<'ACTIVE' | 'POSTED'> { sourceDocumentId: EntityID; targetBatchId: EntityID; amountPaisa: Money; basis: 'METERS' | 'SUITS' | 'DIRECT' }
export interface SupplierLedgerEntry extends EntityMeta<'POSTED'> { supplierId: EntityID; sourceDocumentId: EntityID; debitPaisa: Money; creditPaisa: Money; transactionId: EntityID }
export interface CustomerLedgerEntry extends EntityMeta<'POSTED'> { customerId: EntityID; sourceDocumentId: EntityID; debitPaisa: Money; creditPaisa: Money; transactionId: EntityID }
export interface AccountTransaction extends DocumentMeta { date: string; description: string; entries: { accountCode: string; debitPaisa: Money; creditPaisa: Money }[] }
