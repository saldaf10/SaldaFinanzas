'use client';
import { useMemo } from 'react';
import Layout from '../../components/Layout';
import { useStore } from '../../store/useStore';
import { getMonthlyStats, getCategoryBreakdown, getHealthScore, generateInsights, getPersonality, generateNarrative } from '../../utils/calculations';
import { formatCOP, getMonthKey, getMonthLabel, getPrevMonthKey } from '../../utils/format';
import InsightCard from '../../components/InsightCard';
import HealthScore from '../../components/HealthScore';
import DonutChart from '../../components/DonutChart';

export default function Insights() {
  const { transactions, budgets } = useStore();
  const monthKey = getMonthKey();
  const prevKey = getPrevMonthKey(monthKey);

  const stats = useMemo(() => getMonthlyStats(transactions, monthKey), [transactions, monthKey]);
  const prevStats = useMemo(() => getMonthlyStats(transactions, prevKey), [transactions, prevKey]);
  const breakdown = useMemo(() => getCategoryBreakdown(transactions, 'expense', monthKey), [transactions, monthKey]);
  const incomeBd = useMemo(() => getCategoryBreakdown(transactions, 'income', monthKey), [transactions, monthKey]);
  const health = useMemo(() => getHealthScore(stats, budgets, transactions), [stats, budgets, transactions]);
  const insights = useMemo(() => generateInsights(transactions, stats, prevStats, budgets), [transactions, stats, prevStats, budgets]);
  const personality = useMemo(() => getPersonality(stats, breakdown), [stats, breakdown]);
  const narrative = useMemo(() => generateNarrative(stats, breakdown, getMonthLabel(monthKey)), [stats, breakdown, monthKey]);

  const rated = transactions.filter((t) => t.rating !== undefined && t.date.startsWith(monthKey));
  const avgRating = rated.length > 0 ? rated.reduce((s, t) => s + (t.rating || 0), 0) / rated.length : null;

  const byDay = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    label: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d],
    amount: transactions.filter((t) => t.type === 'expense' && t.date.startsWith(monthKey) && new Date(t.date).getDay() === d).reduce((s, t) => s + t.amount, 0),
    weekend: d === 0 || d === 6,
  }));
  const maxDay = Math.max(...byDay.map((d) => d.amount), 1);

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-2xl font-black text-white">Análisis IA</h1>
        <p className="text-muted text-xs mt-0.5 capitalize">{getMonthLabel(monthKey)}</p>
      </div>

      {/* Personality */}
      <div className="mx-4 mb-3 rounded-2xl border p-4 flex items-center gap-4" style={{ backgroundColor: '#1A0505', borderColor: '#3D0000' }}>
        <div className="w-14 h-14 rounded-full bg-surface2 flex items-center justify-center text-3xl flex-shrink-0">
          {personality.emoji}
        </div>
        <div>
          <p className="text-primary text-xs font-bold mb-0.5">Tu perfil financiero</p>
          <p className="text-white text-base font-black">{personality.title}</p>
          <p className="text-secondary text-xs mt-0.5 leading-relaxed">{personality.description}</p>
        </div>
      </div>

      {/* Narrative */}
      <div className="mx-4 mb-3 card p-4">
        <p className="text-secondary text-xs font-bold mb-2">📖 Resumen del mes</p>
        <p className="text-white text-sm leading-relaxed">{narrative}</p>
      </div>

      {/* Health + Charts */}
      <div className="mx-4 flex gap-2 mb-3">
        {[
          { label: null, content: <HealthScore score={health} size={100} /> },
          { label: 'Gastos', content: <DonutChart breakdown={breakdown} size={100} /> },
          { label: 'Ingresos', content: <DonutChart breakdown={incomeBd} size={100} /> },
        ].map((item, i) => (
          <div key={i} className="card p-3 flex-1 flex flex-col items-center">
            {item.label && <p className="text-muted text-[9px] font-bold uppercase mb-1">{item.label}</p>}
            {item.content}
          </div>
        ))}
      </div>

      {/* Day of week chart */}
      <div className="mx-4 mb-3 card p-4">
        <p className="text-white text-sm font-bold mb-3">📅 Gastos por día de semana</p>
        <div className="flex items-end gap-1 h-24">
          {byDay.map((d) => {
            const h = Math.max((d.amount / maxDay) * 72, 4);
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center">
                <p className="text-muted text-[7px] mb-1">{d.amount > 0 ? formatCOP(d.amount) : ''}</p>
                <div className="w-full flex justify-center items-end" style={{ height: 72 }}>
                  <div className="w-3/4 rounded-sm" style={{ height: h, backgroundColor: d.weekend ? '#DC2626' : '#222' }} />
                </div>
                <p className={`text-[9px] font-semibold mt-1 ${d.weekend ? 'text-primary' : 'text-secondary'}`}>{d.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Regret index */}
      {avgRating !== null && (
        <div className="mx-4 mb-3 card p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-white text-sm font-bold">🤔 Índice de Satisfacción</p>
            <p className="font-black text-lg" style={{ color: avgRating >= 4 ? '#22C55E' : avgRating >= 3 ? '#F59E0B' : '#DC2626' }}>
              {avgRating.toFixed(1)} ★
            </p>
          </div>
          <div className="h-1.5 bg-surface3 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full" style={{
              width: `${(avgRating / 5) * 100}%`,
              backgroundColor: avgRating >= 4 ? '#22C55E' : avgRating >= 3 ? '#F59E0B' : '#DC2626',
            }} />
          </div>
          <p className="text-secondary text-xs">
            {avgRating >= 4 ? '¡Gastas en lo que te importa!' : avgRating >= 3 ? 'Satisfacción moderada. Algunos gastos pueden optimizarse.' : 'Varios gastos no generan valor real.'}
          </p>
          <p className="text-muted text-xs mt-1">{rated.length} transacciones calificadas</p>
        </div>
      )}

      {/* Insights */}
      <div className="px-4 mb-3">
        <p className="text-white text-sm font-bold mb-2">✨ Insights personalizados</p>
        {insights.map((i) => <InsightCard key={i.id} insight={i} />)}
      </div>

      {/* Month comparison */}
      {prevStats.transactionCount > 0 && (
        <div className="mx-4 mb-4 card p-4">
          <p className="text-white text-sm font-bold mb-3">📊 vs Mes anterior</p>
          {[
            { label: 'Ingresos', cur: stats.totalIncome, prev: prevStats.totalIncome, goodUp: true },
            { label: 'Gastos', cur: stats.totalExpenses, prev: prevStats.totalExpenses, goodUp: false },
            { label: 'Balance', cur: stats.balance, prev: prevStats.balance, goodUp: true },
          ].map(({ label, cur, prev, goodUp }) => {
            const chg = prev !== 0 ? ((cur - prev) / Math.abs(prev)) * 100 : 0;
            const good = goodUp ? cur >= prev : cur <= prev;
            return (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                <span className="text-secondary text-sm">{label}</span>
                <span className="text-white text-sm font-semibold">{formatCOP(cur)}</span>
                <span className="text-xs font-bold w-14 text-right" style={{ color: good ? '#22C55E' : '#DC2626' }}>
                  {cur >= prev ? '↑' : '↓'} {Math.abs(chg).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
