import React from "react";
import { Link } from "react-router-dom";
import { Home, Sparkles } from "lucide-react";
import { R } from "../lib/routes.js";

export default function FreeAINotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="text-7xl">🧭</div>
        <h1 className="text-3xl font-black">הדף לא נמצא</h1>
        <p className="text-white/60">
          הקישור שהגעת אליו לא קיים או השתנה.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link to={R.hub} className="fa-btn fa-btn-primary">
            <Home className="w-4 h-4" />
            FreeAI Hub
          </Link>
          <Link to={R.kids} className="fa-btn fa-btn-ghost">
            <Sparkles className="w-4 h-4" />
            Kids
          </Link>
        </div>
      </div>
    </div>
  );
}
