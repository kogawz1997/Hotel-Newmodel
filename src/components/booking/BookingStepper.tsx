'use client';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step { id: number; label: string; description?: string; }

interface Props {
  steps: Step[];
  current: number;
}

export function BookingStepper({ steps, current }: Props) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done   = current > step.id;
        const active = current === step.id;
        const last   = i === steps.length - 1;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300',
                done   ? 'bg-[#1e293b] border-[#1e293b] text-white' :
                active ? 'bg-[#2563eb] border-[#2563eb] text-white shadow-lg shadow-[#2563eb]/30' :
                         'bg-white border-black/15 text-[#1e293b]/30'
              )}>
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {/* Label */}
              <span className={cn(
                'text-xs mt-1.5 font-medium text-center hidden sm:block',
                active ? 'text-[#2563eb]' : done ? 'text-[#1e293b]' : 'text-[#1e293b]/30'
              )}>
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {!last && (
              <div className={cn(
                'flex-1 h-0.5 mx-2 transition-colors duration-300 -mt-5 sm:-mt-6',
                done || (current > step.id) ? 'bg-[#1e293b]' : 'bg-black/10'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
