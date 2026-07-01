import React from "react";
import SeverityBadge from "@/components/SeverityBadge";
import ReactMarkdown from "react-markdown";

export default function AnalysisResult({ result, severity, summary, imageUrl }) {
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

      <div className="prose prose-sm max-w-none text-foreground/85 leading-relaxed" dir="rtl">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
    </div>
  );
}