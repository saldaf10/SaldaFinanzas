import { Transaction, Budget, MonthlyStats, CategoryBreakdown, Insight } from '../types';
import { getCategoryById } from './categories';
import { getMonthKey } from './format';

export function getMonthlyStats(txs: Transaction[], monthKey?: string): MonthlyStats {
  const key = monthKey || getMonthKey();
  const filtered = txs.filter((t) => t.date.startsWith(key));
  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  const catMap: Record<string, number> = {};
  filtered.filter((t) => t.type === 'expense').forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { totalIncome, totalExpenses, balance, savingsRate, transactionCount: filtered.length, topCategory, month: key };
}

export function getCategoryBreakdown(txs: Transaction[], type: 'expense' | 'income', monthKey?: string): CategoryBreakdown {
  const key = monthKey || getMonthKey();
  const filtered = txs.filter((t) => t.date.startsWith(key) && t.type === type);
  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const bd: CategoryBreakdown = {};
  filtered.forEach((t) => {
    if (!bd[t.category]) bd[t.category] = { amount: 0, count: 0, percentage: 0 };
    bd[t.category].amount += t.amount;
    bd[t.category].count++;
  });
  Object.keys(bd).forEach((k) => {
    bd[k].percentage = total > 0 ? (bd[k].amount / total) * 100 : 0;
  });
  return bd;
}

export function getHealthScore(stats: MonthlyStats, budgets: Budget[], txs: Transaction[]): number {
  let score = 0;
  if (stats.savingsRate >= 30) score += 40;
  else if (stats.savingsRate >= 20) score += 32;
  else if (stats.savingsRate >= 10) score += 22;
  else if (stats.savingsRate >= 0) score += 12;

  const mb = budgets.filter((b) => b.month === stats.month);
  if (mb.length > 0) {
    const bd = getCategoryBreakdown(txs, 'expense', stats.month);
    let sum = 0;
    mb.forEach((b) => {
      const spent = bd[b.categoryId]?.amount || 0;
      const ratio = b.amount > 0 ? spent / b.amount : 1;
      sum += ratio <= 1 ? 1 : Math.max(0, 1 - (ratio - 1));
    });
    score += Math.round((sum / mb.length) * 30);
  } else { score += 15; }

  const days = new Set(txs.slice(0, 30).map((t) => t.date.substring(0, 10))).size;
  score += Math.min(15, days);
  const cats = Object.keys(getCategoryBreakdown(txs, 'expense', stats.month)).length;
  score += Math.min(15, cats * 3);
  return Math.min(100, Math.max(0, score));
}

export function generateInsights(txs: Transaction[], stats: MonthlyStats, prevStats: MonthlyStats, budgets: Budget[]): Insight[] {
  const insights: Insight[] = [];
  const bd = getCategoryBreakdown(txs, 'expense', stats.month);
  const prevBd = getCategoryBreakdown(txs, 'expense', prevStats.month);

  if (stats.savingsRate >= 25) {
    insights.push({ id: 'savings_good', type: 'success', title: '¡Excelente tasa de ahorro!', description: `Estás ahorrando el ${stats.savingsRate.toFixed(0)}% de tus ingresos.`, icon: '🎯' });
  } else if (stats.savingsRate < 0 && stats.totalIncome > 0) {
    insights.push({ id: 'neg_savings', type: 'warning', title: 'Gastos > Ingresos', description: `Tus gastos superan tus ingresos por $${Math.abs(stats.balance).toLocaleString('es-CO')}.`, icon: '⚠️' });
  }

  if (stats.topCategory) {
    const cur = bd[stats.topCategory]?.amount || 0;
    const prev = prevBd[stats.topCategory]?.amount || 0;
    if (prev > 0) {
      const chg = ((cur - prev) / prev) * 100;
      const name = getCategoryById(stats.topCategory)?.name || stats.topCategory;
      if (chg > 20) insights.push({ id: 'top_up', type: 'warning', title: `+${chg.toFixed(0)}% en ${name}`, description: `Gastaste significativamente más en ${name} que el mes pasado.`, icon: '📈' });
      else if (chg < -20) insights.push({ id: 'top_down', type: 'success', title: `↓ ${Math.abs(chg).toFixed(0)}% en ${name}`, description: `¡Reduciste gastos en ${name} comparado con el mes anterior!`, icon: '📉' });
    }
  }

  budgets.filter((b) => b.month === stats.month).forEach((b) => {
    const spent = bd[b.categoryId]?.amount || 0;
    const ratio = b.amount > 0 ? spent / b.amount : 0;
    const name = getCategoryById(b.categoryId)?.name || b.categoryId;
    if (ratio > 1) insights.push({ id: `over_${b.categoryId}`, type: 'warning', title: `Presupuesto de ${name} excedido`, description: `Llevas ${(ratio * 100).toFixed(0)}% del presupuesto en ${name}.`, icon: '🔴' });
    else if (ratio > 0.8) insights.push({ id: `near_${b.categoryId}`, type: 'info', title: `${name} casi al límite`, description: `Has usado el ${(ratio * 100).toFixed(0)}% del presupuesto de ${name}.`, icon: '🟡' });
  });

  const ratedLow = txs.filter((t) => t.rating !== undefined && t.rating <= 2 && t.date.startsWith(stats.month));
  if (ratedLow.length > 2) {
    const total = ratedLow.reduce((s, t) => s + t.amount, 0);
    insights.push({ id: 'regret', type: 'tip', title: 'Gastos que no valieron la pena', description: `${ratedLow.length} compras calificadas con poca satisfacción = $${total.toLocaleString('es-CO')}.`, icon: '🤔' });
  }

  const weekend = txs.filter((t) => { const d = new Date(t.date).getDay(); return t.type === 'expense' && t.date.startsWith(stats.month) && (d === 0 || d === 6); }).reduce((s, t) => s + t.amount, 0);
  const weekday = stats.totalExpenses - weekend;
  if (weekday > 0 && weekend / 8 > weekday / 22 * 1.5) {
    insights.push({ id: 'weekend', type: 'info', title: 'Gastas más los fines de semana', description: 'Tu promedio de gasto en fin de semana es notablemente mayor que entre semana.', icon: '🎉' });
  }

  if (insights.length === 0) insights.push({ id: 'default', type: 'info', title: 'Agrega más transacciones', description: 'Con más datos podré darte insights personalizados sobre tus hábitos financieros.', icon: '💡' });
  return insights;
}

