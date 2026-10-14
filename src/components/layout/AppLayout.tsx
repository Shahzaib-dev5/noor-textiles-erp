import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, matchPath } from 'react-router-dom';
import { ArrowLeft, ChevronsLeftRight, Menu, Moon, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { primaryNavigation } from '@/app/config/navigation';
import { getRoute, routeRegistry } from '@/routes/registry';
import { t } from '@/locales/ur';
import { useERPStore } from '@/store';
import { cn } from '@/lib/utils';

function Brand() {
  return <Link to="/dashboard" className="flex items-center gap-3" aria-label="نور ٹیکسٹائلز — ڈیش بورڈ">
    <div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>
    <div><p className="text-2xl font-bold leading-9 text-white">{t('appName')}</p><p className="font-sans text-[10px] tracking-[0.23em] text-emerald-200/60" dir="ltr">TEXTILE MANAGEMENT</p></div>
  </Link>;
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const role = useERPStore((state) => state.role);
  const theme = useERPStore((state) => state.theme);
  const setRole = useERPStore((state) => state.setRole);
  const setTheme = useERPStore((state) => state.setTheme);
  const storageWarning = useERPStore((state) => state.storageWarning);
  const activeRoute = routeRegistry.find((route) => matchPath({ path: route.path, end: true }, location.pathname));

  useEffect(() => {
    document.documentElement.lang = 'ur';
    document.documentElement.dir = 'rtl';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => { document.title = `${activeRoute ? t(activeRoute.title) : 'صفحہ نہیں ملا'} | ${t('companyName')}`; }, [activeRoute]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuTrigger.current?.focus(); } };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen]);

  return <div dir="rtl" className="min-h-screen bg-background text-foreground">
    <a className="skip-link" href="#main-content">مرکزی مواد پر جائیں</a>
    {menuOpen && <button className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)} aria-label="مینو بند کریں" />}
    <aside id="erp-sidebar" aria-label="مرکزی نیویگیشن" className={cn('app-sidebar fixed inset-y-0 start-0 z-50 flex w-[250px] flex-col transition-transform lg:visible lg:translate-x-0', menuOpen ? 'visible translate-x-0' : 'invisible translate-x-full')}>
      <div className="flex items-center justify-between px-6 pb-7 pt-8"><Brand /><button type="button" className="text-white lg:hidden" onClick={() => setMenuOpen(false)} aria-label="سائیڈبار بند کریں"><X className="size-5" /></button></div>
      <div className="mx-5 mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-emerald-100"><span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-300" />{t('demo')}</span><span className="text-emerald-100/50">{t('phaseOne')}</span></div>
      <nav className="sidebar-scroll flex-1 overflow-y-auto px-4 pb-4">
        {primaryNavigation.map((group) => <div key={group.label} className="mb-5"><p className="mb-2 px-3 text-xs text-emerald-100/40">{group.label}</p><div className="space-y-1">{group.routes.map(({ id, icon: Icon }) => {
          const route = getRoute(id);
          return <NavLink key={id} to={route.path} onClick={() => setMenuOpen(false)} className={({ isActive }) => cn('sidebar-link flex items-center gap-3 rounded-xl px-3 py-2 text-[17px] text-emerald-50/65 transition-colors hover:bg-white/5 hover:text-white', isActive && 'sidebar-link-active bg-[#dcece2] text-[#143b30] hover:bg-[#dcece2] hover:text-[#143b30]')}><Icon className="size-[18px] shrink-0" strokeWidth={1.6} /><span>{t(route.title)}</span>{!route.implemented && <span className="ms-auto size-1 rounded-full bg-current opacity-35" aria-label={t('underDevelopment')} />}</NavLink>;
        })}</div></div>)}
      </nav>
      <div className="mx-5 border-t border-white/10 py-5"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-emerald-200">ن</div><div><p className="text-sm text-white">{t('companyName')}</p><p className="text-xs text-emerald-100/40">{t('location')}</p></div></div></div>
    </aside>
    <div className="lg:ms-[250px]">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-card/80 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3"><Button ref={menuTrigger} variant="ghost" size="icon" className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="مینو کھولیں" aria-expanded={menuOpen} aria-controls="erp-sidebar"><Menu /></Button><div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="hidden sm:inline">کاروبار کا انتظام</span><span className="hidden text-border sm:inline">/</span><span className="text-foreground">{activeRoute ? t(activeRoute.title) : 'صفحہ نہیں ملا'}</span></div></div>
        <div className="flex items-center gap-3"><Badge className="hidden border-primary/15 bg-primary/5 text-primary sm:inline-flex"><span className="size-1.5 rounded-full bg-primary" />مقامی ڈیمو</Badge><div className="flex items-center gap-2 border-s border-border ps-3"><label htmlFor="demo-role" className="text-sm text-muted-foreground">ڈیمو کردار</label><select id="demo-role" className="bg-transparent text-base outline-offset-4" value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="owner">{t('owner')}</option><option value="warehouse">{t('warehouse')}</option><option value="accounts">{t('accounts')}</option></select></div><Button variant="ghost" size="icon" aria-label={theme === 'light' ? 'تاریک تھیم' : 'روشن تھیم'} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon /> : <Sun />}</Button></div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1530px] px-5 py-7 outline-none sm:px-8 sm:py-9 xl:px-10">
        {storageWarning && <div role="alert" className="mb-6 rounded-xl border border-amber-300/40 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100"><p>{storageWarning}</p><Link to="/settings" className="mt-1 inline-flex items-center gap-2 underline">ڈیمو ڈیٹا کی ترتیبات<ArrowLeft className="size-4" /></Link></div>}
        <Outlet />
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5 text-sm text-muted-foreground"><span>{t('companyName')} · مقامی ڈیمو، حقیقی لین دین کے لیے نہیں</span><span className="flex items-center gap-1.5"><ChevronsLeftRight className="size-3.5" />بنیادی ساخت · مرحلہ ۱</span></footer>
      </main>
    </div>
  </div>;
}
