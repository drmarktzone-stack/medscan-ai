import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { runDiagnosisPipeline } from "@/lib/analysisPipeline";
import ImageUploader from "@/components/ImageUploader";
import ClinicalContextForm from "@/components/ClinicalContextForm";
import AnalysisResult from "@/components/AnalysisResult";
import DisclaimerBanner from "@/components/DisclaimerBanner";

export default function ECGAnalysis() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [kbCount, setKbCount] = useState(0);
  const [clinicalContext, setClinicalContext] = useState("");

  useEffect(() => {
    base44.entities.ECGCase.list("-created_date", 100).then((cases) => setKbCount(cases.length)).catch(() => {});
  }, []);

  const handleFileSelect = (f) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runDiagnosisPipeline({
        file,
        entityName: "ECGCase",
        analysisType: "ecg",
        domainRole: "קרדיולוג מומחה",
        clinicalContext,
        matchingInstructions: `1. בחן את התרשים בצורה שיטתית: קצב, רגולריות, גלי P, מרווח PR, קומפלקס QRS, מקטע ST, גלי T, מקטע QT, ציר חשמלי.
2. השווה את הממצאים מול המאפיינים המרכזיים של כל מקרה במאגר — גם חיובי וגם שלילי.
3. שים לב במיוחד למצבים מסכני חיים: STEMI, VT, VF, חסמים מלאים, היפרקלמיה.
4. אל תניח "תקין" כברירת מחדל — שקול כל מקרה ברצינות.`,
        diagnosisInstructions: `1. התבסס על תוצאות שלב ההתאמה — המקרים התואמים ביותר מופיעים למעלה עם דרגת הביטחון שלהם.
2. נתח ביסודיות: קצב, רגולריות, גלי P, מרווח PR, QRS, מקטע ST, גל T, QT, ציר חשמלי.
3. הסבר מדוע האבחנה הראשית תואמת את המקרה מהמאגר, ומדוע אבחנות אחרות נשללו.
4. השתמש בתמונות הייחוס להשוואה ויזואלית מול המקרים התואמים.
5. אם יש ספק, ציין זאת במפורש והמלץ על בדיקות נוספות.`,
        onStage: setStage,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
      setError(err.message || "אירעה שגיאה במהלך הניתוח. נסה שנית.");
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  const stageLabel = stage === "matching" ? "מתאים מול מאגר הידע ומאגרי אינטרנט רפואיים..." : "מנתח ומכין דוח מפורט...";

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
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
        {kbCount > 0 && (
          <Link to="/knowledge-base" className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
            <BookOpen className="w-4 h-4" />
            מאגר הידע כולל {kbCount} דפוסי ECG להשוואה
          </Link>
        )}

        <ImageUploader
          onFileSelect={handleFileSelect}
          preview={preview}
          onClear={handleClear}
          label="העלה תמונת ECG"
        />

        {file && !result && (
          <>
            <ClinicalContextForm onChange={setClinicalContext} />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
            >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {stageLabel}
              </span>
            ) : (
              "נתח ECG"
            )}
            </Button>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <AnalysisResult
              result={result.analysis}
              severity={result.severity}
              summary={result.summary}
              matchedCases={result.matchedCases}
              imageUrl={result.imageUrl}
              findings={result.findings}
              uncertainty={result.uncertainty}
            />
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
}