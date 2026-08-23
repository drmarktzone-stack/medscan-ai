import React, { useState, useMemo, useCallback } from "react";
import FreeAILayout from "@/freeai/components/FreeAILayout";
import ProviderCard from "@/freeai/components/ProviderCard";
import { getCreditsDashboard } from "@/freeai/lib/planner.js";
import {
  loadCreditState, setCredits, toggleProvider, resetProviderCredits,
  loadApiKeys, saveApiKey,
} from "@/freeai/lib/creditStore.js";
import { useI18n } from "@/lib/i18n";
import { Search, Key, RefreshCw } from "lucide-react";

export default function FreeAIProvidersPage() {
  const { lang } = useI18n();
  const locale = lang === "en" ? "en" : "he";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [apiKeys, setApiKeysState] = useState(() => loadApiKeys());

  const dashboard = useMemo(() => {
    void refreshKey;
    return getCreditsDashboard();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    let list = dashboard.providers;
    if (filter !== "all") {
      list = list.filter((p) => p.capabilities.includes(filter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.nameHe.includes(q) ||
        p.notesHe.includes(q)
      );
    }
    return list;
  }, [dashboard.providers, filter, search]);

  const handleToggle = useCallback((id, enabled) => {
    toggleProvider(id, enabled);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleReset = useCallback((id) => {
    resetProviderCredits(id);
    setRefreshKey((k) => k + 1);
  }, []);

  const handleEditCredits = useCallback((id, current) => {
    setEditingId(id);
    setEditValue(String(current));
  }, []);

  const saveEdit = useCallback(() => {
    if (editingId) {
      setCredits(editingId, Number(editValue));
      setEditingId(null);
      setRefreshKey((k) => k + 1);
    }
  }, [editingId, editValue]);

  const handleApiKey = useCallback((providerId, key) => {
    saveApiKey(providerId, key);
    setApiKeysState(loadApiKeys());
  }, []);

  const caps = ["all", "image", "video", "design", "edit"];

  return (
    <FreeAILayout>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white mb-2">
          {locale === "he" ? "ניהול ספקים וקרדיטים" : "Provider & credit management"}
        </h1>
        <p className="text-white/60 text-sm">
          {locale === "he"
            ? `${dashboard.grandTotal.toLocaleString()} קרדיטים חינמיים זמינים · עדכן ידנית אחרי שימוש`
            : `${dashboard.grandTotal.toLocaleString()} free credits available · update manually after use`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "he" ? "חיפוש ספק..." : "Search provider..."}
            className="w-full rounded-xl bg-black/30 border border-white/10 text-white pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {caps.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === c ? "bg-violet-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"
              }`}
            >
              {c === "all" ? (locale === "he" ? "הכל" : "All") : c}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            dashboard.providers.forEach((p) => resetProviderCredits(p.id));
            setRefreshKey((k) => k + 1);
          }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/15"
        >
          <RefreshCw className="w-3 h-3" />
          {locale === "he" ? "איפוס הכל" : "Reset all"}
        </button>
      </div>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-white mb-3">
              {locale === "he" ? "עדכון קרדיטים" : "Update credits"}
            </h3>
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 text-white px-3 py-2 text-sm mb-4"
              min={0}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="flex-1 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium"
              >
                {locale === "he" ? "שמור" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="flex-1 py-2 rounded-xl border border-white/20 text-white/70 text-sm"
              >
                {locale === "he" ? "ביטול" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {filtered.map((p) => (
          <div key={p.id} id={p.id}>
            <ProviderCard
              provider={p}
              locale={locale}
              onToggle={handleToggle}
              onReset={handleReset}
              onEditCredits={handleEditCredits}
            />
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-400" />
          {locale === "he" ? "מפתחות API (נשמרים מקומית)" : "API keys (stored locally)"}
        </h2>
        <div className="space-y-3">
          {dashboard.providers.filter((p) => p.hasApi && p.needsKey).map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-sm text-white/70 w-40 shrink-0 truncate">
                {locale === "he" ? p.nameHe : p.name}
              </span>
              <input
                type="password"
                value={apiKeys[p.id] || ""}
                onChange={(e) => handleApiKey(p.id, e.target.value)}
                placeholder="sk-..."
                className="flex-1 rounded-lg bg-black/30 border border-white/10 text-white px-3 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      </section>
    </FreeAILayout>
  );
}
