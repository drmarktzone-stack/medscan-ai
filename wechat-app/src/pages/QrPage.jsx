import React from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import WeChatAvatar from '@/components/WeChatAvatar.jsx';
import { useWeChat } from '@/lib/store.js';
import { profileQrValue } from '@/lib/qr.js';

export default function QrPage() {
  const { state } = useWeChat();
  const { profile } = state;
  const qrValue = profileQrValue(profile.wechatId);

  return (
    <div className="min-h-screen bg-[#ededed] max-w-lg mx-auto">
      <header className="sticky top-0 z-40 bg-[#ededed] border-b border-[#d9d9d9]">
        <div className="flex items-center h-11 px-2">
          <Link to="/me" className="text-[#576b95] text-sm px-2">
            ‹ חזרה
          </Link>
          <h1 className="flex-1 text-center font-semibold text-[17px] text-[#191919]">
            QR שלי
          </h1>
          <div className="w-12" />
        </div>
      </header>

      <div className="p-6 flex flex-col items-center">
        <div className="bg-white rounded-2xl p-6 shadow-sm w-full max-w-xs">
          <div className="flex flex-col items-center mb-4">
            <WeChatAvatar emoji={profile.avatar} size="lg" className="mb-2" />
            <div className="font-semibold text-[#191919]">{profile.name}</div>
            <div className="text-xs text-[#888]">WeChat ID: {profile.wechatId}</div>
          </div>
          <div className="flex justify-center p-4 bg-white">
            <QRCode value={qrValue} size={200} level="M" />
          </div>
          <p className="text-center text-xs text-[#b2b2b2] mt-2">
            סרוק/י כדי להוסיף אותי כחבר/ה
          </p>
        </div>

        <Link
          to="/scan"
          className="mt-6 text-sm text-[#576b95] font-medium"
        >
          סרוק QR של חבר/ה →
        </Link>
      </div>
    </div>
  );
}
