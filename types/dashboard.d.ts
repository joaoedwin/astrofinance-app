import type { Transaction, Installment, TransactionType } from './database';

export interface TransactionWithCategory extends Transaction {
  category?: string;
}

export interface InstallmentWithCategory extends Installment {
  category?: string;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyData {
  transactions: TransactionWithCategory[];
  installments: InstallmentWithCategory[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: CategoryExpense[];
}

export interface MonthSummary {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface DashboardResponse {
  currentMonth: MonthlyData;
  previousMonth: MonthlyData;
  trends: {
    income: number;
    expense: number;
    balance: number;
  };
  monthlyData: MonthSummary[];
} 