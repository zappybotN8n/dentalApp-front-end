import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-6">
          <p className="text-4xl">⚠️</p>
          <h2 className="text-lg font-semibold text-gray-800">Algo salió mal</h2>
          <p className="text-sm text-gray-500 max-w-sm">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
