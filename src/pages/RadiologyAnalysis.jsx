import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ScanLine, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { runDiagnosisPipeline } from "@/lib/analysisPipeline";
import ImageUploader from "@/components/ImageUploader";
import ClinicalContextForm from "@/components/ClinicalContextForm";
import AnalysisResult from "@/components/AnalysisResult";
import DisclaimerBanner from "@/components/DisclaimerBanner";

export default function RadiologyAnalysis() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [kbCount, setKbCount] = useState(0);
  const [clinicalContext, setClinicalContext] = useState("");

  useEffect(() => {
    base44.entities.RadiologyCase.list("-created_date", 100).then((cases) => setKbCount(cases.length)).catch(() => {});
  }, []);

  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runDiagnosisPipeline({
        files,
        entityName: "RadiologyCase",
        analysisType: "radiology",
        domainRole: "רדיולוג מומחה",
        clinicalContext,
        matchingInstructions: `1. זהה את סוג הבדיקה הרדיולוגית (רנטגן, CT, MRI, אולטראסאונד) ואת האזור האנטומי המצולם.
2. סרוק את הצילום בצורה שיטתית מלמעלה למטה ומצד לצד — אל תדלג על אזורים.
3. הערך צפיפות רקמות, מבנה אנטומי, סימטריה, וכל חריגה מהתקין.
4. השווה את הממצאים מול המאפיינים המרכזיים של כל מקרה במאגר — גם חיובי וגם שלילי.
5. שים לב במיוחד לממצאים מסכני חיים: פנאומוטורקס, פנאומופריטונאום, דיסקציה אאורטה, דימום תוך-גולגולתי, תסחיף ריאתי, שברים מרוסקים.
6. אל תניח "תקין" כברירת מחדל — שקול כל מקרה ברצינות.`,
        diagnosisInstructions: `1. התבסס על תוצאות שלב ההתאמה — המקרים התואמים ביותר מופיעים למעלה עם דרגת הביטחון שלהם.
2. תאר את סוג הבדיקה, האזור האנטומי, ואיכות הצילום (חשיפה, חדות, זווית).
3. נתח ממצאים מורפולוגיים מפורטים: צפיפות, גודל, צורה, מיקום, גבולות, השפעה על מבנים סמוכים.
4. הסבר מדוע האבחנה הראשית תואמת את המקרה מהמאגר, ומדוע אבחנות אחרות נשללו.
5. השתמש בתמונות הייחוס להשוואה ויזואלית מול המקרים התואמים.
6. ציין רמת דחיפות והמלצות — המשך בירור, בדיקות השלמה (CT עם חומר ניגוד, MRI, אולטראסאונד), הפניה למומחה.`,
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-indigo-500" />
            <h1 className="font-bold text-base">אבחון רדיולוגי</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {kbCount > 0 && (
          <Link to="/knowledge-base" className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
            <BookOpen className="w-4 h-4" />
            מאגר הידע כולל {kbCount} ממצאים רדיולוגיים להשוואה
          </Link>
        )}

        <ImageUploader
          files={files}
          onFilesChange={handleFilesChange}
          label="העלה צילום רדיולוגי"
          hint="רנטגן, CT, MRI או אולטראסאונד — ניתן להעלות מספר חתכים או פרופקציות"
        />

        {files.length > 0 && !result && (
          <>
            <ClinicalContextForm onChange={setClinicalContext} />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
            >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {stageLabel}
              </span>
            ) : (
              "נתח צילום"
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
              guideline={result.guideline}
              analysisId={result.analysisId}
              analysisType="radiology"
            />
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
}