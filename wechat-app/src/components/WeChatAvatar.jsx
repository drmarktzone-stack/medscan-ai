import React from 'react';
import { cn } from '@/lib/utils';

export default function WeChatAvatar({ emoji, size = 'md', className }) {
  const sizes = {
    sm: 'w-9 h-9 text-lg',
    md: 'w-11 h-11 text-xl',
    lg: 'w-14 h-14 text-2xl',
    xl: 'w-20 h-20 text-4xl',
  };

  return (
    <div
      className={cn(
        'rounded-md bg-[#d9d9d9] flex items-center justify-center shrink-0 select-none',
        sizes[size] || sizes.md,
        className,
      )}
    >
      {emoji || '👤'}
    </div>
  );
}
