import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pin } from 'lucide-react';
import { ChatsHeader } from '@/wechat/components/WeChatLayout.jsx';
import SearchBar from '@/wechat/components/SearchBar.jsx';
import WeChatAvatar from '@/wechat/components/WeChatAvatar.jsx';
import NewChatSheet from '@/wechat/components/NewChatSheet.jsx';
import { useWeChat, useSortedChats, getChatTitle, getChatAvatar } from '@/wechat/lib/store.js';
import { formatChatTime } from '@/wechat/lib/format.js';

export default function ChatsPage() {
  const [query, setQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  const { state } = useWeChat();
  const chats = useSortedChats(query);

  return (
    <>
      <ChatsHeader onNewChat={() => setNewChatOpen(true)} />
      <NewChatSheet open={newChatOpen} onClose={() => setNewChatOpen(false)} />
      <SearchBar value={query} onChange={setQuery} placeholder="חיפוש" />

      <ul className="bg-white divide-y divide-[#ededed]">
        {chats.length === 0 && (
          <li className="py-12 text-center text-sm text-[#b2b2b2]">אין צ\'אטים</li>
        )}
        {chats.map((chat) => (
          <li key={chat.id}>
            <Link
              to={`/wechat/chat/${chat.id}`}
              className="flex items-center gap-3 px-3 py-2.5 active:bg-[#ececec]"
            >
              <WeChatAvatar emoji={getChatAvatar(state, chat)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[16px] text-[#191919] truncate flex items-center gap-1">
                    {chat.pinned && <Pin className="w-3 h-3 text-[#b2b2b2] fill-[#b2b2b2]" />}
                    {getChatTitle(state, chat)}
                  </span>
                  <span className="text-[11px] text-[#b2b2b2] shrink-0">
                    {formatChatTime(chat.lastTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-sm text-[#b2b2b2] truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#fa5151] text-white text-[11px] font-medium flex items-center justify-center">
                      {chat.unread > 99 ? '99+' : chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
