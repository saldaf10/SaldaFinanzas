'use client';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { PaymentSource, Subscription, Receivable } from '../../types';
import { getExpenseCategories, getCategoryById } from '../../utils/categories';
import { formatCOP, formatCOPFull } from '../../utils/format';

const SOURCES: { id: PaymentSource; label: string; color: string; textDark?: boolean }[] = [
  { id: 'nu', label: 'Nu', color: '#820AD1' },
  { id: 'hapi', label: 'Hapi', color: '#00B050' },
  { id: 'bancolombia', label: 'Bancolombia', color: '#FDDA24', textDark: true },
];

const getSource = (id: PaymentSource) => SOURCES.find((s) => s.id === id)!;

function SourceBadge({ source }: { source: PaymentSource }) {
  const s = getSource(source);
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.color + '33', color: s.color }}
    >
      {s.label}
    </span>
  );
}

type Tab = 'subs' | 'medeben';

interface SubFormState {
  name: string; amount: string; dayOfMonth: string;
  paymentSource: PaymentSource; category: string; note: string;
}

interface RecFormState {
  personName: string; description: string; amount: string; dueDate: string;
}

export default function Subscriptions() {
  const {
    subscriptions, receivables,
    addSubscription, updateSubscription, deleteSubscription,
    addReceivable, markReceivablePaid, deleteReceivable,
    applyMonthlySubscriptions,
  } = useStore();

  const [tab, setTab] = useState<Tab>('subs');
  const [showSubModal, setShowSubModal] = useState(false);
  const [showRecModal, setShowRecModal] = useState(false);
  const [subError, setSubError] = useState('');
  const [recError, setRecError] = useState('');

  const [subForm, setSubForm] = useState<SubFormState>({
    name: '', amount: '', dayOfMonth: '1',
    paymentSource: 'nu', category: 'subscriptions', note: '',
  });
  const [recForm, setRecForm] = useState<RecFormState>({
    personName: '', description: '', amount: '', dueDate: '',
  });

  useEffect(() => { applyMonthlySubscriptions(); }, []);

  const expenseCategories = getExpenseCategories();

  const totalActiveSubs = subscriptions
    .filter((s) => s.active)
    .reduce((acc, s) => acc + s.amount, 0);

  const totalMeDeben = receivables
    .filter((r) => !r.paid)
    .reduce((acc, r) => acc + r.amount, 0);

  function resetSubForm() {
    setSubForm({ name: '', amount: '', dayOfMonth: '1', paymentSource: 'nu', category: 'subscriptions', note: '' });
    setSubError('');
  }
  function resetRecForm() {
    setRecForm({ personName: '', description: '', amount: '', dueDate: '' });
    setRecError('');
  }

  function handleSaveSub() {
    const amt = parseFloat(subForm.amount.replace(/\./g, '').replace(',', '.'));
    const day = parseInt(subForm.dayOfMonth);
    if (!subForm.name.trim()) { setSubError('Agrega el nombre'); return; }
    if (!amt || amt <= 0) { setSubError('Monto inválido'); return; }
    if (!day || day < 1 || day > 31) { setSubError('Día inválido (1-31)'); return; }
    addSubscription({
      name: subForm.name.trim(), amount: amt, dayOfMonth: day,
      paymentSource: subForm.paymentSource, category: subForm.category,
      active: true, note: subForm.note.trim() || undefined,
    });
    applyMonthlySubscriptions();
    resetSubForm();
    setShowSubModal(false);
  }

  function handleSaveRec() {
    const amt = parseFloat(recForm.amount.replace(/\./g, '').replace(',', '.'));
    if (!recForm.personName.trim()) { setRecError('Agrega el nombre'); return; }
    if (!recForm.description.trim()) { setRecError('Agrega una descripción'); return; }
    if (!amt || amt <= 0) { setRecError('Monto inválido'); return; }
    addReceivable({
      personName: recForm.personName.trim(), description: recForm.description.trim(),
      amount: amt, dueDate: recForm.dueDate || undefined,
      createdDate: new Date().toISOString().slice(0, 10), paid: false,
    });
    resetRecForm();
    setShowRecModal(false);
  }

  const subsGrouped = SOURCES.map((src) => ({
    source: src,
    items: subscriptions.filter((s) => s.paymentSource === src.id),
  })).filter((g) => g.items.length > 0);

  const pendingRec = receivables.filter((r) => !r.paid);
  const paidRec = receivables.filter((r) => r.paid);

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-black text-white">Recurrentes</h1>
      </div>

      {/* Tab switcher */}
      <div className="px-4 mb-4">
        <div className="flex bg-surface2 rounded-2xl p-1 border border-border">
          <button
            onClick={() => setTab('subs')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'subs' ? 'bg-primary text-white' : 'text-secondary'}`}
          >
            🔄 Suscripciones
          </button>
          <button
            onClick={() => setTab('medeben')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'medeben' ? 'bg-success text-white' : 'text-secondary'}`}
          >
            💸 Me deben
          </button>
        </div>
      </div>

      {tab === 'subs' && (
        <>
          {/* Summary */}
          <div className="mx-4 mb-4 card p-4">
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-1">Total mensual</p>
            <p className="text-3xl font-black text-white">{formatCOPFull(totalActiveSubs)}</p>
            <p className="text-muted text-xs mt-1">{subscriptions.filter((s) => s.active).length} activas · {subscriptions.filter((s) => !s.active).length} pausadas</p>
            <div className="flex gap-2 mt-3">
              {SOURCES.map((src) => {
                const srcTotal = subscriptions.filter((s) => s.paymentSource === src.id && s.active).reduce((a, s) => a + s.amount, 0);
                if (srcTotal === 0) return null;
                return (
                  <div key={src.id} className="flex-1 rounded-xl p-2 text-center" style={{ backgroundColor: src.color + '22' }}>
                    <p className="text-[9px] font-bold mb-0.5" style={{ color: src.color }}>{src.label}</p>
                    <p className="text-white text-xs font-bold">{formatCOP(srcTotal)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Groups */}
          {subsGrouped.length === 0 ? (
            <div className="mx-4 card2 p-10 flex flex-col items-center border-dashed">
              <span className="text-4xl mb-3">🔄</span>
              <p className="text-white text-sm font-bold mb-1">Sin suscripciones</p>
              <p className="text-muted text-xs text-center">Agrega Netflix, Spotify, gym… y se cobran solos cada mes</p>
            </div>
          ) : (
            subsGrouped.map(({ source, items }) => (
              <div key={source.id} className="mx-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                  <p className="text-white text-sm font-bold">{source.label}</p>
                  <span className="text-muted text-xs">· {formatCOP(items.filter((s) => s.active).reduce((a, s) => a + s.amount, 0))}/mes</span>
                </div>
                {items.map((sub) => <SubCard key={sub.id} sub={sub} onToggle={() => updateSubscription(sub.id, { active: !sub.active })} onDelete={() => { if (confirm(`¿Eliminar "${sub.name}"?`)) deleteSubscription(sub.id); }} />)}
              </div>
            ))
          )}

          <div className="px-4 mb-6">
            <button
              onClick={() => { resetSubForm(); setShowSubModal(true); }}
              className="w-full btn-primary"
            >
              + Agregar suscripción
            </button>
          </div>
        </>
      )}

      {tab === 'medeben' && (
        <>
          {/* Summary */}
          <div className="mx-4 mb-4 card p-4">
            <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-1">Total pendiente</p>
            <p className="text-3xl font-black text-success">{formatCOPFull(totalMeDeben)}</p>
            <p className="text-muted text-xs mt-1">{pendingRec.length} pendientes · {paidRec.length} cobradas</p>
          </div>

          {/* Pending */}
          {pendingRec.length === 0 ? (
            <div className="mx-4 card2 p-10 flex flex-col items-center border-dashed mb-4">
              <span className="text-4xl mb-3">💸</span>
              <p className="text-white text-sm font-bold mb-1">Nadie te debe nada</p>
              <p className="text-muted text-xs text-center">Registra plata que te prestan o te deben</p>
            </div>
          ) : (
            <div className="mx-4 mb-4 space-y-2">
              {pendingRec.map((rec) => (
                <RecCard key={rec.id} rec={rec}
                  onPaid={() => { if (confirm(`¿Marcar como cobrada la deuda de ${rec.personName}?`)) markReceivablePaid(rec.id); }}
                  onDelete={() => { if (confirm(`¿Eliminar deuda de ${rec.personName}?`)) deleteReceivable(rec.id); }}
                />
              ))}
            </div>
          )}

          {/* Paid */}
          {paidRec.length > 0 && (
            <div className="mx-4 mb-4">
              <p className="text-muted text-xs font-bold uppercase tracking-wide mb-2">Ya cobradas</p>
              {paidRec.map((rec) => (
                <div key={rec.id} className="card p-3 mb-2 flex items-center gap-3 opacity-50">
                  <span className="text-lg">✅</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{rec.personName}</p>
                    <p className="text-muted text-xs truncate">{rec.description}</p>
                  </div>
                  <p className="text-success text-sm font-bold">{formatCOP(rec.amount)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 mb-6">
            <button
              onClick={() => { resetRecForm(); setShowRecModal(true); }}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all"
              style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }}
            >
              + Registrar deuda
            </button>
          </div>
        </>
      )}

      {/* Add Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowSubModal(false); resetSubForm(); }} />
          <div className="relative w-full bg-surface rounded-t-3xl border-t border-border slide-up max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Nueva suscripción</h2>
                <button onClick={() => { setShowSubModal(false); resetSubForm(); }} className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-secondary text-sm">✕</button>
              </div>

              {/* Payment source */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-secondary mb-2 block">¿Con qué pagas?</label>
                <div className="flex gap-2">
                  {SOURCES.map((src) => (
                    <button
                      key={src.id}
                      onClick={() => setSubForm((f) => ({ ...f, paymentSource: src.id }))}
                      className="flex-1 py-3 rounded-xl font-bold text-sm transition-all border"
                      style={subForm.paymentSource === src.id
                        ? { backgroundColor: src.color + '33', borderColor: src.color, color: src.color }
                        : { backgroundColor: 'transparent', borderColor: '#333', color: '#666' }}
                    >
                      {src.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-secondary mb-1.5 block">Nombre</label>
                <input
                  className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                  placeholder="Ej: Netflix, Spotify, Gym..."
                  value={subForm.name}
                  onChange={(e) => setSubForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Amount + Day */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-secondary mb-1.5 block">Monto (COP)</label>
                  <input
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                    placeholder="0"
                    inputMode="numeric"
                    value={subForm.amount}
                    onChange={(e) => setSubForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div style={{ width: 100 }}>
                  <label className="text-xs font-semibold text-secondary mb-1.5 block">Día cobro</label>
                  <input
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted text-center"
                    placeholder="1"
                    inputMode="numeric"
                    value={subForm.dayOfMonth}
                    onChange={(e) => setSubForm((f) => ({ ...f, dayOfMonth: e.target.value }))}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-3">
                <label className="text-xs font-semibold text-secondary mb-1.5 block">Categoría</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {expenseCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSubForm((f) => ({ ...f, category: cat.id }))}
                      className="flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-xl border transition-all min-w-[64px]"
                      style={subForm.category === cat.id ? { backgroundColor: cat.color + '22', borderColor: cat.color } : { backgroundColor: '#1a1a1a', borderColor: '#333' }}
                    >
                      <span className="text-lg mb-1">{cat.icon}</span>
                      <span className="text-[9px] font-semibold" style={subForm.category === cat.id ? { color: cat.color } : { color: '#666' }}>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-secondary mb-1.5 block">Nota (opcional)</label>
                <input
                  className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                  placeholder="Ej: Plan familia"
                  value={subForm.note}
                  onChange={(e) => setSubForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>

              {subError && <p className="text-xs text-primary-light mb-3">{subError}</p>}

              <button onClick={handleSaveSub} className="w-full btn-primary text-base">
                Agregar suscripción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Receivable Modal */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => { setShowRecModal(false); resetRecForm(); }} />
          <div className="relative w-full bg-surface rounded-t-3xl border-t border-border slide-up max-h-[92dvh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="px-4 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">¿Quién te debe?</h2>
                <button onClick={() => { setShowRecModal(false); resetRecForm(); }} className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-secondary text-sm">✕</button>
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-secondary mb-1.5 block">Nombre</label>
                <input
                  className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                  placeholder="Ej: Juan, Mamá, Cliente..."
                  value={recForm.personName}
                  onChange={(e) => setRecForm((f) => ({ ...f, personName: e.target.value }))}
                />
              </div>

              <div className="mb-3">
                <label className="text-xs font-semibold text-secondary mb-1.5 block">¿Por qué?</label>
                <input
                  className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                  placeholder="Ej: Cena del viernes, préstamo..."
                  value={recForm.description}
                  onChange={(e) => setRecForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-secondary mb-1.5 block">Monto (COP)</label>
                  <input
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
                    placeholder="0"
                    inputMode="numeric"
                    value={recForm.amount}
                    onChange={(e) => setRecForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-secondary mb-1.5 block">¿Cuándo? (opcional)</label>
                  <input
                    type="date"
                    className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm"
                    value={recForm.dueDate}
                    onChange={(e) => setRecForm((f) => ({ ...f, dueDate: e.target.value }))}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>

              {recError && <p className="text-xs text-primary-light mb-3">{recError}</p>}

              <button
                onClick={handleSaveRec}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-base"
                style={{ background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)' }}
              >
                Registrar deuda
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function SubCard({ sub, onToggle, onDelete }: { sub: Subscription; onToggle: () => void; onDelete: () => void }) {
  const cat = getCategoryById(sub.category);
  return (
    <div className={`card p-3 mb-2 flex items-center gap-3 transition-opacity ${!sub.active ? 'opacity-50' : ''}`}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: (cat?.color || '#666') + '22' }}>
        {cat?.icon || '📱'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-white text-sm font-semibold truncate">{sub.name}</p>
          <SourceBadge source={sub.paymentSource} />
        </div>
        <p className="text-muted text-xs">Día {sub.dayOfMonth} de cada mes · {sub.note || cat?.name}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-primary text-sm font-bold">{formatCOP(sub.amount)}</p>
        <div className="flex gap-1">
          <button
            onClick={onToggle}
            className="text-[10px] px-2 py-0.5 rounded-full border transition-all"
            style={sub.active
              ? { borderColor: '#4ADE80', color: '#4ADE80', backgroundColor: '#4ADE8011' }
              : { borderColor: '#555', color: '#666', backgroundColor: 'transparent' }}
          >
            {sub.active ? 'Activa' : 'Pausa'}
          </button>
          <button onClick={onDelete} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted">✕</button>
        </div>
      </div>
    </div>
  );
}

function RecCard({ rec, onPaid, onDelete }: { rec: Receivable; onPaid: () => void; onDelete: () => void }) {
  const isOverdue = rec.dueDate && new Date(rec.dueDate) < new Date() && !rec.paid;
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#4ADE8022' }}>
        💸
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{rec.personName}</p>
        <p className="text-muted text-xs truncate">{rec.description}</p>
        {rec.dueDate && (
          <p className={`text-[10px] mt-0.5 ${isOverdue ? 'text-primary' : 'text-muted'}`}>
            {isOverdue ? '⚠️ Venció' : '📅'} {new Date(rec.dueDate + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-success text-sm font-bold">{formatCOP(rec.amount)}</p>
        <div className="flex gap-1">
          <button
            onClick={onPaid}
            className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
            style={{ borderColor: '#4ADE80', color: '#4ADE80', backgroundColor: '#4ADE8011' }}
          >
            Cobré ✓
          </button>
          <button onClick={onDelete} className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted">✕</button>
        </div>
      </div>
    </div>
  );
}
