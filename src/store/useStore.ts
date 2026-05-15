'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Budget, UserProfile, Subscription, Receivable } from '../types';

interface Store {
  transactions: Transaction[];
  budgets: Budget[];
  profile: UserProfile;
  subscriptions: Subscription[];
  receivables: Receivable[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (b: Budget) => void;
  deleteBudget: (categoryId: string, month: string) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  clearAllData: () => void;
  addSubscription: (s: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  addReceivable: (r: Omit<Receivable, 'id'>) => void;
  markReceivablePaid: (id: string) => void;
  deleteReceivable: (id: string) => void;
  applyMonthlySubscriptions: () => void;
}


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
    (set, get) => ({
      transactions: [],
      budgets: [],
      profile: { name: 'saldaf', monthlyIncomeGoal: 0, currency: 'COP' },
      subscriptions: [],
      receivables: [],

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

      addSubscription: (s) => {
        const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((st) => ({ subscriptions: [...st.subscriptions, { ...s, id }] }));
      },
      updateSubscription: (id, updates) =>
        set((s) => ({ subscriptions: s.subscriptions.map((x) => x.id === id ? { ...x, ...updates } : x) })),
      deleteSubscription: (id) =>
        set((s) => ({ subscriptions: s.subscriptions.filter((x) => x.id !== id) })),

      addReceivable: (r) => {
        const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ receivables: [...s.receivables, { ...r, id }] }));
      },
      markReceivablePaid: (id) => {
        const state = get();
        const rec = state.receivables.find((r) => r.id === id);
        if (!rec || rec.paid) return;
        const paidDate = new Date().toISOString().slice(0, 10);
        const txId = `tx_rec_${Date.now()}`;
        set((s) => ({
          receivables: s.receivables.map((r) => r.id === id ? { ...r, paid: true, paidDate } : r),
          transactions: [{
            id: txId, type: 'income', amount: rec.amount,
            description: `💸 ${rec.personName} me pagó: ${rec.description}`,
            category: 'other_income', date: paidDate + 'T12:00:00.000Z',
            tags: [`rec:${id}`],
          }, ...s.transactions],
        }));
      },
      deleteReceivable: (id) =>
        set((s) => ({ receivables: s.receivables.filter((r) => r.id !== id) })),

      applyMonthlySubscriptions: () => {
        const state = get();
        const today = new Date();
        const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        const newTxs: Transaction[] = [];
        state.subscriptions.filter((s) => s.active).forEach((sub) => {
          const alreadyCharged = state.transactions.some(
            (t) => t.tags?.includes(`sub:${sub.id}`) && t.date.startsWith(monthKey)
          );
          if (!alreadyCharged && today.getDate() >= sub.dayOfMonth) {
            const day = String(sub.dayOfMonth).padStart(2, '0');
            newTxs.push({
              id: `tx_sub_${sub.id}_${monthKey}`,
              type: 'expense', amount: sub.amount,
              description: sub.name, category: sub.category,
              date: `${monthKey}-${day}T12:00:00.000Z`,
              tags: [`sub:${sub.id}`, sub.paymentSource],
            });
          }
        });
        if (newTxs.length > 0)
          set((s) => ({ transactions: [...newTxs, ...s.transactions] }));
      },
    }),
    {
      name: 'finance-v2',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
