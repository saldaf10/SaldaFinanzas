'use client';
import { useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { useStore } from '../store/useStore';
import { Account, AccountType } from '../types';
import { formatCOP, formatCOPFull, getBudgetPeriod } from '../utils/format';
import { getCategoryById } from '../utils/categories';
import { computeAccountBalance } from '../utils/calculations';

const PALETTE = ['#4ADE80','#60A5FA','#FBBF24','#F472B6','#A78BFA','#FB923C','#38BDF8','#F87171','#34D399','#E879F9'];
const EMOJIS  = ['🏦','💳','💰','🪙','💵','🏧','💼','🐷','📱','💹'];

interface AccountForm { name: string; balance: string; color: string; emoji: string; }
interface ModalState  { open: boolean; type: AccountType; editId?: string; }
const EMPTY_FORM: AccountForm = { name: '', balance: '', color: PALETTE[0], emoji: EMOJIS[0] };
const CLOSED: ModalState = { open: false, type: 'bank' };

export default function Dashboard() {
  const { accounts, addAccount, updateAccount, deleteAccount, receivables, budgets, transactions, profile } = useStore();

  const [modal, setModal] = useState<ModalState>(CLOSED);
  const [form, setForm]   = useState<AccountForm>(EMPTY_FORM);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const banks   = accounts.filter((a) => a.type === 'bank');
  const debts   = accounts.filter((a) => a.type === 'debt');
  const pending = receivables.filter((r) => !r.paid);

  const bankBalances = useMemo(() => Object.fromEntries(banks.map((a) => [a.id, computeAccountBalance(a, transactions)])), [banks, transactions]);
  const debtBalances = useMemo(() => Object.fromEntries(debts.map((a) => [a.id, computeAccountBalance(a, transactions)])), [debts, transactions]);

  const totalBanks       = Object.values(bankBalances).reduce((s, b) => s + b, 0);
  const totalDebts       = Object.values(debtBalances).reduce((s, b) => s + Math.abs(b), 0); // debts stored negative
  const totalReceivables = pending.reduce((s, r) => s + r.amount, 0);
  const netCapital       = totalBanks - totalDebts;

  const period = getBudgetPeriod(profile.budgetResetDay ?? 5);
  const periodBudgets = budgets.filter((b) => b.month === period.monthKey);
  const totalBudgeted = periodBudgets.reduce((s, b) => s + b.amount, 0);
  const leftover = totalBanks - totalBudgeted;

  const catSpent = useMemo(() => {
    const m: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type !== 'expense') return;
      const d = t.date.slice(0, 10);
      if (d >= period.start && d <= period.end) m[t.category] = (m[t.category] || 0) + t.amount;
    });
    return m;
  }, [transactions, period.start, period.end]);

  function openAdd(type: AccountType) {
    setForm(EMPTY_FORM);
    setModal({ open: true, type });
  }
  function openEdit(a: Account) {
    const computed = computeAccountBalance(a, transactions);
    const displayBal = a.type === 'debt' ? Math.abs(computed).toString() : computed.toString();
    setForm({ name: a.name, balance: displayBal, color: a.color, emoji: a.emoji });
    setModal({ open: true, type: a.type, editId: a.id });
  }
  function handleSave() {
    const raw = parseFloat(form.balance.replace(/\./g, '').replace(',', '.'));
    if (!form.name.trim() || isNaN(raw)) return;
    // For debts: store negative initialBalance; for banks: positive
    const initBal = modal.type === 'debt' ? -raw : raw;
    if (modal.editId) {
      // When editing, adjust initialBalance so that the new computed balance equals what the user entered
      const txContrib = transactions
        .filter((t) => t.accountId === modal.editId)
        .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
      const newInitial = modal.type === 'debt' ? (-raw - txContrib) : (raw - txContrib);
      updateAccount(modal.editId, { name: form.name.trim(), initialBalance: newInitial, color: form.color, emoji: form.emoji });
    } else {
      addAccount({ name: form.name.trim(), type: modal.type, initialBalance: initBal, color: form.color, emoji: form.emoji });
    }
    setModal(CLOSED);
  }

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <p className="text-secondary text-sm">{greeting}, <span className="text-white font-bold">{profile.name}</span> 👋</p>
      </div>

      {/* Onboarding banner */}
      {accounts.length === 0 && (
        <div className="mx-4 mb-4 rounded-2xl border border-primary/30 p-5" style={{ backgroundColor: '#1A0505' }}>
          <p className="text-primary text-xs font-bold mb-1">Para empezar</p>
          <p className="text-white font-bold text-base mb-1">Registra tu capital actual</p>
          <p className="text-secondary text-xs leading-relaxed">Agrega las cuentas donde tienes tu plata (Nu, Bancolombia, efectivo…) y lo que debes. Así cada movimiento queda coordinado automáticamente.</p>
        </div>
      )}

      {/* ── Capital Neto Hero ── */}
      <div className="mx-4 mb-4 card p-5">
        <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-1">Capital Neto</p>
        <p className={`text-4xl font-black tracking-tight mb-4 ${netCapital < 0 ? 'text-primary' : 'text-white'}`}>
          {netCapital < 0 ? '-' : ''}{formatCOPFull(Math.abs(netCapital))}
        </p>
        <div className="flex gap-5">
          <div>
            <p className="text-[9px] text-muted mb-0.5">Activo</p>
            <p className="text-success text-sm font-bold">{formatCOP(totalBanks)}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted mb-0.5">Deudas</p>
            <p className="text-primary text-sm font-bold">-{formatCOP(totalDebts)}</p>
          </div>
          {totalReceivables > 0 && (
            <div>
              <p className="text-[9px] text-muted mb-0.5">Me deben</p>
              <p className="text-blue-400 text-sm font-bold">+{formatCOP(totalReceivables)}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Mi plata ── */}
      <SectionHead title="Mi plata" onAdd={() => openAdd('bank')} />
      <div className="px-4 mb-4">
        {banks.length === 0 ? (
          <button onClick={() => openAdd('bank')} className="w-full card2 border-dashed p-5 flex flex-col items-center gap-1">
            <span className="text-2xl">🏦</span>
            <p className="text-muted text-xs">Agrega tu primera cuenta o efectivo</p>
          </button>
        ) : (
          <>
            {banks.map((a) => (
              <AccountRow key={a.id} account={a} balance={bankBalances[a.id]} onEdit={() => openEdit(a)} />
            ))}
            <div className="flex justify-between px-1 mt-1.5">
              <span className="text-[10px] text-muted">Total activo</span>
              <span className="text-[10px] text-success font-bold">{formatCOPFull(totalBanks)}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Lo que debo ── */}
      <SectionHead title="Lo que debo" onAdd={() => openAdd('debt')} accent="#F87171" />
      <div className="px-4 mb-4">
        {debts.length === 0 ? (
          <button onClick={() => openAdd('debt')} className="w-full card2 border-dashed p-5 flex flex-col items-center gap-1 opacity-50">
            <span className="text-2xl">💳</span>
            <p className="text-muted text-xs">Sin deudas registradas</p>
          </button>
        ) : (
          <>
            {debts.map((a) => (
              <AccountRow key={a.id} account={a} balance={debtBalances[a.id]} onEdit={() => openEdit(a)} negative />
            ))}
            <div className="flex justify-between px-1 mt-1.5">
              <span className="text-[10px] text-muted">Total deudas</span>
              <span className="text-[10px] text-primary font-bold">-{formatCOPFull(totalDebts)}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Me deben ── */}
      {pending.length > 0 && (
        <>
          <SectionHead title="Me deben" accent="#60A5FA" />
          <div className="px-4 mb-4">
            {pending.map((r) => (
              <div key={r.id} className="card p-3 mb-2 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#60A5FA22' }}>💸</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{r.personName}</p>
                  <p className="text-muted text-xs truncate">{r.description}</p>
                </div>
                <p className="text-blue-400 text-sm font-bold">+{formatCOP(r.amount)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Presupuesto del período ── */}
      <div className="mx-4 mb-8">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-white text-sm font-bold">Presupuesto</p>
          <p className="text-muted text-[10px]">{period.label}</p>
        </div>

        {periodBudgets.length === 0 ? (
          <div className="card2 border-dashed p-5 flex flex-col items-center gap-1">
            <span className="text-2xl">🎯</span>
            <p className="text-muted text-xs text-center">Ve a Presupuesto para definir límites por categoría</p>
          </div>
        ) : (
          <div className="card p-4">
            <div className="flex justify-between items-baseline mb-3">
              <p className="text-muted text-[10px]">Capital base</p>
              <p className="text-white text-xs font-bold">{formatCOPFull(totalBanks)}</p>
            </div>

            {totalBanks > 0 && (
              <div className="h-2.5 rounded-full overflow-hidden flex mb-4 gap-px" style={{ backgroundColor: '#111' }}>
                {periodBudgets.map((b) => {
                  const cat = getCategoryById(b.categoryId);
                  const w = Math.min((b.amount / totalBanks) * 100, 100);
                  return w > 0 ? <div key={b.categoryId} style={{ width: `${w}%`, backgroundColor: cat?.color || '#666' }} /> : null;
                })}
                {leftover > 0 && <div style={{ flex: 1, backgroundColor: '#2A2A2A' }} />}
              </div>
            )}

            {periodBudgets.map((b) => {
              const cat = getCategoryById(b.categoryId);
              const spent = catSpent[b.categoryId] || 0;
              const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
              const over = spent > b.amount;
              return (
                <div key={b.categoryId} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-secondary">{cat?.icon} {cat?.name}</span>
                    <span className={`text-[10px] font-semibold ${over ? 'text-primary' : 'text-muted'}`}>
                      {formatCOP(spent)} / {formatCOP(b.amount)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: over ? '#DC2626' : (cat?.color || '#666') }} />
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
              <p className="text-secondary text-xs">Proyectado libre</p>
              <p className={`text-base font-black ${leftover < 0 ? 'text-primary' : 'text-success'}`}>
                {leftover < 0 ? '-' : '+'}{formatCOPFull(Math.abs(leftover))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Account Modal ── */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setModal(CLOSED)} />
          <div className="relative w-full bg-surface rounded-t-3xl border-t border-border slide-up max-h-[88dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="px-4 pb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">
                  {modal.editId ? 'Editar' : modal.type === 'bank' ? 'Nueva cuenta' : 'Nueva deuda'}
                </h2>
                <button onClick={() => setModal(CLOSED)} className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-secondary text-sm">✕</button>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-secondary mb-2 block">Ícono</label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all"
                      style={{ backgroundColor: form.emoji === e ? '#ffffff22' : 'transparent', border: form.emoji === e ? '1px solid #555' : '1px solid transparent' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-secondary mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PALETTE.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-all"
                      style={{ backgroundColor: c, border: form.color === c ? '2px solid white' : '2px solid transparent' }} />
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-secondary mb-1.5 block">Nombre</label>
                <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                  placeholder={modal.type === 'bank' ? 'Ej: Nu, Bancolombia, Efectivo...' : 'Ej: Tarjeta Nu, Préstamo...'}
                  value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-secondary mb-1.5 block">
                  {modal.type === 'bank' ? 'Saldo actual (COP)' : '¿Cuánto debes? (COP)'}
                </label>
                <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-2xl font-black placeholder-muted"
                  placeholder="0" inputMode="numeric"
                  value={form.balance} onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))} />
              </div>

              <div className="flex gap-2">
                {modal.editId && (
                  <button onClick={() => { if (confirm('¿Eliminar esta cuenta?')) { deleteAccount(modal.editId!); setModal(CLOSED); } }}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-primary border border-primary/40 bg-primary/10">
                    Eliminar
                  </button>
                )}
                <button onClick={handleSave} className="flex-[2] btn-primary py-3.5 text-base">
                  {modal.editId ? 'Guardar' : modal.type === 'bank' ? 'Agregar cuenta' : 'Agregar deuda'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function SectionHead({ title, onAdd, accent }: { title: string; onAdd?: () => void; accent?: string }) {
  return (
    <div className="px-4 mb-2 flex items-center justify-between">
      <p className="text-sm font-bold" style={{ color: accent || '#fff' }}>{title}</p>
      {onAdd && (
        <button onClick={onAdd} className="text-xs font-bold px-3 py-1 rounded-full border"
          style={{ borderColor: accent ? accent + '55' : '#333', color: accent || '#aaa', backgroundColor: accent ? accent + '11' : 'transparent' }}>
          + Agregar
        </button>
      )}
    </div>
  );
}

function AccountRow({ account, balance, onEdit, negative }: { account: Account; balance: number; onEdit: () => void; negative?: boolean }) {
  const display = negative ? Math.abs(balance) : balance;
  const color   = negative ? '#F87171' : account.color;
  return (
    <button onClick={onEdit} className="w-full card p-3 mb-2 flex items-center gap-3 text-left active:scale-[0.99] transition-transform">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: account.color + '22' }}>
        {account.emoji}
      </div>
      <p className="flex-1 text-white text-sm font-semibold truncate">{account.name}</p>
      <p className="font-bold text-sm" style={{ color }}>
        {negative ? '-' : ''}{formatCOP(display)}
      </p>
      <span className="text-muted text-xs">›</span>
    </button>
  );
}
