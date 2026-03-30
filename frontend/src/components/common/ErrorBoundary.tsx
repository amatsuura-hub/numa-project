import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: Replace with Sentry.captureException() when error tracking is set up.
    console.error("ErrorBoundary caught an error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
          <h2 className="mb-2 text-xl font-bold text-gray-800">
            予期しないエラーが発生しました
          </h2>
          <p className="mb-6 text-gray-500">
            ページを再読み込みしてください。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-numa-600 px-6 py-2 text-sm font-medium text-white hover:bg-numa-700"
          >
            再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
