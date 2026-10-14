import { DetailsDrawer } from '@/components/dialogs/Dialog';
import { SidebarNavigation } from './AppSidebar';

export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) { return <DetailsDrawer id="mobile-navigation" open={open} onClose={onClose} title="مرکزی نیویگیشن" className="app-sidebar"><div className="-m-5 flex h-[calc(100dvh-90px)] flex-col py-3"><SidebarNavigation onNavigate={onClose} /></div></DetailsDrawer>; }
