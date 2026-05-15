'use client';

interface Props { score: number; size?: number; }

function getColor(s: number) {
  if (s >= 80) return '#22C55E';
  if (s >= 60) return '#84CC16';
  if (s >= 40) return '#F59E0B';
  if (s >= 20) return '#F97316';
  return '#EF4444';
}
function getLabel(s: number) {
  if (s >= 80) return 'Excelente';
  if (s >= 60) return 'Bueno';
  if (s >= 40) return 'Regular';
  if (s >= 20) return 'Bajo';
  return 'Crítico';
}

export default function HealthScore({ score, size = 100 }: Props) {
  const sw = 10;
  const r = (size - sw * 2) / 2;
  const C = 2 * Math.PI * r;
  const progress = (score / 100) * C;
  const cx = size / 2;
  const color = getColor(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {/* Track */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#222" strokeWidth={sw}
            transform={`rotate(-90 ${cx} ${cx})`} />
          {/* Progress */}
          <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${progress} ${C - progress}`}
            strokeDashoffset={C * 0.25}
            transform={`rotate(-90 ${cx} ${cx})`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black text-xl leading-none" style={{ color }}>{score}</span>
          <span className="text-muted text-[9px]">/100</span>
        </div>
      </div>
      <span className="text-xs font-bold mt-1.5" style={{ color }}>{getLabel(score)}</span>
      <span className="text-muted text-[9px] mt-0.5">Salud Financiera</span>
    </div>
  );
}
