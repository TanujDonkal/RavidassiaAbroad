import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center px-3">
          <h1 className="display-4 fw-bold text-danger mb-3">
            Something went wrong
          </h1>
          <p className="text-muted mb-4">
            An unexpected error occurred. Please refresh the page and try again.
          </p>
          <button
            className="btn btn-primary rounded-pill px-4"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
