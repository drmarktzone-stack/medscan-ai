import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = 'חיפוש' }) {
  return (
    <div className="px-3 py-2 bg-[#ededed]">
      <div className="flex items-center gap-2 bg-white rounded-md px-3 py-1.5">
        <Search className="w-4 h-4 text-[#b2b2b2] shrink-0" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-[#b2b2b2] text-[#191919]"
        />
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-[#b2b2b2]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
