import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { buildKnowledgeBaseText } from "@/lib/knowledgeBase";
import ImageUploader from "@/components/ImageUploader";
import AnalysisResult from "@/components/AnalysisResult";
import DisclaimerBanner from "@/components/DisclaimerBanner";

export default function ECGAnalysis() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [kbCount, setKbCount] = useState(0);

  useEffect(() => {
    base44.entities.ECGCase.list("-created_date", 100).then((cases) => setKbCount(cases.length)).catch(() => {});
  }, []);

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
      const cases = await base44.entities.ECGCase.list("-created_date", 100);
      const knowledgeBase = buildKnowledgeBaseText(cases);

      const referenceImages = cases.filter((c) => c.image_url).slice(0, 5).map((c) => c.image_url);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה קרדיולוג מומחה עם ניסיון רב שנים בפענוח ECG. נתח את תרשים ה-ECG הבא בצורה מדויקת, יסודית וביקורתית.

## מאגר ידע — דפוסי ECG עם אבחנות ידועות:
${knowledgeBase}

## הוראות ניתוח:
1. בחן את התרשים בצורה שיטתית: קצב, רגולריות, גלי P, מרווח PR, קומפלקס QRS, מקטע ST, גלי T, מקטע QT, ציר חשמלי.
2. השווה את הממצאים מול כל דפוס במאגר הידע — חיובי ושלילי.
3. אל תניח "תקין" כברירת מחדל — שקול כל אבחנה מבדלת ברצינות, במיוחד מצבים מסכני חיים (STEMI, VT, VF, חסמים מלאים).
4. אם יש ספק, ציין זאת במפורש והמלץ על בדיקות נוספות.
5. זהה את הדפוס התואם ביותר או שילוב של דפוסים מתוך המאגר.

${referenceImages.length > 0 ? `## תמונות ייחוס ממאגר הידע:
התמונה הראשונה היא ה-ECG לניתוח. שאר התמונות הן דוגמאות ממאגר הידע להשוואה.` : ""}

## פלט נדרש:
- summary: סיכום תמציתי של הממצא העיקרי (משפט אחד)
- severity: רמת חומרה — normal / mild / moderate / severe / urgent
- analysis: ניתוח מפורט ב-Markdown הכולל:
  * **קצב ורגולריות** — מספר, רגולרי/לא רגולרי
  * **ניתוח גלים ומרווחים** — גל P, מרווח PR, QRS, מקטע ST, גל T, QT
  * **ציר חשמלי**
  * **השוואה למאגר הידע** — אילו דפוסים נשללו ואילו תואמים
  * **אבחנה ראשית** ואבחנות מבדלות (מהסביר ביותר לפחות סביר)
  * **ממצאים פתולוגיים** משמעותיים
  * **המלצות קליניות** — המשך טיפול/בירור`,
        file_urls: [file_url, ...referenceImages],
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

      await base44.entities.Analysis.create({
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
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                מנתח מול מאגר הידע...
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