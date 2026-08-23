import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Image, Settings, ChevronRight, QrCode, Star, HelpCircle,
} from 'lucide-react';
import WeChatAvatar from '@/wechat/components/WeChatAvatar.jsx';
import { useWeChat } from '@/wechat/lib/store.js';

const MENU = [
  { icon: Wallet, label: 'Pay 微信支付', badge: 'בקרוב', disabled: true },
  { icon: Star, label: 'מועדפים', disabled: true },
  { icon: Image, label: 'גלריה', disabled: true },
  { icon: QrCode, label: 'QR שלי', disabled: true },
  { icon: Settings, label: 'הגדרות', disabled: true },
  { icon: HelpCircle, label: 'עזרה', disabled: true },
];

export default function ProfilePage() {
  const { state, actions } = useWeChat();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [status, setStatus] = useState(state.profile.status);

  function save() {
    actions.updateProfile({ name: name.trim() || state.profile.name, status });
    setEditing(false);
  }

  return (
    <>
      <div className="bg-white mb-2">
        <div className="px-4 py-6 flex items-center gap-4">
          <WeChatAvatar emoji={state.profile.avatar} size="xl" />
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-lg font-semibold border-b border-[#07c160] outline-none"
                />
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-sm text-[#888] border-b border-[#d9d9d9] outline-none"
                  placeholder="סטטוס"
                />
                <button
                  type="button"
                  onClick={save}
                  className="text-sm text-[#576b95] font-medium"
                >
                  שמור
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="text-left w-full">
                <div className="text-xl font-semibold text-[#191919]">{state.profile.name}</div>
                <div className="text-sm text-[#888] mt-0.5">WeChat ID: {state.profile.wechatId}</div>
                <div className="text-sm text-[#888] mt-1">{state.profile.status}</div>
              </button>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-[#c8c8c8] shrink-0" />
        </div>
      </div>

      <ul className="bg-white mb-2 divide-y divide-[#ededed]">
        {MENU.map(({ icon: Icon, label, badge, disabled }) => (
          <li key={label}>
            <button
              type="button"
              disabled={disabled}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#ececec] disabled:opacity-50"
            >
              <Icon className="w-5 h-5 text-[#191919]" strokeWidth={1.5} />
              <span className="flex-1 text-left text-[16px] text-[#191919]">{label}</span>
              {badge && (
                <span className="text-[10px] text-[#888] bg-[#ededed] px-2 py-0.5 rounded">
                  {badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-[#c8c8c8]" />
            </button>
          </li>
        ))}
      </ul>

      <div className="px-4 py-2">
        <Link
          to="/"
          className="block text-center text-sm text-[#576b95] py-3 bg-white rounded-lg"
        >
          ← חזרה ל-MedScan
        </Link>
      </div>
    </>
  );
}
