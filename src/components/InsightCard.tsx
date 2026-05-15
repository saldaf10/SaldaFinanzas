'use client';
import { Insight } from '../types';

const STYLES = {
  warning: { border: '#F59E0B44', bg: '#1A1100', text: '#F59E0B' },
  success: { border: '#22C55E44', bg: '#071A0E', text: '#22C55E' },
  info:    { border: '#3B82F644', bg: '#07101A', text: '#60A5FA' },
  tip:     { border: '#A78BFA44', bg: '#0D0A1F', text: '#A78BFA' },
};

export default function InsightCard({ insight }: { insight: Insight }) {
  const s = STYLES[insight.type];
  return (
    <div className="rounded-2xl p-4 mb-2.5 border" style={{ backgroundColor: s.bg, borderColor: s.border }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{insight.icon}</span>
        <span className="text-sm font-bold" style={{ color: s.text }}>{insight.title}</span>
      </div>
      <p className="text-secondary text-xs leading-relaxed">{insight.description}</p>
    </div>
  );
}
