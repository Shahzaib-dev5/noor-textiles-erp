import { useEffect, type ReactNode } from 'react';
import { useUIStore, resolveTheme } from '@/store/ui-preferences';
import { useERPStore } from '@/store';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUIStore((state) => state.preferences.theme);
  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
      document.documentElement.lang = 'ur'; document.documentElement.dir = 'rtl';
      useERPStore.setState({ theme: resolved });
    };
    apply();
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    media?.addEventListener('change', apply);
    return () => media?.removeEventListener('change', apply);
  }, [theme]);
  return children;
}
