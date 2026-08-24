import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, Image, Settings, ChevronRight, QrCode, Star, HelpCircle,
} from 'lucide-react';
import WeChatAvatar from '@/components/WeChatAvatar.jsx';
import { useWeChat } from '@/lib/store.js';

const MENU = [
  { icon: Wallet, label: 'Pay 微信支付', to: '/pay' },
  { icon: Star, label: 'מועדפים', disabled: true },
  { icon: Image, label: 'גלריה', disabled: true },
  { icon: QrCode, label: 'QR שלי', to: '/qr' },
  { icon: Settings, label: 'הגדרות', disabled: true },
  { icon: HelpCircle, label: 'עזרה', disabled: true },
];

export default function ProfilePage() {
  const { state, actions } = useWeChat();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [status, setStatus] = useState(state.profile.status);
  const balance = state.profile.wallet?.balance;

  function save() {
    actions.updateProfile({ name: name.trim() || state.profile.name, status });
    setEditing(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
        <div className="max-w-lg mx-auto flex items-center justify-center h-11">
          <h1 className="font-semibold text-[17px] text-[#191919]">我 אני</h1>
        </div>
      </header>

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
                <div className="text-sm text-[#888] mt-0.5">WeiChat ID: {state.profile.wechatId}</div>
                <div className="text-sm text-[#888] mt-1">{state.profile.status}</div>
                {balance != null && (
                  <div className="text-xs text-[#07c160] mt-1">¥ {balance.toFixed(2)}</div>
                )}
              </button>
            )}
          </div>
          <Link to="/qr" className="p-1">
            <QrCode className="w-5 h-5 text-[#888]" />
          </Link>
        </div>
      </div>

      <ul className="bg-white mb-2 divide-y divide-[#ededed]">
        {MENU.map(({ icon: Icon, label, to, disabled }) => (
          <li key={label}>
            {to && !disabled ? (
              <Link
                to={to}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-[#ececec]"
              >
                <Icon className="w-5 h-5 text-[#191919]" strokeWidth={1.5} />
                <span className="flex-1 text-left text-[16px] text-[#191919]">{label}</span>
                <ChevronRight className="w-4 h-4 text-[#c8c8c8]" />
              </Link>
            ) : (
              <button
                type="button"
                disabled={disabled}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#ececec] disabled:opacity-50"
              >
                <Icon className="w-5 h-5 text-[#191919]" strokeWidth={1.5} />
                <span className="flex-1 text-left text-[16px] text-[#191919]">{label}</span>
                <ChevronRight className="w-4 h-4 text-[#c8c8c8]" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <p className="text-center text-xs text-[#b2b2b2] px-4 pb-6">
        WeiChat v0.1 — יישום עצמאי · יעד: לעבור את WhatsApp ו-Telegram
      </p>
    </>
  );
}
