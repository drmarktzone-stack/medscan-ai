import React, { useState, useEffect } from "react";
import { Hand, ChevronDown } from "lucide-react";

/**
 * Two-channel input — captures the physical-exam findings a CAMERA CANNOT SEE
 * and feeds them into the clinical context. This is the missing half of a
 * dermatology read: diascopy (blanching), palpation texture, Nikolsky,
 * elevation, tenderness. Each carries clinical weight the engine acts on
 * (e.g. non-blanching → purpura; positive Nikolsky → SJS/TEN/pemphigus).
 *
 * Emits a Hebrew summary string via onChange; empty when nothing is set.
 */

const FIELDS = [
  {
    key: "diascopy",
    label: "לחיצה (diascopy)",
    options: [
      ["", "לא נבדק"],
      ["מחוויר בלחיצה (blanching) — כלי-דם/אריתמה", "מחוויר"],
      ["לא מחוויר בלחיצה — חשד פורפורה/פטכיות", "לא מחוויר ⚠"],
    ],
  },
  {
    key: "texture",
    label: "מרקם במישוש",
    options: [
      ["", "לא נבדק"],
      ["מרקם חלק", "חלק"],
      ["מרקם מחוספס/נייר-זכוכית (sandpaper)", "מחוספס"],
      ["מוקשה/אינדורציה במישוש", "מוקשה"],
    ],
  },
  {
    key: "elevation",
    label: "מישוש — מורם/שטוח",
    options: [
      ["", "לא נבדק"],
      ["שטוח (מקולרי)", "שטוח"],
      ["מורם (פפולרי/פלאק)", "מורם"],
      ["מוסלל/עם תוכן (וסיקולה/בולה/ציסטה)", "עם תוכן"],
    ],
  },
  {
    key: "nikolsky",
    label: "סימן Nikolsky",
    options: [
      ["", "לא נבדק"],
      ["Nikolsky שלילי", "שלילי"],
      ["Nikolsky חיובי — חשד SJS/TEN/פמפיגוס/SSSS", "חיובי ⚠"],
    ],
  },
  {
    key: "tenderness",
    label: "רגישות למגע",
    options: [
      ["", "לא נבדק"],
      ["אינו רגיש", "לא רגיש"],
      ["רגיש/כואב במישוש", "כואב"],
    ],
  },
  {
    key: "itch",
    label: "גרד",
    options: [
      ["", "לא נבדק"],
      ["ללא גרד", "ללא"],
      ["מגרד", "מגרד"],
    ],
  },
];

export default function ExamFindingsInput({ onChange }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState({});

  useEffect(() => {
    const parts = FIELDS.map((f) => vals[f.key]).filter(Boolean);
    onChange?.(parts.length ? `בדיקה גופנית (מה שהמצלמה לא רואה): ${parts.join("; ")}.` : "");
  }, [vals, onChange]);

  const setField = (k, v) => setVals((p) => ({ ...p, [k]: v }));

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-right"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Hand className="w-4 h-4 text-teal-500" />
          ממצאי בדיקה גופנית (הערוץ שהמצלמה לא רואה)
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="text-[11px] text-slate-600">
              <span className="block mb-1 font-medium">{f.label}</span>
              <select
                value={vals[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 px-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {f.options.map(([val, lbl]) => (
                  <option key={lbl} value={val}>{lbl}</option>
                ))}
              </select>
            </label>
          ))}
          <p className="col-span-2 text-[10px] text-slate-400">
            הממצאים מוזנים ל-AI כהקשר — למשל "לא מחוויר בלחיצה" מפנה לפורפורה, ו-Nikolsky חיובי לחירום עורי.
          </p>
        </div>
      )}
    </div>
  );
}
