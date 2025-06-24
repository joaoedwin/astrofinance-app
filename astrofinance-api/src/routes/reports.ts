import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

// Criar o roteador para relatórios
const reportsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar middleware de autenticação em todas as rotas
reportsRouter.use('*', authMiddleware);

// Schema para validação de período
const periodSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD'),
});

// Interfaces para tipagem
interface MonthlyData {
  [month: string]: {
    income: number;
    expense: number;
    balance: number;
    categories: {
      income: Array<CategoryData>;
      expense: Array<CategoryData>;
    };
  };
}

interface CategoryData {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
}

interface TransactionItem {
  month: string;
  type: 'income' | 'expense';
  total: number;
}

interface CategoryItem {
  month: string;
  type: 'income' | 'expense';
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
}

interface DailyData {
  [date: string]: {
    income: number;
    expense: number;
    daily_balance: number;
    cumulative_balance: number;
  };
}

interface CashFlowItem {
  date: string;
  type: 'income' | 'expense';
  total: number;
}

interface CategoryReport {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  total: number;
  transaction_count: number;
}

// Rota para relatório mensal
reportsRouter.get('/monthly', zValidator('query', periodSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { startDate, endDate } = c.req.valid('query');
    const db = c.env.DB;

    // Obter todas as transações do período
    const transactionsQuery = `
      SELECT 
        strftime('%Y-%m', date) as month,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY month, type
      ORDER BY month
    `;
    const transactions = await db.prepare(transactionsQuery).bind(userId, startDate, endDate).all<TransactionItem>();

    // Obter categorias por mês
    const categoriesQuery = `
      SELECT 
        strftime('%Y-%m', t.date) as month,
        t.type,
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ?
      GROUP BY month, t.type, c.id
      ORDER BY month, t.type, total DESC
    `;
    const categories = await db.prepare(categoriesQuery).bind(userId, startDate, endDate).all<CategoryItem>();

    // Processar os dados para formar o relatório mensal
    const monthlyData: MonthlyData = {};
    
    // Processar transações
    transactions.results.forEach(item => {
      if (!monthlyData[item.month]) {
        monthlyData[item.month] = {
          income: 0,
          expense: 0,
          balance: 0,
          categories: {
            income: [],
            expense: []
          }
        };
      }
      
      monthlyData[item.month][item.type] = item.total;
      monthlyData[item.month].balance = monthlyData[item.month].income - monthlyData[item.month].expense;
    });
    
    // Processar categorias
    categories.results.forEach(item => {
      if (monthlyData[item.month]) {
        monthlyData[item.month].categories[item.type].push({
          id: item.category_id,
          name: item.category_name,
          color: item.category_color,
          icon: item.category_icon,
          total: item.total
        });
      }
    });

    return c.json({
      startDate,
      endDate,
      months: monthlyData
    });
  } catch (error) {
    console.error('Erro ao gerar relatório mensal:', error);
    return c.json({ error: 'Erro ao gerar relatório mensal' }, 500);
  }
});

// Rota para relatório por categoria
reportsRouter.get('/by-category', zValidator('query', periodSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { startDate, endDate } = c.req.valid('query');
    const db = c.env.DB;

    // Obter totais por categoria
    const query = `
      SELECT 
        c.id,
        c.name,
        c.type,
        c.color,
        c.icon,
        SUM(t.amount) as total,
        COUNT(t.id) as transaction_count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.date BETWEEN ? AND ?
      GROUP BY c.id
      ORDER BY c.type, total DESC
    `;
    const categories = await db.prepare(query).bind(userId, startDate, endDate).all<CategoryReport>();

    // Separar categorias por tipo
    const incomeCategories = categories.results.filter(cat => cat.type === 'income');
    const expenseCategories = categories.results.filter(cat => cat.type === 'expense');

    // Calcular totais
    const totalIncome = incomeCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    const totalExpense = expenseCategories.reduce((sum, cat) => sum + Number(cat.total), 0);
    const balance = totalIncome - totalExpense;

    return c.json({
      startDate,
      endDate,
      income: {
        total: totalIncome,
        categories: incomeCategories
      },
      expense: {
        total: totalExpense,
        categories: expenseCategories
      },
      balance
    });
  } catch (error) {
    console.error('Erro ao gerar relatório por categoria:', error);
    return c.json({ error: 'Erro ao gerar relatório por categoria' }, 500);
  }
});

// Rota para relatório de fluxo de caixa
reportsRouter.get('/cash-flow', zValidator('query', periodSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { startDate, endDate } = c.req.valid('query');
    const db = c.env.DB;

    // Obter fluxo de caixa diário
    const query = `
      SELECT 
        date,
        type,
        SUM(amount) as total
      FROM transactions
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY date, type
      ORDER BY date
    `;
    const cashFlow = await db.prepare(query).bind(userId, startDate, endDate).all<CashFlowItem>();

    // Processar os dados para formar o relatório de fluxo de caixa
    const dailyData: DailyData = {};
    let cumulativeBalance = 0;
    
    cashFlow.results.forEach(item => {
      if (!dailyData[item.date]) {
        dailyData[item.date] = {
          income: 0,
          expense: 0,
          daily_balance: 0,
          cumulative_balance: 0
        };
      }
      
      dailyData[item.date][item.type] = item.total;
      dailyData[item.date].daily_balance = dailyData[item.date].income - dailyData[item.date].expense;
      cumulativeBalance += dailyData[item.date].daily_balance;
      dailyData[item.date].cumulative_balance = cumulativeBalance;
    });

    return c.json({
      startDate,
      endDate,
      days: dailyData,
      final_balance: cumulativeBalance
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de fluxo de caixa:', error);
    return c.json({ error: 'Erro ao gerar relatório de fluxo de caixa' }, 500);
  }
});

// Rota para relatório de metas
reportsRouter.get('/goals', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;

    // Obter metas ativas
    const goalsQuery = `
      SELECT 
        g.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM goals g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.user_id = ? AND g.status = 'active'
      ORDER BY g.end_date
    `;
    const goals = await db.prepare(goalsQuery).bind(userId).all();

    // Para cada meta, obter as reservas
    const goalsWithReserves = [];
    
    for (const goal of goals.results) {
      const reservesQuery = `
        SELECT * FROM goal_reserves 
        WHERE goal_id = ? AND user_id = ? 
        ORDER BY month
      `;
      const reserves = await db.prepare(reservesQuery).bind(goal.id, userId).all();
      
      // Calcular progresso
      const progress = Math.min(100, (Number(goal.current_amount) / Number(goal.target_amount)) * 100);
      
      goalsWithReserves.push({
        ...goal,
        reserves: reserves.results,
        progress: progress
      });
    }

    return c.json({
      goals: goalsWithReserves
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de metas:', error);
    return c.json({ error: 'Erro ao gerar relatório de metas' }, 500);
  }
});

export default reportsRouter; 