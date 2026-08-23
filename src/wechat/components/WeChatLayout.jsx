import React from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { MessageCircle, Users, Compass, User, Plus, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/wechat', label: '微信', labelHe: 'צ\'אטים', icon: MessageCircle, end: true },
  { to: '/wechat/contacts', label: '通讯录', labelHe: 'אנשי קשר', icon: Users, end: true },
  { to: '/wechat/discover', label: '发现', labelHe: 'גילוי', icon: Compass, end: true },
  { to: '/wechat/me', label: '我', labelHe: 'אני', icon: User, end: true },
];

function WeChatHeader({ title, backTo, rightAction }) {
  return (
    <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
      <div className="max-w-lg mx-auto flex items-center h-11 px-2">
        {backTo ? (
          <Link to={backTo} className="p-2 text-[#191919]">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        ) : (
          <div className="w-10" />
        )}
        <h1 className="flex-1 text-center font-semibold text-[17px] text-[#191919] truncate">
          {title}
        </h1>
        <div className="w-10 flex justify-end">{rightAction || null}</div>
      </div>
    </header>
  );
}

export default function WeChatLayout({ title, backTo, rightAction, hideTabs = false }) {
  const location = useLocation();
  const isChatRoom = location.pathname.includes('/chat/');
  const isMoments = location.pathname.includes('/moments');

  return (
    <div className="min-h-screen bg-[#ededed] flex flex-col max-w-lg mx-auto shadow-xl">
      {(title || isChatRoom || isMoments) && (
        <WeChatHeader
          title={title}
          backTo={backTo}
          rightAction={rightAction}
        />
      )}

      <main className={cn('flex-1 overflow-y-auto', !hideTabs && !isChatRoom && 'pb-16')}>
        <Outlet context={{ setHeader: () => {} }} />
      </main>

      {!hideTabs && !isChatRoom && !isMoments && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#f7f7f7] border-t border-[#d9d9d9] safe-area-pb">
          <div className="max-w-lg mx-auto grid grid-cols-4 h-14">
            {TABS.map(({ to, labelHe, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
                    isActive ? 'text-[#07c160]' : 'text-[#7f7f7f]',
                  )
                }
              >
                <Icon className="w-6 h-6" strokeWidth={1.75} />
                <span>{labelHe}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export function ChatsHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
      <div className="max-w-lg mx-auto flex items-center justify-between h-11 px-4">
        <h1 className="font-semibold text-[17px] text-[#191919]">微信 WeChat</h1>
        <button type="button" className="p-1 text-[#191919]" aria-label="חדש">
          <Plus className="w-6 h-6" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
