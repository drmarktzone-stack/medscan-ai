import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import ImageUploader from "@/components/ImageUploader";
import AnalysisResult from "@/components/AnalysisResult";
import DisclaimerBanner from "@/components/DisclaimerBanner";

export default function ECGAnalysis() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileSelect = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה קרדיולוג מומחה. נתח את תמונת ה-ECG הבאה ותן ניתוח מפורט בעברית.

כלול בניתוח:
1. **קצב הלב** — רגולרי/לא רגולרי, קצב משוער
2. **גלי P** — נוכחות, מורפולוגיה
3. **מרווח PR** — תקין/מוארך/מקוצר
4. **קומפלקס QRS** — רוחב, מורפולוגיה
5. **מקטע ST** — עליות/ירידות
6. **גל T** — מורפולוגיה, היפוך
7. **ציר חשמלי** — תקין/סטייה
8. **ממצאים עיקריים** — זיהוי הפרעות קצב, חסמים, שינויים איסכמיים
9. **סיכום והמלצות** — המלצה כללית

ציין את רמת החומרה: normal, mild, moderate, severe, או urgent.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string", description: "סיכום קצר של הממצאים" },
            severity: { type: "string", enum: ["normal", "mild", "moderate", "severe", "urgent"] },
            analysis: { type: "string", description: "ניתוח מפורט בפורמט Markdown" },
          },
          required: ["summary", "severity", "analysis"],
        },
        model: "claude_sonnet_4_6",
      });

      const saved = await base44.entities.Analysis.create({
        type: "ecg",
        image_url: file_url,
        result: analysis.analysis,
        severity: analysis.severity,
        summary: analysis.summary,
      });

      setResult(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h1 className="font-bold text-base">פענוח ECG</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <ImageUploader
          onFileSelect={handleFileSelect}
          preview={preview}
          onClear={handleClear}
          label="העלה תמונת ECG"
        />

        {file && !result && (
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                מנתח את ה-ECG...
              </span>
            ) : (
              "נתח ECG"
            )}
          </Button>
        )}

        {result && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <AnalysisResult
              result={result.analysis}
              severity={result.severity}
              summary={result.summary}
            />
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
}