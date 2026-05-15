'use client';
import { useState, useEffect } from 'react';

const SALDAF_DEFAULT_PASS = 'Behetria1!';
const PRUEBA_PASS = '123456';

function seedDemoData() {
  if (localStorage.getItem('finance-demo')) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  // Create a past date within the current month (offset days ago, capped at month start)
  function ago(days: number): string {
    const d = new Date(now);
    d.setDate(now.getDate() - days);
    const start = new Date(year, month - 1, 1);
    const capped = d < start ? start : d;
    return capped.toISOString().slice(0, 10) + 'T12:00:00.000Z';
  }

  const VID = 'cust_videojuegos_demo';
  const RUM = 'cust_rumbas_demo';

  const state = {
    profile: { name: 'prueba1', monthlyIncomeGoal: 5000000, currency: 'COP', budgetResetDay: 1 },

    accounts: [
      { id: 'acc_d_nu',  name: 'Nu',            type: 'bank',       initialBalance: 1850000,  color: '#4ADE80', emoji: '💚' },
      { id: 'acc_d_bc',  name: 'Bancolombia',    type: 'bank',       initialBalance: 2200000,  color: '#60A5FA', emoji: '🏦' },
      { id: 'acc_d_ef',  name: 'Efectivo',       type: 'bank',       initialBalance:  380000,  color: '#FBBF24', emoji: '💵' },
      { id: 'acc_d_i1',  name: 'Nubank Invest',  type: 'investment', initialBalance: 3200000,  color: '#A78BFA', emoji: '📊' },
      { id: 'acc_d_i2',  name: 'CDT Bancolombia',type: 'investment', initialBalance: 5000000,  color: '#38BDF8', emoji: '🏗️' },
      { id: 'acc_d_dt',  name: 'Tarjeta Nu',     type: 'debt',       initialBalance: -680000,  color: '#F87171', emoji: '💳' },
    ],

    customCategories: [
      { id: VID, name: 'Videojuegos', emoji: '🎮', color: '#4ADE80' },
      { id: RUM, name: 'Rumbas',      emoji: '🍺', color: '#FB923C' },
    ],

    budgets: [
      { categoryId: 'food',          amount: 700000, month: monthKey },
      { categoryId: 'transport',     amount: 280000, month: monthKey },
      { categoryId: 'entertainment', amount: 180000, month: monthKey },
      { categoryId: 'shopping',      amount: 350000, month: monthKey },
      { categoryId: 'subscriptions', amount: 100000, month: monthKey },
      { categoryId: VID,             amount: 120000, month: monthKey },
      { categoryId: RUM,             amount: 200000, month: monthKey },
    ],

    transactions: [
      // ─ Ingresos ─
      { id: 'td01', type: 'income',  amount: 4500000, description: 'Nómina',                      category: 'salary',        date: ago(14), accountId: 'acc_d_bc' },
      { id: 'td02', type: 'income',  amount:  650000, description: 'Proyecto diseño UX freelance', category: 'freelance',     date: ago(10), rating: 5 },
      // ─ Comida ─
      { id: 'td03', type: 'expense', amount:   42000, description: 'Almuerzo Crepes & Waffles',    category: 'food',          date: ago(13), rating: 5, note: 'Con amigos del trabajo' },
      { id: 'td04', type: 'expense', amount:   25900, description: 'Rappi — Sushi Nagoya',         category: 'food_delivery', date: ago(11), rating: 4 },
      { id: 'td05', type: 'expense', amount:   18500, description: 'Almuerzo ejecutivo',           category: 'food',          date: ago(9),  rating: 3 },
      { id: 'td06', type: 'expense', amount:   31000, description: 'Domicilio El Corral',          category: 'food_delivery', date: ago(7),  rating: 2, note: 'Llegó frío' },
      { id: 'td07', type: 'expense', amount:   52000, description: 'Cena restaurante japonés',     category: 'food',          date: ago(5),  rating: 5, note: 'Excelente servicio' },
      { id: 'td08', type: 'expense', amount:   14000, description: 'Juan Valdez',                  category: 'food',          date: ago(3),  rating: 4 },
      { id: 'td09', type: 'expense', amount:   28000, description: 'Pizza Hut domicilio',          category: 'food_delivery', date: ago(1),  rating: 3 },
      // ─ Transporte ─
      { id: 'td10', type: 'expense', amount:   13500, description: 'Uber al trabajo',              category: 'transport',     date: ago(12), rating: 4 },
      { id: 'td11', type: 'expense', amount:   88000, description: 'Gasolina Terpel',              category: 'fuel',          date: ago(8),  rating: 3 },
      { id: 'td12', type: 'expense', amount:    9000, description: 'InDriver — centro',            category: 'transport',     date: ago(6),  rating: 3 },
      { id: 'td13', type: 'expense', amount:   18000, description: 'Parqueadero Andino',           category: 'transport',     date: ago(4),  rating: 2 },
      // ─ Entretenimiento ─
      { id: 'td14', type: 'expense', amount:   36000, description: 'Cine — Deadpool',              category: 'entertainment', date: ago(8),  rating: 5 },
      { id: 'td15', type: 'expense', amount:   95000, description: 'Bar Bogotá Beer Company',      category: 'entertainment', date: ago(6),  rating: 4 },
      // ─ Compras ─
      { id: 'td16', type: 'expense', amount:  165000, description: 'Ropa deportiva Nike',          category: 'shopping',      date: ago(10), rating: 4 },
      { id: 'td17', type: 'expense', amount:   58000, description: 'Mercado semanal D1',           category: 'shopping',      date: ago(4),  rating: 3 },
      // ─ Suscripciones ─
      { id: 'td18', type: 'expense', amount:   25900, description: 'Netflix',                      category: 'subscriptions', date: ago(14), rating: 5 },
      { id: 'td19', type: 'expense', amount:   17900, description: 'Spotify Premium',              category: 'subscriptions', date: ago(14), rating: 5 },
      { id: 'td20', type: 'expense', amount:   18900, description: 'iCloud 200 GB',                category: 'subscriptions', date: ago(14), rating: 4 },
      // ─ Salud ─
      { id: 'td21', type: 'expense', amount:   55000, description: 'Consulta dermatólogo',         category: 'health',        date: ago(9),  rating: 4 },
      { id: 'td22', type: 'expense', amount:   32000, description: 'Farmacia Cruz Verde',          category: 'health',        date: ago(5),  rating: 3 },
      // ─ Videojuegos (personalizada) ─
      { id: 'td23', type: 'expense', amount:   75000, description: 'Call of Duty — puntos',        category: VID,             date: ago(11), rating: 4 },
      { id: 'td24', type: 'expense', amount:   28000, description: 'Skins Fortnite',               category: VID,             date: ago(3),  rating: 2, note: 'No valió la pena' },
      // ─ Rumbas (personalizada) ─
      { id: 'td25', type: 'expense', amount:  135000, description: 'Andrés Carne de Res',          category: RUM,             date: ago(7),  rating: 5, note: 'Increíble noche' },
      { id: 'td26', type: 'expense', amount:   68000, description: 'Cocteles con amigos',          category: RUM,             date: ago(2),  rating: 4 },
      // ─ Hogar ─
      { id: 'td27', type: 'expense', amount:  950000, description: 'Arriendo',                     category: 'home',          date: ago(14), rating: 3, accountId: 'acc_d_bc' },
      { id: 'td28', type: 'expense', amount:   72000, description: 'Internet ETB',                 category: 'home',          date: ago(13), rating: 3 },
      { id: 'td29', type: 'expense', amount:   48000, description: 'Agua y alcantarillado',        category: 'home',          date: ago(12), rating: 3 },
    ],

    subscriptions: [
      { id: 'sub_d1', name: 'Netflix',          amount: 25900, dayOfMonth: 1, paymentSource: 'nu', category: 'subscriptions', active: true },
      { id: 'sub_d2', name: 'Spotify Premium',  amount: 17900, dayOfMonth: 1, paymentSource: 'nu', category: 'subscriptions', active: true },
      { id: 'sub_d3', name: 'iCloud 200 GB',    amount: 18900, dayOfMonth: 1, paymentSource: 'nu', category: 'subscriptions', active: true },
    ],

    receivables: [
      { id: 'rec_d1', personName: 'Camilo Torres',  description: 'División del Uber',          amount:  25000, createdDate: ago(6).slice(0, 10),  paid: false },
      { id: 'rec_d2', personName: 'Laura Gómez',    description: 'Cena cumpleaños del grupo',  amount:  85000, createdDate: ago(9).slice(0, 10),  paid: false },
    ],
  };

  localStorage.setItem('finance-demo', JSON.stringify({ state, version: 0 }));
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('finance_auth') === '1') {
      window.location.replace('/');
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const uname = username.trim().toLowerCase();

    let valid = false;
    if (uname === 'saldaf') {
      const pass = localStorage.getItem('finance_password') || SALDAF_DEFAULT_PASS;
      valid = password === pass;
    } else if (uname === 'prueba1') {
      valid = password === PRUEBA_PASS;
    }

    if (valid) {
      setLoading(true);
      localStorage.setItem('finance_auth', '1');
      localStorage.setItem('finance_user', uname);
      if (uname === 'prueba1') seedDemoData();
      // Full page reload so the store picks the correct per-user storage key
      window.location.replace('/');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  }

  return (
    <div className="min-h-screen min-h-dvh bg-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center text-4xl mx-auto mb-4">
            💰
          </div>
          <h1 className="text-3xl font-black text-white mb-1">Finance</h1>
          <p className="text-muted text-sm">Tu copiloto financiero personal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1.5">Usuario</label>
            <input
              className="w-full bg-surface2 border border-border rounded-2xl px-4 py-3.5 text-white text-sm placeholder-muted outline-none focus:border-primary transition-colors"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-secondary block mb-1.5">Contraseña</label>
            <input
              type="password"
              className="w-full bg-surface2 border border-border rounded-2xl px-4 py-3.5 text-white text-sm placeholder-muted outline-none focus:border-primary transition-colors"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-center font-semibold" style={{ color: '#FF6B6B' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-base mt-2 disabled:opacity-50"
            style={{ boxShadow: '0 4px 20px rgba(220,38,38,0.35)' }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
