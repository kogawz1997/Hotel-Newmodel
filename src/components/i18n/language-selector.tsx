'use client';
import { useLocale } from '@/components/providers/locale-provider';
import { LOCALES, type Locale } from '@/lib/i18n/translations';
import { cn } from '@/lib/utils';

export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {(Object.entries(LOCALES) as [Locale, { label: string; flag: string }][]).map(([code, info]) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
            locale === code
              ? 'bg-[#004B87] text-white border-[#004B87]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#004B87]/50 hover:text-[#004B87]'
          )}
        >
          <span>{info.flag}</span>
          <span>{info.label}</span>
        </button>
      ))}
    </div>
  );
}
