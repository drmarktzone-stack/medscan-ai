import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowLeftRight, CreditCard } from 'lucide-react';
import { useWeChat } from '@/wechat/lib/store.js';

export default function PayPage() {
  const { state, actions } = useWeChat();
  const balance = state.profile.wallet?.balance ?? 0;
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');

  function sendRedPacket(e) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0 || val > balance) {
      setMsg('סכום לא תקין');
      return;
    }
    actions.updateWallet(-val);
    setMsg(`🧧 שלחת חבילה אדומה של ¥${val.toFixed(2)} (דמו)`);
    setAmount('');
  }

  return (
    <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto pb-8">
      <header className="sticky top-0 z-40 bg-[#07c160]">
        <div className="flex items-center h-11 px-2">
          <Link to="/wechat/me" className="text-white text-sm px-2">
            ‹ חזרה
          </Link>
          <h1 className="flex-1 text-center font-semibold text-[17px] text-white">
            微信支付 WeChat Pay
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="bg-[#07c160] px-6 pb-8 pt-4 text-white">
        <div className="text-sm opacity-80">יתרה (דמו)</div>
        <div className="text-4xl font-light mt-1">¥ {balance.toFixed(2)}</div>
      </div>

      <div className="mx-4 -mt-4 bg-white rounded-xl shadow-sm divide-y divide-[#ededed]">
        {[
          { icon: ArrowLeftRight, label: 'העברה', sub: 'בקרוב' },
          { icon: CreditCard, label: 'כרטיסים', sub: 'בקרוב' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-4 opacity-50">
            <Icon className="w-5 h-5 text-[#07c160]" />
            <div className="flex-1">
              <div className="text-[15px]">{label}</div>
              <div className="text-xs text-[#b2b2b2]">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-4 mt-4 bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-[#fa5151]" />
          <span className="font-medium text-[#191919]">חבילה אדומה 🧧 (דמו)</span>
        </div>
        <form onSubmit={sendRedPacket} className="space-y-3">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="סכום ¥"
            className="w-full border border-[#d9d9d9] rounded-md px-3 py-2 text-lg outline-none focus:border-[#07c160]"
          />
          <button
            type="submit"
            className="w-full py-2.5 bg-[#fa5151] text-white rounded-md font-medium"
          >
            שלח חבילה אדומה
          </button>
        </form>
        {msg && <p className="text-sm text-[#576b95] mt-3 text-center">{msg}</p>}
      </div>

      <p className="text-center text-[10px] text-[#b2b2b2] mt-6 px-6">
        תשלומים אמיתיים לא מחוברים — זה MVP לתצוגה בלבד
      </p>
    </div>
  );
}
