import React, { useState, useEffect } from "react";
import { Activity, Loader2, BookOpen, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { runDiagnosisPipeline } from "@/lib/analysisPipeline";
import ImageUploader from "@/components/ImageUploader";
import ClinicalContextForm from "@/components/ClinicalContextForm";
import ExamFindingsInput, { ECG_EXAM_FIELDS } from "@/components/ExamFindingsInput";
import PediatricToggle from "@/components/PediatricToggle";
import AnalysisResult from "@/components/AnalysisResult";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import GroundedInterpretation from "@/components/GroundedInterpretation";
import BackButton from "@/components/BackButton";
import { useI18n } from "@/lib/i18n";
import { runGroundedVisionInterpretation } from "@/lib/medscan/engines/visionGrounded";

export default function ECGAnalysis() {
  const { t, lang } = useI18n();
  const [files, setFiles] = useState([]);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [grounded, setGrounded] = useState(null);
  const [groundedLoading, setGroundedLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kbCount, setKbCount] = useState(0);
  const [clinicalContext, setClinicalContext] = useState("");
  const [examFindings, setExamFindings] = useState("");
  const [pediatric, setPediatric] = useState(false);
  const [patientMeta, setPatientMeta] = useState({});

  const updateUploadedUrls = (urls) => {
    setUploadedUrls(urls);
    if (urls.length > 0) {
      sessionStorage.setItem("ecg_file_urls", JSON.stringify(urls));
    } else {
      sessionStorage.removeItem("ecg_file_urls");
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("ecg_file_urls");
    if (saved) {
      try {
        const urls = JSON.parse(saved);
        if (Array.isArray(urls) && urls.length > 0) setUploadedUrls(urls);
      } catch {}
    }
    base44.entities.ECGCase.list("-created_date", 100).then((cases) => setKbCount(cases.length)).catch(() => {});
  }, []);

  const handleFilesChange = async (newFiles) => {
    setFiles(newFiles);
    setResult(null);
    setGrounded(null);
    setError(null);
    updateUploadedUrls([]);

    if (newFiles.length > 0) {
      setUploading(true);
      try {
        const urls = await Promise.all(
          newFiles.map((f) => base44.integrations.Core.UploadFile({ file: f }))
        );
        const fileUrls = urls.map((r) => r.file_url);
        updateUploadedUrls(fileUrls);
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (uploadedUrls.length === 0 && files.length === 0) return;
    setLoading(true);
    setError(null);
    const fullContext = [clinicalContext, examFindings].filter(Boolean).join("\n");
    try {
      const res = await runDiagnosisPipeline({
        files,
        preUploadedUrls: uploadedUrls,
        entityName: "ECGCase",
        analysisType: "ecg",
        domainRole: "קרדיולוג מומחה",
        clinicalContext: fullContext,
        language: lang,
        pediatric,
        patientAgeYears: patientMeta.age ? Number(patientMeta.age) : undefined,
        patientSex: patientMeta.sex || undefined,
        patientRef: patientMeta.patient_ref || undefined,
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

      // שכבת הפרשנות המעוגנת — רצה אחרי הצינור הקיים ובנפרד ממנו.
      // כישלון כאן לעולם לא מפיל את הפענוח שהמשתמש כבר קיבל.
      if (res?.structuredInterpretation) {
        setGroundedLoading(true);
        runGroundedVisionInterpretation({
          modality: "ecg",
          engineResult: res.structuredInterpretation,
          clinicalContext: fullContext,
        })
          .then(setGrounded)
          .catch((e) => { console.error("grounded interpretation failed", e); setGrounded(null); })
          .finally(() => setGroundedLoading(false));
      }
      sessionStorage.removeItem("ecg_file_urls");
    } catch (err) {
      console.error(err);
      setError(err.message || t("analysis.error_fallback"));
    } finally {
      setLoading(false);
      setStage("");
    }
  };

  const stageLabels = {
    extracting: t("analysis.stage_extracting"),
    matching: t("analysis.stage_matching"),
    interpreting: t("analysis.stage_interpreting"),
    verifying: t("analysis.stage_verifying"),
    diagnosing: t("analysis.stage_diagnosing"),
  };
  const stageLabel = stageLabels[stage] || t("analysis.stage_diagnosing");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100 safe-top">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <h1 className="font-bold text-base">{t("analysis.ecg_title")}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        {kbCount > 0 && (
          <Link to="/knowledge-base" className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/15 rounded-lg px-3 py-2">
            <BookOpen className="w-4 h-4" />
            {t("analysis.ecg_kb_link", { n: kbCount })}
          </Link>
        )}

        <ImageUploader
          files={files}
          onFilesChange={handleFilesChange}
          label={t("analysis.ecg_upload_label")}
          hint={t("analysis.ecg_upload_hint")}
          imageUrls={uploadedUrls}
          onImageUrlsChange={updateUploadedUrls}
        />

        {(files.length > 0 || uploadedUrls.length > 0) && !result && (
          <>
            <ClinicalContextForm onChange={setClinicalContext} onMeta={setPatientMeta} />
            <ExamFindingsInput onChange={setExamFindings} fields={ECG_EXAM_FIELDS} title="הקשר קליני (תסמינים/תרופות/אלקטרוליטים)" />
            <PediatricToggle value={pediatric} onChange={setPediatric} />
            <Button
              onClick={handleAnalyze}
              disabled={loading || uploading}
              className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/20"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מעלה תמונות...
                </span>
              ) : loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {stageLabel}
                </span>
              ) : (
                t("analysis.ecg_button")
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
              ecgInterpretation={result.ecgInterpretation}
              structuredInterpretation={result.structuredInterpretation}
              analysisId={result.analysisId}
              analysisType="ecg"
              numericIntegrity={result.numericIntegrity}
            />
          </div>
        )}

        {groundedLoading && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            מריץ אימות עיגון על הפרשנות…
          </div>
        )}

        {grounded && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <div>
                <h3 className="font-bold text-sm">פרשנות מעוגנת</h3>
                <p className="text-[11px] text-slate-500">עברה אימות מול בסיס הידע המאומת</p>
              </div>
            </div>
            <GroundedInterpretation data={grounded} />
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
}