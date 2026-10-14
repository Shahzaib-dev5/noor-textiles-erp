import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModulesPage, NotFoundPage, PlannedModulePage } from '@/features/foundation/FoundationPages';
import { routeRegistry, type ERPRoute } from '@/routes/registry';

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const DiagnosticsPage = lazy(() => import('@/features/diagnostics/DiagnosticsPage'));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'));

function routeElement(route: ERPRoute) {
  switch (route.id) {
    case 'dashboard': return <DashboardPage />;
    case 'diagnostics': return <DiagnosticsPage />;
    case 'settings': return <SettingsPage />;
    case 'modules': return <ModulesPage />;
    default: return <PlannedModulePage route={route} />;
  }
}

export function AppRoutes() {
  return <Routes><Route element={<AppLayout />}><Route index element={<Navigate to="/dashboard" replace />} />{routeRegistry.map((route) => <Route key={route.id} path={route.path} element={<Suspense fallback={<div role="status" className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">صفحہ کھولا جا رہا ہے…</div>}>{routeElement(route)}</Suspense>} />)}<Route path="*" element={<NotFoundPage />} /></Route></Routes>;
}
