'use client';
import { Transaction } from '../types';
import { getCategoryById } from '../utils/categories';
import { formatCOPFull } from '../utils/format';

interface Props { transaction: Transaction; onClick?: () => void; }

export default function TransactionCard({ transaction, onClick }: Props) {
  const cat = getCategoryById(transaction.category);
  const isIncome = transaction.type === 'income';
  const stars = transaction.rating;

  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 p-3 bg-surface2 rounded-2xl border border-border mb-2 active:opacity-70 transition-opacity text-left">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: (cat?.color || '#666') + '22' }}>
        {cat?.icon || '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{transaction.description}</p>
        <p className="text-muted text-xs">{cat?.name || 'Otros'}</p>
        {stars !== undefined && (
          <p className="text-xs mt-0.5" style={{ color: ['','#EF4444','#F97316','#EAB308','#22C55E','#3B82F6'][stars] }}>
            {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
          </p>
        )}
      </div>
      <div className="text-right">
        <span className={`text-sm font-bold ${isIncome ? 'text-success' : 'text-white'}`}>
          {isIncome ? '+' : '-'}{formatCOPFull(transaction.amount)}
        </span>
        <span className="block text-muted text-[10px] mt-0.5">›</span>
      </div>
    </button>
  );
}
