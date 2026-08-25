import React from "react";

/**
 * Catches render errors so one broken page never blanks the whole app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("FreeAI render error:", error, info);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white">
        <div className="max-w-md w-full rounded-3xl border border-white/15 bg-white/5 p-6 text-center space-y-4">
          <div className="text-5xl">🛠️</div>
          <h1 className="text-xl font-black">משהו השתבש בעמוד הזה</h1>
          <p className="text-sm text-white/60 break-words">
            {String(this.state.error?.message || this.state.error).slice(0, 200)}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-xl bg-violet-600 font-bold text-sm hover:bg-violet-500"
            >
              נסה שוב
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl border border-white/20 font-bold text-sm hover:bg-white/10"
            >
              רענן דף
            </button>
          </div>
        </div>
      </div>
    );
  }
}
