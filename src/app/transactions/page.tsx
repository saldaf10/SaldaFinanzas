'use client';
import { useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { formatDate, formatCOP } from '../../utils/format';
import TransactionCard from '../../components/TransactionCard';
import { Transaction } from '../../types';

type Filter = 'all' | 'income' | 'expense';

export default function Transactions() {
  const { transactions, deleteTransaction } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let r = [...transactions];
    if (filter !== 'all') r = r.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((t) => t.description.toLowerCase().includes(q) || t.category.includes(q));
    }
    return r;
  }, [transactions, filter, search]);

  const grouped = useMemo(() => {
    const g: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      const day = t.date.substring(0, 10);
      if (!g[day]) g[day] = [];
      g[day].push(t);
    });
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const income = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2 flex justify-between items-baseline">
        <h1 className="text-2xl font-black text-white">Movimientos</h1>
        <span className="text-muted text-xs">{filtered.length} registros</span>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <input
          className="w-full bg-surface2 border border-border rounded-2xl px-4 py-3 text-white text-sm placeholder-muted"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="px-4 flex gap-2 mb-3">
        {(['all', 'income', 'expense'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-full text-xs font-semibold border transition-all ${
              filter === f ? 'bg-primary/20 border-primary text-primary' : 'bg-surface2 border-border text-secondary'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'income' ? '↑ Ingresos' : '↓ Gastos'}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="mx-4 mb-3 card p-3 flex">
        <div className="flex-1 text-center">
          <p className="text-muted text-[10px] mb-0.5">Ingresos</p>
          <p className="text-success text-sm font-bold">+{formatCOP(income)}</p>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 text-center">
          <p className="text-muted text-[10px] mb-0.5">Gastos</p>
          <p className="text-primary text-sm font-bold">-{formatCOP(expense)}</p>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 text-center">
          <p className="text-muted text-[10px] mb-0.5">Balance</p>
          <p className={`text-sm font-bold ${income - expense >= 0 ? 'text-success' : 'text-primary'}`}>
            {formatCOP(income - expense)}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="px-4">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-3">🔍</span>
            <p className="text-muted text-sm">Sin resultados</p>
          </div>
        ) : (
          grouped.map(([day, txList]) => (
            <div key={day} className="mb-4">
              <p className="text-muted text-xs font-bold uppercase tracking-wide mb-2">{formatDate(day)}</p>
              {txList.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onDelete={() => {
                    if (confirm(`¿Eliminar "${tx.description}"?`)) deleteTransaction(tx.id);
                  }}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
