import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';

export default function MiniAppShell({ app, children }) {
  return (
    <div className="min-h-screen bg-[#ededed] flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
        <div className="flex items-center h-11 px-2">
          <Link to="/wechat/discover/mini" className="text-[#576b95] text-sm px-2">
            ‹ חזרה
          </Link>
          <div className="flex-1 text-center">
            <div className="font-semibold text-[17px] text-[#191919]">{app.name}</div>
            <div className="text-[10px] text-[#b2b2b2]">{app.nameCn} · Mini Program</div>
          </div>
          <button type="button" className="p-2 text-[#191919]" aria-label="עוד">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
