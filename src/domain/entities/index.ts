import type { EntityMap } from '@/types/common';
import type { ActivityLog, Company, DemoRole, Employee, Warehouse } from './company';
import type { FabricMaster, FabricRoll, GoodsReceipt, GoodsReceiptLine, PurchaseOrder, PurchaseOrderLine, Supplier } from './purchasing';
import type { FabricLot, InventoryMovement, InventoryReservation, StockLocation } from './inventory';
import type { Contractor, ProcessingChallan, ProcessingChallanLine, ProcessingLoss, ProcessingReceipt, ProcessingReceiptLine } from './processing';
import type { Design, FinishedProductSKU } from './production';
import type { Customer } from './wholesale';
import type { HistoricalDataset } from './history';
import type { ProcurementState } from './procurement';

export * from './company';
export * from './purchasing';
export * from './inventory';
export * from './processing';
export * from './production';
export * from './wholesale';

/** The shared meter foundation and optional validated Phase 3 historical extension. */
export interface DomainState {
  history?: HistoricalDataset;
  procurement?: ProcurementState;
  companies: EntityMap<Company>;
  employees: EntityMap<Employee>;
  roles: EntityMap<DemoRole>;
  warehouses: EntityMap<Warehouse>;
  locations: EntityMap<StockLocation>;
  suppliers: EntityMap<Supplier>;
  fabrics: EntityMap<FabricMaster>;
  lots: EntityMap<FabricLot>;
  rolls: EntityMap<FabricRoll>;
  purchaseOrders: EntityMap<PurchaseOrder>;
  purchaseOrderLines: EntityMap<PurchaseOrderLine>;
  goodsReceipts: EntityMap<GoodsReceipt>;
  goodsReceiptLines: EntityMap<GoodsReceiptLine>;
  contractors: EntityMap<Contractor>;
  challans: EntityMap<ProcessingChallan>;
  challanLines: EntityMap<ProcessingChallanLine>;
  processingReceipts: EntityMap<ProcessingReceipt>;
  processingReceiptLines: EntityMap<ProcessingReceiptLine>;
  processingLosses: EntityMap<ProcessingLoss>;
  movements: EntityMap<InventoryMovement>;
  reservations: EntityMap<InventoryReservation>;
  customers: EntityMap<Customer>;
  designs: EntityMap<Design>;
  finishedSKUs: EntityMap<FinishedProductSKU>;
  activityLogs: EntityMap<ActivityLog>;
}
