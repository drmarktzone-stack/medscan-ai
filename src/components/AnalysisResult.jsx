import React, { useRef, useState } from "react";
import SeverityBadge from "@/components/SeverityBadge";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import AnnotatedImage from "@/components/AnnotatedImage";
import UncertaintyWarning from "@/components/UncertaintyWarning";
import FeedbackButtons from "@/components/FeedbackButtons";
import { exportReportToPDF } from "@/lib/pdfExport";
import { Button } from "@/components/ui/button";

function confidenceStyle(conf) {
  if (conf >= 70) return "text-red-600 bg-red-50 border-red-200";
  if (conf >= 40) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-slate-500 bg-slate-50 border-slate-200";
}

export default function AnalysisResult({ result, severity, summary, matchedCases, imageUrl, findings, uncertainty, guideline, analysisId, analysisType }) {
  const reportRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportReportToPDF(reportRef.current);
    } catch (err) {
      console.error(err);
      setExportError("ייצוא ה-PDF נכשל. נסה שנית.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div ref={reportRef} className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-foreground">תוצאות הניתוח</h3>
        <SeverityBadge severity={severity} />
      </div>

      {uncertainty && uncertainty.level !== "low" && (
        <UncertaintyWarning level={uncertainty.level} reason={uncertainty.reason} />
      )}

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

      {guideline && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
          <h4 className="text-sm font-bold text-teal-800 mb-1">הנחיה קלינית</h4>
          <p className="text-xs text-teal-700 leading-relaxed">{guideline}</p>
        </div>
      )}

      <div
        className="prose prose-sm max-w-none text-foreground/85 leading-relaxed select-text"
        dir="rtl"
      >
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
          דוח זה נוצר על ידי מערכת MedScan AI ומספק הערכה ראשונית בלבד. אינו מהווה תחליף לייעוץ רפואי מקצועי.
        </p>
      </div>
      </div>

      <Button
        onClick={handleExport}
        disabled={exporting}
        variant="outline"
        className="w-full h-11 rounded-xl text-sm font-semibold"
      >
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {exporting ? "מכין דוח..." : "ייצא דוח PDF"}
      </Button>
      {exportError && (
        <p className="text-xs text-red-500 text-center">{exportError}</p>
      )}

      {analysisId && (
        <FeedbackButtons analysisId={analysisId} analysisType={analysisType} />
      )}
    </div>
  );
}