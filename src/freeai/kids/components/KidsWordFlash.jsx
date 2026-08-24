import React from "react";

export default function KidsWordFlash({ flash }) {
  if (!flash) return null;

  return (
    <div className="fixed inset-x-0 top-24 z-50 flex justify-center pointer-events-none px-4">
      <div className="kids-word-flash flex items-center gap-3 px-6 py-4 rounded-3xl bg-white text-purple-800 shadow-2xl border-4 border-yellow-300 font-black text-2xl animate-[kids-fade-in_0.3s_ease-out]">
        <span className="text-4xl kids-float">{flash.emoji}</span>
        <span>{flash.word}</span>
      </div>
    </div>
  );
}
