'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({ value, label, className, size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'คัดลอกแล้ว' : `คัดลอก${label ? ' ' + label : ''}`}
      title={copied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
      className={cn(
        'inline-flex items-center gap-1 rounded transition',
        size === 'sm' && 'p-1 text-xs',
        size === 'md' && 'px-2.5 py-1.5 text-sm',
        copied
          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
        className,
      )}
    >
      {copied ? <Check className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} /> : <Copy className={cn(size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />}
      {size === 'md' && <span>{copied ? 'คัดลอกแล้ว' : label || 'คัดลอก'}</span>}
    </button>
  );
}

interface CopyFieldProps {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}

export function CopyField({ label, value, mono, className }: CopyFieldProps) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2', className)}>
      <div className="flex-1 min-w-0">
        <p className="text-2xs text-muted-foreground mb-0.5">{label}</p>
        <p className={cn('text-sm truncate', mono && 'font-mono')}>{value}</p>
      </div>
      <CopyButton value={value} label={label} />
    </div>
  );
}
