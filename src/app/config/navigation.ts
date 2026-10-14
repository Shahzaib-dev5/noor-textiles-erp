import { ArrowDownToLine, Boxes, ClipboardCheck, Factory, FlaskConical, LayoutDashboard, LayoutGrid, Package, ReceiptText, Settings2, ShoppingBag, ShoppingCart, Wallet, type LucideIcon } from 'lucide-react';
import type { RouteId } from '@/routes/registry';

export const primaryNavigation: { label: string; routes: { id: RouteId; icon: LucideIcon }[] }[] = [
  { label: 'جائزہ', routes: [{ id: 'dashboard', icon: LayoutDashboard }] },
  { label: 'خریداری اور پیداوار', routes: [
    { id: 'purchases', icon: ShoppingCart }, { id: 'grey-inventory', icon: Boxes },
    { id: 'processing', icon: FlaskConical }, { id: 'production', icon: Factory },
    { id: 'finished-inventory', icon: Package },
  ] },
  { label: 'فروخت اور حسابات', routes: [
    { id: 'sales', icon: ShoppingBag }, { id: 'payments', icon: Wallet }, { id: 'reports', icon: ReceiptText },
  ] },
  { label: 'نظام', routes: [
    { id: 'diagnostics', icon: ClipboardCheck }, { id: 'modules', icon: LayoutGrid }, { id: 'settings', icon: Settings2 },
  ] },
];

export const workflowPreview = [
  { label: 'خریداری و وصولی', icon: ArrowDownToLine, phase: 1 },
  { label: 'کورا کپڑا', icon: Boxes, phase: 1 },
  { label: 'پروسیسنگ', icon: FlaskConical, phase: 1 },
  { label: 'پیداوار و پیکنگ', icon: Factory, phase: 7 },
  { label: 'تھوک فروخت', icon: ShoppingBag, phase: 10 },
];
