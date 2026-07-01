import React, { useRef, useState } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImageUploader({ onFileSelect, preview, onClear, label }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) onFileSelect(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="w-full">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border bg-white shadow-sm">
          <img src={preview} alt="תצוגה מקדימה" className="w-full max-h-80 object-contain bg-slate-50" />
          <button
            onClick={onClear}
            className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-300
            ${dragOver
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
            }
          `}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{label || "העלה תמונה"}</p>
              <p className="text-xs text-muted-foreground mt-1">גרור לכאן או לחץ לבחירה</p>
            </div>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}