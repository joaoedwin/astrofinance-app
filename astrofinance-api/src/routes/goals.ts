import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

// Criar o roteador para metas
const goalsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar middleware de autenticação em todas as rotas
goalsRouter.use('*', authMiddleware);

// Schema para validação de meta
const goalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  target_amount: z.number().positive('Valor alvo deve ser positivo'),
  current_amount: z.number().min(0, 'Valor atual não pode ser negativo').optional(),
  category_id: z.string().optional(),
  type: z.enum(['saving', 'spending', 'purchase'], { 
    errorMap: () => ({ message: 'Tipo deve ser saving, spending ou purchase' })
  }),
  recurrence: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD').optional(),
  status: z.enum(['active', 'completed', 'cancelled']).default('active'),
});

// Schema para atualização de meta
const updateGoalSchema = goalSchema.partial();

// Schema para validação de reserva de meta
const goalReserveSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês deve estar no formato YYYY-MM'),
});

// Rota para listar metas
goalsRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;
    
    // Parâmetros de filtro
    const type = c.req.query('type') as 'saving' | 'spending' | 'purchase' | undefined;
    const status = c.req.query('status') as 'active' | 'completed' | 'cancelled' | undefined;
    const categoryId = c.req.query('categoryId');

    // Construir a query com filtros
    let query = `
      SELECT g.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM goals g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.user_id = ?
    `;
    const params: any[] = [userId];

    if (type) {
      query += ' AND g.type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND g.status = ?';
      params.push(status);
    }

    if (categoryId) {
      query += ' AND g.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY g.end_date ASC, g.created_at DESC';

    const goals = await db.prepare(query).bind(...params).all();

    return c.json(goals.results);
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return c.json({ error: 'Erro ao buscar metas' }, 500);
  }
});

// Rota para criar meta
goalsRouter.post('/', zValidator('json', goalSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a categoria existe, se fornecida
    if (data.category_id) {
      const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id = "default")').bind(data.category_id, userId).first();
      if (!category) {
        return c.json({ error: 'Categoria não encontrada' }, 404);
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO goals (
        id, user_id, name, description, target_amount, current_amount, 
        category_id, type, recurrence, start_date, end_date, 
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      userId, 
      data.name, 
      data.description || null, 
      data.target_amount,
      data.current_amount || 0,
      data.category_id || null,
      data.type,
      data.recurrence || null,
      data.start_date,
      data.end_date || null,
      data.status,
      now
    ).run();

    // Buscar a meta recém-criada com detalhes da categoria
    const query = `
      SELECT g.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM goals g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.id = ?
    `;
    const goal = await db.prepare(query).bind(id).first();
    if (!goal) {
      return c.json({ error: 'Erro ao criar meta' }, 500);
    }

    return c.json(goal, 201);
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    return c.json({ error: 'Erro ao criar meta' }, 500);
  }
});

// Rota para obter meta por ID
goalsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    const query = `
      SELECT g.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM goals g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.id = ? AND g.user_id = ?
    `;
    const goal = await db.prepare(query).bind(id, userId).first();
    if (!goal) {
      return c.json({ error: 'Meta não encontrada' }, 404);
    }

    return c.json(goal);
  } catch (error) {
    console.error('Erro ao buscar meta:', error);
    return c.json({ error: 'Erro ao buscar meta' }, 500);
  }
});

// Rota para atualizar meta
goalsRouter.put('/:id', zValidator('json', updateGoalSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const updates = c.req.valid('json');
    const db = c.env.DB;

    // Verificar se a meta existe e pertence ao usuário
    const existingGoal = await db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').bind(id, userId).first();
    if (!existingGoal) {
      return c.json({ error: 'Meta não encontrada ou você não tem permissão para editá-la' }, 404);
    }

    // Se a categoria foi atualizada, verificar se ela existe
    if (updates.category_id) {
      const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id = "default")').bind(updates.category_id, userId).first();
      if (!category) {
        return c.json({ error: 'Categoria não encontrada' }, 404);
      }
    }

    // Construir a query de atualização dinamicamente
    let query = 'UPDATE goals SET';
    const params: any[] = [];
    let hasUpdates = false;

    if (updates.name !== undefined) {
      query += ' name = ?,';
      params.push(updates.name);
      hasUpdates = true;
    }

    if (updates.description !== undefined) {
      query += ' description = ?,';
      params.push(updates.description || null);
      hasUpdates = true;
    }

    if (updates.target_amount !== undefined) {
      query += ' target_amount = ?,';
      params.push(updates.target_amount);
      hasUpdates = true;
    }

    if (updates.current_amount !== undefined) {
      query += ' current_amount = ?,';
      params.push(updates.current_amount);
      hasUpdates = true;
    }

    if (updates.category_id !== undefined) {
      query += ' category_id = ?,';
      params.push(updates.category_id || null);
      hasUpdates = true;
    }

    if (updates.type !== undefined) {
      query += ' type = ?,';
      params.push(updates.type);
      hasUpdates = true;
    }

    if (updates.recurrence !== undefined) {
      query += ' recurrence = ?,';
      params.push(updates.recurrence || null);
      hasUpdates = true;
    }

    if (updates.start_date !== undefined) {
      query += ' start_date = ?,';
      params.push(updates.start_date);
      hasUpdates = true;
    }

    if (updates.end_date !== undefined) {
      query += ' end_date = ?,';
      params.push(updates.end_date || null);
      hasUpdates = true;
    }

    if (updates.status !== undefined) {
      query += ' status = ?,';
      params.push(updates.status);
      
      // Se o status foi alterado para "completed", atualizar a data de conclusão
      if (updates.status === 'completed' && existingGoal.status !== 'completed') {
        query += ' completed_at = ?,';
        params.push(new Date().toISOString());
      } else if (updates.status !== 'completed' && existingGoal.status === 'completed') {
        query += ' completed_at = ?,';
        params.push(null);
      }
      
      hasUpdates = true;
    }

    // Remover a vírgula final e adicionar a condição WHERE
    if (hasUpdates) {
      query = query.slice(0, -1) + ' WHERE id = ? AND user_id = ?';
      params.push(id, userId);
      
      await db.prepare(query).bind(...params).run();
    }

    // Buscar a meta atualizada com detalhes da categoria
    const selectQuery = `
      SELECT g.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM goals g
      LEFT JOIN categories c ON g.category_id = c.id
      WHERE g.id = ?
    `;
    const goal = await db.prepare(selectQuery).bind(id).first();
    if (!goal) {
      return c.json({ error: 'Erro ao atualizar meta' }, 500);
    }

    return c.json(goal);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    return c.json({ error: 'Erro ao atualizar meta' }, 500);
  }
});

