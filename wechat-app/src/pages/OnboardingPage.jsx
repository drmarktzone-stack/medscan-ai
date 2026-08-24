import React, { useState } from 'react';
import { MessageCircle, Sparkles, UserPlus } from 'lucide-react';
import { createSeedState } from '@/lib/seedData.js';
import {
  createFreshState,
  markOnboardingComplete,
  validateWechatId,
} from '@/lib/onboarding.js';
import { ZERO_COST_STACK } from '@/lib/zeroCost.js';

const AVATARS = ['👤', '🩺', '👨‍💼', '👩‍⚕️', '🧑‍💻', '💬', '🌟', '🎯'];

export default function OnboardingPage({ onComplete }) {
  const [mode, setMode] = useState(null);
  const [wechatId, setWechatId] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [error, setError] = useState('');

  function finish(state) {
    markOnboardingComplete();
    onComplete(state);
  }

  function handleCustom(e) {
    e.preventDefault();
    const check = validateWechatId(wechatId);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    if (!name.trim()) {
      setError('נא להזין שם תצוגה');
      return;
    }
    setError('');
    finish(createFreshState({ wechatId: check.id, name: name.trim(), avatar }));
  }

  function handleDemo() {
    finish(createSeedState());
  }

  if (!mode) {
    return (
      <div className="min-h-screen bg-[#ededed] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#07c160] flex items-center justify-center mb-6 shadow-lg">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#191919] mb-2">WeiChat 微聊</h1>
        <p className="text-[#888] text-sm mb-8 max-w-xs">
          messaging עם סנכרון בחינם — relay, localStorage, PWA
        </p>

        <div className="w-full max-w-sm space-y-3">
          <button
            type="button"
            onClick={() => setMode('custom')}
            className="w-full flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-[#e5e5e5] hover:border-[#07c160] transition"
          >
            <UserPlus className="w-6 h-6 text-[#07c160]" />
            <div className="text-right flex-1">
              <div className="font-semibold text-[#191919]">התחל עם ID שלך</div>
              <div className="text-xs text-[#888]">מומלץ לסנכרון אמיתי בין מכשירים</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleDemo}
            className="w-full flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-[#e5e5e5] hover:border-[#10aeff] transition"
          >
            <Sparkles className="w-6 h-6 text-[#10aeff]" />
            <div className="text-right flex-1">
              <div className="font-semibold text-[#191919]">דמו מהיר</div>
              <div className="text-xs text-[#888]">dr_samar + צ&apos;אטים לדוגמה</div>
            </div>
          </button>
        </div>

        <div className="mt-10 text-[10px] text-[#b2b2b2] max-w-xs leading-relaxed">
          {Object.values(ZERO_COST_STACK).join(' · ')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ededed] flex flex-col items-center justify-center p-6">
      <h2 className="text-xl font-bold text-[#191919] mb-6">בחר WeiChat ID</h2>
      <form onSubmit={handleCustom} className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-xs text-[#888] block mb-1">WeiChat ID (ייחודי)</label>
          <input
            value={wechatId}
            onChange={(e) => setWechatId(e.target.value)}
            placeholder="user_b"
            className="w-full rounded-lg border border-[#ddd] px-3 py-2 text-left dir-ltr"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="text-xs text-[#888] block mb-1">שם תצוגה</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="השם שלך"
            className="w-full rounded-lg border border-[#ddd] px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs text-[#888] block mb-2">אווטאר</label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setAvatar(em)}
                className={`w-10 h-10 rounded-full text-xl ${avatar === em ? 'ring-2 ring-[#07c160]' : 'bg-white'}`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-[#fa5151]">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#07c160] text-white rounded-lg py-3 font-semibold"
        >
          התחל
        </button>
        <button
          type="button"
          onClick={() => setMode(null)}
          className="w-full text-[#888] text-sm py-2"
        >
          חזרה
        </button>
      </form>
    </div>
  );
}
