import { Database as BetterSQLite3Database } from 'better-sqlite3';

export type TransactionType = 'income' | 'expense';
export type GoalType = 'saving' | 'spending' | 'purchase';
export type GoalStatus = 'active' | 'completed' | 'cancelled';
export type GoalRecurrence = 'monthly' | 'yearly' | 'custom';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role?: string;
  created_at?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  user_id: string;
  created_at?: string;
  color?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  user_id: string;
  created_at?: string;
}

export interface Installment {
  id: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: string;
  nextPaymentDate: string;
  userId: string;
  category_id: string;
  type: 'expense';
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  category_id?: string;
  type: GoalType;
  recurrence?: GoalRecurrence;
  start_date: string;
  end_date?: string;
  status: GoalStatus;
  created_at?: string;
  completed_at?: string;
}

export interface Database extends BetterSQLite3Database {
  all<T = any>(sql: string, params?: any[]): Promise<T[]>;
  get<T = any>(sql: string, params?: any[]): Promise<T>;
  run(sql: string, params?: any[]): Promise<{ lastID: number; changes: number }>;
} 