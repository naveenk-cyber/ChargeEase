import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
          <div className="w-full max-w-md rounded-card border border-line bg-surface p-8 text-center shadow-card">
            <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-error-soft">
              <AlertTriangle className="h-6 w-6 text-error-ink" aria-hidden="true" />
            </span>

            <h1 className="text-2xl font-bold text-ink">Something went wrong</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              The page stopped unexpectedly. Reloading usually clears it; if it keeps happening, the
              station service may be unavailable.
            </p>

            <div className="mt-6 space-y-2.5">
              <Button
                onClick={this.handleReload}
                fullWidth
                leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
              >
                Reload the page
              </Button>
              <Button onClick={this.handleReset} variant="ghost" fullWidth>
                Try again without reloading
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs font-medium text-ink-muted">
                  Error details (development)
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-control border border-line bg-surface-muted p-3 text-[0.7rem] text-error-ink">
                  {this.state.error.toString()}
                  {this.state.errorInfo ? `\n\n${this.state.errorInfo.componentStack}` : ''}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
