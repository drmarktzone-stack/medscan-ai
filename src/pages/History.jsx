import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Stethoscope, Clock, ScanLine } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SeverityBadge from "@/components/SeverityBadge";
import moment from "moment";

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Analysis.list("-created_date", 50)
      .then(setAnalyses)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h1 className="font-bold text-base">היסטוריה</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">אין ניתוחים קודמים</p>
          </div>
        ) : (
          analyses.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${a.type === "ecg" ? "bg-blue-50" : a.type === "skin" ? "bg-teal-50" : "bg-indigo-50"}`}>
                  {a.type === "ecg"
                    ? <Activity className="w-5 h-5 text-blue-500" />
                    : a.type === "skin"
                    ? <Stethoscope className="w-5 h-5 text-teal-500" />
                    : <ScanLine className="w-5 h-5 text-indigo-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{a.type === "ecg" ? "ECG" : a.type === "skin" ? "עור" : "רדיולוגיה"}</span>
                    {a.severity && <SeverityBadge severity={a.severity} />}
                  </div>
                  {a.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.summary}</p>}
                  <p className="text-[11px] text-muted-foreground/60 mt-2">{moment(a.created_date).format("DD/MM/YYYY HH:mm")}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}