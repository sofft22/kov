import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col bg-cream text-charcoal">
        {/* Minimal brand bar */}
        <div className="border-b border-cream-dark px-5 py-4 sm:px-8 lg:px-10">
          <a
            href="/"
            className="font-serif text-[18px] uppercase leading-none tracking-[0.18em] text-charcoal"
          >
            KOVA
          </a>
        </div>

        <main className="flex flex-1 items-center justify-center px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-md text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-terracotta">
              
            </p>
            <h1 className="mt-4 font-serif text-[32px] leading-tight tracking-[-0.02em] text-charcoal sm:text-[40px]">
              We hit a snag.
            </h1>
            <p className="mt-4 text-[13.5px] leading-[1.7] text-charcoal/55 sm:text-[14px]">
              The page ran into an unexpected error. Reload to try again, or
              head back home.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReload}
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal underline-offset-4 transition-colors hover:text-terracotta hover:underline"
              >
                Reload
              </button>
              <span className="hidden text-charcoal/20 sm:inline">·</span>
              <a
                href="/"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal underline-offset-4 transition-colors hover:text-terracotta hover:underline"
              >
                Back home
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }
}