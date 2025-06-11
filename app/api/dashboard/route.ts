import { NextResponse } from "next/server"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import type {
  TransactionWithCategory,
  InstallmentWithCategory,
  CategoryExpense,
  MonthlyData,
  MonthSummary,
  DashboardResponse
} from '@/types/dashboard'
import type { TransactionType } from '@/types/database'

// Função auxiliar para determinar o valor de uma transação ou instalação
function getItemAmount(item: TransactionWithCategory | InstallmentWithCategory): number {
  if ('amount' in item && typeof item.amount === 'number') {
    return item.amount;
  }
  if ('installmentAmount' in item && typeof item.installmentAmount === 'number') {
    return item.installmentAmount;
  }
  return 0;
}

// Função auxiliar para verificar o tipo da transação
function isTransactionType(type: string): type is TransactionType {
  return type === 'income' || type === 'expense';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    console.log('Parâmetros recebidos:', { userId, month, year });
    const db = getDatabase();
    const allTransactions = await db.all('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    console.log('Transações do usuário:', allTransactions);

    if (!userId || !month || !year) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    // Busca transações do mês
    const monthTransactions = await db.all<TransactionWithCategory>(
      `SELECT t.*, c.name as category 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND substr(t.date, 1, 7) = ?`,
      [userId, `${year}-${month.padStart(2, '0')}`]
    );

    // Busca todos os parcelamentos do usuário
    const allInstallments = await db.all<InstallmentWithCategory>(
      `SELECT i.*, c.name as category 
       FROM installments i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.userId = ?`,
      [userId]
    );

    // Para cada parcelamento, verifica se existe parcela para o mês/ano atual
    const monthInstallments = allInstallments.flatMap((installment) => {
      const startDate = new Date(installment.startDate);
      const startMonth = startDate.getMonth() + 1;
      const startYear = startDate.getFullYear();
      const monthsDiff = (Number(year) - startYear) * 12 + (Number(month) - startMonth);
      const currentInstallmentNumber = monthsDiff + 1;
      if (currentInstallmentNumber < 1 || currentInstallmentNumber > installment.totalInstallments) {
        return [];
      }
      // Garantir que category é string e adicionar installmentNumber sempre como number
      return [{ ...installment, category: String(installment.category || ''), installmentNumber: Number(currentInstallmentNumber) }];
    });

    // Calcula totais do mês atual
    const totalIncome = monthTransactions
      .filter(t => isTransactionType(t.type) && t.type === 'income')
      .reduce((sum, t) => sum + getItemAmount(t), 0);

    const totalExpense = monthTransactions
      .filter(t => isTransactionType(t.type) && t.type === 'expense')
      .reduce((sum, t) => sum + getItemAmount(t), 0) +
      monthInstallments.reduce((sum, i) => sum + (i.installmentAmount || 0), 0);

    // Calcula despesas por categoria
    const expensesByCategory = [...monthTransactions, ...monthInstallments]
      .filter((item) => {
        return typeof (item as any).category === 'string' &&
          (typeof (item as any).installmentAmount === 'number' || (isTransactionType((item as any).type) && (item as any).type === 'expense'));
      })
      .reduce<CategoryExpense[]>((acc, item) => {
        const amount = 'installmentAmount' in item ? item.installmentAmount : getItemAmount(item);
        const category = String((item as any).category || '');
        const existingCategory = acc.find(c => c.category === category);
        if (existingCategory) {
          existingCategory.amount += amount;
        } else {
          acc.push({
            category,
            amount,
            percentage: 0
          });
        }
        return acc;
      }, [])
      .map(category => ({
        ...category,
        percentage: (category.amount / totalExpense) * 100
      }))
      .sort((a, b) => b.amount - a.amount);

    const currentMonthData: MonthlyData = {
      transactions: monthTransactions,
      installments: monthInstallments,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      expensesByCategory
    };

    // Busca dados do mês anterior para comparação
    const previousMonth = month === '1' ? '12' : String(Number(month) - 1).padStart(2, '0');
    const previousYear = month === '1' ? String(Number(year) - 1) : year;

    const previousMonthTransactions = await db.all<TransactionWithCategory>(
      `SELECT t.*, c.name as category 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND substr(t.date, 1, 7) = ?`,
      [userId, `${previousYear}-${previousMonth}`]
    );

    const previousMonthInstallments = await db.all<InstallmentWithCategory>(
      `SELECT i.*, c.name as category 
       FROM installments i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.userId = ? AND substr(i.nextPaymentDate, 1, 7) = ?`,
      [userId, `${previousYear}-${previousMonth}`]
    );

    const previousTotalIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + getItemAmount(t), 0);

    const previousTotalExpense = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + getItemAmount(t), 0) +
      previousMonthInstallments.reduce((sum, i) => sum + getItemAmount(i), 0);

    const previousMonthData: MonthlyData = {
      transactions: previousMonthTransactions,
      installments: previousMonthInstallments,
      totalIncome: previousTotalIncome,
      totalExpense: previousTotalExpense,
      balance: previousTotalIncome - previousTotalExpense,
      expensesByCategory: []
    };

    // Calcula dados mensais para o gráfico
    const monthlyData: MonthSummary[] = [];
    for (let i = 11; i >= 0; i--) {
      const currentDate = new Date(Number(year), Number(month) - i - 1);
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const yearStr = String(currentDate.getFullYear());

      const transactions = await db.all<TransactionWithCategory>(
        `SELECT t.*, c.name as category 
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = ? AND substr(t.date, 1, 7) = ?`,
        [userId, `${yearStr}-${monthStr}`]
      );

      const installments = await db.all<InstallmentWithCategory>(
        `SELECT i.*, c.name as category 
         FROM installments i
         LEFT JOIN categories c ON i.category_id = c.id
         WHERE i.userId = ? AND substr(i.nextPaymentDate, 1, 7) = ?`,
        [userId, `${yearStr}-${monthStr}`]
      );

      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + getItemAmount(t), 0);

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + getItemAmount(t), 0) +
        installments.reduce((sum, i) => sum + getItemAmount(i), 0);

      monthlyData.push({
        month: currentDate.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
        income,
        expenses,
        balance: income - expenses
      });
    }

    const response: DashboardResponse = {
      currentMonth: currentMonthData,
      previousMonth: previousMonthData,
      trends: {
        income: previousTotalIncome ? ((totalIncome - previousTotalIncome) / previousTotalIncome) * 100 : 0,
        expense: previousTotalExpense ? ((totalExpense - previousTotalExpense) / previousTotalExpense) * 100 : 0,
        balance: previousMonthData.balance ? ((currentMonthData.balance - previousMonthData.balance) / Math.abs(previousMonthData.balance)) * 100 : 0
      },
      monthlyData
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    );
  }
} 