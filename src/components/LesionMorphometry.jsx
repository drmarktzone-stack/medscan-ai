import React, { useState, useEffect } from "react";
import { Ruler, Loader2, Info } from "lucide-react";
import { measureLesionFromImage } from "@/lib/skinMorphometry";

/**
 * מורפומטריה דטרמיניסטית של נגע (ABCDE בקוד) מתוך התמונה שהועלתה.
 *
 * עיקרון אנטי-הזיה: המדדים כאן נמדדים בקוד (Otsu + מסכה), לא מנוחשים ע"י
 * המודל. ללא סמן קנה-מידה — הדיווח יחסי בלבד (אין מ"מ מוחלטים), וזה מוצהר.
 * אם הסגמנטציה לא אמינה (או שהקנבס "מזוהם" מ-CORS) — לא מוצג מספר מנוחש,
 * אלא הודעה כנה.
 */
export default function LesionMorphometry({ imageUrl }) {
  const [state, setState] = useState({ loading: true, data: null, failed: null });

  useEffect(() => {
    if (!imageUrl) return;
    let alive = true;
    setState({ loading: true, data: null, failed: null });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const res = await measureLesionFromImage(img, {});
        if (!alive) return;
        if (res?.ok) setState({ loading: false, data: res, failed: null });
        else setState({ loading: false, data: null, failed: res?.reason || "unknown" });
      } catch {
        if (alive) setState({ loading: false, data: null, failed: "error" });
      }
    };
    img.onerror = () => { if (alive) setState({ loading: false, data: null, failed: "load_error" }); };
    img.src = imageUrl;

    return () => { alive = false; };
  }, [imageUrl]);

  if (!imageUrl) return null;

  const REASON_HE = {
    segmentation_unreliable: "לא ניתן לבודד את הנגע מהעור באמינות (רקע/תאורה) — לא מוצג מדד מנוחש.",
    tainted_canvas: "לא ניתן לגשת לפיקסלים של התמונה (הגבלת CORS) — מדידה בצד-לקוח לא זמינה.",
    load_error: "טעינת התמונה למדידה נכשלה.",
    no_pixels: "התמונה ריקה/לא נטענה.",
    error: "אירעה שגיאה במדידה.",
    unknown: "המדידה לא הושלמה.",
  };

  return (
    <div className="bg-white rounded-xl border border-pink-200 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Ruler className="w-4 h-4 text-pink-500" />
        <h4 className="text-sm font-bold">מורפומטריה (ABCDE בקוד)</h4>
      </div>
      <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
        נמדד ישירות מהתמונה בקוד, לא ע"י המודל. מדד תומך בלבד — אינו מאבחן.
      </p>

      {state.loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
          <Loader2 className="w-4 h-4 animate-spin" /> מודד…
        </div>
      ) : state.data ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="קוטר (יחסי)" value={state.data.diameter_mm != null ? `${state.data.diameter_mm} מ"מ` : `${state.data.diameter_px}px`} />
            <Metric label="אסימטריה (A)" value={state.data.asymmetry_index != null ? state.data.asymmetry_index : "—"} hint="0=סימטרי · 1=א-סימטרי" />
            <Metric label="חוסר-סדירות גבול (B)" value={state.data.border_irregularity != null ? state.data.border_irregularity : "—"} hint="1.0=עיגול · גבוה=משונן" />
            <Metric label="גווני צבע (C)" value={state.data.color_clusters} hint="ריבוי גוונים → דגל" />
          </div>
          {state.data.scale_unknown && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed">
                אין סמן קנה-מידה בתמונה — הקוטר יחסי (פיקסלים), לא מ"מ מוחלטים. לצילום עם סרגל/מדבקה ידועה יתקבלו מ"מ אמיתיים.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">{REASON_HE[state.failed] || REASON_HE.unknown}</p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="bg-slate-50 rounded-lg py-2 px-2 text-center">
      <p className="text-lg font-extrabold text-pink-600">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      {hint && <p className="text-[9px] text-muted-foreground/70 mt-0.5 leading-tight">{hint}</p>}
    </div>
  );
}
