import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Mail } from 'lucide-react';
import { Button } from './Button';
import { Card } from '../UI';
import { logError, ApiError, ErrorType } from '../../utils/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EnhancedErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to error tracking service
    const appError: ApiError = new ApiError(
      error.message,
      ErrorType.UNKNOWN,
      'BOUNDARY_ERROR',
      {
        componentStack: errorInfo.componentStack,
        stack: error.stack,
      },
      'An unexpected error occurred in the application.'
    );
    
    logError(appError, 'ErrorBoundary');
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error tracking service
    if (window.errorTracker) {
      window.errorTracker.captureException(error, {
        tags: {
          errorBoundary: true,
          errorId: this.state.errorId,
        },
        extra: {
          componentStack: errorInfo.componentStack,
          errorInfo,
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, errorId } = this.state;
      const showDetails = this.props.showDetails ?? (import.meta.env.DEV || import.meta.env.MODE === 'development');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-4">
          <Card className="max-w-2xl w-full p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h1>
              <p className="text-gray-600 mb-2">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              {errorId && (
                <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                  Error ID: {errorId}
                </p>
              )}
            </div>

            {showDetails && error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-h-64 overflow-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-bold text-red-900">Error Details (Development Only):</p>
                </div>
                <div className="space-y-2">
                  <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap break-words">
                    {error.toString()}
                  </pre>
                  {errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-700 cursor-pointer hover:text-red-900">
                        Component Stack
                      </summary>
                      <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap break-words">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Button
                onClick={this.handleReset}
                variant="primary"
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reload Page
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Home size={18} />
                Go to Home
              </Button>
            </div>

            <div className="border-t border-gray-200 pt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">
                If this problem persists, please contact our support team.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <Mail size={16} className="text-gray-400" />
                <a 
                  href="mailto:support@liywan.qa" 
                  className="text-qatar hover:text-qatar-dark font-medium"
                >
                  support@liywan.qa
                </a>
              </div>
              {errorId && (
                <p className="text-xs text-gray-500 mt-2">
                  Please include Error ID: <span className="font-mono">{errorId}</span> when contacting support.
                </p>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;

