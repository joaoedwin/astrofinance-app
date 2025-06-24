import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

// Criar o roteador para parcelamentos
const installmentsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar middleware de autenticação em todas as rotas
installmentsRouter.use('*', authMiddleware);

// Schema para validação de parcelamento
const installmentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  category_id: z.string().min(1, 'Categoria é obrigatória'),
  totalAmount: z.number().positive('Valor total deve ser positivo'),
  totalInstallments: z.number().int().positive('Número de parcelas deve ser positivo'),
  paidInstallments: z.number().int().min(0, 'Parcelas pagas não pode ser negativo').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  nextPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data do próximo pagamento deve estar no formato YYYY-MM-DD'),
  creditCardId: z.number().optional(),
  type: z.enum(['expense']).default('expense'),
});

// Schema para atualização de parcelamento
const updateInstallmentSchema = installmentSchema.partial();

// Rota para listar parcelamentos
installmentsRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;
    
    // Parâmetros de filtro
    const categoryId = c.req.query('categoryId');
    const creditCardId = c.req.query('creditCardId');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    // Construir a query com filtros
    let query = `
      SELECT i.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM installments i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.userId = ?
    `;
    const params: any[] = [userId];

    if (categoryId) {
      query += ' AND i.category_id = ?';
      params.push(categoryId);
    }

    if (creditCardId) {
      query += ' AND i.creditCardId = ?';
      params.push(creditCardId);
    }

    query += ' ORDER BY i.nextPaymentDate ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const installments = await db.prepare(query).bind(...params).all();

    return c.json(installments.results);
  } catch (error) {
    console.error('Erro ao buscar parcelamentos:', error);
    return c.json({ error: 'Erro ao buscar parcelamentos' }, 500);
  }
});

