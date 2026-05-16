'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  message:  string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center rounded-lg border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <div>
            <p className="font-semibold text-sm">{this.props.title ?? 'เกิดข้อผิดพลาด'}</p>
            {this.state.message && (
              <p className="text-xs text-muted-foreground mt-1">{this.state.message}</p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            ลองใหม่
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Functional wrapper for simple error states without full boundary */
export function ErrorState({
  title = 'เกิดข้อผิดพลาด',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center rounded-lg border border-destructive/30 bg-destructive/5">
      <AlertTriangle className="w-8 h-8 text-destructive" />
      <div>
        <p className="font-semibold text-sm">{title}</p>
        {message && <p className="text-xs text-muted-foreground mt-1">{message}</p>}
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          ลองใหม่
        </Button>
      )}
    </div>
  );
}
