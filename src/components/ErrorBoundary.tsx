import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicit state declaration required with React 19 + useDefineForClassFields=false
  declare state: ErrorBoundaryState;
  declare props: React.PropsWithChildren<ErrorBoundaryProps>;
  declare setState: React.Component<ErrorBoundaryProps, ErrorBoundaryState>['setState'];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    (this as any).state = { hasError: false, error: null } as ErrorBoundaryState;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): React.ReactNode {
    if ((this as any).state?.hasError) {
      return (
        <div className="bg-white rounded-xl p-8 border border-red-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            {(this as any).props?.fallbackTitle ?? 'This section could not be displayed'}
          </h2>
          <p className="text-sm text-slate-500">Your data has not been changed.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => (this as any).setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition"
            >
              Return to Pipeline
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props?.children ?? null;
  }
}
