'use client';

import { useState } from 'react';

interface Flag {
  id: string;
  key: string;
  enabled: boolean;
  description?: string;
  updated_at?: string;
  scope?: string;
}

export function FeatureGatesClient({ flags }: { flags: Flag[] }) {
  const [items, setItems] = useState<Flag[]>(flags);
  const [saving, setSaving] = useState<string | null>(null);

  async function toggle(flag: Flag) {
    setSaving(flag.id);
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flag.id, enabled: !flag.enabled }),
      });
      if (res.ok) {
        setItems(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
      }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-2">
      {items.map(flag => (
        <div
          key={flag.id}
          className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm text-white">{flag.key}</div>
            {flag.description && (
              <div className="text-xs text-gray-400 truncate">{flag.description}</div>
            )}
            {flag.scope && (
              <div className="text-xs text-gray-600 mt-0.5">scope: {flag.scope}</div>
            )}
          </div>

          <button
            onClick={() => toggle(flag)}
            disabled={saving === flag.id}
            className={`ml-4 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              flag.enabled ? 'bg-indigo-500' : 'bg-white/20'
            } ${saving === flag.id ? 'opacity-50' : ''}`}
            aria-label={flag.enabled ? 'Disable' : 'Enable'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                flag.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No feature flags defined. Create one via the API or database.
        </div>
      )}
    </div>
  );
}
