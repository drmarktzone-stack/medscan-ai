import React, { useState } from 'react';
import { Link2, Globe, Bookmark } from 'lucide-react';

const BOOKMARKS = [
  { label: 'WeiChat GitHub', url: 'https://github.com', icon: Globe },
  { label: 'Mini Programs docs', url: 'https://developers.weixin.qq.com/miniprogram/en/dev/framework/', icon: Link2 },
];

export default function ToolsApp() {
  const [note, setNote] = useState('');

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🧰</span>
          <div>
            <div className="font-semibold text-[#191919]">Tools Mini Program</div>
            <div className="text-xs text-[#888]">工具箱 · קיצורי דרך</div>
          </div>
        </div>
        <p className="text-sm text-[#888]">מini Programs מובנים — הרחבה עתידית לפיצ&apos;רים מעבר ל-WhatsApp.</p>
      </div>

      <ul className="bg-white rounded-xl divide-y divide-[#ededed] shadow-sm">
        {BOOKMARKS.map(({ label, url, icon: Icon }) => (
          <li key={label}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 active:bg-[#f7f7f7]"
            >
              <Icon className="w-5 h-5 text-[#07c160]" />
              <span className="flex-1 text-[15px] text-[#576b95]">{label}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-[#191919] font-medium">
          <Bookmark className="w-4 h-4" /> Quick note
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="רשום משהו…"
          className="w-full h-24 text-sm border border-[#d9d9d9] rounded-md p-2 outline-none focus:border-[#07c160]"
        />
      </div>
    </div>
  );
}
