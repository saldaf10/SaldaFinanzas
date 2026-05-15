'use client';
import { CategoryBreakdown } from '../types';
import { getCategoryById } from '../utils/categories';

interface Props {
  breakdown: CategoryBreakdown;
  size?: number;
  centerLabel?: string;
  centerSub?: string;
}

export default function DonutChart({ breakdown, size = 160, centerLabel, centerSub }: Props) {
  const r = size / 2 - 14;
  const C = 2 * Math.PI * r;
  const cx = size / 2;
  const sw = 18;

  const entries = Object.entries(breakdown)
    .filter(([, v]) => v.amount > 0)
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 6);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted text-xs" style={{ width: size, height: size }}>
        Sin datos
      </div>
    );
  }

  let cum = 0;
  const segments = entries.map(([catId, data]) => {
    const cat = getCategoryById(catId);
    const dash = (data.percentage / 100) * C;
    const offset = cum;
    cum += dash;
    return { catId, data, cat, dash, offset };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#222" strokeWidth={sw} />
          {/* Segments */}
          {segments.map((seg) => (
            <circle
              key={seg.catId}
              cx={cx} cy={cx} r={r}
              fill="none"
              stroke={seg.cat?.color || '#888'}
              strokeWidth={sw}
              strokeDasharray={`${seg.dash - 1.5} ${C - seg.dash + 1.5}`}
              strokeDashoffset={-seg.offset}
            />
          ))}
        </svg>
        {/* Center */}
        {(centerLabel || centerSub) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerLabel && <span className="text-white font-bold text-sm">{centerLabel}</span>}
            {centerSub && <span className="text-muted text-xs mt-0.5">{centerSub}</span>}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="w-full mt-3 space-y-1.5">
        {segments.slice(0, 4).map((seg) => (
          <div key={seg.catId} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: seg.cat?.color || '#888' }} />
            <span className="text-secondary text-xs flex-1 truncate">{seg.cat?.name || seg.catId}</span>
            <span className="text-white text-xs font-semibold">{seg.data.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
