import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function ResultBlock({ title, children, className }) {
  return (
    <Card className={cn('bg-white/5 border-white/10 text-white', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-white/90">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-white/80 whitespace-pre-wrap">{children}</CardContent>
    </Card>
  );
}

export function CopyButton({ text, label = 'העתק' }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
    >
      {copied ? '✓ הועתק' : label}
    </button>
  );
}

export function ScoreRing({ score, grade }) {
  const color = score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex flex-col items-center">
      <div className={cn('text-5xl font-black', color)}>{score}</div>
      <div className="text-white/60 text-sm">/ 100</div>
      {grade && <div className="mt-2 px-3 py-1 rounded-full bg-white/10 text-sm">{grade}</div>}
    </div>
  );
}

export function ToolFormField({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-white/70">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500';

export const selectClass = inputClass;
