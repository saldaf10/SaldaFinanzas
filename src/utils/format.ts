export function formatCOP(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `$${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}k`;
  return `$${amount.toLocaleString('es-CO')}`;
}

export function formatCOPFull(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`;
}

export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
  });
}

export function getPrevMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

export function getBudgetPeriod(resetDay: number): { start: string; end: string; label: string; monthKey: string } {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  let startYear = year, startMonth = month;
  if (day < resetDay) {
    startMonth--;
    if (startMonth < 0) { startMonth = 11; startYear--; }
  }

  let endYear = startYear, endMonth = startMonth + 1;
  if (endMonth > 11) { endMonth = 0; endYear++; }

  const endDate = new Date(endYear, endMonth, resetDay - 1);
  const start = `${startYear}-${String(startMonth + 1).padStart(2, '0')}-${String(resetDay).padStart(2, '0')}`;
  const end = endDate.toISOString().slice(0, 10);
  const monthKey = `${startYear}-${String(startMonth + 1).padStart(2, '0')}`;
  const label = `${resetDay} ${MONTHS_ES[startMonth]} → ${endDate.getDate()} ${MONTHS_ES[endDate.getMonth()]}`;

  return { start, end, label, monthKey };
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
}
