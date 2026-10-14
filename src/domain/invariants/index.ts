import type { DomainState } from '@/domain/entities';
import { getInventoryBalances, getReconciliation } from '@/services/inventory';

export function inspectInventoryInvariants(state: DomainState): string[] {
  const problems: string[] = [];
  getInventoryBalances(state).forEach((balance) => {
    if (balance.onHandMeters < 0 || balance.availableMeters < 0) problems.push(`منفی اسٹاک: ${balance.lotId}/${balance.locationId}`);
  });
  if (!getReconciliation(state).balanced) problems.push('خرید، اسٹاک اور تسلیم شدہ نقصان کا مجموعہ برابر نہیں۔');
  return problems;
}