// Rota para criar parcelamento
installmentsRouter.post('/', zValidator('json', installmentSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a categoria existe
    const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id = "default")').bind(data.category_id, userId).first();
    if (!category) {
      return c.json({ error: 'Categoria não encontrada' }, 404);
    }

    // Verificar se o cartão de crédito existe, se fornecido
    if (data.creditCardId) {
      const creditCard = await db.prepare('SELECT * FROM credit_cards WHERE id = ? AND userId = ?').bind(data.creditCardId, userId).first();
      if (!creditCard) {
        return c.json({ error: 'Cartão de crédito não encontrado' }, 404);
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const installmentAmount = data.totalAmount / data.totalInstallments;

    await db.prepare(`
      INSERT INTO installments (
        id, description, category_id, totalAmount, installmentAmount, 
        totalInstallments, paidInstallments, startDate, nextPaymentDate, 
        userId, type, created_at, creditCardId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, 
      data.description, 
      data.category_id, 
      data.totalAmount, 
      installmentAmount,
      data.totalInstallments, 
      data.paidInstallments || 0, 
      data.startDate, 
      data.nextPaymentDate,
      userId, 
      data.type, 
      now, 
      data.creditCardId || null
    ).run();

    // Buscar o parcelamento recém-criado com detalhes da categoria
    const query = `
      SELECT i.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM installments i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = ?
    `;
    const installment = await db.prepare(query).bind(id).first();
    if (!installment) {
      return c.json({ error: 'Erro ao criar parcelamento' }, 500);
    }

    return c.json(installment, 201);
  } catch (error) {
    console.error('Erro ao criar parcelamento:', error);
    return c.json({ error: 'Erro ao criar parcelamento' }, 500);
  }
});

// Rota para obter parcelamento por ID
installmentsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    const query = `
      SELECT i.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM installments i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = ? AND i.userId = ?
    `;
    const installment = await db.prepare(query).bind(id, userId).first();
    if (!installment) {
      return c.json({ error: 'Parcelamento não encontrado' }, 404);
    }

    return c.json(installment);
  } catch (error) {
    console.error('Erro ao buscar parcelamento:', error);
    return c.json({ error: 'Erro ao buscar parcelamento' }, 500);
  }
});

// Rota para atualizar parcelamento
installmentsRouter.put('/:id', zValidator('json', updateInstallmentSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const updates = c.req.valid('json');
    const db = c.env.DB;

    // Verificar se o parcelamento existe e pertence ao usuário
    const existingInstallment = await db.prepare('SELECT * FROM installments WHERE id = ? AND userId = ?').bind(id, userId).first();
    if (!existingInstallment) {
      return c.json({ error: 'Parcelamento não encontrado ou você não tem permissão para editá-lo' }, 404);
    }

    // Se a categoria foi atualizada, verificar se ela existe
    if (updates.category_id) {
      const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id = "default")').bind(updates.category_id, userId).first();
      if (!category) {
        return c.json({ error: 'Categoria não encontrada' }, 404);
      }
    }

    // Se o cartão de crédito foi atualizado, verificar se ele existe
    if (updates.creditCardId !== undefined) {
      if (updates.creditCardId !== null) {
        const creditCard = await db.prepare('SELECT * FROM credit_cards WHERE id = ? AND userId = ?').bind(updates.creditCardId, userId).first();
        if (!creditCard) {
          return c.json({ error: 'Cartão de crédito não encontrado' }, 404);
        }
      }
    }

    // Construir a query de atualização dinamicamente
    let query = 'UPDATE installments SET';
    const params: any[] = [];
    let hasUpdates = false;

    // Atualizar o valor da parcela se o valor total ou o número de parcelas mudar
    let recalculateInstallmentAmount = false;
    let totalAmount = existingInstallment.totalAmount;
    let totalInstallments = existingInstallment.totalInstallments;

    if (updates.totalAmount !== undefined) {
      query += ' totalAmount = ?,';
      params.push(updates.totalAmount);
      totalAmount = updates.totalAmount;
      recalculateInstallmentAmount = true;
      hasUpdates = true;
    }

    if (updates.totalInstallments !== undefined) {
      query += ' totalInstallments = ?,';
      params.push(updates.totalInstallments);
      totalInstallments = updates.totalInstallments;
      recalculateInstallmentAmount = true;
      hasUpdates = true;
    }

    if (recalculateInstallmentAmount) {
      const installmentAmount = totalAmount / totalInstallments;
      query += ' installmentAmount = ?,';
      params.push(installmentAmount);
    }

    if (updates.description !== undefined) {
      query += ' description = ?,';
      params.push(updates.description);
      hasUpdates = true;
    }

    if (updates.category_id !== undefined) {
      query += ' category_id = ?,';
      params.push(updates.category_id);
      hasUpdates = true;
    }

    if (updates.paidInstallments !== undefined) {
      query += ' paidInstallments = ?,';
      params.push(updates.paidInstallments);
      hasUpdates = true;
    }

    if (updates.startDate !== undefined) {
      query += ' startDate = ?,';
      params.push(updates.startDate);
      hasUpdates = true;
    }

    if (updates.nextPaymentDate !== undefined) {
      query += ' nextPaymentDate = ?,';
      params.push(updates.nextPaymentDate);
      hasUpdates = true;
    }

    if (updates.creditCardId !== undefined) {
      query += ' creditCardId = ?,';
      params.push(updates.creditCardId);
      hasUpdates = true;
    }

    if (updates.type !== undefined) {
      query += ' type = ?,';
      params.push(updates.type);
      hasUpdates = true;
    }

    // Remover a vírgula final e adicionar a condição WHERE
    if (hasUpdates) {
      query = query.slice(0, -1) + ' WHERE id = ? AND userId = ?';
      params.push(id, userId);
      
      await db.prepare(query).bind(...params).run();
    }

    // Buscar o parcelamento atualizado com detalhes da categoria
    const selectQuery = `
      SELECT i.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM installments i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id = ?
    `;
    const installment = await db.prepare(selectQuery).bind(id).first();
    if (!installment) {
      return c.json({ error: 'Erro ao atualizar parcelamento' }, 500);
    }

    return c.json(installment);
  } catch (error) {
    console.error('Erro ao atualizar parcelamento:', error);
    return c.json({ error: 'Erro ao atualizar parcelamento' }, 500);
  }
});

// Rota para excluir parcelamento
installmentsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se o parcelamento existe e pertence ao usuário
    const installment = await db.prepare('SELECT * FROM installments WHERE id = ? AND userId = ?').bind(id, userId).first();
    if (!installment) {
      return c.json({ error: 'Parcelamento não encontrado ou você não tem permissão para excluí-lo' }, 404);
    }

    // Excluir o parcelamento
    await db.prepare('DELETE FROM installments WHERE id = ? AND userId = ?').bind(id, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir parcelamento:', error);
    return c.json({ error: 'Erro ao excluir parcelamento' }, 500);
  }
});

export default installmentsRouter; 