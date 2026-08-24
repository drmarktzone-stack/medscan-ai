import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, ScanLine, ShoppingBag, Gamepad2, Music, ChevronRight } from 'lucide-react';

const ITEMS = [
  {
    icon: Camera,
    label: '朋友圈 Moments',
    labelCn: '朋友圈',
    to: '/moments',
    color: 'bg-[#fa9d3b]',
  },
  {
    icon: ScanLine,
    label: 'סריקה',
    labelCn: '扫一扫',
    to: '/scan',
    color: 'bg-[#10aeff]',
  },
  {
    icon: ShoppingBag,
    label: 'Mini Programs',
    labelCn: '小程序',
    to: '/discover/mini',
    color: 'bg-[#6467f0]',
  },
  {
    icon: Gamepad2,
    label: 'משחקים',
    labelCn: '游戏',
    to: '#',
    color: 'bg-[#07c160]',
    badge: 'בקרוב',
  },
  {
    icon: Music,
    label: 'Channels',
    labelCn: '视频号',
    to: '#',
    color: 'bg-[#fa5151]',
    badge: 'בקרוב',
  },
];

export default function DiscoverPage() {
  return (
    <>
      <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
        <div className="max-w-lg mx-auto flex items-center justify-center h-11">
          <h1 className="font-semibold text-[17px] text-[#191919]">发现 גילוי</h1>
        </div>
      </header>

      <ul className="mt-2 bg-white divide-y divide-[#ededed]">
        {ITEMS.map(({ icon: Icon, label, labelCn, to, color, badge }) => (
          <li key={label}>
            {to === '#' ? (
              <div className="flex items-center gap-3 px-4 py-3 opacity-70">
                <div className={`w-7 h-7 rounded-md ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="flex-1 text-[16px] text-[#191919]">
                  {label}
                  <span className="text-[#b2b2b2] text-xs mr-2">{labelCn}</span>
                </span>
                {badge && (
                  <span className="text-[10px] bg-[#ededed] text-[#888] px-2 py-0.5 rounded">
                    {badge}
                  </span>
                )}
              </div>
            ) : (
              <Link to={to} className="flex items-center gap-3 px-4 py-3 active:bg-[#ececec]">
                <div className={`w-7 h-7 rounded-md ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="flex-1 text-[16px] text-[#191919]">
                  {label}
                  <span className="text-[#b2b2b2] text-xs mr-2">{labelCn}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-[#c8c8c8]" />
              </Link>
            )}
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-[#b2b2b2] mt-8 px-6">
        WeiChat v0.1 — Mini Programs, QR, Moments, sync
      </p>
    </>
  );
}
