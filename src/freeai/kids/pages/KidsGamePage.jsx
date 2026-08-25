import React, { useState, useMemo } from "react";
import { Loader2, ExternalLink, Download, Play } from "lucide-react";
import { useI18n } from "../../lib/i18n.jsx";
import KidsLayout from "../components/KidsLayout.jsx";
import VoiceMic, { VoiceInputRow } from "../components/VoiceMic.jsx";
import { pickL } from "../lib/locale.js";
import { GAME_LIBRARY } from "../lib/gameLibrary.js";
import { generateKidsGame } from "../lib/kidsEngine.js";
import { loadKidsProfile, saveCreation } from "../lib/kidsStore.js";
import { useSymbolKeyboardBridge } from "../context/SymbolKeyboardBridge.jsx";

const COPY = {
  title: { he: "בונה משחקים", en: "Game Builder", ar: "صانع الألعاب" },
  pickGame: { he: "בחר סוג משחק", en: "Pick a game type", ar: "اختر نوع اللعبة" },
  theme: { he: "נושא המשחק — דבר או כתוב", en: "Game theme — speak or type", ar: "موضوع اللعبة — تحدث أو اكتب" },
  build: { he: "בנה ושחק! 🎮", en: "Build & Play! 🎮", ar: "ابنِ والعب! 🎮" },
  playNow: { he: "▶ שחק עכשיו", en: "▶ Play now", ar: "▶ العب الآن" },
  preview: { he: "תצוגה מקדימה", en: "Preview", ar: "معاينة" },
  open: { he: "מסך מלא", en: "Fullscreen", ar: "ملء الشاشة" },
  download: { he: "הורד", en: "Download", ar: "حمّل" },
  tip: {
    he: "🎯 10 סוגי משחקים — בנה, שחק, שתף!",
    en: "🎯 10 game types — build, play, share!",
    ar: "🎯 10 أنواع ألعاب — ابنِ، العب، شارك!",
  },
};

export default function KidsGamePage() {
  const { lang } = useI18n();
  const profile = loadKidsProfile();
  const [gameType, setGameType] = useState("quiz");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [playing, setPlaying] = useState(false);

  useSymbolKeyboardBridge(useMemo(() => ({
    lang,
    value: theme,
    onChange: setTheme,
    onSymbol: (p) => {
      if (p.action === "gameType") {
        const map = { quiz: "quiz", snake: "snake", memory: "memory", runner: "runner", catch: "catch", colors: "colors", math: "math", puzzle: "puzzle", bubble: "bubble", adventure: "adventure" };
        if (map[p.id]) setGameType(map[p.id]);
      }
    },
  }), [lang, theme]));

  const build = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    setPlaying(false);
    const res = await generateKidsGame({
      gameType,
      theme: theme.trim(),
      grade: profile.grade || "5",
      lang,
    });
    const blob = new Blob([res.html], { type: "text/html" });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
    saveCreation({ type: "game", title: theme, data: { html: res.html, gameType } });
    setLoading(false);
    setPlaying(true);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `freeai-kids-game-${Date.now()}.html`;
    a.click();
  };

  return (
    <KidsLayout>
      <div className="space-y-5">
        <h1 className="text-2xl font-black">{pickL(COPY.title, lang)}</h1>
        <p className="text-sm font-semibold opacity-90">{pickL(COPY.tip, lang)}</p>

        <div className="bg-white/20 rounded-3xl p-4 space-y-4 border-2 border-white/30">
          <p className="text-sm font-bold">{pickL(COPY.pickGame, lang)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
            {GAME_LIBRARY.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGameType(g.id)}
                className={`p-3 rounded-xl text-right transition-all ${
                  gameType === g.id ? "bg-white text-purple-700 ring-2 ring-white" : "bg-white/15 hover:bg-white/25"
                }`}
              >
                <div className="text-2xl">{g.icon}</div>
                <div className="font-black text-xs mt-1">{pickL(g.name, lang)}</div>
                <div className="text-[10px] opacity-70 line-clamp-2">{pickL(g.desc, lang)}</div>
              </button>
            ))}
          </div>

          <VoiceInputRow
            value={theme}
            onChange={setTheme}
            placeholder={pickL(COPY.theme, lang)}
            lang={lang}
          />
          <div className="flex justify-center">
            <VoiceMic onText={(t) => setTheme(theme ? `${theme} ${t}` : t)} />
          </div>

          <button type="button" onClick={build} disabled={loading || !theme.trim()}
            className="w-full py-3 rounded-2xl bg-white text-purple-700 font-black text-lg flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {pickL(COPY.build, lang)}
          </button>
        </div>

        {previewUrl && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setPlaying(true)}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-black flex items-center justify-center gap-2 min-w-[140px]">
                <Play className="w-5 h-5" /> {pickL(COPY.playNow, lang)}
              </button>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl bg-white/30 font-bold flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> {pickL(COPY.open, lang)}
              </a>
              <button type="button" onClick={download}
                className="flex-1 py-2 rounded-xl bg-white/30 font-bold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> {pickL(COPY.download, lang)}
              </button>
            </div>
            {playing && (
              <div className="rounded-2xl overflow-hidden border-4 border-green-300 shadow-2xl bg-white">
                <p className="text-green-700 text-xs font-bold px-3 py-2 bg-green-50">{pickL(COPY.preview, lang)}</p>
                <iframe title="game" src={previewUrl} className="w-full h-[420px] border-0" sandbox="allow-scripts" />
              </div>
            )}
          </div>
        )}
      </div>
    </KidsLayout>
  );
}
