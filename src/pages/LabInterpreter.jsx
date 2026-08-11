import React, { useState, useRef } from "react";
import { FlaskConical, Loader2, Plus, X, ShieldCheck, AlertTriangle, ScanLine, Upload, Info, Camera, GitCompare, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GroundedInterpretation from "@/components/GroundedInterpretation";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import BackButton from "@/components/BackButton";
import AnalytePicker from "@/components/AnalytePicker";
import { base44 } from "@/api/base44Client";
import { createVisionInvokeLLM } from "@/lib/medscan/llmAdapter";
import { runLabScan } from "@/lib/labScanEngine";
import { downscaleImageFile } from "@/lib/imageOptimize";
import { runLabInterpreter } from "@/lib/medscan/engines/labInterpreter";
import { RESULT_TYPES, CATALOG_SIZE } from "@/lib/medscan/deterministic/analyteCatalog";

const scanInvoke = createVisionInvokeLLM({ purpose: "lab_scan" });

const emptyRow = () => ({
  analyte: "", value: "", unit: "", ref_low: "", ref_high: "",
  result_type: RESULT_TYPES.NUMERIC,
});

export default function LabInterpreter() {
  const [ageValue, setAgeValue] = useState("");
  const [ageUnit, setAgeUnit] = useState("years");
  const [sex, setSex] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()]);
  const [findingsText, setFindingsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanInfo, setScanInfo] = useState(null);
  const scanFileRef = useRef(null);   // העלאת קבצים (רבים, ללא מצלמה)
  const scanCamRef = useRef(null);    // צילום במצלמה

  // בדיקות קודמות להשוואה (של אותו מטופל)
  const [priorRows, setPriorRows] = useState([]);
  const [priorScanning, setPriorScanning] = useState(false);
  const [priorInfo, setPriorInfo] = useState(null);
  const priorFileRef = useRef(null);
  const priorCamRef = useRef(null);

  // המרת שורת-סריקה לשורת-טופס. ערך לא-קריא → ריק (לא מנוחש).
  const scanRowToUiRow = (sr) => {
    const isQual = sr.value == null && !!(sr.value_text || "").trim();
    return {
      analyte: sr.matched_he || sr.analyte_raw || "",
      value: sr.value != null ? String(sr.value) : (sr.value_text || ""),
      unit: sr.unit || sr.expected_unit || "",
      ref_low: sr.ref_low != null ? String(sr.ref_low) : "",
      ref_high: sr.ref_high != null ? String(sr.ref_high) : "",
      result_type: isQual ? RESULT_TYPES.QUALITATIVE : RESULT_TYPES.NUMERIC,
      _scan: true,
      analyte_raw: sr.analyte_raw || "",
      needs_review: sr.needs_review,
      review_reason_he: sr.review_reason_he || "",
      confidence: sr.confidence || "medium",
    };
  };

  // סריקת קובץ בודד → שורות + מטא-דאטה.
  const scanOneFile = async (file) => {
    const optimized = await downscaleImageFile(file);
    const { file_url } = await base44.integrations.Core.UploadFile({ file: optimized });
    return runLabScan({ fileUrls: [file_url], invokeLLM: scanInvoke });
  };

  // סריקת מספר קבצים של אותו מטופל — ממזגת את כל המדדים לטופס אחד.
  const scanFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setScanning(true);
    setScanInfo(null);
    setError(null);
    try {
      const allRows = [];
      const totals = { total: 0, readable: 0, needs_review: 0 };
      let sexDetected = null, ageText = "", failed = 0;
      for (const file of files) {
        try {
          const scan = await scanOneFile(file);
          if (scan.ok) {
            allRows.push(...scan.rows.map(scanRowToUiRow));
            totals.total += scan.stats?.total || 0;
            totals.readable += scan.stats?.readable || 0;
            totals.needs_review += scan.stats?.needs_review || 0;
            if (!sexDetected && (scan.patient?.sex === "male" || scan.patient?.sex === "female")) sexDetected = scan.patient.sex;
            if (!ageText && scan.patient?.age_text) ageText = scan.patient.age_text;
          } else { failed++; }
        } catch { failed++; }
      }
      if (!allRows.length) {
        setScanInfo({ error: "לא הצלחתי לקרוא ערכים מהקבצים. נסה צילום חד יותר או מילוי ידני." });
      } else {
        // מצרפים לשורות שכבר מולאו (סריקות קודמות או הקלדה ידנית) — לא דורסים.
        const existing = rows.filter((r) => r.analyte.trim() && String(r.value).trim() !== "");
        const merged = [...existing, ...allRows];
        setRows(merged.length ? merged : [emptyRow()]);
        if (sexDetected) setSex(sexDetected);
        setScanInfo({ stats: totals, note: `נסרקו ${files.length - failed}/${files.length} קבצים${failed ? ` (אחד או יותר לא נקרא)` : ""}. אמת/י את הערכים לפני הניתוח.`, ageText });
      }
    } catch (err) {
      console.error(err);
      setScanInfo({ error: err.message || "שגיאה בסריקת הקבצים." });
    } finally {
      setScanning(false);
      if (scanFileRef.current) scanFileRef.current.value = "";
      if (scanCamRef.current) scanCamRef.current.value = "";
    }
  };
  const handleScanFile = (e) => scanFiles(e.target.files);

  // סריקת בדיקות קודמות להשוואה — נשמרות בנפרד (לא נכנסות לטופס הנוכחי).
  const scanPriorFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setPriorScanning(true);
    setPriorInfo(null);
    try {
      const collected = [];
      let idx = priorRows.reduce((mx, r) => Math.max(mx, r._priorIndex || 0), 0);
      let failed = 0;
      for (const file of files) {
        idx += 1;
        try {
          const scan = await scanOneFile(file);
          if (scan.ok) {
            const label = scan.patient?.age_text ? `קודמת ${idx} (${scan.patient.age_text})` : `קודמת ${idx}`;
            scan.rows.map(scanRowToUiRow).forEach((r) => collected.push({ ...r, _priorIndex: idx, _label: label }));
          } else { failed++; }
        } catch { failed++; }
      }
      if (!collected.length) {
        setPriorInfo({ error: "לא נקראו ערכים מהבדיקות הקודמות." });
      } else {
        setPriorRows((prev) => [...prev, ...collected]);
        setPriorInfo({ note: `נוספו ${files.length - failed} בדיקות קודמות להשוואה.` });
      }
    } catch (err) {
      setPriorInfo({ error: err.message || "שגיאה בסריקת הבדיקות הקודמות." });
    } finally {
      setPriorScanning(false);
      if (priorFileRef.current) priorFileRef.current.value = "";
      if (priorCamRef.current) priorCamRef.current.value = "";
    }
  };
  const handlePriorFile = (e) => scanPriorFiles(e.target.files);
  const clearPriors = () => { setPriorRows([]); setPriorInfo(null); };

  const updateRow = (i, field, val) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

  const filledRows = rows.filter((r) => r.analyte.trim() && String(r.value).trim() !== "");

  // שורה עם שם מדד אבל בלי ערך — לא משמיטים בשקט.
  // השמטה שקטה של תוצאת מעבדה היא בדיוק מה שהמערכת נבנתה למנוע:
  // הרופא/ה יראה/תראה ניתוח שנראה שלם ולא ידע/תדע שמדד נפל.
  const incompleteRows = rows.filter(
    (r) => r.analyte.trim() && String(r.value).trim() === ""
  );

  const canRun = filledRows.length > 0 && ageValue !== "" && incompleteRows.length === 0;

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const patient = {
        [ageUnit === "days" ? "age_days" : ageUnit === "months" ? "age_months" : "age_years"]:
          Number(ageValue),
        sex: sex || undefined,
        weight_kg: weight ? Number(weight) : undefined,
        height_cm: height ? Number(height) : undefined,
      };

      const labs = filledRows.map((r) => {
        const qualitative = r.result_type !== RESULT_TYPES.NUMERIC;
        return {
          analyte: r.analyte.trim(),
          // תוצאה איכותית נשלחת כטקסט — המרה למספר היתה הופכת אותה ל-NaN
          value: qualitative ? r.value.trim() : Number(r.value),
          result_type: r.result_type,
          unit: qualitative ? undefined : (r.unit.trim() || undefined),
          ref_low: !qualitative && r.ref_low !== "" ? Number(r.ref_low) : undefined,
          ref_high: !qualitative && r.ref_high !== "" ? Number(r.ref_high) : undefined,
        };
      });

      const findings = findingsText
        .split(/[,\n]/)
        .map((f) => f.trim())
        .filter(Boolean);

      setResult(await runLabInterpreter({ patient, labs, findings }));
    } catch (e) {
      console.error(e);
      setError(e.message || "אירעה שגיאה בהרצת הניתוח.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/50 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100 safe-top">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-600" />
            <h1 className="font-bold text-base">פענוח מעבדה</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">
        <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3">
          הכלי מזהה <strong>דפוסים רב-פרמטריים</strong>, לא ערכים בודדים.
          ככל שתזין יותר מדדים מאותה בדיקה — כך הזיהוי מדויק יותר.
          טווח ייחוס שתזין מגיליון המעבדה גובר על כל מקור אחר.
          <span className="block mt-1 text-slate-400">
            הקטלוג כולל {CATALOG_SIZE} מדדים — ספירת דם, כימיה, אנדוקרינולוגיה,
            אימונולוגיה, מיקרוביולוגיה, גנטיקה, שתן, CSF ועוד. התחל/י להקליד.
          </span>
        </p>

        {/* סריקת דף מעבדה — מילוי אוטומטי במקום הקלדה */}
        <div className="bg-white rounded-2xl border border-teal-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ScanLine className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold">סריקת דף מעבדה (במקום הקלדה)</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
            העלה/י צילום/PDF/צילום-מסך של דף תוצאות — המערכת תקרא את הערכים ותמלא אותם.
            <strong> ערכים לא-קריאים יישארו ריקים למילוי ידני</strong> — המערכת לא מנחשת מספרים.
            כל ערך טעון אישורך לפני הניתוח.
          </p>
          <input ref={scanFileRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={handleScanFile} />
          <button
            onClick={() => scanFileRef.current?.click()}
            disabled={scanning}
            className="w-full h-11 rounded-xl border-2 border-dashed border-teal-300 bg-teal-50/50 text-teal-700 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {scanning ? <><Loader2 className="w-4 h-4 animate-spin" /> סורק וקורא ערכים…</> : <><Upload className="w-4 h-4" /> העלה דף מעבדה / צלם</>}
          </button>
          {scanInfo?.error && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-800 leading-relaxed">{scanInfo.error}</div>
          )}
          {scanInfo?.stats && (
            <div className="mt-2 bg-teal-50 border border-teal-200 rounded-lg p-2.5">
              <p className="text-[11px] text-teal-800 font-semibold">
                זוהו {scanInfo.stats.total} מדדים · {scanInfo.stats.readable} נקראו בביטחון
                {scanInfo.stats.needs_review > 0 && <span className="text-amber-700"> · {scanInfo.stats.needs_review} לבדיקה/השלמה</span>}
              </p>
              {scanInfo.ageText && <p className="text-[10px] text-slate-500 mt-1">גיל שזוהה בדף: “{scanInfo.ageText}” — הזן/י ואמת/י בשדה הגיל.</p>}
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{scanInfo.note}</p>
            </div>
          )}
        </div>

        {/* פרטי המטופל */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <h3 className="text-sm font-bold">פרטי המטופל</h3>

          <div>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">
              גיל <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                value={ageValue}
                onChange={(e) => setAgeValue(e.target.value)}
                placeholder="גיל"
                className="flex-1"
              />
              <select
                value={ageUnit}
                onChange={(e) => setAgeUnit(e.target.value)}
                className="rounded-md border border-slate-200 text-sm px-2 bg-white"
              >
                <option value="years">שנים</option>
                <option value="months">חודשים</option>
                <option value="days">ימים</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              חובה — כמעט כל טווח ייחוס ברפואת ילדים תלוי-גיל.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">מין</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full rounded-md border border-slate-200 text-sm px-2 py-2 bg-white"
              >
                <option value="">—</option>
                <option value="male">זכר</option>
                <option value="female">נקבה</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">משקל (ק"ג)</label>
              <Input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">גובה (ס"מ)</label>
              <Input type="number" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
          </div>
        </div>

        {/* תוצאות מעבדה */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">תוצאות מעבדה</h3>
            <button onClick={addRow} className="flex items-center gap-1 text-xs text-teal-600 font-medium">
              <Plus className="w-3.5 h-3.5" /> שורה
            </button>
          </div>

          {rows.map((row, i) => {
            const qualitative = row.result_type !== RESULT_TYPES.NUMERIC;
            return (
              <div key={i} className={`rounded-lg border p-2 space-y-1.5 ${row.needs_review ? "border-amber-400 bg-amber-50/40" : "border-slate-100"}`}>
                {row._scan && (
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${row.needs_review ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"}`}>
                      {row.needs_review ? `⚠ ${row.review_reason_he || "לבדיקה"}` : `✓ נסרק (${row.confidence})`}
                    </span>
                    {row.analyte_raw && row.analyte_raw !== row.analyte && (
                      <span className="text-[9px] text-slate-400">בדף: “{row.analyte_raw}”</span>
                    )}
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <AnalytePicker
                    className="flex-1"
                    value={row.analyte}
                    onChange={(v) => updateRow(i, "analyte", v)}
                    onSelect={(a) => {
                      updateRow(i, "analyte", a.he);
                      updateRow(i, "unit", a.unit || "");
                      updateRow(i, "result_type", a.type);
                      if (a.type !== RESULT_TYPES.NUMERIC) {
                        updateRow(i, "ref_low", "");
                        updateRow(i, "ref_high", "");
                      }
                    }}
                  />
                  <button
                    onClick={() => removeRow(i)}
                    disabled={rows.length <= 1}
                    className="text-slate-300 hover:text-red-500 disabled:opacity-30 mt-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {qualitative ? (
                  /* תרבית / גנטיקה / איכותי — אין מספר ואין טווח */
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 block mb-0.5">תוצאה</label>
                    <Input
                      value={row.value}
                      onChange={(e) => updateRow(i, "value", e.target.value)}
                      placeholder="חיובי / שלילי / שם מחולל / ממצא"
                      className={`text-xs h-9 ${!String(row.value).trim() ? "border-amber-400" : ""}`}
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      תוצאה איכותית — לא נדרש טווח ייחוס.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-600 block mb-0.5">
                        ערך <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number" inputMode="decimal"
                        value={row.value}
                        onChange={(e) => updateRow(i, "value", e.target.value)}
                        className={`text-xs h-9 ${
                          !String(row.value).trim() ? "border-amber-400 bg-amber-50/40" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-0.5">יחידה</label>
                      <Input
                        value={row.unit}
                        onChange={(e) => updateRow(i, "unit", e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-0.5">טווח מ</label>
                      <Input
                        type="number" inputMode="decimal"
                        value={row.ref_low}
                        onChange={(e) => updateRow(i, "ref_low", e.target.value)}
                        className="text-xs h-9 px-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-0.5">עד</label>
                      <Input
                        type="number" inputMode="decimal"
                        value={row.ref_high}
                        onChange={(e) => updateRow(i, "ref_high", e.target.value)}
                        className="text-xs h-9 px-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {incompleteRows.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5">
              <p className="text-[11px] text-amber-900 leading-relaxed">
                <strong>חסר ערך</strong> בשורות: {incompleteRows.map((r) => r.analyte).join(", ")}.
                <span className="block mt-0.5">
                  שורה בלי ערך לא תיכנס לניתוח. מלא/י אותה או מחק/י את השורה —
                  כדי שלא תקבל/י ניתוח שנראה שלם וחסר בו מדד.
                </span>
              </p>
            </div>
          )}

          <p className="text-[10px] text-slate-400 leading-relaxed">
            מדד ללא טווח ייחוס לא יסומן כחריג <strong>ולא כתקין</strong> — הוא לא ישתתף בניתוח,
            והדבר יוצג לך במפורש.
          </p>
        </div>

        {/* ממצאים קליניים */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <label className="text-sm font-bold block mb-2">ממצאים קליניים</label>
          <textarea
            value={findingsText}
            onChange={(e) => setFindingsText(e.target.value)}
            rows={2}
            placeholder="חום, בצקות פריאורביטליות, ..."
            className="w-full rounded-md border border-slate-200 text-sm p-2 resize-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">מופרדים בפסיק. משתתפים בהפעלת דגלים אדומים.</p>
        </div>

        <Button
          onClick={handleRun}
          disabled={!canRun || loading}
          className="w-full h-12 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-500/20"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> מנתח…
            </span>
          ) : (
            "נתח תוצאות"
          )}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
        )}

        {result?.status === "input_error" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">לא ניתן לנתח</p>
            </div>
            <p className="text-xs text-amber-900">{result.message_he}</p>
          </div>
        )}

        {result && result.status !== "input_error" && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="font-bold text-sm">פענוח מעוגן</h3>
                <p className="text-[11px] text-slate-500">עבר אימות מול בסיס הידע המאומת</p>
              </div>
            </div>

            {/* טבלת הנרמול — מה סומן ומה לא, ולמה */}
            {result.normalized?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">ערכים לאחר נרמול</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="text-slate-400 text-right">
                        <th className="font-medium pb-1">מדד</th>
                        <th className="font-medium pb-1">ערך</th>
                        <th className="font-medium pb-1">סימון</th>
                        <th className="font-medium pb-1">מקור הטווח</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.normalized.map((n, i) => (
                        <tr key={i} className="border-t border-slate-50">
                          <td className="py-1">{n.label_he}</td>
                          <td className="py-1">{n.value}{n.unit ? ` ${n.unit}` : ""}</td>
                          <td className="py-1">
                            {n.flag === "high" && <span className="text-red-600 font-semibold">גבוה</span>}
                            {n.flag === "low" && <span className="text-blue-600 font-semibold">נמוך</span>}
                            {n.flag === "normal" && <span className="text-emerald-600">תקין</span>}
                            {n.flag === "unknown_range" && (
                              <span className="text-slate-400">לא נבדק</span>
                            )}
                          </td>
                          <td className="py-1 text-slate-400">
                            {n.range_source ?? (n.flag === "unknown_range" ? "אין טווח" : "—")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {result.missing_ranges?.length > 0 && (
                  <p className="text-[10px] text-amber-700 mt-2 leading-relaxed">
                    ⚠ {result.missing_ranges.join(", ")} — לא נטען טווח ייחוס מאומת.
                    ערכים אלה <strong>לא סומנו ולא השתתפו בהתאמת דפוסים</strong>.
                    "לא נבדק" אינו "תקין".
                  </p>
                )}
              </div>
            )}

            {result.calculators?.length > 0 && (
              <div className="bg-indigo-50/60 rounded-lg p-3 border border-indigo-100">
                <h4 className="text-[11px] font-bold text-indigo-700 mb-2">מחשבונים דטרמיניסטיים (מחושב בקוד)</h4>
                <div className="space-y-1.5">
                  {result.calculators.map((c, i) => (
                    <div key={i} className="bg-white rounded-md p-2 border border-indigo-100">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-700">{c.label_he}</span>
                        <span className="text-sm font-extrabold text-indigo-600 shrink-0">{c.value} <span className="text-[10px] font-normal text-slate-400">{c.unit}</span></span>
                      </div>
                      {c.formula_source && <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{c.formula_source}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-slate-500 mt-2 leading-relaxed">תוצאות אריתמטיות בלבד, לא הוראת מתן. טעונות אימות מקומי.</p>
              </div>
            )}

            {result.calculator_refusals?.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <h4 className="text-[11px] font-bold text-slate-600 mb-1">מחשבונים שסירבו לחשב</h4>
                <ul className="space-y-1">
                  {result.calculator_refusals.map((r, i) => (
                    <li key={i} className="text-[11px] text-slate-600 leading-snug">· {r.message_he}</li>
                  ))}
                </ul>
              </div>
            )}

            <GroundedInterpretation data={result} />
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
}
