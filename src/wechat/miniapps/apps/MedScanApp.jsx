import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Heart, FlaskConical, Scan, ChevronRight } from 'lucide-react';

const TOOLS = [
  { to: '/labs', icon: FlaskConical, label: 'מעבדה', color: 'bg-blue-500' },
  { to: '/ecg', icon: Heart, label: 'ECG', color: 'bg-red-500' },
  { to: '/skin', icon: Scan, label: 'עור', color: 'bg-amber-500' },
  { to: '/doctorped', icon: Stethoscope, label: 'DoctorPed', color: 'bg-emerald-500' },
];

export default function MedScanApp() {
  return (
    <div className="p-4">
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🩺</span>
          <div>
            <div className="font-semibold text-[#191919]">MedScan Mini Program</div>
            <div className="text-xs text-[#888]">医疗助手 · כלי תמיכה קלינית</div>
          </div>
        </div>
        <p className="text-sm text-[#888] leading-relaxed">
          גישה מהירה לכלי MedScan מתוך WeChat. אין אבחנה סופית — לתמיכה בלבד.
        </p>
      </div>

      <ul className="bg-white rounded-xl divide-y divide-[#ededed] shadow-sm">
        {TOOLS.map(({ to, icon: Icon, label, color }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex items-center gap-3 px-4 py-3.5 active:bg-[#f7f7f7]"
            >
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="flex-1 text-[16px] text-[#191919]">{label}</span>
              <ChevronRight className="w-4 h-4 text-[#c8c8c8]" />
            </Link>
          </li>
        ))}
      </ul>

      <p className="text-center text-[10px] text-[#b2b2b2] mt-6">
        Mini Program מקשר ל-MedScan הראשי
      </p>
    </div>
  );
}
