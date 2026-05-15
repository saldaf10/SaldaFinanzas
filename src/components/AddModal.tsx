'use client';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { getExpenseCategories, getIncomeCategories, getCategoryById } from '../utils/categories';
import { TransactionType } from '../types';
import { formatCOP } from '../utils/format';

const QUICK = [10000, 20000, 50000, 100000, 200000, 500000];

interface Props { open: boolean; onClose: () => void; }

export default function AddModal({ open, onClose }: Props) {
  const { addTransaction, subscriptions, accounts } = useStore();
  const activeSubs = subscriptions.filter((s) => s.active);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('other_expense');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [rating, setRating] = useState<number | undefined>();
  const [error, setError] = useState('');
  const [accountId, setAccountId] = useState<string>('');

  const categories = type === 'expense' ? getExpenseCategories() : getIncomeCategories();
  const selCat = getCategoryById(category);

  function reset() {
    setType('expense'); setAmount(''); setDesc(''); setCategory('other_expense');
    setNote(''); setDate(new Date().toISOString().slice(0, 10)); setRating(undefined); setError(''); setAccountId('');
  }

  function handleClose() { reset(); onClose(); }

  function handleTypeChange(t: TransactionType) {
    setType(t);
    setCategory(t === 'expense' ? 'other_expense' : 'other_income');
  }

  function handleSave() {
    const amt = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (!amt || amt <= 0) { setError('Monto inválido'); return; }
    if (!desc.trim()) { setError('Agrega una descripción'); return; }
    addTransaction({
      type, amount: amt, description: desc.trim(),
      category, date: date + 'T12:00:00.000Z',
      note: note.trim() || undefined,
      rating: type === 'expense' ? rating : undefined,
      accountId: accountId || undefined,
    });
    handleClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />

      <div className="relative w-full bg-surface rounded-t-3xl border-t border-border slide-up max-h-[92dvh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Nuevo movimiento</h2>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-secondary text-sm">✕</button>
          </div>

          {/* Type Toggle */}
          <div className="flex bg-surface2 rounded-2xl p-1 mb-4 border border-border">
            <button
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'expense' ? 'bg-primary text-white' : 'text-secondary'}`}
              onClick={() => handleTypeChange('expense')}
            >↓ Gasto</button>
            <button
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'income' ? 'bg-success text-white' : 'text-secondary'}`}
              onClick={() => handleTypeChange('income')}
            >↑ Ingreso</button>
          </div>

          {/* Account selector */}
          {accounts.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-secondary mb-2 block">
                {type === 'expense' ? '¿De qué cuenta sale?' : '¿A qué cuenta entra?'}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setAccountId(accountId === acc.id ? '' : acc.id)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                    style={accountId === acc.id
                      ? { backgroundColor: acc.color + '33', borderColor: acc.color, color: '#fff' }
                      : { backgroundColor: '#1a1a1a', borderColor: '#2a2a2a', color: '#888' }}
                  >
                    <span>{acc.emoji}</span>
                    <span>{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subscription quick picks */}
          {type === 'expense' && activeSubs.length > 0 && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-secondary mb-2 block">Suscripciones</label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activeSubs.map((sub) => {
                  const cat = getCategoryById(sub.category);
                  return (
                    <button
                      key={sub.id}
                      onClick={() => { setDesc(sub.name); setAmount(sub.amount.toString()); setCategory(sub.category); }}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                      style={desc === sub.name
                        ? { backgroundColor: '#DC262622', borderColor: '#DC2626', color: '#fff' }
                        : { backgroundColor: '#1a1a1a', borderColor: '#2a2a2a', color: '#888' }}
                    >
                      <span>{cat?.icon || '📱'}</span>
                      <span>{sub.name}</span>
                      <span className="text-[10px] opacity-70">{formatCOP(sub.amount)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick amounts */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-secondary mb-2 block">Montos rápidos</label>
            <div className="flex flex-wrap gap-2">
              {QUICK.map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(a.toString())}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${amount === a.toString() ? 'bg-primary/20 border-primary text-primary' : 'bg-surface2 border-border text-secondary'}`}
                >
                  ${a >= 1000 ? `${a / 1000}k` : a}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-muted text-lg font-semibold">COP $</span>
            <input
              className={`flex-1 text-4xl font-black bg-transparent outline-none ${type === 'expense' ? 'text-primary' : 'text-success'}`}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              type="text"
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-secondary mb-1.5 block">Descripción</label>
            <input
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              placeholder="Ej: Almuerzo, gasolina, nómina..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-secondary mb-1.5 block">Categoría</label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-xl border transition-all min-w-[64px] ${category === cat.id ? 'border-opacity-100' : 'bg-surface2 border-border'}`}
                  style={category === cat.id ? { backgroundColor: cat.color + '22', borderColor: cat.color } : {}}
                >
                  <span className="text-lg mb-1">{cat.icon}</span>
                  <span className="text-[9px] font-semibold" style={category === cat.id ? { color: cat.color } : { color: '#A0A0A0' }}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-secondary mb-1.5 block">Fecha</label>
            <input
              type="date"
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Note */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-secondary mb-1.5 block">Nota (opcional)</label>
            <textarea
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted resize-none h-16"
              placeholder="Agrega contexto..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Rating */}
          {type === 'expense' && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-secondary mb-1.5 block">¿Valió la pena?</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(rating === s ? undefined : s)} className="text-2xl">
                    <span style={{ color: rating !== undefined && rating >= s ? '#F59E0B' : '#444' }}>★</span>
                  </button>
                ))}
                {rating && (
                  <span className="text-xs text-secondary ml-1">
                    {['', 'Para nada', 'Poco', 'Regular', 'Sí', '¡Totalmente!'][rating]}
                  </span>
                )}
              </div>
            </div>
          )}

          {error && <p className="text-xs text-primary-light mb-3">{error}</p>}

          {/* Preview + Save */}
          <div className="flex items-center gap-3 bg-surface2 rounded-xl p-3 mb-4 border border-border">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: selCat?.color + '22' }}>
              {selCat?.icon || '📦'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{desc || 'Sin descripción'}</p>
              <p className="text-muted text-xs">{selCat?.name || 'Sin categoría'}</p>
            </div>
            <span className={`text-base font-black ${type === 'expense' ? 'text-primary' : 'text-success'}`}>
              {type === 'expense' ? '-' : '+'}${amount ? parseFloat(amount).toLocaleString('es-CO') : '0'}
            </span>
          </div>

          <button
            onClick={handleSave}
            className="w-full btn-primary text-base mb-2"
            style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}
          >
            Registrar {type === 'expense' ? 'gasto' : 'ingreso'}
          </button>
        </div>
      </div>
    </div>
  );
}
