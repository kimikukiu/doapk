import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-black text-emerald-500 font-mono p-4">
          <div className="border border-emerald-500/30 p-8 rounded-lg text-center">
            <h1 className="text-xl font-black uppercase italic mb-4">System_Critical_Failure</h1>
            <p className="text-xs text-gray-400 mb-6">The interface has crashed due to a rendering error. Please refresh the page to attempt a recovery.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-emerald-600 text-black px-4 py-2 rounded font-black text-[10px] uppercase hover:bg-emerald-500 transition-all"
            >
              Force_System_Reboot
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
