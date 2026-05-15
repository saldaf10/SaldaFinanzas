'use client';
import { getCategoryById } from '../utils/categories';
import { formatCOP } from '../utils/format';

interface Props { categoryId: string; budget: number; spent: number; onDelete?: () => void; }

export default function BudgetBar({ categoryId, budget, spent, onDelete }: Props) {
  const cat = getCategoryById(categoryId);
  const ratio = budget > 0 ? Math.min(spent / budget, 1) : 0;
  const pct = Math.round(ratio * 100);
  const over = spent > budget;
  const barColor = over ? '#DC2626' : pct > 80 ? '#F59E0B' : cat?.color || '#DC2626';
  const remaining = budget - spent;

  return (
    <div className="card p-4 mb-2.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cat?.icon || '📦'}</span>
          <span className="text-white text-sm font-semibold">{cat?.name || categoryId}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-sm font-bold" style={{ color: over ? '#DC2626' : '#fff' }}>{formatCOP(spent)}</span>
            <span className="text-muted text-xs"> / {formatCOP(budget)}</span>
          </div>
          {onDelete && (
            <button onClick={onDelete} className="text-muted text-xs active:text-primary">✕</button>
          )}
        </div>
      </div>

      <div className="h-1.5 bg-surface3 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>

      <div className="flex justify-between">
        <span className="text-xs font-semibold" style={{ color: barColor }}>{pct}% usado</span>
        <span className={`text-xs ${over ? 'text-primary' : 'text-muted'}`}>
          {over ? `+${formatCOP(Math.abs(remaining))} excedido` : `${formatCOP(remaining)} restante`}
        </span>
      </div>
    </div>
  );
}
