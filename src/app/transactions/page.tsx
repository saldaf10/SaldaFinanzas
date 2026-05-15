'use client';
import { useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { formatDate, formatCOP } from '../../utils/format';
import { getCategoryById } from '../../utils/categories';
import TransactionCard from '../../components/TransactionCard';
import { Transaction } from '../../types';

type Filter = 'all' | 'income' | 'expense';
type View = 'list' | 'calendar';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function Transactions() {
  const { transactions, deleteTransaction } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<View>('list');
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  /* ── LIST VIEW ── */
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

  /* ── CALENDAR VIEW ── */
  const monthKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}`;

  const dayMap = useMemo(() => {
    const m: Record<string, { income: number; expense: number; txs: Transaction[] }> = {};
    transactions.forEach((t) => {
      const d = t.date.substring(0, 10);
      if (!d.startsWith(monthKey)) return;
      if (!m[d]) m[d] = { income: 0, expense: 0, txs: [] };
      if (t.type === 'income') m[d].income += t.amount;
      else m[d].expense += t.amount;
      m[d].txs.push(t);
    });
    return m;
  }, [transactions, monthKey]);

  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const total = new Date(calYear, calMonth + 1, 0).getDate();
    return { offset, total };
  }, [calYear, calMonth]);

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null);
  }

  const selectedTxs = selectedDay ? (dayMap[selectedDay]?.txs ?? []) : [];

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2 flex justify-between items-baseline">
        <h1 className="text-2xl font-black text-white">Movimientos</h1>
        <div className="flex gap-1 bg-surface2 rounded-xl p-1 border border-border">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-primary text-white' : 'text-muted'}`}
          >≡ Lista</button>
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${view === 'calendar' ? 'bg-primary text-white' : 'text-muted'}`}
          >▦ Mes</button>
        </div>
      </div>

      {view === 'list' && (
        <>
          <div className="px-4 mb-3">
            <input
              className="w-full bg-surface2 border border-border rounded-2xl px-4 py-3 text-white text-sm placeholder-muted"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
        </>
      )}

      {view === 'calendar' && (
        <div className="px-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center text-white text-lg">‹</button>
            <p className="text-white font-bold capitalize">{monthLabel}</p>
            <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center text-white text-lg">›</button>
          </div>

          {/* Month summary */}
          <div className="card p-3 flex mb-4">
            {[
              { label: 'Ingresos', value: Object.values(dayMap).reduce((s, d) => s + d.income, 0), color: 'text-success', sign: '+' },
              { label: 'Gastos', value: Object.values(dayMap).reduce((s, d) => s + d.expense, 0), color: 'text-primary', sign: '-' },
            ].map((item, i) => (
              <div key={item.label} className={`flex-1 text-center ${i > 0 ? 'border-l border-border' : ''}`}>
                <p className="text-muted text-[10px] mb-0.5">{item.label}</p>
                <p className={`text-sm font-bold ${item.color}`}>{item.sign}{formatCOP(item.value)}</p>
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-muted py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: calDays.offset }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: calDays.total }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const data = dayMap[dateStr];
              const isToday = dateStr === new Date().toISOString().slice(0, 10);
              const isSelected = selectedDay === dateStr;
              const hasIncome = data && data.income > 0;
              const hasExpense = data && data.expense > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all"
                  style={{
                    backgroundColor: isSelected ? '#DC2626' : isToday ? '#DC262622' : data ? '#ffffff08' : 'transparent',
                    border: isToday && !isSelected ? '1px solid #DC262655' : '1px solid transparent',
                  }}
                >
                  <span className={`text-xs font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-primary' : data ? 'text-white' : 'text-muted'}`}>
                    {day}
                  </span>
                  {data && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasExpense && <div className="w-1 h-1 rounded-full bg-primary" />}
                      {hasIncome && <div className="w-1 h-1 rounded-full bg-success" />}
                    </div>
                  )}
                  {data && !isSelected && (
                    <span className="text-[8px] text-muted leading-none mt-0.5">
                      {formatCOP(data.expense || data.income)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day transactions */}
          {selectedDay && (
            <div className="mb-6">
              <p className="text-white text-sm font-bold mb-2 capitalize">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedTxs.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">Sin movimientos este día</p>
              ) : (
                selectedTxs.map((tx) => {
                  const cat = getCategoryById(tx.category);
                  return (
                    <div key={tx.id} className="card p-3 mb-2 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: (cat?.color || '#666') + '22' }}>
                        {cat?.icon || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{tx.description}</p>
                        <p className="text-muted text-xs">{cat?.name}</p>
                      </div>
                      <p className={`text-sm font-bold ${tx.type === 'expense' ? 'text-primary' : 'text-success'}`}>
                        {tx.type === 'expense' ? '-' : '+'}{formatCOP(tx.amount)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
