import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Send, Paperclip, Mic, Image, Code2, Video, Palette, Rocket,
  Scissors, MessageSquare, Plus, X, Download, Copy, ExternalLink,
  Loader2, Sparkles, ChevronDown, History, Trash2, Maximize2,
  FileText, Upload, Zap,
} from "lucide-react";
import {
  processWorkspaceRequest, createSession, saveSession, loadHistory,
  parseAttachment, MODES, ACCEPTED_FILE_TYPES,
} from "../lib/workspaceEngine.js";
import { calculateCreditScore } from "../lib/creditScore.js";
import { getPrimaryEmail } from "../lib/creditPassport.js";
import { formatSavings } from "../lib/savingsCalculator.js";
import { PROFESSION_TEMPLATES } from "../data/templates.js";
import ShareBanner from "../components/ShareBanner";
import { R } from "../lib/routes.js";
import { useKidsVoice } from "@/freeai/kids/hooks/useKidsVoice.js";

const MODE_ICONS = {
  chat: MessageSquare, image: Image, code: Code2, video: Video,
  design: Palette, project: Rocket, edit: Scissors,
};

export default function AIWorkspace({ locale = "he" }) {
  const [session, setSession] = useState(() => createSession("chat"));
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("chat");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const textareaRef = useRef(null);
  const fileRef = useRef(null);
  const messagesEndRef = useRef(null);
  const score = calculateCreditScore();

  const { listening, start: startVoice, stop: stopVoice, supported: voiceSupported } = useKidsVoice({
    lang: locale === "en" ? "en" : "he",
    onResult: (text) => {
      setPrompt((p) => (p ? `${p} ${text}` : text));
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [prompt]);

  const submit = useCallback(async () => {
    if ((!prompt.trim() && attachments.length === 0) || loading) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: prompt,
      mode,
      attachments: [...attachments],
      createdAt: new Date().toISOString(),
    };

    const nextSession = {
      ...session,
      mode,
      title: session.title || prompt.slice(0, 50),
      messages: [...session.messages, userMsg],
      updatedAt: new Date().toISOString(),
    };
    setSession(nextSession);
    setPrompt("");
    setAttachments([]);
    setLoading(true);

    try {
      const result = await processWorkspaceRequest({
        prompt: userMsg.content,
        mode,
        attachments: userMsg.attachments,
        urgent: false,
        history: nextSession.messages.filter((m) => m.id !== userMsg.id),
      });

      const assistantMsg = {
        id: `msg-${Date.now()}-r`,
        role: "assistant",
        content: locale === "he" ? (result.text || "") : (result.textEn || result.text || ""),
        mode,
        result,
        provider: result.provider,
        createdAt: new Date().toISOString(),
      };

      const finalSession = {
        ...nextSession,
        messages: [...nextSession.messages, assistantMsg],
        updatedAt: new Date().toISOString(),
      };
      setSession(finalSession);
      saveSession(finalSession);
      setHistory(loadHistory());
    } finally {
      setLoading(false);
    }
  }, [prompt, mode, attachments, loading, session, locale]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleFiles = async (files) => {
    const parsed = await Promise.all([...files].map(parseAttachment));
    setAttachments((prev) => [...prev, ...parsed].slice(0, 8));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const newChat = () => {
    const s = createSession(mode);
    setSession(s);
    setPrompt("");
    setAttachments([]);
  };

  const loadChat = (s) => {
    setSession(s);
    setMode(s.mode || "chat");
    setShowHistory(false);
  };

  const currentMode = MODES.find((m) => m.id === mode);
  const ModeIcon = MODE_ICONS[mode] || MessageSquare;

  return (
    <div className="flex h-[calc(100vh-4rem)] max-h-[900px] rounded-2xl border border-white/10 overflow-hidden bg-slate-950/80">
      {/* Sidebar */}
      <aside className={`${showHistory ? "w-64" : "w-0"} transition-all overflow-hidden border-l border-white/10 bg-black/40 flex flex-col shrink-0`}>
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <span className="text-sm font-bold text-white">{locale === "he" ? "היסטוריה" : "History"}</span>
          <button type="button" onClick={newChat} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadChat(s)}
              className={`w-full text-right px-3 py-2 rounded-lg text-xs transition-all truncate ${
                s.id === session.id ? "bg-violet-600/30 text-white" : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              {s.title || (locale === "he" ? "שיחה חדשה" : "New chat")}
            </button>
          ))}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-black/20">
          <button type="button" onClick={() => setShowHistory(!showHistory)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50">
            <History className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowModes(!showModes)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-medium text-white"
          >
            <ModeIcon className="w-4 h-4 text-violet-400" />
            {locale === "he" ? currentMode?.labelHe : currentMode?.labelEn}
            <ChevronDown className="w-3 h-3 text-white/40" />
          </button>

          <div className="mr-auto flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {score.gradeHe || score.grade} · {score.runway.totalCredits.toLocaleString()}
            </span>
            {!getPrimaryEmail() && (
              <Link to={R.passport} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30">
                {locale === "he" ? "חבר Passport" : "Link Passport"}
              </Link>
            )}
            <ShareBanner locale={locale} compact />
          </div>
        </div>

        {/* Mode picker dropdown */}
        {showModes && (
          <div className="absolute z-20 mt-12 mx-4 grid grid-cols-2 md:grid-cols-4 gap-2 p-3 rounded-2xl bg-slate-900 border border-white/15 shadow-2xl max-w-lg">
            {MODES.map((m) => {
              const Icon = MODE_ICONS[m.id] || MessageSquare;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setMode(m.id); setShowModes(false); }}
                  className={`text-right p-3 rounded-xl transition-all ${
                    mode === m.id ? "bg-violet-600/30 border border-violet-500/40" : "bg-white/5 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-bold text-white">{locale === "he" ? m.labelHe : m.labelEn}</span>
                  </div>
                  <p className="text-[10px] text-white/40">{locale === "he" ? m.descHe : m.descEn}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Messages area */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-6 space-y-6 ${dragOver ? "bg-violet-500/5 ring-2 ring-violet-500/30 ring-inset" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {session.messages.length === 0 && (
            <EmptyState locale={locale} onSelect={(text, m) => { setPrompt(text); if (m) setMode(m); }} />
          )}

          {session.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} locale={locale} />
          ))}

              {loading && (
            <div className="flex items-center gap-3 text-white/50 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
              {mode === "chat"
                ? (locale === "he" ? "חושב..." : "Thinking...")
                : (locale === "he" ? "יוצר..." : "Generating...")}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto border-t border-white/5">
            {attachments.map((att) => (
              <div key={att.id} className="relative shrink-0 group">
                {att.kind === "image" ? (
                  <img src={att.previewUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-white/10 flex flex-col items-center justify-center p-1">
                    <FileText className="w-5 h-5 text-white/50" />
                    <span className="text-[8px] text-white/40 truncate w-full text-center">{att.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Prompt composer */}
        <div className="p-4 border-t border-white/10 bg-black/30">
          <div className="relative rounded-2xl border border-white/15 bg-white/5 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                locale === "he"
                  ? currentMode?.descHe || "כתוב מה ליצור..."
                  : currentMode?.descEn || "Describe what to create..."
              }
              className="w-full bg-transparent text-white placeholder:text-white/30 px-4 pt-4 pb-12 text-sm resize-none focus:outline-none min-h-[56px] max-h-[160px]"
              dir="auto"
              rows={1}
            />

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_FILE_TYPES}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white/80 transition-all"
                  title={locale === "he" ? "העלה קובץ / תמונה" : "Upload file / image"}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => (listening ? stopVoice() : startVoice())}
                  className={`p-2 rounded-xl transition-all ${
                    listening
                      ? "bg-red-500/30 text-red-300 animate-pulse"
                      : "hover:bg-white/10 text-white/50 hover:text-white/80"
                  }`}
                  title={locale === "he" ? "הקלטה קולית" : "Voice input"}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={loading || (!prompt.trim() && attachments.length === 0)}
                className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-30 hover:opacity-90 transition-all shadow-lg shadow-violet-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-white/25 mt-2">
            {locale === "he"
              ? "FreeAI Hub · Enter לשליחה · Shift+Enter לשורה חדשה · גרור קבצים"
              : "FreeAI Hub · Enter to send · Shift+Enter new line · drag files"}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ locale, onSelect }) {
  const suggestions = [
    { text: "10 תמונות מוצר לחנות אונליין", mode: "image", icon: "🖼️" },
    { text: "דף נחיתה לסטארטאפ SaaS", mode: "code", icon: "💻" },
    { text: "חנות תכשיטים — קוד + עיצוב + deploy", mode: "project", icon: "🚀" },
    { text: "לוגו מינימליסטי לעסק טכנולוגי", mode: "design", icon: "🎨" },
    { text: "וידאו פרסומת מתמונה", mode: "video", icon: "🎬" },
    { text: "הסר רקע מתמונת מוצר", mode: "edit", icon: "✂️" },
  ];

  const templates = PROFESSION_TEMPLATES.slice(0, 4);

  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">
        {locale === "he" ? "מה ניצור היום?" : "What shall we create?"}
      </h2>
      <p className="text-white/40 text-sm mb-8">
        {locale === "he"
          ? "תמונות · קוד · עיצוב · וידאו · פרויקטים שלמים — הכל בחינם"
          : "Images · code · design · video · full projects — all free"}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-8">
        {suggestions.map((s) => (
          <button
            key={s.text}
            type="button"
            onClick={() => onSelect(s.text, s.mode)}
            className="text-right p-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-white/10 transition-all text-xs text-white/70 hover:text-white"
          >
            <span className="text-lg">{s.icon}</span>
            <span className="block mt-1">{s.text}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.descHe, "project")}
            className="px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 hover:bg-violet-500/20"
          >
            {t.icon} {t.titleHe}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message, locale }) {
  const isUser = message.role === "user";
  const result = message.result;

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-start"} gap-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "mr-auto" : ""}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-violet-600/20 border border-violet-500/20 text-white"
            : "bg-white/5 border border-white/10 text-white/90"
        }`}>
          {message.content}

          {/* User attachments */}
          {isUser && message.attachments?.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {message.attachments.map((att) => (
                att.kind === "image"
                  ? <img key={att.id} src={att.previewUrl} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  : <span key={att.id} className="text-xs bg-black/20 px-2 py-1 rounded-lg">📎 {att.name}</span>
              ))}
            </div>
          )}

          {/* Result: images */}
          {result?.images?.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {result.images.map((img) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden">
                  <img src={img.url} alt="" className="w-full aspect-square object-cover" loading="lazy" />
                  <a
                    href={img.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Result: code */}
          {result?.code && (
            <div className="mt-3 relative">
              <pre className="text-xs text-green-300 bg-black/40 rounded-xl p-3 overflow-x-auto max-h-48">{result.code.slice(0, 1500)}</pre>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(result.code)}
                  className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/70 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> {locale === "he" ? "העתק" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([result.code], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = "index.html"; a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-xs px-2 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> HTML
                </button>
              </div>
            </div>
          )}

          {/* Result: project pipeline */}
          {result?.state?.stageResults && (
            <div className="mt-3 space-y-2">
              {Object.entries(result.state.stageResults).map(([stage, data]) => (
                <div key={stage} className="text-xs bg-black/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span className="capitalize text-white/70">{stage}</span>
                  {data.provider && <span className="text-white/30">via {data.provider}</span>}
                </div>
              ))}
              {result.savings > 0 && (
                <p className="text-xs text-emerald-400">
                  {locale === "he" ? "חסכת" : "Saved"} {formatSavings(result.savings, locale)}
                </p>
              )}
            </div>
          )}

          {/* Result: external links */}
          {result?.links?.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
                >
                  <ExternalLink className="w-3 h-3" /> {link.name}
                </a>
              ))}
            </div>
          )}

          {/* Result: plan steps */}
          {result?.plan?.length > 0 && !result?.state && (
            <div className="mt-3 space-y-1">
              {result.plan.slice(0, 5).map((step, i) => (
                <div key={i} className="text-xs text-white/50">
                  {i + 1}. {step.units}× → {step.providerName}
                </div>
              ))}
            </div>
          )}
        </div>

        {message.provider && !isUser && (
          <p className="text-[10px] text-white/25 mt-1 mr-1">via {message.provider}</p>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-1 text-sm">
          👤
        </div>
      )}
    </div>
  );
}
