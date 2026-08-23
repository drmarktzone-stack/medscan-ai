import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, MessageCircle, PenLine, ScanSearch, CreditCard, ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/bizboost', label: 'בית', icon: Sparkles, end: true },
  { to: '/bizboost/leadbot', label: 'LeadBot', icon: MessageCircle },
  { to: '/bizboost/contentflow', label: 'ContentFlow', icon: PenLine },
  { to: '/bizboost/convertscan', label: 'ConvertScan', icon: ScanSearch },
  { to: '/bizboost/prospects', label: 'יעדים', icon: Users },
  { to: '/bizboost/pricing', label: 'מחירים', icon: CreditCard },
];

export default function BizBoostLayout({ children, title, subtitle }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white" dir="rtl">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/bizboost" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span>BizBoost AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, end }) => {
              const active = end ? pathname === to : pathname.startsWith(to) && to !== '/bizboost';
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    active ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10',
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <Link
            to="/bizboost/pricing"
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
          >
            התחילו חינם
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </header>

      {(title || subtitle) && (
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-4 text-center">
          {title && <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>}
          {subtitle && <p className="text-white/70 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-white/10 mt-16 py-8 text-center text-white/50 text-sm">
        <p>BizBoost AI © 2026 — כלי AI לעסקים קטנים בישראל</p>
        <p className="mt-1">LeadBot · ContentFlow · ConvertScan</p>
      </footer>
    </div>
  );
}
