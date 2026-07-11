import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Activity, Stethoscope, Loader2, Trash2, Play, TrendingUp, Target, ImageOff, Flag, ScanLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { runEvaluation } from "@/lib/evaluation";
import GoldStandardForm from "@/components/evaluation/GoldStandardForm";
import MetricsChart from "@/components/evaluation/MetricsChart";
import BulkImport from "@/components/knowledge/BulkImport";

export default function Evaluation() {
  const [tab, setTab] = useState("ecg");
  const [goldCases, setGoldCases] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [liveResults, setLiveResults] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gold, testRuns] = await Promise.all([
        base44.entities.GoldStandardCase.filter({ type: tab }),
        base44.entities.TestRun.filter({ type: tab }, "-created_date", 50),
      ]);
      setGoldCases(gold);
      setRuns(testRuns);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [tab]);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setLiveResults([]);
    setLastResult(null);
    setProgress({ done: 0, total: 0 });
    try {
      const result = await runEvaluation({
        type: tab,
        onProgress: (done, total) => setProgress({ done, total }),
        onUpdate: setLiveResults,
      });
      setLastResult(result);
      loadData();
    } catch (err) {
      setError(err.message || "שגיאה בהרצת ההערכה.");
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async (id) => {
    await base44.entities.GoldStandardCase.delete(id);
    loadData();
  };

  const testableCount = goldCases.filter((c) => c.image_url).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 via-white to-slate-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            <h1 className="font-bold text-base">הערכת דיוק</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-3 w-full rounded-xl">
            <TabsTrigger value="ecg" className="rounded-xl">
              <Activity className="w-4 h-4 ml-1.5" /> ECG
            </TabsTrigger>
            <TabsTrigger value="skin" className="rounded-xl">
              <Stethoscope className="w-4 h-4 ml-1.5" /> עור
            </TabsTrigger>
            <TabsTrigger value="radiology" className="rounded-xl">
              <ScanLine className="w-4 h-4 ml-1.5" /> רדיולוגיה
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-4">
            {/* Run evaluation */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">הרצת הערכה</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {testableCount} מקרים ברי-בדיקה (עם תמונות) מתוך {goldCases.length}
                  </p>
                </div>
                <button onClick={handleRun} disabled={running || testableCount === 0}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-50">
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {running ? "מריץ..." : "הרץ"}
                </button>
              </div>

              {running && (
                <div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    מנתח {progress.done} מתוך {progress.total}...
                  </p>
                </div>
              )}

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            </div>

            {/* Last result */}
            {lastResult && (
              <div className="bg-white rounded-xl border border-purple-200 p-4">
                <h4 className="text-sm font-bold mb-3">תוצאות ההערכה האחרונה</h4>
                <div className="grid grid-cols-3 gap-2">
                  <MetricCard label="דיוק" value={lastResult.accuracy} color="text-blue-600" />
                  <MetricCard label="רגישות" value={lastResult.sensitivity} color="text-red-600" />
                  <MetricCard label="סגוליות" value={lastResult.specificity} color="text-teal-600" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {lastResult.correct} מתוך {lastResult.total} אבחנות נכונות
                </p>
              </div>
            )}

            {/* Live results */}
            {liveResults.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h4 className="text-sm font-bold mb-2">תוצאות חיות</h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {liveResults.map((r, i) => (
                    <div key={i} className={`text-xs rounded-lg p-2 flex items-center justify-between ${r.is_correct ? "bg-green-50" : "bg-red-50"}`}>
                      <span className="font-semibold truncate">{r.title}</span>
                      <span className={`shrink-0 mr-2 ${r.is_correct ? "text-green-600" : "text-red-600"}`}>
                        {r.is_correct ? "✓ נכון" : "✗ שגוי"} ({r.confidence}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics over time */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-500" /> מגמות לאורך זמן
              </h4>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-muted-foreground animate-spin" /></div>
              ) : (
                <MetricsChart runs={runs} />
              )}
            </div>

            {/* Gold standard cases */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2">סט זהב — מקרים ({goldCases.length})</h4>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-muted-foreground animate-spin" /></div>
              ) : goldCases.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">אין מקרים בסט הזהב עדיין</p>
              ) : (
                <div className="space-y-2">
                  {goldCases.map((c) => (
                    <div key={c.id} className={`bg-white rounded-lg border p-3 flex items-start gap-2 ${c.urgent ? "border-red-200" : "border-slate-200"}`}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                        {c.image_url ? <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" /> : <ImageOff className="w-4 h-4 text-muted-foreground/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold truncate">{c.title}</p>
                          {c.urgent && <Flag className="w-3 h-3 text-red-500 fill-current shrink-0" />}
                          {!c.image_url && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">ללא תמונה</span>}
                        </div>
                        <p className="text-[11px] text-primary font-medium">{c.correct_diagnosis}</p>
                      </div>
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add gold standard case */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2">הוסף מקרה לסט הזהב</h4>
              <GoldStandardForm type={tab} onSaved={loadData} />
            </div>

            {/* Bulk import */}
            <div>
              <h4 className="text-sm font-bold text-foreground mb-2">העשרה המונית של סט הזהב</h4>
              <BulkImport type={tab} target="gold" onSaved={loadData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="text-center bg-slate-50 rounded-lg py-2">
      <p className={`text-2xl font-extrabold ${color}`}>{value}%</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}