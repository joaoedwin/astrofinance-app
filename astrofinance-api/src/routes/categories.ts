import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Env, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

// Criar o roteador para categorias
const categoriesRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar middleware de autenticação em todas as rotas
categoriesRouter.use('*', authMiddleware);

// Schema para validação de categoria
const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['income', 'expense'], { 
    errorMap: () => ({ message: 'Tipo deve ser income ou expense' })
  }),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// Schema para atualização de categoria
const updateCategorySchema = categorySchema.partial();

// Rota para listar categorias
categoriesRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const type = c.req.query('type') as 'income' | 'expense' | undefined;
    const db = c.env.DB;

    let query = 'SELECT * FROM categories WHERE user_id = ? OR user_id = "default"';
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY name';
    const categories = await db.prepare(query).bind(...params).all();

    return c.json(categories.results);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return c.json({ error: 'Erro ao buscar categorias' }, 500);
  }
});

// Rota para criar categoria
categoriesRouter.post('/', zValidator('json', categorySchema), async (c) => {
  try {
    const { name, type, color, icon } = c.req.valid('json');
    const userId = c.get('userId');
    const db = c.env.DB;
    const id = randomUUID();
    const now = new Date().toISOString();

    await db.prepare(
      'INSERT INTO categories (id, name, type, user_id, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, name, type, userId, color || null, icon || null, now, now).run();

    const category = await db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    if (!category) {
      return c.json({ error: 'Erro ao criar categoria' }, 500);
    }

    return c.json(category, 201);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return c.json({ error: 'Erro ao criar categoria' }, 500);
  }
});

// Rota para obter categoria por ID
categoriesRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND (user_id = ? OR user_id = "default")').bind(id, userId).first();
    if (!category) {
      return c.json({ error: 'Categoria não encontrada' }, 404);
    }

    return c.json(category);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return c.json({ error: 'Erro ao buscar categoria' }, 500);
  }
});

// Rota para atualizar categoria
categoriesRouter.put('/:id', zValidator('json', updateCategorySchema), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a categoria existe e pertence ao usuário
    const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').bind(id, userId).first();
    if (!category) {
      return c.json({ error: 'Categoria não encontrada ou você não tem permissão para editá-la' }, 404);
    }

    // Verificar se é uma categoria padrão
    if (category.user_id === 'default') {
      return c.json({ error: 'Categorias padrão não podem ser editadas' }, 403);
    }

    const updates = c.req.valid('json');
    const now = new Date().toISOString();

    // Construir a query de atualização dinamicamente
    let query = 'UPDATE categories SET updated_at = ?';
    const params: any[] = [now];

    if (updates.name !== undefined) {
      query += ', name = ?';
      params.push(updates.name);
    }

    if (updates.type !== undefined) {
      query += ', type = ?';
      params.push(updates.type);
    }

    if (updates.color !== undefined) {
      query += ', color = ?';
      params.push(updates.color || null);
    }

    if (updates.icon !== undefined) {
      query += ', icon = ?';
      params.push(updates.icon || null);
    }

    query += ' WHERE id = ? AND user_id = ?';
    params.push(id, userId);

    await db.prepare(query).bind(...params).run();

    // Buscar a categoria atualizada
    const updatedCategory = await db.prepare('SELECT * FROM categories WHERE id = ?').bind(id).first();
    if (!updatedCategory) {
      return c.json({ error: 'Erro ao atualizar categoria' }, 500);
    }

    return c.json(updatedCategory);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return c.json({ error: 'Erro ao atualizar categoria' }, 500);
  }
});

// Rota para excluir categoria
categoriesRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const db = c.env.DB;

    // Verificar se a categoria existe e pertence ao usuário
    const category = await db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').bind(id, userId).first();
    if (!category) {
      return c.json({ error: 'Categoria não encontrada ou você não tem permissão para excluí-la' }, 404);
    }

    // Verificar se é uma categoria padrão
    if (category.user_id === 'default') {
      return c.json({ error: 'Categorias padrão não podem ser excluídas' }, 403);
    }

    // Verificar se existem transações usando esta categoria
    const transactionsCount = await db.prepare('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?').bind(id).first<{ count: number }>();
    if (transactionsCount && transactionsCount.count > 0) {
      return c.json({ error: 'Não é possível excluir uma categoria que possui transações associadas' }, 400);
    }

    // Verificar se existem parcelamentos usando esta categoria
    const installmentsCount = await db.prepare('SELECT COUNT(*) as count FROM installments WHERE category_id = ?').bind(id).first<{ count: number }>();
    if (installmentsCount && installmentsCount.count > 0) {
      return c.json({ error: 'Não é possível excluir uma categoria que possui parcelamentos associados' }, 400);
    }

    // Excluir a categoria
    await db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').bind(id, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return c.json({ error: 'Erro ao excluir categoria' }, 500);
  }
});

export default categoriesRouter; 