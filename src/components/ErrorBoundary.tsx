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
        <div className="bg-white rounded p-4 border border-danger shadow-sm text-center d-flex flex-column gap-3 mx-auto mt-4" style={{maxWidth: '500px'}}>
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{width: '48px', height: '48px'}}>
            <AlertOctagon className="w-6 h-6" />
          </div>
          <h2 className="h5 fw-semibold text-dark mb-0">
            {(this as any).props?.fallbackTitle ?? 'This section could not be displayed'}
          </h2>
          <p className="small text-secondary mb-0">Your data has not been changed.</p>
          <div className="d-flex gap-3 justify-content-center mt-2">
            <button
              onClick={() => (this as any).setState({ hasError: false, error: null })}
              className="btn btn-dark btn-sm fw-medium px-4 py-2"
            >
              Try Again
            </button>
            <button
              onClick={() => (this as any).setState({ hasError: false, error: null })}
              className="btn btn-outline-secondary btn-sm fw-medium px-4 py-2"
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
