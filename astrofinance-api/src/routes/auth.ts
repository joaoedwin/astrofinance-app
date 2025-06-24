import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { Env, Variables } from '../types';
import { createUserResponse, generateRefreshToken, generateToken, hashPassword, verifyPassword, verifyToken } from '../utils/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';

// Criar o roteador para autenticação
const authRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

// Aplicar rate limiting para rotas sensíveis
const loginLimiter = rateLimitMiddleware({ limit: 10, window: 60 }); // 10 tentativas por minuto
authRouter.use('/login', loginLimiter);
authRouter.use('/register', loginLimiter);
authRouter.use('/change-password', loginLimiter);

// Schema para validação de registro
const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Schema para validação de login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Schema para validação de refresh token
const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

// Schema para validação de alteração de senha
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
});

// Rota para registro de usuários
authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  try {
    const { name, email, password } = c.req.valid('json');
    const db = c.env.DB;

    // Verificar se o email já está em uso
    const existingUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (existingUser) {
      return c.json({ error: 'Email já está em uso' }, 400);
    }

    // Criar hash da senha
    const passwordHash = await hashPassword(password);
    const userId = randomUUID();

    // Inserir usuário no banco
    await db.prepare(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, email, name, passwordHash, 'user').run();

    // Buscar o usuário recém-criado
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return c.json({ error: 'Erro ao criar usuário' }, 500);
    }

    // Gerar tokens
    const jwtSecret = c.env.JWT_SECRET || 'your-secret-key';
    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = generateToken(payload, jwtSecret);
    const refreshToken = generateRefreshToken(payload, jwtSecret);

    // Retornar resposta
    return c.json({
      token,
      refreshToken,
      user: createUserResponse(user),
    }, 201);
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return c.json({ error: 'Erro ao registrar usuário' }, 500);
  }
});

// Rota para login de usuários
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json');
    const db = c.env.DB;

    // Buscar usuário pelo email
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    // Verificar senha
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return c.json({ error: 'Senha incorreta' }, 401);
    }

    // Atualizar último login
    const now = new Date().toISOString();
    await db.prepare('UPDATE users SET last_login = ? WHERE id = ?').bind(now, user.id).run();

    // Gerar tokens
    const jwtSecret = c.env.JWT_SECRET || 'your-secret-key';
    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = generateToken(payload, jwtSecret);
    const refreshToken = generateRefreshToken(payload, jwtSecret);

    // Retornar resposta
    return c.json({
      token,
      refreshToken,
      user: createUserResponse(user),
    });
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    return c.json({ error: 'Erro ao autenticar usuário' }, 500);
  }
});

// Rota para refresh token
authRouter.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  try {
    const { refreshToken } = c.req.valid('json');
    const jwtSecret = c.env.JWT_SECRET || 'your-secret-key';

    // Verificar refresh token
    const payload = await verifyToken(refreshToken, jwtSecret);
    if (!payload) {
      return c.json({ error: 'Refresh token inválido ou expirado' }, 401);
    }

    // Buscar usuário pelo ID
    const db = c.env.DB;
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first();
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    // Gerar novos tokens
    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const token = generateToken(newPayload, jwtSecret);
    const newRefreshToken = generateRefreshToken(newPayload, jwtSecret);

    // Retornar resposta
    return c.json({
      token,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    return c.json({ error: 'Erro ao atualizar token' }, 500);
  }
});

// Rota para verificar autenticação
authRouter.get('/me', async (c) => {
  try {
    const userId = c.get('userId');
    const db = c.env.DB;

    // Buscar usuário pelo ID
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    // Retornar resposta
    return c.json(createUserResponse(user));
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return c.json({ error: 'Erro ao buscar usuário' }, 500);
  }
});

// Rota para alterar senha
authRouter.post('/change-password', zValidator('json', changePasswordSchema), async (c) => {
  try {
    const userId = c.get('userId');
    const { currentPassword, newPassword } = c.req.valid('json');
    const db = c.env.DB;

    // Buscar usuário pelo ID
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return c.json({ error: 'Usuário não encontrado' }, 404);
    }

    // Verificar senha atual
    const isPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return c.json({ error: 'Senha atual incorreta' }, 401);
    }

    // Criar hash da nova senha
    const newPasswordHash = await hashPassword(newPassword);

    // Atualizar senha no banco
    await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newPasswordHash, userId).run();

    // Retornar resposta
    return c.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return c.json({ error: 'Erro ao alterar senha' }, 500);
  }
});

export default authRouter; 