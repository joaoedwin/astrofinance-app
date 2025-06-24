import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Env, Variables } from '../types';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

// Criar o roteador para notificações
const notificationsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar middleware de autenticação em todas as rotas
notificationsRouter.use('*', authMiddleware);

// Schema para validação de notificação
const notificationSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.string().optional(),
  description: z.string().optional(),
  user_id: z.string().optional(), // Opcional para permitir notificações globais
});

// Schema para atualização de notificação
const updateNotificationSchema = z.object({
  read: z.number().int().min(0).max(1),
});

// Rota para listar notificações do usuário
notificationsRouter.get('/', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;
    
    // Parâmetros de filtro
    const read = c.req.query('read');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    // Construir a query com filtros
    let query = `
      SELECT * FROM notifications 
      WHERE (user_id = ? OR user_id IS NULL)
    `;
    const params: any[] = [userId];

    if (read !== undefined) {
      query += ' AND read = ?';
      params.push(parseInt(read));
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const notifications = await db.prepare(query).bind(...params).all();

    return c.json(notifications.results);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return c.json({ error: 'Erro ao buscar notificações' }, 500);
  }
});

// Rota para marcar notificação como lida
notificationsRouter.put('/:id', zValidator('json', updateNotificationSchema), async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const { read } = c.req.valid('json');
    const db = c.env.DB;

    // Verificar se a notificação existe e pertence ao usuário ou é global
    const notification = await db.prepare('SELECT * FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)').bind(id, userId).first();
    if (!notification) {
      return c.json({ error: 'Notificação não encontrada' }, 404);
    }

    // Atualizar o status de leitura
    await db.prepare('UPDATE notifications SET read = ? WHERE id = ?').bind(read, id).run();

    // Buscar a notificação atualizada
    const updatedNotification = await db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first();
    if (!updatedNotification) {
      return c.json({ error: 'Erro ao atualizar notificação' }, 500);
    }

    return c.json(updatedNotification);
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return c.json({ error: 'Erro ao atualizar notificação' }, 500);
  }
});

// Rota para marcar todas as notificações como lidas
notificationsRouter.put('/read-all', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;

    // Atualizar todas as notificações do usuário ou globais
    await db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL').bind(userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    return c.json({ error: 'Erro ao marcar notificações como lidas' }, 500);
  }
});

// Rota para criar notificação (apenas admin)
notificationsRouter.post('/', adminMiddleware, zValidator('json', notificationSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const userId = c.get('userId');
    const db = c.env.DB;
    const id = randomUUID();
    const now = new Date().toISOString();

    await db.prepare(`
      INSERT INTO notifications (id, user_id, type, message, created_at, read, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.user_id || null,
      data.type || null,
      data.message,
      now,
      0, // Não lida por padrão
      data.description || null,
      userId // ID do admin que criou a notificação
    ).run();

    // Buscar a notificação recém-criada
    const notification = await db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first();
    if (!notification) {
      return c.json({ error: 'Erro ao criar notificação' }, 500);
    }

    return c.json(notification, 201);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return c.json({ error: 'Erro ao criar notificação' }, 500);
  }
});

// Rota para excluir notificação (apenas admin ou próprio usuário)
notificationsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userId = c.get('userId');
    const isAdmin = c.get('isAdmin');
    const db = c.env.DB;

    // Verificar se a notificação existe
    const notification = await db.prepare('SELECT * FROM notifications WHERE id = ?').bind(id).first();
    if (!notification) {
      return c.json({ error: 'Notificação não encontrada' }, 404);
    }

    // Verificar permissão (admin pode excluir qualquer notificação, usuário só as próprias)
    if (!isAdmin && notification.user_id !== userId) {
      return c.json({ error: 'Você não tem permissão para excluir esta notificação' }, 403);
    }

    // Excluir a notificação
    await db.prepare('DELETE FROM notifications WHERE id = ?').bind(id).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir notificação:', error);
    return c.json({ error: 'Erro ao excluir notificação' }, 500);
  }
});

export default notificationsRouter; 