// Rota para excluir meta
goalsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a meta existe e pertence ao usuário
    const goal = await db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').bind(id, userId).first();
    if (!goal) {
      return c.json({ error: 'Meta não encontrada ou você não tem permissão para excluí-la' }, 404);
    }

    // Excluir todas as reservas associadas à meta
    await db.prepare('DELETE FROM goal_reserves WHERE goal_id = ?').bind(id).run();

    // Excluir a meta
    await db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').bind(id, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir meta:', error);
    return c.json({ error: 'Erro ao excluir meta' }, 500);
  }
});

// Rota para adicionar reserva a uma meta
goalsRouter.post('/:id/reserves', zValidator('json', goalReserveSchema), async (c) => {
  try {
    const goalId = c.req.param('id');
    const { amount, month } = c.req.valid('json');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a meta existe e pertence ao usuário
    const goal = await db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').bind(goalId, userId).first();
    if (!goal) {
      return c.json({ error: 'Meta não encontrada ou você não tem permissão para editá-la' }, 404);
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    // Verificar se já existe uma reserva para este mês
    const existingReserve = await db.prepare(
      'SELECT * FROM goal_reserves WHERE goal_id = ? AND user_id = ? AND month = ?'
    ).bind(goalId, userId, month).first();

    if (existingReserve) {
      // Atualizar a reserva existente
      await db.prepare(
        'UPDATE goal_reserves SET amount = ? WHERE id = ?'
      ).bind(amount, existingReserve.id).run();

      // Buscar a reserva atualizada
      const updatedReserve = await db.prepare('SELECT * FROM goal_reserves WHERE id = ?').bind(existingReserve.id).first();
      return c.json(updatedReserve);
    } else {
      // Criar uma nova reserva
      await db.prepare(
        'INSERT INTO goal_reserves (id, goal_id, user_id, month, amount, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, goalId, userId, month, amount, now).run();

      // Buscar a reserva recém-criada
      const reserve = await db.prepare('SELECT * FROM goal_reserves WHERE id = ?').bind(id).first();
      if (!reserve) {
        return c.json({ error: 'Erro ao criar reserva' }, 500);
      }

      return c.json(reserve, 201);
    }
  } catch (error) {
    console.error('Erro ao adicionar reserva:', error);
    return c.json({ error: 'Erro ao adicionar reserva' }, 500);
  }
});

// Rota para listar reservas de uma meta
goalsRouter.get('/:id/reserves', async (c) => {
  try {
    const goalId = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a meta existe e pertence ao usuário
    const goal = await db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').bind(goalId, userId).first();
    if (!goal) {
      return c.json({ error: 'Meta não encontrada ou você não tem permissão para acessá-la' }, 404);
    }

    // Buscar todas as reservas da meta
    const reserves = await db.prepare(
      'SELECT * FROM goal_reserves WHERE goal_id = ? AND user_id = ? ORDER BY month'
    ).bind(goalId, userId).all();

    return c.json(reserves.results);
  } catch (error) {
    console.error('Erro ao buscar reservas:', error);
    return c.json({ error: 'Erro ao buscar reservas' }, 500);
  }
});

// Rota para excluir uma reserva
goalsRouter.delete('/:goalId/reserves/:reserveId', async (c) => {
  try {
    const goalId = c.req.param('goalId');
    const reserveId = c.req.param('reserveId');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a reserva existe e pertence ao usuário
    const reserve = await db.prepare(
      'SELECT * FROM goal_reserves WHERE id = ? AND goal_id = ? AND user_id = ?'
    ).bind(reserveId, goalId, userId).first();

    if (!reserve) {
      return c.json({ error: 'Reserva não encontrada ou você não tem permissão para excluí-la' }, 404);
    }

    // Excluir a reserva
    await db.prepare('DELETE FROM goal_reserves WHERE id = ?').bind(reserveId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir reserva:', error);
    return c.json({ error: 'Erro ao excluir reserva' }, 500);
  }
});

export default goalsRouter; 