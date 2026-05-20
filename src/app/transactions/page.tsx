'use client';
import { useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { formatDate, formatCOP, formatCOPFull } from '../../utils/format';
import { resolveCategory } from '../../utils/categories';
import TransactionCard from '../../components/TransactionCard';
import { Transaction } from '../../types';

type Filter = 'all' | 'income' | 'expense';
type View = 'list' | 'calendar';

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const STAR_COLORS = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

export default function Transactions() {
  const { transactions, deleteTransaction, updateTransaction, accounts, customCategories } = useStore();

  const [filter, setFilter]       = useState<Filter>('all');
  const [search, setSearch]       = useState('');
  const [view, setView]           = useState<View>('list');
  const [calYear, setCalYear]     = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]   = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Detail / edit modal
  const [detail, setDetail]         = useState<Transaction | null>(null);
  const [editing, setEditing]       = useState(false);
  const [editDesc, setEditDesc]     = useState('');
  const [editAmt, setEditAmt]       = useState('');
  const [editNote, setEditNote]     = useState('');
  const [editRating, setEditRating] = useState<number | undefined>(undefined);
  const [editAccountId, setEditAccountId] = useState<string | undefined>(undefined);

  function openDetail(tx: Transaction) {
    setDetail(tx);
    setEditing(false);
    setEditDesc(tx.description);
    setEditAmt(tx.amount.toString());
    setEditNote(tx.note || '');
    setEditRating(tx.rating);
    setEditAccountId(tx.accountId);
  }
  function closeDetail() { setDetail(null); setEditing(false); }
  function saveEdit() {
    if (!detail) return;
    const amt = parseFloat(editAmt.replace(/\./g, '').replace(',', '.'));
    if (!editDesc.trim() || isNaN(amt) || amt <= 0) return;
    updateTransaction(detail.id, {
      description: editDesc.trim(),
      amount: amt,
      note: editNote.trim() || undefined,
      rating: editRating,
      accountId: editAccountId || undefined,
    });
    closeDetail();
  }

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

  const income  = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
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
    const offset   = firstDay === 0 ? 6 : firstDay - 1;
    const total    = new Date(calYear, calMonth + 1, 0).getDate();
    return { offset, total };
  }, [calYear, calMonth]);

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  }

  const selectedTxs = selectedDay ? (dayMap[selectedDay]?.txs ?? []) : [];
  const monthLabel  = new Date(calYear, calMonth, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  /* ── Detail derived data ── */
  const catInfo     = detail ? resolveCategory(detail.category, customCategories) : { name: '', icon: '📦', color: '#666' };
  const accountName = detail?.accountId ? accounts.find((a) => a.id === detail.accountId)?.name : undefined;
  const accountEmoji = detail?.accountId ? accounts.find((a) => a.id === detail.accountId)?.emoji : undefined;

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2 flex justify-between items-baseline">
        <h1 className="text-2xl font-black text-white">Movimientos</h1>
        <div className="flex gap-1 bg-surface2 rounded-xl p-1 border border-border">
          <button onClick={() => setView('list')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-primary text-white' : 'text-muted'}`}>
            ≡ Lista
          </button>
          <button onClick={() => setView('calendar')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${view === 'calendar' ? 'bg-primary text-white' : 'text-muted'}`}>
            ▦ Mes
          </button>
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
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-1 py-2 rounded-full text-xs font-semibold border transition-all ${
                  filter === f ? 'bg-primary/20 border-primary text-primary' : 'bg-surface2 border-border text-secondary'
                }`}>
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
                    <TransactionCard key={tx.id} transaction={tx} onClick={() => openDetail(tx)} />
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {view === 'calendar' && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center text-white text-lg">‹</button>
            <p className="text-white font-bold capitalize">{monthLabel}</p>
            <button onClick={nextMonth} className="w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center text-white text-lg">›</button>
          </div>

          <div className="card p-3 flex mb-4">
            {[
              { label: 'Ingresos', value: Object.values(dayMap).reduce((s, d) => s + d.income, 0), color: 'text-success', sign: '+' },
              { label: 'Gastos',   value: Object.values(dayMap).reduce((s, d) => s + d.expense, 0), color: 'text-primary', sign: '-' },
            ].map((item, i) => (
              <div key={item.label} className={`flex-1 text-center ${i > 0 ? 'border-l border-border' : ''}`}>
                <p className="text-muted text-[10px] mb-0.5">{item.label}</p>
                <p className={`text-sm font-bold ${item.color}`}>{item.sign}{formatCOP(item.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-bold text-muted py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {Array.from({ length: calDays.offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: calDays.total }).map((_, i) => {
              const day     = i + 1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const data      = dayMap[dateStr];
              const isToday   = dateStr === new Date().toISOString().slice(0, 10);
              const isSelected = selectedDay === dateStr;
              return (
                <button key={day} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all"
                  style={{
                    backgroundColor: isSelected ? '#DC2626' : isToday ? '#DC262622' : data ? '#ffffff08' : 'transparent',
                    border: isToday && !isSelected ? '1px solid #DC262655' : '1px solid transparent',
                  }}>
                  <span className={`text-xs font-bold leading-none ${isSelected ? 'text-white' : isToday ? 'text-primary' : data ? 'text-white' : 'text-muted'}`}>
                    {day}
                  </span>
                  {data && (
                    <div className="flex gap-0.5 mt-0.5">
                      {data.expense > 0 && <div className="w-1 h-1 rounded-full bg-primary" />}
                      {data.income > 0  && <div className="w-1 h-1 rounded-full bg-success" />}
                    </div>
                  )}
                  {data && !isSelected && (() => {
                    const net = data.income - data.expense;
                    return (
                      <span className={`text-[8px] leading-none mt-0.5 font-semibold ${net >= 0 ? 'text-success' : 'text-primary'}`}>
                        {net >= 0 ? '+' : '-'}{formatCOP(Math.abs(net))}
                      </span>
                    );
                  })()}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mb-6">
              <p className="text-white text-sm font-bold mb-2 capitalize">
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedTxs.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">Sin movimientos este día</p>
              ) : (
                selectedTxs.map((tx) => {
                  const info = resolveCategory(tx.category, customCategories);
                  return (
                    <button key={tx.id} onClick={() => openDetail(tx)}
                      className="w-full card p-3 mb-2 flex items-center gap-3 text-left active:opacity-70 transition-opacity">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: info.color + '22' }}>
                        {info.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate">{tx.description}</p>
                        <p className="text-muted text-xs">{info.name}</p>
                      </div>
                      <p className={`text-sm font-bold ${tx.type === 'expense' ? 'text-primary' : 'text-success'}`}>
                        {tx.type === 'expense' ? '-' : '+'}{formatCOP(tx.amount)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Transaction detail / edit modal ── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/70" onClick={closeDetail} />
          <div className="relative w-full bg-surface rounded-t-3xl border-t border-border slide-up max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-8">
              {!editing ? (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-5 mt-2">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                      style={{ backgroundColor: catInfo.color + '22' }}>
                      {catInfo.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-muted text-xs mb-0.5">{catInfo.name}</p>
                      <p className={`text-2xl font-black ${detail.type === 'expense' ? 'text-white' : 'text-success'}`}>
                        {detail.type === 'expense' ? '-' : '+'}{formatCOPFull(detail.amount)}
                      </p>
                    </div>
                    <button onClick={closeDetail}
                      className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-secondary text-sm flex-shrink-0">✕</button>
                  </div>

                  {/* Detail rows */}
                  <div className="card p-4 mb-4 space-y-3">
                    <DetailRow label="Descripción" value={detail.description} />
                    <DetailRow label="Fecha" value={new Date(detail.date + (detail.date.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />
                    {accountName && (
                      <DetailRow label="Cuenta" value={`${accountEmoji || ''} ${accountName}`} />
                    )}
                    {detail.note && <DetailRow label="Nota" value={detail.note} />}
                    {detail.rating !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-secondary text-xs font-semibold">Calificación</span>
                        <span className="text-sm" style={{ color: STAR_COLORS[detail.rating] }}>
                          {'★'.repeat(detail.rating)}{'☆'.repeat(5 - detail.rating)} {detail.rating}/5
                        </span>
                      </div>
                    )}
                    {detail.tags && detail.tags.filter((t) => !t.startsWith('sub:') && !t.startsWith('rec:')).length > 0 && (
                      <DetailRow label="Etiquetas" value={detail.tags.filter((t) => !t.startsWith('sub:') && !t.startsWith('rec:')).join(', ')} />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${detail.description}"?`)) { deleteTransaction(detail.id); closeDetail(); } }}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-primary border border-primary/40 bg-primary/10">
                      Eliminar
                    </button>
                    <button onClick={() => setEditing(true)} className="flex-[2] btn-primary py-3.5 text-sm">
                      Editar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <h2 className="text-xl font-bold text-white">Editar movimiento</h2>
                    <button onClick={() => setEditing(false)}
                      className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-secondary text-sm">✕</button>
                  </div>

                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="text-xs font-semibold text-secondary block mb-1.5">Descripción</label>
                      <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                        value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-secondary block mb-1.5">Monto (COP)</label>
                      <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-xl font-bold placeholder-muted"
                        value={editAmt} onChange={(e) => setEditAmt(e.target.value)} inputMode="numeric" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-secondary block mb-1.5">Cuenta</label>
                      <select className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm"
                        value={editAccountId || ''}
                        onChange={(e) => setEditAccountId(e.target.value || undefined)}>
                        <option value="">Sin cuenta</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-secondary block mb-1.5">Nota</label>
                      <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                        placeholder="Opcional" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-secondary block mb-2">Calificación</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setEditRating(editRating === s ? undefined : s)}
                            className="flex-1 py-2.5 rounded-xl text-lg transition-all"
                            style={{
                              backgroundColor: editRating !== undefined && s <= editRating ? '#DC262618' : '#1a1a1a',
                              border: editRating !== undefined && s <= editRating ? '1px solid #DC2626' : '1px solid #2a2a2a',
                              color: editRating !== undefined && s <= editRating ? STAR_COLORS[editRating] : '#555',
                            }}>
                            {editRating !== undefined && s <= editRating ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setEditing(false)}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-secondary border border-border bg-surface2">
                      Cancelar
                    </button>
                    <button onClick={saveEdit} className="flex-[2] btn-primary py-3.5 text-sm">
                      Guardar cambios
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-secondary text-xs font-semibold flex-shrink-0">{label}</span>
      <span className="text-white text-xs text-right">{value}</span>
    </div>
  );
}
