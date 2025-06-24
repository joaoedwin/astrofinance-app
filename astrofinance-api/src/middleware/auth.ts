import { Context, MiddlewareHandler, Next } from 'hono';
import { extractTokenFromHeader, verifyToken } from '../utils/auth';
import { Env, Variables } from '../types';

/**
 * Middleware para autenticação de usuários
 */
export const authMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> = async (c: Context, next: Next) => {
  // Obter o token do cabeçalho Authorization
  const authHeader = c.req.header('Authorization') || null;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return c.json({ error: 'Token não fornecido' }, 401);
  }

  // Verificar o token
  const jwtSecret = c.env.JWT_SECRET || 'your-secret-key';
  const payload = await verifyToken(token, jwtSecret);

  if (!payload) {
    return c.json({ error: 'Token inválido ou expirado' }, 401);
  }

  // Armazenar informações do usuário no contexto
  c.set('userId', payload.userId);
  c.set('isAdmin', payload.role === 'admin');

  await next();
};

/**
 * Middleware para verificar se o usuário é admin
 */
export const adminMiddleware: MiddlewareHandler<{
  Variables: Variables;
}> = async (c: Context, next: Next) => {
  const isAdmin = c.get('isAdmin');

  if (!isAdmin) {
    return c.json({ error: 'Acesso negado' }, 403);
  }

  await next();
}; 