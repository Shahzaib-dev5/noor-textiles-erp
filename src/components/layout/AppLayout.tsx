import { useEffect, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileNavigation } from './MobileNavigation';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { ToastNotification } from '@/components/feedback/ToastNotification';
import { AlertBanner } from '@/components/feedback/states';
import { useERPStore } from '@/store';
import { useUIStore } from '@/store/ui-preferences';
import { getRoute } from '@/routes/registry';

export function PageContainer({ children }: { children: ReactNode }) { return <main id="main-content" tabIndex={-1} className="mx-auto min-w-0 max-w-[1600px] px-4 py-6 outline-none sm:px-7 sm:py-8 xl:px-9">{children}</main>; }
export function PageActions({ children }: { children: ReactNode }) { return <div className="no-print flex flex-wrap items-center gap-2">{children}</div>; }
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useUIStore((s) => s.preferences.sidebarCollapsed);
  const uiWarning = useUIStore((s) => s.warning);
  const storageWarning = useERPStore((s) => s.storageWarning);
  const location = useLocation();
  useEffect(() => { document.title = 'نور ٹیکسٹائل ERP | نور ٹیکسٹائلز لاہور'; }, [location.pathname]);
  return <ThemeProvider><div dir="rtl" className="min-h-screen bg-background text-foreground"><a className="skip-link" href="#main-content">مرکزی مواد پر جائیں</a><AppSidebar /><MobileNavigation open={mobileOpen} onClose={() => setMobileOpen(false)} /><div className={collapsed ? 'app-content lg:ms-[80px]' : 'app-content lg:ms-[272px]'}><AppHeader mobileOpen={mobileOpen} onMobileOpen={() => setMobileOpen(true)} /><PageContainer>{storageWarning && <AlertBanner tone="warning" className="mb-5">{storageWarning}<Link to={getRoute('settings').path} className="ms-2 underline">ڈیٹا کی ترتیبات</Link></AlertBanner>}{uiWarning && <AlertBanner tone="warning" className="mb-5">{uiWarning}</AlertBanner>}<Outlet /><footer className="app-footer no-print mt-9 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs leading-6 text-muted-foreground"><span>نور ٹیکسٹائلز لاہور · مقامی ڈیمو</span><span>کاروباری ڈیٹا صرف اسی براؤزر میں محفوظ ہے</span></footer></PageContainer></div><ToastNotification /></div></ThemeProvider>;
}