export function getPersonality(stats: MonthlyStats, bd: CategoryBreakdown): { title: string; description: string; emoji: string } {
  if (stats.transactionCount === 0) return { title: 'Nuevo usuario', description: 'Registra tus primeros movimientos para descubrir tu perfil.', emoji: '🌱' };
  if (stats.savingsRate >= 30) return { title: 'El Hormiguero', description: 'Ahorra consistentemente. Eres financieramente disciplinado.', emoji: '🐜' };
  const top = Object.entries(bd).sort((a, b) => b[1].amount - a[1].amount)[0];
  if (top) {
    if ((top[0] === 'food' || top[0] === 'food_delivery') && top[1].percentage > 35) return { title: 'El Foodie', description: 'La comida es tu prioridad. Disfrutas comer bien.', emoji: '🍕' };
    if ((top[0] === 'transport' || top[0] === 'fuel') && top[1].percentage > 30) return { title: 'El Viajero', description: 'Te mueves mucho. El transporte consume una parte importante de tu presupuesto.', emoji: '🚗' };
    if ((top[0] === 'entertainment' || top[0] === 'travel')) return { title: 'El Sibarita', description: 'Priorizas las experiencias sobre los bienes materiales.', emoji: '🎭' };
    if (top[0] === 'shopping') return { title: 'El Comprador', description: 'Las compras son tu debilidad. Piensa si cada compra es necesaria.', emoji: '🛍️' };
  }
  if (stats.savingsRate < 0) return { title: 'El Impulsivo', description: 'Tus gastos superan tus ingresos. Momento de revisar prioridades.', emoji: '🌊' };
  return { title: 'El Equilibrado', description: 'Mantienes un balance razonable entre gastos y ahorro.', emoji: '⚖️' };
}

export function generateNarrative(stats: MonthlyStats, bd: CategoryBreakdown, label: string): string {
  if (stats.transactionCount === 0) return `No hay transacciones en ${label}. Comienza registrando tus movimientos.`;
  const top = Object.entries(bd).sort((a, b) => b[1].amount - a[1].amount).slice(0, 2).map(([id]) => getCategoryById(id)?.name || id).join(' y ');
  const rateComment = stats.savingsRate >= 25 ? 'excelente nivel de ahorro' : stats.savingsRate >= 10 ? 'un margen positivo' : stats.savingsRate >= 0 ? 'un margen ajustado' : 'un déficit';
  const balStr = stats.balance >= 0 ? `saldo positivo de $${stats.balance.toLocaleString('es-CO')}` : `déficit de $${Math.abs(stats.balance).toLocaleString('es-CO')}`;
  return `En ${label} registraste ${stats.transactionCount} movimientos con ${rateComment}. Tus principales categorías fueron ${top || 'varias'}. Cerraste con ${balStr}. ${stats.savingsRate >= 15 ? '¡Sigue así!' : 'Hay oportunidad de mejorar.'}`;
}
