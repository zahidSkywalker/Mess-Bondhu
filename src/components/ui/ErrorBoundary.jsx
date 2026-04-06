import { Component } from 'react';
import Button from './Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} onGoHome={this.handleGoHome} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onRetry, onGoHome }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Error icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
            An unexpected error occurred. Please try refreshing the page.
          </p>
        </div>

        {/* Error details (dev mode only) */}
        {typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development' && error && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 text-left">
            <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
              {error.message}
            </p>
            {error.stack && (
              <pre className="text-[10px] font-mono text-red-500 dark:text-red-500 mt-2 overflow-x-auto max-h-32 whitespace-pre-wrap">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={onRetry}>
            Try Again
          </Button>
          <Button variant="primary" onClick={onGoHome}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
