import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

// Criar o roteador para cartões de crédito
const creditCardsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar middleware de autenticação em todas as rotas
creditCardsRouter.use('*', authMiddleware);

// Schema para validação de cartão de crédito
const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória'),
  lastFourDigits: z.string().optional(),
  bank: z.string().optional(),
  cardLimit: z.number().optional(),
});

// Schema para atualização de cartão de crédito
const updateCreditCardSchema = creditCardSchema.partial();

// Rota para listar cartões de crédito
creditCardsRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;
    
    const creditCards = await db.prepare('SELECT * FROM credit_cards WHERE userId = ? ORDER BY name').bind(userId).all();

    return c.json(creditCards.results);
  } catch (error) {
    console.error('Erro ao buscar cartões de crédito:', error);
    return c.json({ error: 'Erro ao buscar cartões de crédito' }, 500);
  }
});

// Rota para criar cartão de crédito
creditCardsRouter.post('/', zValidator('json', creditCardSchema), async (c) => {
  try {
    const { name, color, lastFourDigits, bank, cardLimit } = c.req.valid('json');
    const userId = c.get('userId');
    const db = c.env.DB;
    const now = new Date().toISOString();

    const result = await db.prepare(`
      INSERT INTO credit_cards (userId, name, color, lastFourDigits, bank, cardLimit, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, name, color, lastFourDigits || null, bank || null, cardLimit || null, now, now).run();

    if (!result.success) {
      return c.json({ error: 'Erro ao criar cartão de crédito' }, 500);
    }

    // Buscar o cartão recém-criado
    const creditCard = await db.prepare('SELECT * FROM credit_cards WHERE id = ?').bind(result.meta.last_row_id).first();
    if (!creditCard) {
      return c.json({ error: 'Erro ao criar cartão de crédito' }, 500);
    }

    return c.json(creditCard, 201);
  } catch (error) {
    console.error('Erro ao criar cartão de crédito:', error);
    return c.json({ error: 'Erro ao criar cartão de crédito' }, 500);
  }
});

// Rota para obter cartão de crédito por ID
creditCardsRouter.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const userId = c.get('userId');
    const db = c.env.DB;

    const creditCard = await db.prepare('SELECT * FROM credit_cards WHERE id = ? AND userId = ?').bind(id, userId).first();
    if (!creditCard) {
      return c.json({ error: 'Cartão de crédito não encontrado' }, 404);
    }

    return c.json(creditCard);
  } catch (error) {
    console.error('Erro ao buscar cartão de crédito:', error);
    return c.json({ error: 'Erro ao buscar cartão de crédito' }, 500);
  }
});

// Rota para atualizar cartão de crédito
creditCardsRouter.put('/:id', zValidator('json', updateCreditCardSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const userId = c.get('userId');
    const updates = c.req.valid('json');
    const db = c.env.DB;

    // Verificar se o cartão existe e pertence ao usuário
    const existingCard = await db.prepare('SELECT * FROM credit_cards WHERE id = ? AND userId = ?').bind(id, userId).first();
    if (!existingCard) {
      return c.json({ error: 'Cartão de crédito não encontrado ou você não tem permissão para editá-lo' }, 404);
    }

    const now = new Date().toISOString();

    // Construir a query de atualização dinamicamente
    let query = 'UPDATE credit_cards SET updatedAt = ?';
    const params: any[] = [now];

    if (updates.name !== undefined) {
      query += ', name = ?';
      params.push(updates.name);
    }

    if (updates.color !== undefined) {
      query += ', color = ?';
      params.push(updates.color);
    }

    if (updates.lastFourDigits !== undefined) {
      query += ', lastFourDigits = ?';
      params.push(updates.lastFourDigits || null);
    }

    if (updates.bank !== undefined) {
      query += ', bank = ?';
      params.push(updates.bank || null);
    }

    if (updates.cardLimit !== undefined) {
      query += ', cardLimit = ?';
      params.push(updates.cardLimit || null);
    }

    query += ' WHERE id = ? AND userId = ?';
    params.push(id, userId);

    await db.prepare(query).bind(...params).run();

    // Buscar o cartão atualizado
    const updatedCard = await db.prepare('SELECT * FROM credit_cards WHERE id = ?').bind(id).first();
    if (!updatedCard) {
      return c.json({ error: 'Erro ao atualizar cartão de crédito' }, 500);
    }

    return c.json(updatedCard);
  } catch (error) {
    console.error('Erro ao atualizar cartão de crédito:', error);
    return c.json({ error: 'Erro ao atualizar cartão de crédito' }, 500);
  }
});

// Rota para excluir cartão de crédito
creditCardsRouter.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se o cartão existe e pertence ao usuário
    const creditCard = await db.prepare('SELECT * FROM credit_cards WHERE id = ? AND userId = ?').bind(id, userId).first();
    if (!creditCard) {
      return c.json({ error: 'Cartão de crédito não encontrado ou você não tem permissão para excluí-lo' }, 404);
    }

    // Verificar se existem parcelamentos usando este cartão
    const installmentsCount = await db.prepare('SELECT COUNT(*) as count FROM installments WHERE creditCardId = ?').bind(id).first<{ count: number }>();
    if (installmentsCount && installmentsCount.count > 0) {
      return c.json({ error: 'Não é possível excluir um cartão de crédito que possui parcelamentos associados' }, 400);
    }

    // Excluir o cartão
    await db.prepare('DELETE FROM credit_cards WHERE id = ? AND userId = ?').bind(id, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir cartão de crédito:', error);
    return c.json({ error: 'Erro ao excluir cartão de crédito' }, 500);
  }
});

export default creditCardsRouter; 