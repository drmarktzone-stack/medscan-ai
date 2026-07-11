import React, { useRef, useState, useMemo, useEffect } from "react";
import { Upload, X, Plus } from "lucide-react";

export default function ImageUploader({ files, onFilesChange, label, hint }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const addFiles = (fileList) => {
    const valid = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) return;
    onFilesChange([...files, ...valid]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const removeFile = (idx) => {
    onFilesChange(files.filter((_, i) => i !== idx));
  };

  return (
    <div className="w-full space-y-3">
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((url, idx) => (
            <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-square">
              <img src={url} alt={`תמונה ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 right-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded">ראשית</span>
              )}
              <button
                onClick={() => removeFile(idx)}
                className="absolute top-1 left-1 bg-white/90 rounded-full p-1 shadow hover:bg-red-50 transition-colors"
              >
                <X className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-slate-200 hover:border-primary/40 hover:bg-slate-50"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            {previews.length > 0 ? <Plus className="w-5 h-5 text-primary" /> : <Upload className="w-6 h-6 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {previews.length > 0 ? "הוסף תמונות נוספות" : label || "העלה תמונה"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{hint || "גרור לכאן או לחץ לבחירה"}</p>
          </div>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleChange} className="hidden" />
    </div>
  );
}