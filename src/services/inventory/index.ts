import type { DomainState, InventoryBalance } from '@/domain/entities';
import type { InventoryLocationType } from '@/types/common';
import { roundQuantity } from '@/domain/value-objects/quantity';

export const balanceKey = (lotId: string, locationId: string, category: InventoryLocationType) => `${lotId}|${locationId}|${category}`;
export function getInventoryBalances(state: DomainState): InventoryBalance[] {
  const balances = new Map<string, InventoryBalance>();
  const obtain = (lotId: string, locationId: string, category: InventoryLocationType) => {
    const key = balanceKey(lotId, locationId, category);
    let balance = balances.get(key);
    if (!balance) { balance = { lotId, locationId, category, onHandMeters: 0, reservedMeters: 0, availableMeters: 0 }; balances.set(key, balance); }
    return balance;
  };
  Object.values(state.movements).forEach((movement) => {
    const balance = obtain(movement.lotId, movement.locationId, movement.category);
    balance.onHandMeters = roundQuantity(balance.onHandMeters + movement.quantityMeters);
  });
  Object.values(state.history?.materialAllocations ?? {}).forEach((allocation) => {
    const balance = obtain(allocation.lotId, allocation.sourceLocationId, 'PROCESSED');
    balance.onHandMeters = roundQuantity(balance.onHandMeters - allocation.quantityMeters);
  });
  Object.values(state.reservations).filter((reservation) => reservation.status === 'ACTIVE').forEach((reservation) => {
    const balance = obtain(reservation.lotId, reservation.locationId, reservation.category);
    balance.reservedMeters = roundQuantity(balance.reservedMeters + reservation.quantityMeters);
  });
  return [...balances.values()].map((balance) => ({ ...balance, availableMeters: roundQuantity(balance.onHandMeters - balance.reservedMeters) }));
}
export function getAvailableMeters(state: DomainState, lotId: string, locationId: string, category: InventoryLocationType): number {
  return getInventoryBalances(state).find((balance) => balanceKey(balance.lotId, balance.locationId, balance.category) === balanceKey(lotId, locationId, category))?.availableMeters ?? 0;
}
export function getInventorySummary(state: DomainState) {
  const balances = getInventoryBalances(state);
  const sum = (category: InventoryLocationType) => roundQuantity(balances.filter((balance) => balance.category === category).reduce((total, balance) => total + balance.onHandMeters, 0));
  return {
    grey: sum('GREY'), processed: sum('PROCESSED'), contractor: sum('PROCESSING_OUT'),
    loss: roundQuantity(Object.values(state.processingLosses).reduce((total, loss) => total + loss.quantityMeters, 0)),
    finished: Object.values(state.history?.finishedMovements ?? {}).reduce((n, r) => n + r.quantitySuits, 0),
  };
}
export function getReconciliation(state: DomainState) {
  const totals = getInventorySummary(state);
  const productionConsumed = getProductionConsumedMeters(state);
  const purchased = roundQuantity(Object.values(state.movements).filter((movement) => movement.sourceType === 'GOODS_RECEIPT').reduce((sum, movement) => sum + movement.quantityMeters, 0));
  const issued = roundQuantity(Object.values(state.movements).filter((movement) => movement.sourceType === 'PROCESSING_ISSUE' && movement.category === 'PROCESSING_OUT').reduce((sum, movement) => sum + movement.quantityMeters, 0));
  const difference = roundQuantity(purchased - totals.grey - totals.processed - totals.contractor - totals.loss - productionConsumed);
  return { ...totals, ...(state.history ? { productionConsumed } : {}), purchased, issued, difference, balanced: difference === 0 };
}
export function getProductionConsumedMeters(state: DomainState) {
  return roundQuantity(Object.values(state.history?.materialAllocations ?? {}).reduce((n, r) => n + r.quantityMeters, 0));
}
