import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { primaryNavigation, sidebarLabels } from '@/app/config/navigation';
import { getRoute, type RouteId } from '@/routes/registry';
import { t } from '@/locales/ur';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-preferences';
import { CompanyIdentity } from './CompanyIdentity';
import type { LucideIcon } from 'lucide-react';
import { useId } from 'react';

export function SidebarItem({ id, icon: Icon, compact, onNavigate }: { id: RouteId; icon: LucideIcon; compact: boolean; onNavigate?: () => void }) {
  const route = getRoute(id); const location = useLocation(); const label = sidebarLabels[id] ?? t(route.title);
  const active = location.pathname === route.path || (route.path !== '/' && location.pathname.startsWith(`${route.path}/`));
  return <NavLink to={route.path} onClick={onNavigate} title={compact ? label : undefined} aria-label={`${label}${route.implemented ? '' : ' زیرِ تعمیر'}`} aria-current={active ? 'page' : undefined} className={cn('flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors', compact && 'justify-center px-2', active ? 'bg-card text-primary font-semibold' : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-sidebar-foreground')}><Icon className="size-[18px] shrink-0" strokeWidth={1.7} />{!compact && <><span className="flex-1">{label}</span>{!route.implemented && <span className="size-1 rounded-full bg-current opacity-50" aria-hidden="true" />}</>}</NavLink>;
}
export function SidebarGroup({ group, compact, onNavigate }: { group: typeof primaryNavigation[number]; compact: boolean; onNavigate?: () => void }) {
  const contentId = useId();
  const groups = useUIStore((s) => s.preferences.collapsedGroups); const update = useUIStore((s) => s.updatePreferences); const expanded = !groups.includes(group.id);
  return <section className="mb-3">{!compact && <button className="mb-1 flex w-full items-center justify-between px-3 py-2 text-xs text-sidebar-muted" aria-expanded={expanded} aria-controls={contentId} onClick={() => update({ collapsedGroups: expanded ? [...groups, group.id] : groups.filter((id) => id !== group.id) })}>{group.label}<ChevronDown className={cn('size-3 transition-transform', !expanded && 'rotate-90')} /></button>}<div id={contentId} hidden={!compact && !expanded} className="space-y-1">{group.routes.map((route) => <SidebarItem key={route.id} {...route} compact={compact} onNavigate={onNavigate} />)}</div></section>;
}
export function SidebarNavigation({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) { return <nav aria-label="مرکزی نیویگیشن" className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3">{primaryNavigation.map((group) => <SidebarGroup key={group.id} group={group} compact={compact} onNavigate={onNavigate} />)}</nav>; }
export function AppSidebar() {
  const compact = useUIStore((s) => s.preferences.sidebarCollapsed); const update = useUIStore((s) => s.updatePreferences);
  return <aside id="erp-sidebar" aria-label="مرکزی سائیڈبار" data-collapsed={compact} className={cn('app-sidebar no-print fixed inset-y-0 start-0 z-30 hidden flex-col border-e border-border/20 lg:flex', compact ? 'w-[80px]' : 'w-[272px]')}><div className={cn('flex min-h-24 items-center px-6', compact && 'justify-center px-3')}><CompanyIdentity compact={compact} /></div><div className="mx-3 mb-3 flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-xs text-sidebar-muted">{!compact && <span>ڈیمو ماحول · مقامی نمونہ</span>}<button aria-label={compact ? 'سائیڈبار پھیلائیں' : 'سائیڈبار سمیٹیں'} title={compact ? 'سائیڈبار پھیلائیں' : 'سائیڈبار سمیٹیں'} onClick={() => update({ sidebarCollapsed: !compact })}>{compact ? <PanelRightOpen className="size-4" /> : <PanelRightClose className="size-4" />}</button></div><SidebarNavigation compact={compact} /><div className="m-4 border-t border-white/15 pt-3 text-xs leading-6 text-sidebar-muted">{compact ? 'نور' : 'نور ٹیکسٹائلز لاہور · اعظم کلاتھ مارکیٹ'}</div></aside>;
}
