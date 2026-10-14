import { Bell, Boxes, Building2, ClipboardCheck, ContactRound, Factory, FlaskConical, Layers3, LayoutDashboard, LayoutGrid, Package, Palette, ReceiptText, Scissors, Settings2, ShieldCheck, ShoppingBag, ShoppingCart, Truck, Users, Wallet, type LucideIcon } from 'lucide-react';
import type { RouteId } from '@/routes/registry';

export const primaryNavigation: { id: string; label: string; routes: { id: RouteId; icon: LucideIcon }[] }[] = [
  { id: 'main', label: 'مرکزی نظام', routes: [{ id: 'dashboard', icon: LayoutDashboard }, { id: 'company', icon: Building2 }] },
  { id: 'purchasing', label: 'خریداری اور کپڑا', routes: [{ id: 'suppliers', icon: ContactRound }, { id: 'fabrics', icon: Layers3 }, { id: 'purchases', icon: ShoppingCart }, { id: 'purchase-requests', icon: ClipboardCheck }, { id: 'purchase-receipts', icon: Truck }, { id: 'purchase-bills', icon: ReceiptText }, { id: 'supplier-payments', icon: Wallet }, { id: 'purchase-returns', icon: Truck }, { id: 'purchase-reports', icon: LayoutGrid }, { id: 'grey-inventory', icon: Boxes }] },
  { id: 'processing', label: 'پروسیسنگ', routes: [{ id: 'contractors', icon: Factory }, { id: 'processing', icon: FlaskConical }, { id: 'processing-jobs', icon: Palette }, { id: 'designs', icon: Palette }, { id: 'embroidery', icon: Scissors }, { id: 'quality-control', icon: ShieldCheck }] },
  { id: 'production', label: 'پیداوار', routes: [{ id: 'production', icon: Factory }, { id: 'cutting', icon: Scissors }, { id: 'suit-assembly', icon: Layers3 }, { id: 'packaging', icon: Package }, { id: 'finished-inventory', icon: Boxes }] },
  { id: 'wholesale', label: 'ہول سیل', routes: [{ id: 'customers', icon: Users }, { id: 'pricing', icon: ReceiptText }, { id: 'sales', icon: ShoppingBag }, { id: 'dispatch', icon: Truck }, { id: 'invoices', icon: ReceiptText }, { id: 'payments', icon: Wallet }, { id: 'returns', icon: Truck }] },
  { id: 'accounts', label: 'حسابات', routes: [{ id: 'expenses', icon: Wallet }, { id: 'costing', icon: ReceiptText }, { id: 'accounting', icon: ReceiptText }, { id: 'reports', icon: LayoutGrid }] },
  { id: 'administration', label: 'انتظام', routes: [{ id: 'staff', icon: Users }, { id: 'notifications', icon: Bell }, { id: 'audit', icon: ClipboardCheck }, { id: 'settings', icon: Settings2 }, { id: 'diagnostics', icon: ClipboardCheck }, { id: 'design-system', icon: Palette }, { id: 'modules', icon: LayoutGrid }] },
];
export const sidebarLabels: Partial<Record<RouteId, string>> = {
  company: 'کمپنی کا انتظام', 'grey-inventory': 'کورے کپڑے کا گودام', contractors: 'پروسیسنگ ملز',
  processing: 'پروسیسنگ چالان', designs: 'ڈیزائن اسٹوڈیو', production: 'پیداواری منصوبہ بندی',
  'suit-assembly': 'سوٹ کی تیاری', 'finished-inventory': 'تیار مال کا گودام', customers: 'ہول سیل گاہک',
  pricing: 'تھوک قیمتیں', sales: 'فروخت کے آرڈرز', dispatch: 'مال کی ترسیل', invoices: 'انوائس',
  costing: 'پیداواری لاگت', staff: 'ملازمین', audit: 'سرگرمیوں کا ریکارڈ',
};
export const workflowPreview = [
  { label: 'خریداری و وصولی', icon: ShoppingCart, phase: 1 }, { label: 'کورا کپڑا', icon: Boxes, phase: 1 },
  { label: 'پروسیسنگ', icon: FlaskConical, phase: 1 }, { label: 'پیداوار و پیکنگ', icon: Factory, phase: 7 }, { label: 'تھوک فروخت', icon: ShoppingBag, phase: 10 },
];
