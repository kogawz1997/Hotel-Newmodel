'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Lang } from '@/lib/admin-i18n';
import { t } from '@/lib/admin-i18n';

type AdminLangCtx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };
const Ctx = createContext<AdminLangCtx>({ lang: 'th', setLang: () => {}, t: k => k });

export function AdminLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('th');

  useEffect(() => {
    const saved = localStorage.getItem('admin_lang') as Lang | null;
    if (saved === 'th' || saved === 'en') setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('admin_lang', l);
  }

  return (
    <Ctx.Provider value={{ lang, setLang, t: (key) => t(lang, key) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAdminLang = () => useContext(Ctx);
