import type { MessageKey } from '@/locales/ur';

export type RouteGroup = 'foundation' | 'partners' | 'supply' | 'manufacturing' | 'trade' | 'management';
export interface ERPRoute {
  readonly id: string;
  readonly path: `/${string}`;
  readonly title: MessageKey;
  readonly phase: number;
  readonly group: RouteGroup;
  readonly module: string;
  readonly implemented?: boolean;
  readonly detail?: boolean;
}

export const routeRegistry = [
  { id: 'dashboard', path: '/dashboard', title: 'dashboard', phase: 1, group: 'foundation', module: 'dashboard', implemented: true },
  { id: 'diagnostics', path: '/diagnostics', title: 'diagnostics', phase: 1, group: 'foundation', module: 'diagnostics', implemented: true },
  { id: 'modules', path: '/modules', title: 'modules', phase: 1, group: 'foundation', module: 'modules', implemented: true },
  { id: 'settings', path: '/settings', title: 'settings', phase: 1, group: 'foundation', module: 'settings', implemented: true },
  { id: 'company', path: '/company', title: 'company', phase: 2, group: 'partners', module: 'company' },
  { id: 'suppliers', path: '/suppliers', title: 'suppliers', phase: 2, group: 'partners', module: 'suppliers' },
  { id: 'supplier-detail', path: '/suppliers/:id', title: 'suppliers', phase: 2, group: 'partners', module: 'suppliers', detail: true },
  { id: 'fabrics', path: '/fabrics', title: 'fabrics', phase: 2, group: 'supply', module: 'fabrics' },
  { id: 'contractors', path: '/contractors', title: 'contractors', phase: 2, group: 'partners', module: 'contractors' },
  { id: 'customers', path: '/customers', title: 'customers', phase: 2, group: 'partners', module: 'customers' },
  { id: 'staff', path: '/staff', title: 'staff', phase: 2, group: 'management', module: 'staff' },
  { id: 'purchases', path: '/purchases', title: 'purchases', phase: 4, group: 'supply', module: 'purchasing' },
  { id: 'purchase-new', path: '/purchases/new', title: 'purchases', phase: 4, group: 'supply', module: 'purchasing', detail: true },
  { id: 'purchase-detail', path: '/purchases/:id', title: 'purchases', phase: 4, group: 'supply', module: 'purchasing', detail: true },
  { id: 'grey-inventory', path: '/inventory/grey', title: 'greyInventory', phase: 4, group: 'supply', module: 'grey-inventory' },
  { id: 'grey-lot', path: '/inventory/grey/lots/:id', title: 'greyInventory', phase: 4, group: 'supply', module: 'grey-inventory', detail: true },
  { id: 'processing', path: '/processing/challans', title: 'processing', phase: 5, group: 'supply', module: 'processing' },
  { id: 'processing-detail', path: '/processing/challans/:id', title: 'processing', phase: 5, group: 'supply', module: 'processing', detail: true },
  { id: 'designs', path: '/designs', title: 'designs', phase: 6, group: 'manufacturing', module: 'designs' },
  { id: 'collections', path: '/collections', title: 'collections', phase: 6, group: 'manufacturing', module: 'designs' },
  { id: 'production', path: '/production', title: 'production', phase: 7, group: 'manufacturing', module: 'production' },
  { id: 'production-order', path: '/production/orders/:id', title: 'production', phase: 7, group: 'manufacturing', module: 'production', detail: true },
  { id: 'cutting', path: '/cutting', title: 'cutting', phase: 7, group: 'manufacturing', module: 'cutting' },
  { id: 'embroidery', path: '/embroidery', title: 'embroidery', phase: 8, group: 'manufacturing', module: 'embroidery' },
  { id: 'quality-control', path: '/quality-control', title: 'qualityControl', phase: 8, group: 'manufacturing', module: 'quality-control' },
  { id: 'suit-assembly', path: '/suit-assembly', title: 'suitAssembly', phase: 8, group: 'manufacturing', module: 'suit-assembly' },
  { id: 'packaging', path: '/packaging', title: 'packaging', phase: 9, group: 'manufacturing', module: 'packaging' },
  { id: 'finished-inventory', path: '/inventory/finished', title: 'finishedInventory', phase: 9, group: 'manufacturing', module: 'finished-inventory' },
  { id: 'pricing', path: '/pricing', title: 'pricing', phase: 10, group: 'trade', module: 'pricing' },
  { id: 'quotations', path: '/quotations', title: 'quotations', phase: 10, group: 'trade', module: 'quotations' },
  { id: 'sales', path: '/sales/orders', title: 'sales', phase: 10, group: 'trade', module: 'sales' },
  { id: 'sales-detail', path: '/sales/orders/:id', title: 'sales', phase: 10, group: 'trade', module: 'sales', detail: true },
  { id: 'dispatch', path: '/dispatch', title: 'dispatch', phase: 11, group: 'trade', module: 'dispatch' },
  { id: 'invoices', path: '/invoices', title: 'invoicing', phase: 11, group: 'trade', module: 'invoicing' },
  { id: 'payments', path: '/payments', title: 'payments', phase: 12, group: 'trade', module: 'payments' },
  { id: 'expenses', path: '/expenses', title: 'expenses', phase: 12, group: 'management', module: 'expenses' },
  { id: 'accounting', path: '/accounting', title: 'accounting', phase: 12, group: 'management', module: 'accounting' },
  { id: 'returns', path: '/returns', title: 'returns', phase: 13, group: 'trade', module: 'returns' },
  { id: 'costing', path: '/costing', title: 'costing', phase: 13, group: 'management', module: 'costing' },
  { id: 'reports', path: '/reports', title: 'reports', phase: 14, group: 'management', module: 'reports' },
  { id: 'notifications', path: '/notifications', title: 'notifications', phase: 14, group: 'management', module: 'notifications' },
  { id: 'audit', path: '/audit', title: 'audit', phase: 14, group: 'management', module: 'audit' },
] as const satisfies readonly ERPRoute[];

export type RouteId = typeof routeRegistry[number]['id'];
export function getRoute(id: RouteId): ERPRoute {
  const route = routeRegistry.find((entry) => entry.id === id);
  if (!route) throw new Error(`Unknown route: ${id}`);
  return route;
}

export const routeGroupLabels: Record<RouteGroup, string> = {
  foundation: 'بنیادی نظام', partners: 'کمپنی اور کاروباری رابطے', supply: 'خریداری اور کپڑا',
  manufacturing: 'ڈیزائن اور پیداوار', trade: 'فروخت اور وصولیاں', management: 'انتظام اور حسابات',
};
