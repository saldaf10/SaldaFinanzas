'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { formatCOPFull, getMonthKey, getPrevMonthKey, formatCOP } from '../../utils/format';
import { getMonthlyStats, getCategoryBreakdown, getPersonality, generateInsights, getHealthScore } from '../../utils/calculations';
import { resolveCategory } from '../../utils/categories';
import { USERS } from '../../utils/auth';
import HealthScore from '../../components/HealthScore';
import InsightCard from '../../components/InsightCard';

function Stars({ avg }: { avg: number }) {
  const full = Math.round(avg);
  return (
    <span className="text-yellow-400 text-xs tracking-tight">
      {[1,2,3,4,5].map((i) => (i <= full ? '★' : '☆')).join('')}
    </span>
  );
}

export default function Settings() {
  const { profile, updateProfile, transactions, clearAllData, budgets, customCategories } = useStore();
  const router = useRouter();
  const [name, setName]       = useState(profile.name);
  const [income, setIncome]   = useState(profile.monthlyIncomeGoal.toString());
  const [apiKey, setApiKey]   = useState(profile.openAiKey || '');
  const [resetDay, setResetDay] = useState((profile.budgetResetDay ?? 5).toString());
  const [saved, setSaved]     = useState(false);
  const [curPass, setCurPass]     = useState('');
  const [newPass, setNewPass]     = useState('');
  const [confPass, setConfPass]   = useState('');
  const [passMsg, setPassMsg]     = useState('');

  function handleSave() {
    const amt = parseFloat(income.replace(/\./g, ''));
    const day = Math.min(28, Math.max(1, parseInt(resetDay) || 5));
    updateProfile({ name: name.trim() || profile.name, monthlyIncomeGoal: amt || profile.monthlyIncomeGoal, openAiKey: apiKey.trim() || undefined, budgetResetDay: day });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const txCount = transactions.length;
  const totalExpenseAmt = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const monthKey  = getMonthKey();
  const prevKey   = getPrevMonthKey(monthKey);
  const stats     = useMemo(() => getMonthlyStats(transactions, monthKey), [transactions, monthKey]);
  const prevStats = useMemo(() => getMonthlyStats(transactions, prevKey), [transactions, prevKey]);
  const breakdown = useMemo(() => getCategoryBreakdown(transactions, 'expense', monthKey), [transactions, monthKey]);
  const health    = useMemo(() => getHealthScore(stats, budgets, transactions), [stats, budgets, transactions]);
  const personality = useMemo(() => getPersonality(stats, breakdown), [stats, breakdown]);
  const insights  = useMemo(() => generateInsights(transactions, stats, prevStats, budgets), [transactions, stats, prevStats, budgets]);

  const byDay = [0,1,2,3,4,5,6].map((d) => ({
    label: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d],
    amount: transactions.filter((t) => t.type === 'expense' && t.date.startsWith(monthKey) && new Date(t.date).getDay() === d).reduce((s, t) => s + t.amount, 0),
    weekend: d === 0 || d === 6,
  }));
  const maxDay = Math.max(...byDay.map((d) => d.amount), 1);

  // Star ratings analysis
  const expenseTxs = transactions.filter((t) => t.type === 'expense');
  const ratedTxs   = expenseTxs.filter((t) => t.rating !== undefined);
  const ratedPct   = expenseTxs.length > 0 ? Math.round((ratedTxs.length / expenseTxs.length) * 100) : 0;

  const starDist = [5,4,3,2,1].map((star) => ({
    star,
    count: ratedTxs.filter((t) => t.rating === star).length,
  }));

  function handleChangePassword() {
    const currentUser = localStorage.getItem('finance_user') || 'saldaf';
    const passKey = `finance_password_${currentUser}`;
    const stored = localStorage.getItem(passKey) || USERS[currentUser] || '';
    if (curPass !== stored) { setPassMsg('Contraseña actual incorrecta'); return; }
    if (newPass.length < 6) { setPassMsg('Mínimo 6 caracteres'); return; }
    if (newPass !== confPass) { setPassMsg('Las contraseñas no coinciden'); return; }
    localStorage.setItem(passKey, newPass);
    setCurPass(''); setNewPass(''); setConfPass('');
    setPassMsg('✓ Contraseña actualizada');
    setTimeout(() => setPassMsg(''), 3000);
  }

  const starsByCategory = useMemo(() => {
    const m: Record<string, { total: number; count: number; amount: number }> = {};
    transactions.forEach((t) => {
      if (t.type !== 'expense' || t.rating === undefined) return;
      if (!m[t.category]) m[t.category] = { total: 0, count: 0, amount: 0 };
      m[t.category].total += t.rating;
      m[t.category].count++;
      m[t.category].amount += t.amount;
    });
    return Object.entries(m)
      .map(([catId, d]) => ({
        catId,
        avg: d.total / d.count,
        count: d.count,
        amount: d.amount,
        ...resolveCategory(catId, customCategories),
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [transactions, customCategories]);

  const topSatisfied = starsByCategory.filter((c) => c.avg >= 4.0 && c.count >= 2);
  const lowSatisfied = starsByCategory.filter((c) => c.avg < 2.5 && c.count >= 2);

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-black text-white">Perfil</h1>
      </div>

      {/* Avatar */}
      <div className="mx-4 mb-3 card p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-black">
          {(name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-white text-base font-bold">{profile.name}</p>
          <p className="text-muted text-xs">Copiloto Financiero Personal</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mx-4 mb-3 card p-3 flex">
        {[
          { label: 'Movimientos', value: txCount.toString(), color: 'text-white' },
          { label: 'Ingresos', value: transactions.filter((t) => t.type === 'income').length.toString(), color: 'text-success' },
          { label: 'Gastos', value: expenseTxs.length.toString(), color: 'text-primary' },
          { label: 'Rastreado', value: formatCOPFull(totalExpenseAmt), color: 'text-white' },
        ].map((s, i) => (
          <div key={s.label} className={`flex-1 text-center ${i > 0 ? 'border-l border-border' : ''}`}>
            <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            <p className="text-muted text-[9px]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Health score + personality — always visible */}
      <div className="mx-4 mb-3 card p-4 flex items-center gap-4">
        <HealthScore score={health} size={80} />
        <div className="flex-1 min-w-0">
          <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-1.5">Tu perfil financiero</p>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">{personality.emoji}</span>
            <p className="text-white text-sm font-black">{personality.title}</p>
          </div>
          <p className="text-secondary text-xs leading-relaxed">{personality.description}</p>
        </div>
      </div>

      {/* Day-of-week chart */}
      {stats.transactionCount > 0 && (
        <div className="mx-4 mb-3 card p-4">
          <p className="text-white text-sm font-bold mb-3">Gasto por día de semana</p>
          <div className="flex items-end gap-1 h-20">
            {byDay.map((d) => {
              const h = Math.max((d.amount / maxDay) * 60, d.amount > 0 ? 4 : 0);
              return (
                <div key={d.label} className="flex-1 flex flex-col items-center">
                  <p className="text-[7px] text-muted mb-1 leading-none">{d.amount > 0 ? formatCOP(d.amount) : ''}</p>
                  <div className="w-full flex justify-center items-end" style={{ height: 60 }}>
                    <div className="w-3/4 rounded-sm" style={{ height: h, backgroundColor: d.weekend ? '#DC2626' : '#333' }} />
                  </div>
                  <p className={`text-[9px] font-semibold mt-1 ${d.weekend ? 'text-primary' : 'text-secondary'}`}>{d.label}</p>
                </div>
              );
            })}
          </div>
          <p className="text-muted text-[10px] mt-2">Barras rojas = fin de semana</p>
        </div>
      )}

      {/* Insights */}
      {insights.filter((i) => i.id !== 'default').slice(0, 3).length > 0 && (
        <div className="px-4 mb-3">
          <p className="text-white text-sm font-bold mb-2">Insights</p>
          {insights.filter((i) => i.id !== 'default').slice(0, 3).map((i) => <InsightCard key={i.id} insight={i} />)}
        </div>
      )}

      {/* Star ratings section */}
      {expenseTxs.length > 0 && (
        <div className="mx-4 mb-3 card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white text-sm font-bold">Satisfacción de compras</p>
            <span className="text-muted text-xs">{ratedTxs.length}/{expenseTxs.length} ({ratedPct}%)</span>
          </div>

          {ratedTxs.length === 0 ? (
            <p className="text-muted text-xs text-center py-3">Califica tus gastos con ★ al registrarlos para ver análisis aquí.</p>
          ) : (
            <>
              {/* Distribution bars */}
              <div className="space-y-1.5 mb-4">
                {starDist.map(({ star, count }) => {
                  const pct = ratedTxs.length > 0 ? (count / ratedTxs.length) * 100 : 0;
                  const barColor = star >= 4 ? '#22C55E' : star === 3 ? '#F59E0B' : '#EF4444';
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-yellow-400 text-[10px] w-6 flex-shrink-0">{star}★</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1a1a1a' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                      <span className="text-muted text-[10px] w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* By category */}
              {starsByCategory.length > 0 && (
                <>
                  <p className="text-secondary text-[10px] font-semibold uppercase tracking-wide mb-2">Por categoría</p>
                  <div className="space-y-2.5 mb-4">
                    {starsByCategory.map((c) => (
                      <div key={c.catId} className="flex items-center gap-2">
                        <span className="text-base w-6 flex-shrink-0">{c.icon}</span>
                        <span className="text-secondary text-xs flex-1 truncate">{c.name}</span>
                        <Stars avg={c.avg} />
                        <span className="text-muted text-[10px] ml-1 w-7 text-right">{c.avg.toFixed(1)}</span>
                        <span className="text-muted text-[9px] w-14 text-right">{c.count} gastos</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Conclusions */}
              {(topSatisfied.length > 0 || lowSatisfied.length > 0 || ratedPct < 50) && (
                <div className="space-y-2.5 pt-3 border-t border-border">
                  <p className="text-secondary text-[10px] font-semibold uppercase tracking-wide">Conclusiones</p>
                  {topSatisfied.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-success text-sm mt-0.5 flex-shrink-0">✓</span>
                      <p className="text-secondary text-xs leading-relaxed">
                        <span className="text-white font-semibold">Vale la pena: </span>
                        {topSatisfied.map((c) => `${c.icon} ${c.name} (${c.avg.toFixed(1)}★)`).join(', ')}. Siguen generando satisfacción.
                      </p>
                    </div>
                  )}
                  {lowSatisfied.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-primary text-sm mt-0.5 flex-shrink-0">!</span>
                      <p className="text-secondary text-xs leading-relaxed">
                        <span className="text-white font-semibold">A revisar: </span>
                        {lowSatisfied.map((c) => `${c.icon} ${c.name} (${c.avg.toFixed(1)}★)`).join(', ')}. Considera si estos gastos valen la pena.
                      </p>
                    </div>
                  )}
                  {ratedPct < 50 && (
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 text-sm mt-0.5 flex-shrink-0">i</span>
                      <p className="text-secondary text-xs leading-relaxed">
                        Solo el <span className="text-white font-semibold">{ratedPct}%</span> de tus gastos están calificados. Califica más para mejores conclusiones.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Settings form */}
      <div className="px-4 mb-3">
        <p className="text-white text-sm font-bold mb-3">Configuración</p>
        <div className="space-y-3">
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1.5">Tu nombre</label>
            <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Sebastián" />
          </div>
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1.5">Meta de ingreso mensual (COP)</label>
            <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              value={income} onChange={(e) => setIncome(e.target.value)} placeholder="Ej: 5000000" inputMode="numeric" />
          </div>
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1.5">Día de corte del presupuesto</label>
            <p className="text-muted text-xs mb-1.5">El día del mes en que empieza tu nuevo período (1–28)</p>
            <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              value={resetDay} onChange={(e) => setResetDay(e.target.value)} placeholder="5" inputMode="numeric" />
          </div>
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1">API Key OpenAI (opcional)</label>
            <p className="text-muted text-xs mb-1.5">Para análisis con IA real (GPT-4o mini)</p>
            <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." type="password" autoCapitalize="none" />
          </div>
          <button onClick={handleSave}
            className={`w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-colors ${saved ? 'bg-success' : 'bg-primary'}`}>
            {saved ? '✓ Guardado' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* App info */}
      <div className="px-4 mb-3">
        <p className="text-white text-sm font-bold mb-2">Acerca de la app</p>
        <div className="card divide-y divide-border">
          {[
            ['Versión', '1.0.0'],
            ['Moneda', 'COP (Peso Colombiano)'],
            ['Almacenamiento', 'Local en tu dispositivo'],
            ['IA', apiKey ? 'OpenAI conectado ✓' : 'Modo offline'],
            ['Instalación', 'PWA — instala desde Safari'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-3">
              <span className="text-secondary text-sm">{label}</span>
              <span className="text-white text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Install instructions */}
      <div className="mx-4 mb-3 rounded-2xl border p-4" style={{ backgroundColor: '#07101A', borderColor: '#1E3A5F' }}>
        <p className="text-blue-400 text-sm font-bold mb-2">📱 Instalar en iPhone</p>
        <ol className="text-secondary text-xs space-y-1.5">
          <li>1. Abre esta app en <strong className="text-white">Safari</strong></li>
          <li>2. Toca el botón <strong className="text-white">Compartir ↑</strong></li>
          <li>3. Selecciona <strong className="text-white">"Agregar a inicio"</strong></li>
          <li>4. Toca <strong className="text-white">Agregar</strong></li>
          <li>5. ¡Ya aparece en tu pantalla de inicio! 🎉</li>
        </ol>
      </div>

      {/* Password change */}
      <div className="px-4 mb-3">
        <p className="text-white text-sm font-bold mb-3">Seguridad</p>
        <div className="space-y-3">
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1.5">Contraseña actual</label>
            <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              type="password" value={curPass} onChange={(e) => setCurPass(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1.5">Nueva contraseña</label>
            <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="text-secondary text-xs font-semibold block mb-1.5">Confirmar contraseña</label>
            <input className="w-full bg-surface2 border border-border rounded-xl px-3 py-3 text-white text-sm placeholder-muted"
              type="password" value={confPass} onChange={(e) => setConfPass(e.target.value)} placeholder="Repite la nueva contraseña" />
          </div>
          {passMsg && (
            <p className={`text-xs font-semibold text-center ${passMsg.startsWith('✓') ? 'text-success' : 'text-primary'}`}>{passMsg}</p>
          )}
          <button onClick={handleChangePassword}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-surface2 border border-border">
            Cambiar contraseña
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mb-4">
        <button onClick={() => { localStorage.removeItem('finance_auth'); localStorage.removeItem('finance_user'); window.location.replace('/login'); }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-secondary border border-border bg-surface2">
          Cerrar sesión
        </button>
      </div>

      {/* Danger zone */}
      <div className="px-4 mb-8">
        <p className="text-primary text-sm font-bold mb-2">Zona de peligro</p>
        <button onClick={() => { if (confirm('¿Borrar TODOS los datos? Esta acción no se puede deshacer.')) clearAllData(); }}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-primary border border-primary/50 bg-primary/10">
          🗑️ Borrar todos los datos
        </button>
      </div>
    </Layout>
  );
}
