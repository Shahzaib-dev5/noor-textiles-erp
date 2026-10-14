import { Link } from 'react-router-dom';
import { useERPStore } from '@/store';
import { getRoute } from '@/routes/registry';
import { t } from '@/locales/ur';

export function CompanyIdentity({ compact = false }: { compact?: boolean }) { const company = useERPStore((s) => Object.values(s.data.companies)[0]); return <Link to={getRoute('dashboard').path} className="flex items-center gap-3" title={company?.name} aria-label="نور ٹیکسٹائلز — ڈیش بورڈ"><div className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></div>{!compact && <div className="min-w-0"><p className="text-xl font-bold leading-9">{t('appName')}</p><p className="text-xs text-sidebar-muted">{company?.city} · مقامی ڈیمو</p></div>}</Link>; }
