import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users, Tag, ChevronRight } from 'lucide-react';
import SearchBar from '@/wechat/components/SearchBar.jsx';
import WeChatAvatar from '@/wechat/components/WeChatAvatar.jsx';
import { useWeChat, useWeChatSearch, wechatActions } from '@/wechat/lib/store.js';

const QUICK_ENTRIES = [
  { icon: UserPlus, label: 'הוספת חבר/ה', color: 'text-[#fa9d3b]' },
  { icon: Tag, label: 'תגיות', color: 'text-[#10aeff]' },
  { icon: Users, label: 'קבוצות', color: 'text-[#07c160]' },
];

export default function ContactsPage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { state } = useWeChat();
  const { contacts } = useWeChatSearch(query);

  const sorted = [...contacts].sort((a, b) =>
    (a.remark || a.name).localeCompare(b.remark || b.name, 'he'),
  );

  function openChat(contactId) {
    const chatId = wechatActions.startChat(contactId);
    navigate(`/wechat/chat/${chatId}`);
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
        <div className="max-w-lg mx-auto flex items-center justify-center h-11">
          <h1 className="font-semibold text-[17px] text-[#191919]">通讯录 אנשי קשר</h1>
        </div>
      </header>

      <SearchBar value={query} onChange={setQuery} />

      {!query && (
        <ul className="bg-white mb-2 divide-y divide-[#ededed]">
          {QUICK_ENTRIES.map(({ icon: Icon, label, color }) => (
            <li key={label}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-[#ececec]"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="flex-1 text-left text-[16px] text-[#191919]">{label}</span>
                <ChevronRight className="w-4 h-4 text-[#c8c8c8]" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="bg-white">
        <div className="px-4 py-1 text-[12px] text-[#888] bg-[#ededed]">אנשי קשר</div>
        <ul className="divide-y divide-[#ededed]">
          {sorted.map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                onClick={() => openChat(contact.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 active:bg-[#ececec] text-left"
              >
                <WeChatAvatar emoji={contact.avatar} />
                <div className="flex-1 min-w-0">
                  <div className="text-[16px] text-[#191919] truncate">
                    {contact.remark || contact.name}
                  </div>
                  {contact.remark && (
                    <div className="text-xs text-[#b2b2b2] truncate">{contact.name}</div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-xs text-[#b2b2b2] py-4">
          {state.contacts.length} אנשי קשר
      </p>
    </>
  );
}
