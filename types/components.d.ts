import { Transaction, Category, Installment, Goal } from './database';

export interface TransactionTableProps {
  data: Transaction[];
  categories: Category[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export interface InstallmentProps {
  data: Installment;
  categories: Category[];
  onEdit?: (installment: Installment) => void;
  onDelete?: (id: string) => void;
}

export interface GoalProps {
  data: Goal;
  categories?: Category[];
  onEdit?: (goal: Goal) => void;
  onDelete?: (id: string) => void;
}

export interface DashboardCardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: number;
  loading?: boolean;
}

export interface NotificationProps {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  read: boolean;
  created_at: string;
} 