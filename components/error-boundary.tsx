"use client";

// ============================================================================
// RPDMS — Global Error Boundary
// ============================================================================
// Catches uncaught runtime errors in child components.
// Renders a professional fallback UI instead of a blank screen.
// The user can recover without a full page reload.

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", error, info.componentStack);
    }
    // TODO: send to Sentry / logging service in production
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-10 text-center space-y-6">
            <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Something Went Wrong
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                An unexpected error occurred in the application. If this
                persists, please contact your system administrator.
              </p>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <pre className="mt-4 text-left text-xs bg-slate-900 text-rose-300 rounded-xl p-4 overflow-auto max-h-40">
                  {this.state.error.message}
                  {"\n"}
                  {this.state.error.stack?.split("\n").slice(1, 4).join("\n")}
                </pre>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="rounded-xl font-bold text-xs uppercase tracking-wider gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/dashboard")}
                className="rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper for use around individual sections (not just top-level).
 * Renders a smaller inline error card when a widget crashes.
 */
export function SectionErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 rounded-xl border border-rose-100 bg-rose-50 flex items-center gap-3 text-rose-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-xs font-semibold">
            This section failed to load. Please refresh the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
