import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { MINI_APPS } from '@/wechat/miniapps/registry.js';

export default function MiniProgramsPage() {
  return (
    <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto pb-8">
      <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
        <div className="flex items-center h-11 px-2">
          <Link to="/wechat/discover" className="text-[#576b95] text-sm px-2">
            ‹ חזרה
          </Link>
          <h1 className="flex-1 text-center font-semibold text-[17px] text-[#191919]">
            小程序 Mini Programs
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="p-4 grid grid-cols-3 gap-4">
        {MINI_APPS.map((app) => (
          <Link
            key={app.id}
            to={`/wechat/mini/${app.id}`}
            className="flex flex-col items-center gap-2 active:opacity-70"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
              style={{ backgroundColor: `${app.color}22` }}
            >
              {app.icon}
            </div>
            <span className="text-xs text-[#191919] text-center leading-tight">
              {app.name}
            </span>
          </Link>
        ))}
      </div>

      <div className="mx-4 mt-2 bg-white rounded-xl divide-y divide-[#ededed]">
        <div className="px-4 py-2 text-xs text-[#888] bg-[#f7f7f7] rounded-t-xl">
          בשימוש לאחרונה
        </div>
        {MINI_APPS.map((app) => (
          <Link
            key={app.id}
            to={`/wechat/mini/${app.id}`}
            className="flex items-center gap-3 px-4 py-3 active:bg-[#f7f7f7]"
          >
            <span className="text-xl">{app.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] text-[#191919]">{app.name}</div>
              <div className="text-xs text-[#b2b2b2]">{app.description}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#c8c8c8]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
