import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine, UserPlus } from 'lucide-react';
import WeChatAvatar from '@/components/WeChatAvatar.jsx';
import { useWeChat, wechatActions } from '@/lib/store.js';

export default function NewChatSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { state } = useWeChat();

  if (!open) return null;

  const directContacts = state.contacts.filter((c) => !c.isGroup);

  function startWith(contactId) {
    const chatId = wechatActions.startChat(contactId);
    onClose();
    navigate(`/chat/${chatId}`);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="סגור"
      />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom">
        <div className="p-4 border-b border-[#ededed]">
          <h2 className="font-semibold text-center text-[#191919]">צ\'אט חדש</h2>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 border-b border-[#ededed]">
          <button
            type="button"
            onClick={() => { onClose(); navigate('/scan'); }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#f7f7f7] active:bg-[#ececec]"
          >
            <ScanLine className="w-8 h-8 text-[#10aeff]" />
            <span className="text-sm text-[#191919]">סרוק QR</span>
          </button>
          <button
            type="button"
            onClick={() => { onClose(); navigate('/contacts'); }}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#f7f7f7] active:bg-[#ececec]"
          >
            <UserPlus className="w-8 h-8 text-[#07c160]" />
            <span className="text-sm text-[#191919]">אנשי קשר</span>
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto divide-y divide-[#ededed]">
          {directContacts.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => startWith(c.id)}
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#f7f7f7] text-left"
              >
                <WeChatAvatar emoji={c.avatar} size="sm" />
                <span className="text-[15px] text-[#191919]">{c.remark || c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
