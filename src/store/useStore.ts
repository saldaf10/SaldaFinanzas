'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Budget, UserProfile } from '../types';

interface Store {
  transactions: Transaction[];
  budgets: Budget[];
  profile: UserProfile;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (b: Budget) => void;
  deleteBudget: (categoryId: string, month: string) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  clearAllData: () => void;
}

const now = new Date();
const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const SAMPLE: Transaction[] = [
  { id: 'd1', type: 'income', amount: 5000000, description: 'Nómina mayo', category: 'salary', date: `${m}-01` },
  { id: 'd2', type: 'expense', amount: 45000, description: 'Rappi - Pizza', category: 'food_delivery', date: `${m}-03`, rating: 3 },
  { id: 'd3', type: 'expense', amount: 120000, description: 'Terpel - Gasolina', category: 'fuel', date: `${m}-04`, rating: 5 },
  { id: 'd4', type: 'expense', amount: 37900, description: 'Netflix', category: 'subscriptions', date: `${m}-05`, rating: 4 },
  { id: 'd5', type: 'expense', amount: 280000, description: 'H&M - Ropa', category: 'shopping', date: `${m}-06`, rating: 2 },
  { id: 'd6', type: 'expense', amount: 35000, description: 'Almuerzo El Corral', category: 'food', date: `${m}-07`, rating: 4 },
  { id: 'd7', type: 'income', amount: 800000, description: 'Proyecto freelance', category: 'freelance', date: `${m}-08` },
  { id: 'd8', type: 'expense', amount: 18000, description: 'Uber - Oficina', category: 'transport', date: `${m}-09`, rating: 4 },
  { id: 'd9', type: 'expense', amount: 180000, description: 'Bodytech - Mensualidad', category: 'gym', date: `${m}-10`, rating: 5 },
  { id: 'd10', type: 'expense', amount: 65000, description: 'Cine', category: 'entertainment', date: `${m}-11`, rating: 3 },
];

const safeStorage = typeof window !== 'undefined' ? localStorage : {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  length: 0,
  clear: () => {},
  key: () => null,
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      transactions: SAMPLE,
      budgets: [],
      profile: { name: 'Sebastián', monthlyIncomeGoal: 5000000, currency: 'COP' },

      addTransaction: (t) => {
        const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ transactions: [{ ...t, id }, ...s.transactions] }));
      },
      updateTransaction: (id, updates) =>
        set((s) => ({ transactions: s.transactions.map((t) => t.id === id ? { ...t, ...updates } : t) })),
      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      setBudget: (b) =>
        set((s) => {
          const idx = s.budgets.findIndex((x) => x.categoryId === b.categoryId && x.month === b.month);
          if (idx >= 0) { const updated = [...s.budgets]; updated[idx] = b; return { budgets: updated }; }
          return { budgets: [...s.budgets, b] };
        }),
      deleteBudget: (categoryId, month) =>
        set((s) => ({ budgets: s.budgets.filter((b) => !(b.categoryId === categoryId && b.month === month)) })),
      updateProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      clearAllData: () => set({ transactions: [], budgets: [] }),
    }),
    {
      name: 'finance-ai-pwa',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
