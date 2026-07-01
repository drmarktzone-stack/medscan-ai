import React from "react";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 leading-relaxed">
        <span className="font-bold">שימו לב:</span> אפליקציה זו מספקת הערכה ראשונית בלבד ואינה מחליפה ייעוץ רפואי מקצועי.
        יש להתייעץ עם רופא מומחה לאבחון וטיפול. אין להסתמך על התוצאות לקבלת החלטות רפואיות.
      </p>
    </div>
  );
}