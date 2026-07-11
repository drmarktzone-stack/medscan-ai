import React from "react";
import SeverityBadge from "@/components/SeverityBadge";
import ReactMarkdown from "react-markdown";
import { CheckCircle2 } from "lucide-react";
import AnnotatedImage from "@/components/AnnotatedImage";

function confidenceStyle(conf) {
  if (conf >= 70) return "text-red-600 bg-red-50 border-red-200";
  if (conf >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-slate-500 bg-slate-50 border-slate-200";
}

export default function AnalysisResult({ result, severity, summary, matchedCases, imageUrl, findings }) {
  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-foreground">תוצאות הניתוח</h3>
        <SeverityBadge severity={severity} />
      </div>

      {summary && (
        <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
          <p className="text-sm font-semibold text-primary">{summary}</p>
        </div>
      )}

      {imageUrl && findings && findings.length > 0 && (
        <AnnotatedImage imageUrl={imageUrl} findings={findings} />
      )}

      {matchedCases && matchedCases.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            התאמה מול מאגר הידע
          </h4>
          <div className="space-y-2">
            {matchedCases.map((m, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white border border-slate-200 rounded-lg p-3"
              >
                <div
                  className={`shrink-0 text-xs font-bold px-2 py-1 rounded-md border ${confidenceStyle(
                    m.confidence
                  )}`}
                >
                  {m.confidence}%
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{m.title}</p>
                  {m.diagnosis && (
                    <p className="text-xs text-muted-foreground mt-0.5">{m.diagnosis}</p>
                  )}
                  {m.reasoning && (
                    <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
                      {m.reasoning}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="prose prose-sm max-w-none text-foreground/85 leading-relaxed"
        dir="rtl"
      >
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
    </div>
  );
}