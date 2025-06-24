import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

// Criar o roteador para transações
const transactionsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar middleware de autenticação em todas as rotas
transactionsRouter.use('*', authMiddleware);

// Schema para validação de transação
const transactionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense'], { 
    errorMap: () => ({ message: 'Tipo deve ser income ou expense' })
  }),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
});

// Schema para atualização de transação
const updateTransactionSchema = transactionSchema.partial();

// Rota para listar transações
transactionsRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;
    
    // Parâmetros de filtro
    const type = c.req.query('type') as 'income' | 'expense' | undefined;
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const categoryId = c.req.query('categoryId');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    // Construir a query com filtros
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params: any[] = [userId];

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (startDate) {
      query += ' AND t.date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.date <= ?';
      params.push(endDate);
    }

    if (categoryId) {
      query += ' AND t.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const transactions = await db.prepare(query).bind(...params).all();

    return c.json(transactions.results);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return c.json({ error: 'Erro ao buscar transações' }, 500);
  }
});

// Rota para criar transação
transactionsRouter.post('/', zValidator('json', transactionSchema), async (c) => {
  try {
    const { date, description, amount, type, category_id } = c.req.valid('json');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a categoria existe
    const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id = "default")').bind(category_id, userId).first();
    if (!category) {
      return c.json({ error: 'Categoria não encontrada' }, 404);
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await db.prepare(
      'INSERT INTO transactions (id, date, description, amount, type, category_id, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, date, description, amount, type, category_id, userId, now).run();

    // Buscar a transação recém-criada com detalhes da categoria
    const query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `;
    const transaction = await db.prepare(query).bind(id).first();
    if (!transaction) {
      return c.json({ error: 'Erro ao criar transação' }, 500);
    }

    return c.json(transaction, 201);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return c.json({ error: 'Erro ao criar transação' }, 500);
  }
});

// Rota para obter transação por ID
transactionsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    const query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ? AND t.user_id = ?
    `;
    const transaction = await db.prepare(query).bind(id, userId).first();
    if (!transaction) {
      return c.json({ error: 'Transação não encontrada' }, 404);
    }

    return c.json(transaction);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return c.json({ error: 'Erro ao buscar transação' }, 500);
  }
});

// Rota para atualizar transação
transactionsRouter.put('/:id', zValidator('json', updateTransactionSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a transação existe e pertence ao usuário
    const existingTransaction = await db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').bind(id, userId).first();
    if (!existingTransaction) {
      return c.json({ error: 'Transação não encontrada ou você não tem permissão para editá-la' }, 404);
    }

    const updates = c.req.valid('json');

    // Se a categoria foi atualizada, verificar se ela existe
    if (updates.category_id) {
      const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id = "default")').bind(updates.category_id, userId).first();
      if (!category) {
        return c.json({ error: 'Categoria não encontrada' }, 404);
      }
    }

    // Construir a query de atualização dinamicamente
    let query = 'UPDATE transactions SET';
    const params: any[] = [];
    let hasUpdates = false;

    if (updates.date !== undefined) {
      query += ' date = ?,';
      params.push(updates.date);
      hasUpdates = true;
    }

    if (updates.description !== undefined) {
      query += ' description = ?,';
      params.push(updates.description);
      hasUpdates = true;
    }

    if (updates.amount !== undefined) {
      query += ' amount = ?,';
      params.push(updates.amount);
      hasUpdates = true;
    }

    if (updates.type !== undefined) {
      query += ' type = ?,';
      params.push(updates.type);
      hasUpdates = true;
    }

    if (updates.category_id !== undefined) {
      query += ' category_id = ?,';
      params.push(updates.category_id);
      hasUpdates = true;
    }

    // Remover a vírgula final e adicionar a condição WHERE
    if (hasUpdates) {
      query = query.slice(0, -1) + ' WHERE id = ? AND user_id = ?';
      params.push(id, userId);
      
      await db.prepare(query).bind(...params).run();
    }

    // Buscar a transação atualizada com detalhes da categoria
    const selectQuery = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `;
    const transaction = await db.prepare(selectQuery).bind(id).first();
    if (!transaction) {
      return c.json({ error: 'Erro ao atualizar transação' }, 500);
    }

    return c.json(transaction);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return c.json({ error: 'Erro ao atualizar transação' }, 500);
  }
});

// Rota para excluir transação
transactionsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await db.prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?').bind(id, userId).first();
    if (!transaction) {
      return c.json({ error: 'Transação não encontrada ou você não tem permissão para excluí-la' }, 404);
    }

    // Excluir a transação
    await db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').bind(id, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return c.json({ error: 'Erro ao excluir transação' }, 500);
  }
});

// Rota para obter resumo por período
transactionsRouter.get('/summary', async (c) => {
  try {
    const userId = c.get('userId');
    const startDate = c.req.query('startDate') || '';
    const endDate = c.req.query('endDate') || '';
    const db = c.env.DB;

    // Validar datas
    if (!startDate || !endDate) {
      return c.json({ error: 'Datas de início e fim são obrigatórias' }, 400);
    }

    // Obter total de receitas
    const incomeQuery = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND type = 'income' AND date BETWEEN ? AND ?
    `;
    const income = await db.prepare(incomeQuery).bind(userId, startDate, endDate).first<{ total: number }>();

    // Obter total de despesas
    const expenseQuery = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND date BETWEEN ? AND ?
    `;
    const expense = await db.prepare(expenseQuery).bind(userId, startDate, endDate).first<{ total: number }>();

    // Obter resumo por categoria (receitas)
    const incomeByCategory = `
      SELECT c.id, c.name, c.color, c.icon, COALESCE(SUM(t.amount), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.date BETWEEN ? AND ?
      WHERE (c.user_id = ? OR c.user_id = 'default') AND c.type = 'income' AND (t.user_id = ? OR t.user_id IS NULL)
      GROUP BY c.id
      ORDER BY total DESC
    `;
    const incomeByCategoryResults = await db.prepare(incomeByCategory).bind(startDate, endDate, userId, userId).all();

    // Obter resumo por categoria (despesas)
    const expenseByCategory = `
      SELECT c.id, c.name, c.color, c.icon, COALESCE(SUM(t.amount), 0) as total
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id AND t.date BETWEEN ? AND ?
      WHERE (c.user_id = ? OR c.user_id = 'default') AND c.type = 'expense' AND (t.user_id = ? OR t.user_id IS NULL)
      GROUP BY c.id
      ORDER BY total DESC
    `;
    const expenseByCategoryResults = await db.prepare(expenseByCategory).bind(startDate, endDate, userId, userId).all();

    return c.json({
      income: income?.total || 0,
      expense: expense?.total || 0,
      balance: (income?.total || 0) - (expense?.total || 0),
      incomeByCategory: incomeByCategoryResults.results,
      expenseByCategory: expenseByCategoryResults.results,
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    return c.json({ error: 'Erro ao buscar resumo' }, 500);
  }
});

export default transactionsRouter; 