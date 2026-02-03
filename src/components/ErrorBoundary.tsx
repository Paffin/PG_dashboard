import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--error-muted)] flex items-center justify-center">
              <AlertOctagon className="w-8 h-8 text-[var(--error)]" />
            </div>

            <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Something went wrong
            </h1>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              An unexpected error occurred. Please try reloading the page.
            </p>

            {this.state.error && (
              <div className="mb-6 p-3 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)] text-left">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Error details:</p>
                <code className="text-xs text-[var(--error)] font-mono break-all">
                  {this.state.error.message}
                </code>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleGoHome}
                className="btn btn-secondary"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              <button
                onClick={this.handleReload}
                className="btn btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
