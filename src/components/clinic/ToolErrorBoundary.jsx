import React from "react";

export default class ToolErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err) {
    console.error("DoctorPedAI tool error", err);
  }

  render() {
    if (this.state.err) {
      const msg = this.state.err?.message || String(this.state.err);
      return (
        <div className="clinic-wrap py-8">
          <div className="clinic-card p-5 space-y-3 border-amber-200 bg-amber-50">
            <p className="text-sm font-bold text-amber-950">הכלי נתקל בשגיאה ולא הציג פענוח.</p>
            <p className="text-xs text-amber-900 leading-relaxed">{msg}</p>
            <button
              type="button"
              className="text-sm font-semibold text-primary underline"
              onClick={() => this.setState({ err: null })}
            >
              נסו שוב
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
