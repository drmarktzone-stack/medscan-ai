import React from 'react';
import { cn } from '@/lib/utils';
import { formatMessageTime } from '@/lib/format.js';

export default function ChatBubble({ message, isMine, showTime }) {
  return (
    <div className={cn('flex mb-3', isMine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[75%] flex flex-col', isMine ? 'items-end' : 'items-start')}>
        {showTime && (
          <span className="text-[10px] text-[#b2b2b2] mb-1 px-1">
            {formatMessageTime(message.time)}
          </span>
        )}
        <div
          className={cn(
            'px-3 py-2 text-[15px] leading-snug break-words rounded-md relative',
            isMine
              ? 'bg-[#95ec69] text-[#191919] rounded-tr-none'
              : 'bg-white text-[#191919] rounded-tl-none',
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
