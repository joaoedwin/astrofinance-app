import type { D1Database } from '@cloudflare/workers-types';

// Tipos para o ambiente do Cloudflare Workers
export type Env = {
  DB: D1Database;
  JWT_SECRET?: string;
  NODE_ENV?: string;
};

// Tipos para variáveis de contexto
export type Variables = {
  userId?: string;
  isAdmin?: boolean;
};

// Tipos para usuários
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string;
  role: 'admin' | 'user';
  created_at: string;
  last_login?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
  last_login?: string;
}

// Tipos para categorias
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  user_id: string;
  created_at: string;
  updated_at?: string;
  color?: string;
  icon?: string;
}

// Tipos para transações
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  user_id: string;
  created_at: string;
}

// Tipos para parcelamentos
export interface Installment {
  id: string;
  description: string;
  category_id: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  startDate: string;
  nextPaymentDate: string;
  userId: string;
  type: 'expense';
  created_at: string;
  creditCardId?: number;
}

// Tipos para cartões de crédito
export interface CreditCard {
  id: number;
  userId: string;
  name: string;
  color: string;
  lastFourDigits?: string;
  bank?: string;
  cardLimit?: number;
  createdAt: string;
  updatedAt: string;
}

// Tipos para metas
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  category_id?: string;
  type: 'saving' | 'spending' | 'purchase';
  recurrence?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  completed_at?: string;
}

// Tipos para reservas de metas
export interface GoalReserve {
  id: string;
  goal_id: string;
  user_id: string;
  month: string;
  amount: number;
  created_at: string;
}

// Tipos para notificações
export interface Notification {
  id: string;
  user_id?: string;
  type?: string;
  message: string;
  created_at: string;
  read: number;
  description?: string;
  created_by?: string;
}

// Tipos para autenticação
export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserResponse;
}

// Tipos para respostas de erro
export interface ErrorResponse {
  error: string;
  status?: number;
} 