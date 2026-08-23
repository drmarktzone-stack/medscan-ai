import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import { useWeChat, wechatActions } from '@/wechat/lib/store.js';
import { parseProfileQr, findContactByWechatId } from '@/wechat/lib/qr.js';

export default function ScanPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { state } = useWeChat();
  const [manualId, setManualId] = useState('');
  const [status, setStatus] = useState('מחפש מצלמה...');
  const [error, setError] = useState('');
  const scannedRef = useRef(false);

  const handleFound = useCallback(
    (wechatId) => {
      if (scannedRef.current) return;
      scannedRef.current = true;

      const existing = findContactByWechatId(state, wechatId);
      if (existing) {
        const chatId = wechatActions.startChat(existing.id);
        navigate(`/wechat/chat/${chatId}`);
        return;
      }

      const result = wechatActions.addContactByWechatId(wechatId);
      if (result.ok) {
        const chatId = wechatActions.startChat(result.contact.id);
        navigate(`/wechat/chat/${chatId}`);
      } else {
        setError(result.error || 'שגיאה');
        scannedRef.current = false;
      }
    },
    [navigate, state],
  );

  useEffect(() => {
    let stream;
    let animId;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus('כוון/י את המצלמה ל-QR');

        const tick = () => {
          const canvas = canvasRef.current;
          const vid = videoRef.current;
          if (canvas && vid && vid.readyState === vid.HAVE_ENOUGH_DATA) {
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(vid, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code?.data) {
              const parsed = parseProfileQr(code.data);
              if (parsed?.wechatId) {
                handleFound(parsed.wechatId);
                return;
              }
            }
          }
          animId = requestAnimationFrame(tick);
        };
        animId = requestAnimationFrame(tick);
      } catch {
        setStatus('מצלמה לא זמינה');
        setError('אפשר להזין WeChat ID ידנית למטה');
      }
    }

    startCamera();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      stream?.getTracks?.().forEach((t) => t.stop());
    };
  }, [handleFound]);

  function submitManual(e) {
    e.preventDefault();
    const parsed = parseProfileQr(manualId);
    if (parsed?.wechatId) handleFound(parsed.wechatId);
    else setError('WeChat ID לא תקין');
  }

  return (
    <div className="min-h-screen bg-black max-w-lg mx-auto flex flex-col">
      <header className="sticky top-0 z-40 bg-black/80">
        <div className="flex items-center h-11 px-2">
          <Link to="/wechat/discover" className="text-white text-sm px-2">
            ‹ חזרה
          </Link>
          <h1 className="flex-1 text-center font-semibold text-[17px] text-white">
            扫一扫 סריקה
          </h1>
          <Link to="/wechat/qr" className="text-white text-xs px-2">
            QR שלי
          </Link>
        </div>
      </header>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="relative w-56 h-56 border-2 border-[#07c160] rounded-lg">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#07c160] -translate-x-0.5 -translate-y-0.5" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#07c160] translate-x-0.5 -translate-y-0.5" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#07c160] -translate-x-0.5 translate-y-0.5" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#07c160] translate-x-0.5 translate-y-0.5" />
        </div>
        <p className="absolute bottom-32 text-white/80 text-sm">{status}</p>
      </div>

      <form onSubmit={submitManual} className="p-4 bg-[#1a1a1a]">
        {error && <p className="text-[#fa5151] text-xs mb-2 text-center">{error}</p>}
        <div className="flex gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="WeChat ID (למשל david_wu)"
            className="flex-1 bg-[#333] text-white rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#07c160]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#07c160] text-white text-sm rounded-md font-medium"
          >
            הוסף
          </button>
        </div>
      </form>
    </div>
  );
}
