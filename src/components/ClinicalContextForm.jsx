import React, { useState, useEffect } from "react";
import { ChevronDown, User } from "lucide-react";

export default function ClinicalContextForm({ onChange }) {
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState({
    age: "",
    sex: "",
    symptoms: "",
    duration: "",
    history: "",
    medications: "",
  });

  useEffect(() => {
    const parts = [];
    if (fields.age) parts.push(`גיל: ${fields.age}`);
    if (fields.sex) parts.push(`מין: ${fields.sex}`);
    if (fields.symptoms) parts.push(`תסמינים: ${fields.symptoms}`);
    if (fields.duration) parts.push(`משך התסמינים: ${fields.duration}`);
    if (fields.history) parts.push(`רקע רפואי: ${fields.history}`);
    if (fields.medications) parts.push(`תרופות פעילות: ${fields.medications}`);
    onChange(parts.join("\n"));
  }, [fields, onChange]);

  const update = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));
  const filledCount = Object.values(fields).filter(Boolean).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">הקשר קליני</span>
          {filledCount > 0 && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {filledCount} שדות
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">גיל</label>
              <input
                type="number"
                value={fields.age}
                onChange={(e) => update("age", e.target.value)}
                placeholder="לדוגמה 45"
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">מין</label>
              <select
                value={fields.sex}
                onChange={(e) => update("sex", e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              >
                <option value="">לא צוין</option>
                <option value="זכר">זכר</option>
                <option value="נקבה">נקבה</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">תסמינים עיקריים</label>
            <input
              type="text"
              value={fields.symptoms}
              onChange={(e) => update("symptoms", e.target.value)}
              placeholder="לדוגמה: כאב בחזה, קוצר נשימה"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">משך התסמינים</label>
            <input
              type="text"
              value={fields.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="לדוגמה: 3 ימים, שעתיים"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">רקע רפואי / מחלות כרוניות</label>
            <textarea
              value={fields.history}
              onChange={(e) => update("history", e.target.value)}
              placeholder="לדוגמה: סוכרת, יתר לחץ דם"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">תרופות פעילות</label>
            <input
              type="text"
              value={fields.medications}
              onChange={(e) => update("medications", e.target.value)}
              placeholder="לדוגמה: אספירין, מטופרולול"
              className="w-full h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            הוספת הקשר קליני משפרת משמעותית את דיוק האבחנה. כל השדות אופציונליים.
          </p>
        </div>
      )}
    </div>
  );
}