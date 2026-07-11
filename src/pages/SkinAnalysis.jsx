import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Stethoscope, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { runDiagnosisPipeline } from "@/lib/analysisPipeline";
import ImageUploader from "@/components/ImageUploader";
import ClinicalContextForm from "@/components/ClinicalContextForm";
import AnalysisResult from "@/components/AnalysisResult";
import DisclaimerBanner from "@/components/DisclaimerBanner";

export default function SkinAnalysis() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [kbCount, setKbCount] = useState(0);
  const [clinicalContext, setClinicalContext] = useState("");

  useEffect(() => {
    base44.entities.SkinCase.list("-created_date", 100).then((cases) => setKbCount(cases.length)).catch(() => {});
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
        entityName: "SkinCase",
        analysisType: "skin",
        domainRole: "דרמטולוג מומחה",
        clinicalContext,
        matchingInstructions: `1. בחן את הנגע בצורה שיטתית: מורפולוגיה (מקולרי/פפולרי/נודולרי/וסיקולרי), צבע, גודל, גבולות, פיזור, סימטריה.
2. השווה את הממצאים מול המאפיינים המרכזיים של כל מחלה במאגר — גם חיובי וגם שלילי.
3. השתמש בכלל ABCDE להערכת נגעים פיגמנטיים: Asymmetry, Border, Color, Diameter, Evolution.
4. שים לב לסימני דגל אדום: גבולות לא סדירים, צבע לא אחיד, כיב, דימום, גדילה מהירה.
5. אל תניח "שפיר" כברירת מחדל — שקול כל מקרה ברצינות, במיוחד מלנומה וקרצינומות.`,
        diagnosisInstructions: `1. התבסס על תוצאות שלב ההתאמה — המחלות התואמות ביותר מופיעות למעלה עם דרגת הביטחון שלהן.
2. נתח מורפולוגיה מפורטת: סוג נגע, צבע, גודל משוער, גבולות, פיזור, סימטריה.
3. בצע הערכת ABCDE לנגעים פיגמנטיים.
4. הסבר מדוע האבחנה הראשית תואמת את המקרה מהמאגר, ומדוע אבחנות אחרות נשללו.
5. השתמש בתמונות הייחוס להשוואה ויזואלית מול המקרים התואמים.
6. ציין רמת דחיפות והמלצות — ביופסיה, הפניה למומחה, טיפול ראשוני.`,
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-500" />
            <h1 className="font-bold text-base">אבחון עור</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {kbCount > 0 && (
          <Link to="/knowledge-base" className="flex items-center gap-2 text-xs text-teal-600 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
            <BookOpen className="w-4 h-4" />
            מאגר הידע כולל {kbCount} מחלות עור להשוואה
          </Link>
        )}

        <ImageUploader
          files={files}
          onFilesChange={handleFilesChange}
          label="העלה תמונה של הנגע"
          hint="מקרוב, רחוק, דרמטוסקופיה — מספר זוויות משפרות דיוק"
        />

        {files.length > 0 && !result && (
          <>
            <ClinicalContextForm onChange={setClinicalContext} />
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full h-12 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-500/20"
            >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {stageLabel}
              </span>
            ) : (
              "נתח תמונה"
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
              analysisType="skin"
            />
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
}