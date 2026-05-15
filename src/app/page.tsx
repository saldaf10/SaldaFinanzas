'use client';
import { useMemo } from 'react';
import Layout from '../components/Layout';
import { useStore } from '../store/useStore';
import { getMonthlyStats, getCategoryBreakdown, getHealthScore, generateInsights } from '../utils/calculations';
import { formatCOP, formatCOPFull, getMonthKey, getMonthLabel, formatDate, getPrevMonthKey } from '../utils/format';
import DonutChart from '../components/DonutChart';
import HealthScore from '../components/HealthScore';
import InsightCard from '../components/InsightCard';
import TransactionCard from '../components/TransactionCard';

export default function Dashboard() {
  const { transactions, budgets, profile } = useStore();
  const monthKey = getMonthKey();

  const stats = useMemo(() => getMonthlyStats(transactions, monthKey), [transactions, monthKey]);
  const prevStats = useMemo(() => getMonthlyStats(transactions, getPrevMonthKey(monthKey)), [transactions, monthKey]);
  const breakdown = useMemo(() => getCategoryBreakdown(transactions, 'expense', monthKey), [transactions, monthKey]);
  const healthScore = useMemo(() => getHealthScore(stats, budgets, transactions), [stats, budgets, transactions]);
  const insights = useMemo(() => generateInsights(transactions, stats, prevStats, budgets), [transactions, stats, prevStats, budgets]);
  const recent = useMemo(() => transactions.filter((t) => t.date.startsWith(monthKey)).slice(0, 5), [transactions, monthKey]);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = now.getDate() / daysInMonth;
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <Layout>
      <div className="safe-top" />
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-white">{greeting}, {profile.name} 👋</h1>
          <p className="text-secondary text-xs mt-0.5 capitalize">{getMonthLabel(monthKey)}</p>
        </div>
      </div>

      {/* Balance Hero */}
      <div className="mx-4 mb-3 card p-5">
        <p className="text-secondary text-xs font-semibold mb-1">Balance del mes</p>
        <p className={`text-5xl font-black tracking-tight mb-4 ${stats.balance < 0 ? 'text-primary' : 'text-white'}`}>
          {stats.balance < 0 ? '-' : ''}{formatCOPFull(Math.abs(stats.balance))}
        </p>

        <div className="flex items-center mb-4">
          <div className="flex-1">
            <p className="text-muted text-[10px] mb-0.5">Ingresos</p>
            <p className="text-success font-bold text-base">+{formatCOP(stats.totalIncome)}</p>
          </div>
          <div className="w-px h-10 bg-border mx-4" />
          <div className="flex-1">
            <p className="text-muted text-[10px] mb-0.5">Gastos</p>
            <p className="text-primary font-bold text-base">-{formatCOP(stats.totalExpenses)}</p>
          </div>
          <div className="w-px h-10 bg-border mx-4" />
          <div className="flex-1">
            <p className="text-muted text-[10px] mb-0.5">Movimientos</p>
            <p className="text-white font-bold text-base">{stats.transactionCount}</p>
          </div>
        </div>

        <p className="text-muted text-[10px] mb-1.5">Progreso del mes — Día {now.getDate()} de {daysInMonth}</p>
        <div className="h-1 bg-surface3 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${monthProgress * 100}%` }} />
        </div>
      </div>

      {/* Health + Chart Row */}
      <div className="mx-4 flex gap-3 mb-3">
        <div className="card p-4 flex items-center justify-center" style={{ width: 130 }}>
          <HealthScore score={healthScore} size={100} />
        </div>
        <div className="card p-4 flex-1">
          <p className="text-muted text-[10px] font-semibold uppercase tracking-wide mb-2">Gastos por categoría</p>
          <DonutChart breakdown={breakdown} size={130} centerLabel={formatCOP(stats.totalExpenses)} centerSub="total" />
        </div>
      </div>

      {/* Savings Rate */}
      {stats.totalIncome > 0 && (
        <div className="mx-4 mb-3 card p-4 flex items-center gap-4">
          <div className="border-r border-border pr-4">
            <p className="text-muted text-[10px] mb-0.5">Tasa de ahorro</p>
            <p className={`text-3xl font-black ${stats.savingsRate >= 10 ? 'text-success' : 'text-primary'}`}>
              {stats.savingsRate.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">
              {stats.savingsRate >= 20 ? '¡Vas muy bien! 🎯' : stats.savingsRate >= 0 ? 'Puedes mejorar 📈' : 'Gastos > Ingresos ⚠️'}
            </p>
            <p className="text-muted text-xs mt-0.5">Meta: {profile.monthlyIncomeGoal.toLocaleString('es-CO')}</p>
          </div>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="px-4 mb-3">
          <p className="text-white text-sm font-bold mb-2">✨ Insights de IA</p>
          {insights.slice(0, 3).map((i) => <InsightCard key={i.id} insight={i} />)}
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-4 mb-4">
        <p className="text-white text-sm font-bold mb-2">Movimientos recientes</p>
        {recent.length === 0 ? (
          <div className="card2 p-8 flex flex-col items-center border-dashed">
            <span className="text-4xl mb-3">💳</span>
            <p className="text-white text-sm font-bold mb-1">Sin movimientos</p>
            <p className="text-muted text-xs text-center">Toca el botón + para registrar tu primer movimiento</p>
          </div>
        ) : (
          recent.map((tx) => <TransactionCard key={tx.id} transaction={tx} />)
        )}
      </div>
    </Layout>
  );
}
