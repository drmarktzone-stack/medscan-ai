import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MoreHorizontal, Mic, Smile, Plus } from 'lucide-react';
import WeChatAvatar from '@/components/WeChatAvatar.jsx';
import ChatBubble from '@/components/ChatBubble.jsx';
import {
  useWeChat,
  getChatTitle,
  getChatAvatar,
  getContact,
  ME_ID,
} from '@/lib/store.js';

export default function ChatRoomPage() {
  const { chatId } = useParams();
  const { state, actions } = useWeChat();
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  const chat = state.chats.find((c) => c.id === chatId);
  const messages = state.messages[chatId] || [];

  useEffect(() => {
    if (chatId) actions.markChatRead(chatId);
  }, [chatId, actions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (!chat) {
    return (
      <div className="p-8 text-center text-[#b2b2b2]">
        <p>צ\'אט לא נמצא</p>
        <Link to="/" className="text-[#576b95] text-sm mt-2 inline-block">
          חזרה
        </Link>
      </div>
    );
  }

  const title = getChatTitle(state, chat);
  const avatar = getChatAvatar(state, chat);

  function send() {
    if (!draft.trim()) return;
    actions.sendMessage(chatId, draft);
    setDraft('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="min-h-screen bg-[#ededed] flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
        <div className="flex items-center h-11 px-2">
          <Link to="/" className="text-[#576b95] text-sm px-2">
            ‹ חזרה
          </Link>
          <div className="flex-1 text-center">
            <div className="font-semibold text-[17px] text-[#191919]">{title}</div>
            {chat.type === 'group' && (
              <div className="text-[10px] text-[#b2b2b2]">
                {getContact(state, chat.contactId)?.members?.length || 0} משתתפים
              </div>
            )}
          </div>
          <button type="button" className="p-2 text-[#191919]" aria-label="עוד">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 pb-20">
        {messages.map((msg, i) => {
          const isMine = msg.senderId === ME_ID;
          const prev = messages[i - 1];
          const showTime =
            !prev || msg.time - prev.time > 5 * 60 * 1000;
          const sender = getContact(state, msg.senderId);

          return (
            <div key={msg.id}>
              {showTime && (
                <div className="text-center text-[11px] text-[#b2b2b2] my-3">
                  {new Date(msg.time).toLocaleString('he-IL', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              )}
              <div className={isMine ? 'flex justify-end gap-2' : 'flex justify-start gap-2'}>
                {!isMine && (
                  <WeChatAvatar emoji={sender?.avatar || avatar} size="sm" />
                )}
                <div>
                  {chat.type === 'group' && !isMine && (
                    <div className="text-[11px] text-[#888] mb-0.5 px-1">
                      {sender?.name || 'משתמש'}
                    </div>
                  )}
                  <ChatBubble message={msg} isMine={isMine} />
                </div>
                {isMine && (
                  <WeChatAvatar emoji={state.profile.avatar} size="sm" />
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <footer className="fixed bottom-0 inset-x-0 bg-[#f7f7f7] border-t border-[#d9d9d9] pb-safe">
        <div className="max-w-lg mx-auto flex items-end gap-2 px-2 py-2">
          <button type="button" className="p-2 text-[#191919]">
            <Mic className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="הקלד/י הודעה..."
            className="flex-1 max-h-24 resize-none bg-white border border-[#d9d9d9] rounded-md px-3 py-2 text-[15px] outline-none focus:border-[#07c160]"
          />
          <button type="button" className="p-2 text-[#191919]">
            <Smile className="w-6 h-6" strokeWidth={1.5} />
          </button>
          {draft.trim() ? (
            <button
              type="button"
              onClick={send}
              className="px-3 py-1.5 bg-[#07c160] text-white text-sm font-medium rounded-md"
            >
              שלח
            </button>
          ) : (
            <button type="button" className="p-2 text-[#191919]">
              <Plus className="w-6 h-6" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
