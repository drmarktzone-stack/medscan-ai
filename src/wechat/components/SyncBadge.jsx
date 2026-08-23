import React from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useWeChat } from '@/wechat/lib/store.js';

const LABELS = {
  local: { text: 'מקומי', color: 'text-[#b2b2b2]' },
  syncing: { text: 'מסנכרן…', color: 'text-[#10aeff]' },
  live: { text: 'Live', color: 'text-[#07c160]' },
  offline: { text: 'לא מחובר', color: 'text-[#fa5151]' },
};

export default function SyncBadge() {
  const { syncMeta } = useWeChat();
  const mode = syncMeta?.mode || 'local';
  const cfg = LABELS[mode] || LABELS.local;
  const Icon = mode === 'syncing' ? Loader2 : mode === 'live' ? Cloud : CloudOff;

  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${cfg.color}`} title={syncMeta?.error || ''}>
      <Icon className={`w-3 h-3 ${mode === 'syncing' ? 'animate-spin' : ''}`} />
      {cfg.text}
    </span>
  );
}
