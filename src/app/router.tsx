import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModulesPage, NotFoundPage, PlannedModulePage } from '@/features/foundation/FoundationPages';
import { routeRegistry, type ERPRoute } from '@/routes/registry';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const DiagnosticsPage = lazy(() => import('@/features/diagnostics/DiagnosticsPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));
const DesignSystemPage = lazy(() => import('@/features/design-system/DesignSystemPage'));
const ProcurementPage = lazy(() => import('@/features/purchasing/ProcurementPage'));
const WarehousePage = lazy(() => import('@/features/warehouse/WarehousePage'));

const ProcessingPage = lazy(() => import('@/features/processing/ProcessingPage'));

const DesignStudioPage = lazy(() => import('@/features/designs/DesignStudioPage'));

function routeElement(route: ERPRoute) {
  if(route.module==='designs')return <DesignStudioPage key={route.id} route={route}/>;
  if (['contractors','processing','processing-operations'].includes(route.module)) return <ProcessingPage key={route.id} route={route}/>;
  if (route.module==='grey-inventory'||route.module==='warehouse') return <WarehousePage route={route}/>;
  if (['suppliers','fabrics','purchasing','procurement'].includes(route.module)) return <ProcurementPage route={route} />;
  switch (route.id) {
    case 'dashboard': return <DashboardPage />;
    case 'diagnostics': return <DiagnosticsPage />;
    case 'settings': return <SettingsPage />;
    case 'modules': return <ModulesPage />;
    case 'design-system': return <DesignSystemPage />;
    default: return <PlannedModulePage route={route} />;
  }
}

export function AppRoutes() {
  return <Routes><Route element={<AppLayout />}><Route index element={<Navigate to="/dashboard" replace />} />{routeRegistry.map((route) => <Route key={route.id} path={route.path} element={<Suspense fallback={<div role="status" className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">صفحہ کھولا جا رہا ہے…</div>}>{routeElement(route)}</Suspense>} />)}<Route path="*" element={<NotFoundPage />} /></Route></Routes>;
}
