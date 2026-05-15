export type TransactionType = 'income' | 'expense';
export type AccountType = 'bank' | 'debt';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  emoji: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
  note?: string;
  rating?: number;
  tags?: string[];
}

export interface Budget {
  categoryId: string;
  amount: number;
  month: string;
}

export interface UserProfile {
  name: string;
  monthlyIncomeGoal: number;
  currency: string;
  openAiKey?: string;
  budgetResetDay: number;
}

export interface CategoryDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'both';
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
  transactionCount: number;
  topCategory: string | null;
  month: string;
}

export interface CategoryBreakdown {
  [categoryId: string]: { amount: number; count: number; percentage: number };
}

export interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  icon: string;
}

export interface ParsedTransaction {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
}

export type PaymentSource = 'nu' | 'hapi' | 'bancolombia';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  paymentSource: PaymentSource;
  category: string;
  active: boolean;
  note?: string;
}

export interface Receivable {
  id: string;
  personName: string;
  description: string;
  amount: number;
  dueDate?: string;
  createdDate: string;
  paid: boolean;
  paidDate?: string;
}
