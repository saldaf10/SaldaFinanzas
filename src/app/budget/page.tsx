'use client';
import { useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { getExpenseCategories } from '../../utils/categories';
import { resolveCategory } from '../../utils/categories';
import { formatCOPFull, formatCOP, getBudgetPeriod } from '../../utils/format';
import BudgetBar from '../../components/BudgetBar';

const PALETTE  = ['#4ADE80','#60A5FA','#FBBF24','#F472B6','#A78BFA','#FB923C','#38BDF8','#F87171','#34D399','#E879F9'];
const EMOJIS   = ['🎯','💡','🎮','🎬','✈️','🏃','📚','🍕','☕','🎵','🏠','💊','👗','🚀','🎁','⚽','🎸','🐕','💎','🎨','🧘','🎭','🛒','🌍'];

type Mode = 'predefined' | 'custom';

export default function Budget() {
  const { transactions, budgets, setBudget, deleteBudget, profile, customCategories, addCustomCategory, deleteCustomCategory } = useStore();

  const period = getBudgetPeriod(profile.budgetResetDay ?? 5);

  const breakdown = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type !== 'expense') return;
      const d = t.date.slice(0, 10);
      if (d >= period.start && d <= period.end) m[t.category] = (m[t.category] || 0) + t.amount;
    });
    return m;
  }, [transactions, period.start, period.end]);

  const monthBudgets = budgets.filter((b) => b.month === period.monthKey);
  const predefinedCats = getExpenseCategories();

  const [showAdd, setShowAdd]   = useState(false);
  const [mode, setMode]         = useState<Mode>('predefined');
  const [selCat, setSelCat]     = useState('food');
  const [budgetAmt, setBudgetAmt] = useState('');
  // Custom form
  const [custName,  setCustName]  = useState('');
  const [custEmoji, setCustEmoji] = useState(EMOJIS[0]);
  const [custColor, setCustColor] = useState(PALETTE[0]);

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent  = monthBudgets.reduce((s, b) => s + (breakdown[b.categoryId] || 0), 0);

  function resetForm() {
    setBudgetAmt(''); setMode('predefined'); setSelCat('food');
    setCustName(''); setCustEmoji(EMOJIS[0]); setCustColor(PALETTE[0]);
  }

  function handleSave() {
    const amt = parseFloat(budgetAmt.replace(/\./g, ''));
    if (!amt || amt <= 0) return;

    if (mode === 'custom') {
      if (!custName.trim()) return;
      const id = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      addCustomCategory({ id, name: custName.trim(), emoji: custEmoji, color: custColor });
      setBudget({ categoryId: id, amount: amt, month: period.monthKey });
    } else {
      setBudget({ categoryId: selCat, amount: amt, month: period.monthKey });
    }
    resetForm();
    setShowAdd(false);
  }

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Presupuesto</h1>
          <p className="text-muted text-xs mt-0.5">{period.label}</p>
        </div>
        <button onClick={() => { resetForm(); setShowAdd(!showAdd); }}
          className="bg-primary/20 border border-primary/50 text-primary text-xs font-bold px-4 py-2 rounded-full">
          {showAdd ? 'Cancelar' : '+ Añadir'}
        </button>
      </div>

      {/* Summary */}
      {monthBudgets.length > 0 && (
        <div className="mx-4 mb-3 card p-4 flex">
          {[
            { label: 'Presupuestado', value: formatCOPFull(totalBudget), color: 'text-white' },
            { label: 'Gastado', value: formatCOPFull(totalSpent), color: totalSpent > totalBudget ? 'text-primary' : 'text-white' },
            { label: 'Disponible', value: formatCOPFull(totalBudget - totalSpent), color: totalBudget - totalSpent < 0 ? 'text-primary' : 'text-success' },
          ].map((item, i) => (
            <div key={item.label} className={`flex-1 text-center ${i > 0 ? 'border-l border-border' : ''}`}>
              <p className="text-muted text-[10px] mb-0.5">{item.label}</p>
              <p className={`text-xs font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="mx-4 mb-3 card p-4">
          {/* Mode toggle */}
          <div className="flex bg-surface2 rounded-xl p-1 mb-4 border border-border">
            <button
              onClick={() => setMode('predefined')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'predefined' ? 'bg-primary text-white' : 'text-secondary'}`}
            >Categoría existente</button>
            <button
              onClick={() => setMode('custom')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'custom' ? 'bg-primary text-white' : 'text-secondary'}`}
            >+ Personalizada</button>
          </div>

          {mode === 'predefined' ? (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {predefinedCats.map((cat) => (
                <button key={cat.id} onClick={() => setSelCat(cat.id)}
                  className="flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-xl border min-w-[60px] transition-all"
                  style={selCat === cat.id
                    ? { backgroundColor: cat.color + '22', borderColor: cat.color }
                    : { backgroundColor: '#181818', borderColor: '#2A2A2A' }}>
                  <span className="text-lg mb-1">{cat.icon}</span>
                  <span className="text-[9px] font-semibold" style={selCat === cat.id ? { color: cat.color } : { color: '#A0A0A0' }}>
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-3 space-y-3">
              {/* Name */}
              <input
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                placeholder="Nombre del presupuesto (ej: Salidas, Caprichos…)"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                autoFocus
              />
              {/* Emoji */}
              <div>
                <p className="text-secondary text-[10px] font-semibold mb-1.5">Ícono</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setCustEmoji(e)}
                      className="w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all"
                      style={{ backgroundColor: custEmoji === e ? custColor + '44' : '#1a1a1a', border: custEmoji === e ? `2px solid ${custColor}` : '2px solid transparent' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              {/* Color */}
              <div>
                <p className="text-secondary text-[10px] font-semibold mb-1.5">Color</p>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map((c) => (
                    <button key={c} onClick={() => setCustColor(c)}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{ backgroundColor: c, border: custColor === c ? '2px solid white' : '2px solid transparent' }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <input
            className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-xl font-bold placeholder-muted mb-3"
            placeholder="Monto límite"
            value={budgetAmt}
            onChange={(e) => setBudgetAmt(e.target.value)}
            inputMode="numeric"
          />
          <button onClick={handleSave} className="w-full btn-primary text-sm">Guardar presupuesto</button>
        </div>
      )}

      {/* Budget list */}
      <div className="px-4">
        {monthBudgets.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center py-16 px-6">
            <span className="text-5xl mb-4">🎯</span>
            <p className="text-white text-base font-bold mb-2">Sin presupuestos</p>
            <p className="text-muted text-sm text-center mb-6">Define límites por categoría o crea los tuyos propios.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-6">Crear primer presupuesto</button>
          </div>
        ) : (
          <>
            {monthBudgets.map((b) => {
              const info = resolveCategory(b.categoryId, customCategories);
              return (
                <BudgetBar
                  key={b.categoryId}
                  categoryId={b.categoryId}
                  budget={b.amount}
                  spent={breakdown[b.categoryId] || 0}
                  name={info.name}
                  icon={info.icon}
                  color={info.color}
                  onDelete={() => { if (confirm('¿Eliminar este presupuesto?')) deleteBudget(b.categoryId, period.monthKey); }}
                />
              );
            })}

            {/* Unbudgeted categories with spending */}
            {Object.entries(breakdown)
              .filter(([catId]) => !monthBudgets.find((b) => b.categoryId === catId) && breakdown[catId] > 0)
              .map(([catId]) => {
                const info = resolveCategory(catId, customCategories);
                return (
                  <button key={catId}
                    onClick={() => { setSelCat(catId); setMode('predefined'); setShowAdd(true); }}
                    className="w-full flex justify-between items-center card2 p-3 mb-2 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-secondary text-sm">{info.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-semibold">{formatCOP(breakdown[catId])}</span>
                      <span className="text-primary text-xs font-bold">+ presupuesto →</span>
                    </div>
                  </button>
                );
              })}

            {/* Custom categories management */}
            {customCategories.length > 0 && (
              <div className="mt-4 mb-2">
                <p className="text-muted text-xs font-bold uppercase tracking-wide mb-2">Categorías creadas</p>
                {customCategories.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 card p-3 mb-2">
                    <span className="text-xl">{c.emoji}</span>
                    <span className="flex-1 text-white text-sm font-semibold">{c.name}</span>
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <button onClick={() => { if (confirm(`¿Eliminar categoría "${c.name}"?`)) deleteCustomCategory(c.id); }}
                      className="text-muted text-xs ml-1 active:text-primary">✕</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
