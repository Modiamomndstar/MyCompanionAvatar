import { Component, type ErrorInfo, type ReactNode } from "react";
import { Sparkles } from "lucide-react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-black text-white flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center mb-5">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            An unexpected error occurred in MyCompanionAvatar. Please reload the
            app to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-full bg-purple-600 text-white text-sm font-medium active:scale-95 transition-transform"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
