import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-8 text-center text-red-500" role="alert">
          <h1 className="text-2xl font-bold">Something went wrong.</h1>
          <p className="mt-2">{this.props.fallbackMessage || "Please try refreshing the page."}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;