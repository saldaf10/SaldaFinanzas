'use client';
import { useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { getExpenseCategories, getCategoryById } from '../../utils/categories';
import { getCategoryBreakdown } from '../../utils/calculations';
import { formatCOPFull, getMonthKey, getMonthLabel, formatCOP } from '../../utils/format';
import BudgetBar from '../../components/BudgetBar';

export default function Budget() {
  const { transactions, budgets, setBudget, deleteBudget } = useStore();
  const monthKey = getMonthKey();
  const breakdown = useMemo(() => getCategoryBreakdown(transactions, 'expense', monthKey), [transactions, monthKey]);
  const monthBudgets = budgets.filter((b) => b.month === monthKey);
  const categories = getExpenseCategories();

  const [showAdd, setShowAdd] = useState(false);
  const [selCat, setSelCat] = useState('food');
  const [budgetAmt, setBudgetAmt] = useState('');

  const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = monthBudgets.reduce((s, b) => s + (breakdown[b.categoryId]?.amount || 0), 0);

  function handleSave() {
    const amt = parseFloat(budgetAmt.replace(/\./g, ''));
    if (!amt || amt <= 0) return;
    setBudget({ categoryId: selCat, amount: amt, month: monthKey });
    setBudgetAmt('');
    setShowAdd(false);
  }

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">Presupuesto</h1>
          <p className="text-muted text-xs mt-0.5 capitalize">{getMonthLabel(monthKey)}</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-primary/20 border border-primary/50 text-primary text-xs font-bold px-4 py-2 rounded-full"
        >
          + Añadir
        </button>
      </div>

      {/* Summary */}
      {monthBudgets.length > 0 && (
        <div className="mx-4 mb-3 card p-4 flex">
          {[
            { label: 'Total', value: formatCOPFull(totalBudget), color: 'text-white' },
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

      {/* Add Budget */}
      {showAdd && (
        <div className="mx-4 mb-3 card p-4">
          <p className="text-white text-sm font-bold mb-3">Nuevo presupuesto</p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelCat(cat.id)}
                className="flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-xl border min-w-[60px] transition-all"
                style={selCat === cat.id
                  ? { backgroundColor: cat.color + '22', borderColor: cat.color }
                  : { backgroundColor: '#181818', borderColor: '#2A2A2A' }
                }
              >
                <span className="text-lg mb-1">{cat.icon}</span>
                <span className="text-[9px] font-semibold" style={selCat === cat.id ? { color: cat.color } : { color: '#A0A0A0' }}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
          <input
            className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-xl font-bold placeholder-muted mb-3"
            placeholder="Monto límite"
            value={budgetAmt}
            onChange={(e) => setBudgetAmt(e.target.value)}
            inputMode="numeric"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 btn-ghost text-sm">Cancelar</button>
            <button onClick={handleSave} className="flex-[2] btn-primary text-sm">Guardar</button>
          </div>
        </div>
      )}

      {/* Budget list */}
      <div className="px-4">
        {monthBudgets.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center py-16 px-6">
            <span className="text-5xl mb-4">🎯</span>
            <p className="text-white text-base font-bold mb-2">Sin presupuestos</p>
            <p className="text-muted text-sm text-center mb-6">Define cuánto quieres gastar por categoría.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm px-6">
              Crear primer presupuesto
            </button>
          </div>
        ) : (
          <>
            {monthBudgets.map((b) => (
              <BudgetBar
                key={b.categoryId}
                categoryId={b.categoryId}
                budget={b.amount}
                spent={breakdown[b.categoryId]?.amount || 0}
                onDelete={() => { if (confirm('¿Eliminar este presupuesto?')) deleteBudget(b.categoryId, monthKey); }}
              />
            ))}

            {/* Unbudgeted categories */}
            {Object.entries(breakdown)
              .filter(([catId]) => !monthBudgets.find((b) => b.categoryId === catId) && breakdown[catId].amount > 0)
              .map(([catId, data]) => (
                <button
                  key={catId}
                  onClick={() => { setSelCat(catId); setShowAdd(true); }}
                  className="w-full flex justify-between items-center card2 p-3 mb-2 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryById(catId)?.icon || '📦'}</span>
                    <span className="text-secondary text-sm">{getCategoryById(catId)?.name || catId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-semibold">{formatCOP(data.amount)}</span>
                    <span className="text-primary text-xs font-bold">+ presupuesto →</span>
                  </div>
                </button>
              ))}
          </>
        )}
      </div>
    </Layout>
  );
}
