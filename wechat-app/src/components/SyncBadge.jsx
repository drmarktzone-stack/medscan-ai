import React from 'react';
import { Cloud, CloudOff, Loader2, Wifi } from 'lucide-react';
import { useWeChat } from '@/lib/store.js';

const LABELS = {
  local: { text: 'מקומי', color: 'text-[#b2b2b2]' },
  syncing: { text: 'מסנכרן…', color: 'text-[#10aeff]' },
  live: { text: 'Live', color: 'text-[#07c160]' },
  offline: { text: 'לא מחובר', color: 'text-[#fa5151]' },
};

function resolveLabel(syncMeta, mode) {
  if (mode === 'syncing') return LABELS.syncing.text;
  if (mode === 'offline') return LABELS.offline.text;

  if (mode === 'live') {
    if (syncMeta?.backend === 'supabase') return 'Live · cloud';
    if (syncMeta?.relay) return 'Live · relay';
    if (syncMeta?.zeroCost) return 'Live · tab';
    return LABELS.live.text;
  }

  if (syncMeta?.zeroCost && syncMeta?.error === 'relay_offline') {
    return 'מקומי · relay';
  }

  return LABELS.local.text;
}

export default function SyncBadge() {
  const { syncMeta } = useWeChat();
  const mode = syncMeta?.mode || 'local';
  const cfg = LABELS[mode] || LABELS.local;
  const Icon = mode === 'syncing'
    ? Loader2
    : mode === 'live'
      ? (syncMeta?.relay ? Wifi : Cloud)
      : CloudOff;
  const label = resolveLabel(syncMeta, mode);
  const title = [
    syncMeta?.error,
    syncMeta?.relayUrl,
    syncMeta?.backend,
  ].filter(Boolean).join(' · ');

  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${cfg.color}`} title={title}>
      <Icon className={`w-3 h-3 ${mode === 'syncing' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}
