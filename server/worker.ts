import { Hono, Next } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { secureHeaders } from 'hono/secure-headers'

import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
} from '../lib/db'
import {
  registerUser,
  authenticateUser,
  generateUserToken,
  generateRefreshToken,
  verifyToken,
  getUserById as getAuthUserById, // Renomeado para evitar conflito com getTransactionById etc.
  User as AuthUser,
  JwtPayload
} from '../lib/auth'
import { Context } from 'hono/jsx'; // Necessário para tipar 'c' em alguns middlewares
import type { Transaction } from '../types/database'; // Importar o tipo Transaction
import { addMonths } from 'date-fns'; // Importar addMonths

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', secureHeaders())

app.use(
  '/api/*',
  cors({
    origin: ['https://astrofinance-app.vercel.app', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
)

const jwtAuthMiddleware = async (c: Context, next: Next) => {
  if (c.req.path.startsWith('/api/auth/login') || c.req.path.startsWith('/api/auth/register')) {
    return next()
  }
  const middleware = jwt({ secret: c.env.JWT_SECRET });
  return middleware(c, next);
}

app.use('/api/*', jwtAuthMiddleware)

// --- Rotas de Autenticação (`/api/auth/*`) ---
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json<{ email?: string; password?: string; name?: string; role?: "admin" | "user" }>()

    if (!email || !password || !name) {
      return c.json({ error: 'Email, senha e nome são obrigatórios.' }, 400)
    }
    if (password.length < 6) {
      return c.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, 400)
    }

    const newUser = await registerUser(c.env.DB, email, password, name, role)
    const token = await generateUserToken(newUser, c.env.JWT_SECRET) // Adicionado await
    const refreshToken = await generateRefreshToken(newUser, c.env.JWT_SECRET) // Adicionado await

    return c.json({
      user: newUser,
      token,
      refreshToken,
    }, 201)
  } catch (error: any) {
    console.error("Register error:", error.message, error.stack)
    if (error.message.includes('Email já está em uso')) {
      return c.json({ error: error.message }, 409)
    }
    return c.json({ error: 'Falha ao registrar usuário.', details: error.message }, 500)
  }
})

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>()

    if (!email || !password) {
      return c.json({ error: 'Email e senha são obrigatórios.' }, 400)
    }

    const user = await authenticateUser(c.env.DB, email, password)
    if (!user) {
      return c.json({ error: 'Credenciais inválidas.' }, 401)
    }

    const token = await generateUserToken(user, c.env.JWT_SECRET) // Adicionado await
    const refreshToken = await generateRefreshToken(user, c.env.JWT_SECRET) // Adicionado await

    return c.json({
      user,
      token,
      refreshToken,
    })
  } catch (error: any) {
    console.error("Login error:", error.message, error.stack)
    return c.json({ error: 'Falha ao fazer login.', details: error.message }, 500)
  }
})

app.post('/api/auth/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json<{ refreshToken?: string }>();
    if (!refreshToken) {
      return c.json({ error: 'Refresh token é obrigatório.' }, 400);
    }

    const payload = verifyToken(refreshToken, c.env.JWT_SECRET) as JwtPayload;
    const user = await getAuthUserById(c.env.DB, payload.id);

    if (!user) {
      return c.json({ error: 'Usuário não encontrado ou token de atualização inválido.' }, 401);
    }

    const newAccessToken = await generateUserToken(user, c.env.JWT_SECRET); // Adicionado await

    return c.json({
      token: newAccessToken,
      user,
    });

  } catch (error: any) {
    console.error("Refresh token error:", error.message);
    return c.json({ error: 'Token de atualização inválido ou expirado.' }, 401);
  }
});

app.get('/api/auth/me', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) {
    return c.json({ error: 'Não autorizado ou payload do token inválido.' }, 401);
  }

  try {
    const user = await getAuthUserById(c.env.DB, payload.id);
    if (!user) {
      return c.json({ error: 'Usuário não encontrado.' }, 404);
    }
    return c.json(user);
  } catch (error: any) {
    console.error("Get Me error:", error.message);
    return c.json({ error: 'Falha ao buscar dados do usuário.', details: error.message }, 500);
  }
});

app.post('/api/auth/change-password', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) {
    return c.json({ error: 'Não autorizado ou ID do usuário não encontrado no token.' }, 401);
  }

  try {
    const { currentPassword, newPassword } = await c.req.json<{ currentPassword?: string; newPassword?: string }>();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Senha atual e nova senha são obrigatórias.' }, 400);
    }
    if (newPassword.length < 6) {
      return c.json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' }, 400);
    }

     const userQuery = 'SELECT password_hash FROM users WHERE id = ?'; // Apenas buscar o hash
     const userRecord = await c.env.DB.prepare(userQuery).bind(payload.id).first<{ password_hash: string }>();

    if (!userRecord || !userRecord.password_hash) {
      return c.json({ error: 'Usuário não encontrado ou senha não definida.' }, 404);
    }

    const isValid = await bcrypt.compare(currentPassword, userRecord.password_hash);
    if (!isValid) {
      return c.json({ error: 'Senha atual incorreta.' }, 401);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    const updateQuery = 'UPDATE users SET password_hash = ? WHERE id = ?';
    const { success } = await c.env.DB.prepare(updateQuery).bind(newPasswordHash, payload.id).run();

    if (!success) {
        return c.json({ error: 'Falha ao atualizar a senha.' }, 500);
    }

    return c.json({ message: 'Senha alterada com sucesso.' });
  } catch (error: any) {
    console.error("Change Password error:", error.message, error.stack);
    return c.json({ error: 'Falha ao alterar senha.', details: error.message }, 500);
  }
});

// --- Rotas de Categorias (`/api/categories/*`) ---
app.get('/api/categories', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401)

  const type = c.req.query('type') as 'income' | 'expense' | undefined;

  try {
    const categories = await getCategories(c.env.DB, payload.id, type)
    return c.json(categories)
  } catch (error: any) {
    console.error("Get Categories error:", error.message)
    return c.json({ error: 'Falha ao buscar categorias.', details: error.message }, 500)
  }
})

app.post('/api/categories', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401)

  try {
    const { name, type } = await c.req.json<{ name?: string; type?: 'income' | 'expense' }>()
    if (!name || !type || !['income', 'expense'].includes(type)) {
      return c.json({ error: 'Nome e tipo válido (income/expense) são obrigatórios.' }, 400)
    }

    const newCategory = await createCategory(c.env.DB, name, type, payload.id)
    if (!newCategory) {
        return c.json({ error: 'Falha ao criar categoria, o objeto retornado é nulo.' }, 500);
    }
    return c.json(newCategory, 201)
  } catch (error: any) {
    console.error("Create Category error:", error.message)
    return c.json({ error: 'Falha ao criar categoria.', details: error.message }, 500)
  }
})

app.put('/api/categories/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const categoryId = c.req.param('id');
  if (!categoryId) return c.json({ error: 'ID da categoria é obrigatório.' }, 400);

  try {
    const { name, type } = await c.req.json<{ name?: string; type?: 'income' | 'expense' }>();
    if (!name || !type || !['income', 'expense'].includes(type)) {
      return c.json({ error: 'Nome e tipo válido (income/expense) são obrigatórios.' }, 400);
    }

    const updatedCategory = await updateCategory(c.env.DB, categoryId, name, type, payload.id);
     if (!updatedCategory) {
        return c.json({ error: 'Falha ao atualizar categoria, o objeto retornado é nulo ou não pertence ao usuário.' }, 404);
    }
    return c.json(updatedCategory);
  } catch (error: any) {
    console.error("Update Category error:", error.message);
    return c.json({ error: 'Falha ao atualizar categoria.', details: error.message }, 500);
  }
});

app.delete('/api/categories/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const categoryId = c.req.param('id');
  if (!categoryId) return c.json({ error: 'ID da categoria é obrigatório.' }, 400);

  try {
    const success = await deleteCategory(c.env.DB, categoryId, payload.id);
    if (success) {
      return c.json({ message: 'Categoria deletada com sucesso.' }, 200);
    } else {
      return c.json({ error: 'Falha ao deletar categoria ou categoria não encontrada.' }, 404);
    }
  } catch (error: any) {
    console.error("Delete Category error:", error.message);
    return c.json({ error: 'Falha ao deletar categoria.', details: error.message }, 500);
  }
});

// --- Rotas de Transações (`/api/transactions/*`) ---
app.get('/api/transactions', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const month = c.req.query('month');
  const type = c.req.query('type') as 'income' | 'expense' | undefined;

  try {
    const transactions = await getTransactions(c.env.DB, payload.id, month, type);
    return c.json(transactions);
  } catch (error: any) {
    console.error("Get Transactions error:", error.message);
    return c.json({ error: 'Falha ao buscar transações.', details: error.message }, 500);
  }
});

app.get('/api/transactions/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const transactionId = c.req.param('id');
  if (!transactionId) return c.json({ error: 'ID da transação é obrigatório.' }, 400);

  try {
    const transaction = await getTransactionById(c.env.DB, transactionId, payload.id);
    if (!transaction) {
      return c.json({ error: 'Transação não encontrada ou não pertence ao usuário.' }, 404);
    }
    return c.json(transaction);
  } catch (error: any) {
    console.error("Get Transaction by ID error:", error.message);
    return c.json({ error: 'Falha ao buscar transação.', details: error.message }, 500);
  }
});

app.post('/api/transactions', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  try {
    const body = await c.req.json<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>();

    if (!body.date || !body.description || body.amount === undefined || !body.type || !body.category_id) {
      return c.json({ error: 'Campos date, description, amount, type, category_id são obrigatórios.' }, 400);
    }
    if (!['income', 'expense'].includes(body.type)) {
      return c.json({ error: 'Tipo de transação inválido.' }, 400);
    }

    const category = await getCategoryById(c.env.DB, body.category_id, payload.id);
    if (!category) {
        return c.json({ error: 'Categoria não encontrada ou não pertence ao usuário.' }, 400);
    }

    const transactionData: Omit<Transaction, 'id' | 'created_at'> = {
      ...body,
      user_id: payload.id,
    };

    const newTransaction = await createTransaction(c.env.DB, transactionData);
    if (!newTransaction) {
      return c.json({ error: 'Falha ao criar transação.' }, 500);
    }
    return c.json(newTransaction, 201);
  } catch (error: any) {
    console.error("Create Transaction error:", error.message, error.stack);
    return c.json({ error: 'Falha ao criar transação.', details: error.message }, 500);
  }
});

app.put('/api/transactions/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const transactionId = c.req.param('id');
  if (!transactionId) return c.json({ error: 'ID da transação é obrigatório.' }, 400);

  try {
    const body = await c.req.json<Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>>();

    if (!body.date || !body.description || body.amount === undefined || !body.type || !body.category_id) {
      return c.json({ error: 'Campos date, description, amount, type, category_id são obrigatórios para atualização.' }, 400);
    }
     if (!['income', 'expense'].includes(body.type)) {
      return c.json({ error: 'Tipo de transação inválido.' }, 400);
    }

    const category = await getCategoryById(c.env.DB, body.category_id, payload.id);
    if (!category) {
        return c.json({ error: 'Nova categoria não encontrada ou não pertence ao usuário.' }, 400);
    }

    const updatedTransaction = await updateTransaction(c.env.DB, transactionId, payload.id, body);
    if (!updatedTransaction) {
      return c.json({ error: 'Transação não encontrada ou falha ao atualizar.' }, 404);
    }
    return c.json(updatedTransaction);
  } catch (error: any) {
    console.error("Update Transaction error:", error.message);
    return c.json({ error: 'Falha ao atualizar transação.', details: error.message }, 500);
  }
});

app.delete('/api/transactions/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const transactionId = c.req.param('id');
  if (!transactionId) return c.json({ error: 'ID da transação é obrigatório.' }, 400);

  try {
    const success = await deleteTransaction(c.env.DB, transactionId, payload.id);
    if (success) {
      return c.json({ message: 'Transação deletada com sucesso.' }, 200);
    } else {
      return c.json({ error: 'Transação não encontrada ou não pertence ao usuário.' }, 404);
    }
  } catch (error: any) {
    console.error("Delete Transaction error:", error.message);
    return c.json({ error: 'Falha ao deletar transação.', details: error.message }, 500);
  }
});

app.notFound((c) => {
  return c.json({ error: 'Rota não encontrada.' }, 404)
})

app.onError((err, c) => {
  console.error(`Erro no servidor: ${err}`, err.stack)
  return c.json({ error: 'Erro interno do servidor.', message: err.message }, 500)
})

// --- Rotas de Goals (`/api/goals/*`) ---
import { getGoals, getGoalById, createGoal, updateGoal, deleteGoal, addAmountToGoal } from '../lib/db'; // Importar funções de Goal
import type { Goal, GoalStatus, GoalType, GoalRecurrence } from '../types/database'; // Importar tipos de Goal

// GET /api/goals - Listar todas as metas do usuário
app.get('/api/goals', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  try {
    const goals = await getGoals(c.env.DB, payload.id);
    return c.json(goals);
  } catch (error: any) {
    console.error("Get Goals error:", error.message);
    return c.json({ error: 'Falha ao buscar metas.', details: error.message }, 500);
  }
});

// POST /api/goals - Criar uma nova meta
app.post('/api/goals', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  try {
    const body = await c.req.json<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'completed_at' | 'current_amount' | 'status'>>();

    // Validação básica (melhorar com Zod)
    if (!body.name || !body.target_amount || !body.type || !body.start_date) {
      return c.json({ error: 'Campos name, target_amount, type, start_date são obrigatórios.' }, 400);
    }

    const goalData = {
      ...body,
      user_id: payload.id,
    };

    // @ts-ignore // Temporário para alinhar com CreateGoalData que espera user_id
    const newGoal = await createGoal(c.env.DB, goalData);
    if (!newGoal) {
      return c.json({ error: 'Falha ao criar meta.' }, 500);
    }
    return c.json(newGoal, 201);
  } catch (error: any) {
    console.error("Create Goal error:", error.message, error.stack);
    return c.json({ error: 'Falha ao criar meta.', details: error.message }, 500);
  }
});

// GET /api/goals/:id - Buscar uma meta específica
app.get('/api/goals/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const goalId = c.req.param('id');
  if (!goalId) return c.json({ error: 'ID da meta é obrigatório.' }, 400);

  try {
    const goal = await getGoalById(c.env.DB, goalId, payload.id);
    if (!goal) {
      return c.json({ error: 'Meta não encontrada ou não pertence ao usuário.' }, 404);
    }
    return c.json(goal);
  } catch (error: any) {
    console.error("Get Goal by ID error:", error.message);
    return c.json({ error: 'Falha ao buscar meta.', details: error.message }, 500);
  }
});

// PUT /api/goals/:id - Atualizar uma meta
app.put('/api/goals/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const goalId = c.req.param('id');
  if (!goalId) return c.json({ error: 'ID da meta é obrigatório.' }, 400);

  try {
    const body = await c.req.json<Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>>();
    // Validação mínima, idealmente usar Zod. A função updateGoal em db.ts já tem alguma validação.
    if (Object.keys(body).length === 0) {
        return c.json({ error: 'Nenhum dado fornecido para atualização.' }, 400);
    }

    // @ts-ignore // Ajustar tipo UpdateGoalData se necessário
    const updatedGoal = await updateGoal(c.env.DB, goalId, payload.id, body);
    if (!updatedGoal) {
      return c.json({ error: 'Meta não encontrada ou falha ao atualizar.' }, 404);
    }
    return c.json(updatedGoal);
  } catch (error: any) {
    console.error("Update Goal error:", error.message);
    return c.json({ error: 'Falha ao atualizar meta.', details: error.message }, 500);
  }
});

// DELETE /api/goals/:id - Deletar uma meta
app.delete('/api/goals/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const goalId = c.req.param('id');
  if (!goalId) return c.json({ error: 'ID da meta é obrigatório.' }, 400);

  try {
    const success = await deleteGoal(c.env.DB, goalId, payload.id);
    if (success) {
      return c.json({ message: 'Meta deletada com sucesso.' }, 200);
    } else {
      return c.json({ error: 'Meta não encontrada ou não pertence ao usuário.' }, 404);
    }
  } catch (error: any) {
    console.error("Delete Goal error:", error.message);
    return c.json({ error: 'Falha ao deletar meta.', details: error.message }, 500);
  }
});

// POST /api/goals/:id/add_amount - Adicionar valor a uma meta
app.post('/api/goals/:id/add_amount', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const goalId = c.req.param('id');
  if (!goalId) return c.json({ error: 'ID da meta é obrigatório.' }, 400);

  try {
    const { amount } = await c.req.json<{ amount?: number }>();
    if (typeof amount !== 'number') {
      return c.json({ error: 'Valor (amount) é obrigatório e deve ser um número.' }, 400);
    }

    const updatedGoal = await addAmountToGoal(c.env.DB, goalId, payload.id, amount);
    if (!updatedGoal) {
      return c.json({ error: 'Meta não encontrada ou falha ao adicionar valor.' }, 404);
    }
    return c.json(updatedGoal);
  } catch (error: any) {
    console.error("Add Amount to Goal error:", error.message);
    return c.json({ error: 'Falha ao adicionar valor à meta.', details: error.message }, 500);
  }
});

// --- Rotas de Goal Reserves (`/api/goal-reserves/*`) ---
import { getGoalReserves, getGoalReserveById, createGoalReserve, updateGoalReserve, deleteGoalReserve } from '../lib/db';
import type { GoalReserve } from '../types/database';

// GET /api/goal-reserves - Listar reservas de uma meta ou todas do usuário
app.get('/api/goal-reserves', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const goalId = c.req.query('goal_id'); // Opcional para filtrar por meta

  try {
    const reserves = await getGoalReserves(c.env.DB, payload.id, goalId);
    return c.json(reserves);
  } catch (error: any) {
    console.error("Get GoalReserves error:", error.message);
    return c.json({ error: 'Falha ao buscar reservas da meta.', details: error.message }, 500);
  }
});

// POST /api/goal-reserves - Criar uma nova reserva para uma meta
app.post('/api/goal-reserves', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  try {
    const body = await c.req.json<Omit<GoalReserve, 'id' | 'user_id' | 'created_at'>>();

    if (!body.goal_id || !body.month || typeof body.amount !== 'number') {
      return c.json({ error: 'Campos goal_id, month, e amount são obrigatórios.' }, 400);
    }
    // Validação do formato do mês (YYYY-MM) pode ser adicionada aqui

    const reserveData = {
      ...body,
      user_id: payload.id,
    };

    // @ts-ignore
    const newReserve = await createGoalReserve(c.env.DB, reserveData);
    if (!newReserve) {
      return c.json({ error: 'Falha ao criar reserva para a meta.' }, 500);
    }
    return c.json(newReserve, 201);
  } catch (error: any) {
    console.error("Create GoalReserve error:", error.message, error.stack);
     if (error.message && error.message.includes('Reserva para este mês e meta já existe')) {
      return c.json({ error: error.message }, 409); // Conflict
    }
    return c.json({ error: 'Falha ao criar reserva para a meta.', details: error.message }, 500);
  }
});

// PUT /api/goal-reserves/:id - Atualizar uma reserva
app.put('/api/goal-reserves/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const reserveId = c.req.param('id');
  if (!reserveId) return c.json({ error: 'ID da reserva é obrigatório.' }, 400);

  try {
    const body = await c.req.json<{ amount?: number }>();
    if (typeof body.amount !== 'number') {
      return c.json({ error: 'Valor (amount) é obrigatório para atualização.' }, 400);
    }

    const updatedReserve = await updateGoalReserve(c.env.DB, reserveId, payload.id, {amount: body.amount} );
    if (!updatedReserve) {
      return c.json({ error: 'Reserva não encontrada ou falha ao atualizar.' }, 404);
    }
    return c.json(updatedReserve);
  } catch (error: any) {
    console.error("Update GoalReserve error:", error.message);
    return c.json({ error: 'Falha ao atualizar reserva.', details: error.message }, 500);
  }
});

// DELETE /api/goal-reserves/:id - Deletar uma reserva
app.delete('/api/goal-reserves/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const reserveId = c.req.param('id');
  if (!reserveId) return c.json({ error: 'ID da reserva é obrigatório.' }, 400);

  try {
    const success = await deleteGoalReserve(c.env.DB, reserveId, payload.id);
    if (success) {
      return c.json({ message: 'Reserva deletada com sucesso.' }, 200);
    } else {
      return c.json({ error: 'Reserva não encontrada ou não pertence ao usuário.' }, 404);
    }
  } catch (error: any) {
    console.error("Delete GoalReserve error:", error.message);
    return c.json({ error: 'Falha ao deletar reserva.', details: error.message }, 500);
  }
});

// --- Rotas de Credit Cards (`/api/credit-cards/*`) ---
import { getCreditCards, getCreditCardById, createCreditCard, updateCreditCard, deleteCreditCard } from '../lib/db';
import type { CreditCard } from '../types/database';

app.get('/api/credit-cards', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  try {
    const cards = await getCreditCards(c.env.DB, payload.id);
    return c.json(cards);
  } catch (error: any) {
    console.error("Get CreditCards error:", error.message);
    return c.json({ error: 'Falha ao buscar cartões de crédito.', details: error.message }, 500);
  }
});

app.post('/api/credit-cards', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  try {
    const body = await c.req.json<Omit<CreditCard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>();
    if (!body.name || !body.color) { // Adicionar mais validações conforme necessário
      return c.json({ error: 'Nome e cor são obrigatórios.' }, 400);
    }
    const cardData = { ...body, userId: payload.id };
    // @ts-ignore
    const newCard = await createCreditCard(c.env.DB, cardData);
    if (!newCard) return c.json({ error: 'Falha ao criar cartão de crédito.' }, 500);
    return c.json(newCard, 201);
  } catch (error: any) {
    console.error("Create CreditCard error:", error.message, error.stack);
    return c.json({ error: 'Falha ao criar cartão de crédito.', details: error.message }, 500);
  }
});

app.get('/api/credit-cards/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const cardId = parseInt(c.req.param('id'));
  if (isNaN(cardId)) return c.json({ error: 'ID do cartão inválido.' }, 400);
  try {
    const card = await getCreditCardById(c.env.DB, cardId, payload.id);
    if (!card) return c.json({ error: 'Cartão de crédito não encontrado.' }, 404);
    return c.json(card);
  } catch (error: any) {
    console.error("Get CreditCard by ID error:", error.message);
    return c.json({ error: 'Falha ao buscar cartão de crédito.', details: error.message }, 500);
  }
});

app.put('/api/credit-cards/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const cardId = parseInt(c.req.param('id'));
  if (isNaN(cardId)) return c.json({ error: 'ID do cartão inválido.' }, 400);
  try {
    const body = await c.req.json<Partial<Omit<CreditCard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>>();
    if (Object.keys(body).length === 0) return c.json({ error: 'Nenhum dado para atualizar.' }, 400);

    const updatedCard = await updateCreditCard(c.env.DB, cardId, payload.id, body);
    if (!updatedCard) return c.json({ error: 'Cartão de crédito não encontrado ou falha ao atualizar.' }, 404);
    return c.json(updatedCard);
  } catch (error: any) {
    console.error("Update CreditCard error:", error.message);
    return c.json({ error: 'Falha ao atualizar cartão de crédito.', details: error.message }, 500);
  }
});

app.delete('/api/credit-cards/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const cardId = parseInt(c.req.param('id'));
  if (isNaN(cardId)) return c.json({ error: 'ID do cartão inválido.' }, 400);
  try {
    const success = await deleteCreditCard(c.env.DB, cardId, payload.id);
    if (success) return c.json({ message: 'Cartão de crédito deletado com sucesso.' }, 200);
    return c.json({ error: 'Cartão de crédito não encontrado ou não pertence ao usuário.' }, 404);
  } catch (error: any) {
    console.error("Delete CreditCard error:", error.message);
    if (error.message.includes("possui parcelamentos associados")) {
      return c.json({ error: error.message }, 400);
    }
    return c.json({ error: 'Falha ao deletar cartão de crédito.', details: error.message }, 500);
  }
});

// --- Rotas de Installments (`/api/installments/*`) ---
import {
  getInstallments,
  getInstallmentById,
  createInstallment,
  updateInstallment,
  deleteInstallment,
  payNextInstallment
} from '../lib/db';
import type { Installment } from '../types/database';

app.get('/api/installments', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  try {
    const items = await getInstallments(c.env.DB, payload.id);
    return c.json(items);
  } catch (error: any) {
    return c.json({ error: 'Falha ao buscar parcelamentos.', details: error.message }, 500);
  }
});

app.post('/api/installments', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  try {
    const body = await c.req.json<Omit<Installment, 'id' | 'userId' | 'created_at' | 'paidInstallments' | 'type' | 'category_name' | 'credit_card_name'>>();
    // Adicionar validação com Zod aqui seria ideal
    if (!body.description || !body.category_id || !body.totalAmount || !body.installmentAmount || !body.totalInstallments || !body.startDate) {
      return c.json({ error: 'Campos obrigatórios ausentes.' }, 400);
    }
    const dataToCreate = { ...body, userId: payload.id };
     // @ts-ignore
    const newItem = await createInstallment(c.env.DB, dataToCreate);
    if (!newItem) return c.json({ error: 'Falha ao criar parcelamento.' }, 500);
    return c.json(newItem, 201);
  } catch (error: any) {
    return c.json({ error: 'Falha ao criar parcelamento.', details: error.message }, 500);
  }
});

app.get('/api/installments/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const itemId = c.req.param('id');
  try {
    const item = await getInstallmentById(c.env.DB, itemId, payload.id);
    if (!item) return c.json({ error: 'Parcelamento não encontrado.' }, 404);
    return c.json(item);
  } catch (error: any) {
    return c.json({ error: 'Falha ao buscar parcelamento.', details: error.message }, 500);
  }
});

app.put('/api/installments/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const itemId = c.req.param('id');
  try {
    const body = await c.req.json<Partial<Omit<Installment, 'id' | 'userId' | 'created_at' | 'paidInstallments' | 'type' | 'category_name' | 'credit_card_name'>>>();
    if (Object.keys(body).length === 0) return c.json({ error: 'Nenhum dado para atualizar.' }, 400);
    // @ts-ignore
    const updatedItem = await updateInstallment(c.env.DB, itemId, payload.id, body);
    if (!updatedItem) return c.json({ error: 'Parcelamento não encontrado ou falha ao atualizar.' }, 404);
    return c.json(updatedItem);
  } catch (error: any) {
    return c.json({ error: 'Falha ao atualizar parcelamento.', details: error.message }, 500);
  }
});

app.delete('/api/installments/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const itemId = c.req.param('id');
  try {
    const success = await deleteInstallment(c.env.DB, itemId, payload.id);
    if (success) return c.json({ message: 'Parcelamento deletado com sucesso.' }, 200);
    return c.json({ error: 'Parcelamento não encontrado ou não pertence ao usuário.' }, 404);
  } catch (error: any) {
    return c.json({ error: 'Falha ao deletar parcelamento.', details: error.message }, 500);
  }
});

app.post('/api/installments/:id/pay', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const installmentId = c.req.param('id');
  try {
    const updatedInstallment = await payNextInstallment(c.env.DB, installmentId, payload.id);
    if (!updatedInstallment) return c.json({ error: 'Falha ao pagar parcela ou parcelamento não encontrado.' }, 404);
    return c.json(updatedInstallment);
  } catch (error: any) {
    return c.json({ error: `Falha ao pagar parcela: ${error.message}` }, error.message.includes("Todas as parcelas já foram pagas") ? 400 : 500);
  }
});

// --- Rota de Dashboard Summary (`/api/dashboard-summary`) ---
// (Importar funções de DB necessárias como getTransactions, getInstallments etc. já estão importadas)

interface DashboardExpenseByCategory {
  category: string;
  amount: number;
  percentage: number; // Calculado no frontend ou backend
}

interface DashboardMonthSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: DashboardExpenseByCategory[];
}

interface DashboardSummaryResponse {
  currentMonth: DashboardMonthSummary;
  // TODO: Adicionar previousMonth, trends, monthlyData para gráfico
}

app.get('/api/dashboard-summary', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const userId = payload.id;

  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Formato MM
    const currentMonthYearStr = `${year}-${month}`; // YYYY-MM

    // 1. Buscar transações do mês atual
    const monthTransactions = await getTransactions(c.env.DB, userId, currentMonthYearStr);

    // 2. Buscar todos os parcelamentos do usuário
    const allInstallments = await getInstallments(c.env.DB, userId);

    // Filtrar parcelamentos aplicáveis ao mês atual
    // Esta lógica precisa ser cuidadosa. Assumindo que uma parcela é "do mês" se sua nextPaymentDate cair no mês atual.
    // Ou, se a data de início + número de parcelas pagas cai no mês atual.
    // A lógica original do app/api/dashboard era mais complexa e talvez mais precisa aqui.
    // Vamos usar uma simplificação: se nextPaymentDate cai no mês atual (antes de ser paga).
    // Ou, melhor: um parcelamento contribui para a despesa do mês se o período de pagamento do mês atual está dentro do ciclo do parcelamento.

    const currentMonthInstallmentsContribution: Array<{ category_name: string; installmentAmount: number }> = [];
    allInstallments.forEach(inst => {
      const startDate = new Date(inst.startDate + "T00:00:00"); // Adicionar T00:00:00 para consistência de timezone
      for (let i = 0; i < inst.totalInstallments; i++) {
        const paymentDate = addMonths(startDate, i);
        if (paymentDate.getFullYear() === year && (paymentDate.getMonth() + 1) === parseInt(month)) {
          currentMonthInstallmentsContribution.push({
            category_name: inst.category_name || 'Parcelamento', // Usar category_name do JOIN
            installmentAmount: inst.installmentAmount,
          });
          break; // Contar apenas uma vez por mês
        }
      }
    });

    // 3. Calcular totais
    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenseFromTransactions = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenseFromInstallments = currentMonthInstallmentsContribution
      .reduce((sum, inst) => sum + inst.installmentAmount, 0);

    const totalExpense = totalExpenseFromTransactions + totalExpenseFromInstallments;
    const balance = totalIncome - totalExpense;

    // 4. Despesas por categoria
    const expensesByCategoryMap = new Map<string, number>();

    monthTransactions
      .filter(t => t.type === 'expense' && t.category_name)
      .forEach(t => {
        expensesByCategoryMap.set(t.category_name!, (expensesByCategoryMap.get(t.category_name!) || 0) + t.amount);
      });

    currentMonthInstallmentsContribution.forEach(inst => {
      expensesByCategoryMap.set(inst.category_name, (expensesByCategoryMap.get(inst.category_name) || 0) + inst.installmentAmount);
    });

    const expensesByCategory: DashboardExpenseByCategory[] = [];
    expensesByCategoryMap.forEach((amount, category) => {
      expensesByCategory.push({
        category,
        amount,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      });
    });
    expensesByCategory.sort((a, b) => b.amount - a.amount); // Ordenar

    const response: DashboardSummaryResponse = {
      currentMonth: {
        totalIncome,
        totalExpense,
        balance,
        expensesByCategory,
      }
    };

    return c.json(response);

  } catch (error: any) {
    console.error("Dashboard Summary error:", error.message, error.stack);
    return c.json({ error: 'Falha ao buscar resumo do dashboard.', details: error.message }, 500);
  }
});

// --- Rota de Invoice Summary (`/api/invoice-summary`) ---
// (Importar funções de DB necessárias como getTransactions, getInstallments etc. já estão importadas)

interface InvoiceItemForSummary {
  id: string;
  date: string; // Data da ocorrência no mês (ou data da transação/parcela)
  description: string;
  category_name: string | undefined; // Nome da categoria
  amount: number;
  type: 'income' | 'expense' | 'installment'; // tipo para diferenciar
  original_type?: 'income' | 'expense'; // para transações
  installment_number?: number; // Para parcelas
  total_installments?: number; // Para parcelas
}

interface InvoiceSummaryResponse {
  month: string;
  year: number;
  items: InvoiceItemForSummary[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

app.get('/api/invoice-summary', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const userId = payload.id;

  const queryMonth = c.req.query('month'); // MM
  const queryYear = c.req.query('year');   // YYYY

  const now = new Date();
  const year = queryYear ? parseInt(queryYear) : now.getFullYear();
  const month = queryMonth ? parseInt(queryMonth) : now.getMonth() + 1;
  const monthStr = month.toString().padStart(2, '0');
  const currentMonthYearStr = `${year}-${monthStr}`; // YYYY-MM

  try {
    const monthTransactions = await getTransactions(c.env.DB, userId, currentMonthYearStr);
    const allInstallments = await getInstallments(c.env.DB, userId); // Pega todas, depois filtra

    const items: InvoiceItemForSummary[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    monthTransactions.forEach(t => {
      items.push({
        id: t.id,
        date: t.date,
        description: t.description,
        category_name: t.category_name,
        amount: t.amount,
        type: t.type, // 'income' ou 'expense'
        original_type: t.type
      });
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    allInstallments.forEach(inst => {
      const startDate = new Date(inst.startDate + "T00:00:00");
      for (let i = 0; i < inst.totalInstallments; i++) {
        const paymentDate = addMonths(startDate, i);
        if (paymentDate.getFullYear() === year && (paymentDate.getMonth() + 1) === month) {
          items.push({
            id: `${inst.id}-${i+1}`, // ID único para o item da fatura
            date: formatDateFns(paymentDate, 'yyyy-MM-dd'),
            description: inst.description,
            category_name: inst.category_name,
            amount: inst.installmentAmount, // Parcelas são sempre despesas
            type: 'installment',
            installment_number: i + 1,
            total_installments: inst.totalInstallments
          });
          totalExpense += inst.installmentAmount;
          break;
        }
      }
    });

    // Ordenar itens por data
    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const response: InvoiceSummaryResponse = {
      month: monthStr,
      year: year,
      items,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };

    return c.json(response);

  } catch (error: any) {
    console.error("Invoice Summary error:", error.message, error.stack);
    return c.json({ error: 'Falha ao buscar resumo da fatura.', details: error.message }, 500);
  }
});

// --- Rotas de Notifications (`/api/notifications/*`) ---
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  // createNotification // Usado internamente pelo cron, não como rota POST pública
} from '../lib/db';
// import type { Notification } from '../types/database'; // Já importado ou não necessário aqui

app.get('/api/notifications', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);

  const onlyUnread = c.req.query('unread') === 'true';
  try {
    const notifications = await getNotifications(c.env.DB, payload.id, onlyUnread);
    return c.json(notifications);
  } catch (error: any) {
    return c.json({ error: 'Falha ao buscar notificações.', details: error.message }, 500);
  }
});

app.post('/api/notifications/:id/read', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const notificationId = c.req.param('id');
  try {
    const notification = await markNotificationAsRead(c.env.DB, notificationId, payload.id);
    if (!notification) return c.json({ error: 'Notificação não encontrada ou falha ao marcar como lida.' }, 404);
    return c.json(notification);
  } catch (error: any) {
    return c.json({ error: 'Falha ao marcar notificação como lida.', details: error.message }, 500);
  }
});

app.post('/api/notifications/read-all', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  try {
    const success = await markAllNotificationsAsRead(c.env.DB, payload.id);
    // A função retorna true se pelo menos uma notificação foi atualizada.
    // Poderia retornar o número de notificações atualizadas se a função em db.ts retornasse meta.changes.
    return c.json({ success });
  } catch (error: any) {
    return c.json({ error: 'Falha ao marcar todas as notificações como lidas.', details: error.message }, 500);
  }
});

app.delete('/api/notifications/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload?.id) return c.json({ error: 'Usuário não autenticado' }, 401);
  const notificationId = c.req.param('id');
  try {
    const success = await deleteNotification(c.env.DB, notificationId, payload.id);
    if (success) return c.json({ message: 'Notificação deletada com sucesso.' }, 200);
    return c.json({ error: 'Notificação não encontrada ou não pertence ao usuário.' }, 404);
  } catch (error: any) {
    return c.json({ error: 'Falha ao deletar notificação.', details: error.message }, 500);
  }
});

// Handler para Cron Triggers
// Assegure-se que as funções getGoals e createNotification de lib/db.ts estão importadas
// e que `format` de date-fns também está disponível se necessário.
// (formatDateFns já está importado como alias)
async function handleScheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
  console.log(`Cron processed at ${new Date(event.scheduledTime)} - type: ${event.cron}`);

  const db = env.DB;
  const now = new Date();
  // Usar o formato YYYY-MM para consistência com o que é armazenado em goal_reserves.month
  const currentMonthStr = formatDateFns(now, "yyyy-MM");

  try {
    // Buscar todas as metas de compra/objetivo ativas de todos os usuários.
    // Precisamos de uma nova função em lib/db.ts para isso, ou modificar getGoals.
    // Por agora, vamos simular com uma query direta aqui.
    const activePurchaseGoalsQuery = "SELECT id, name, user_id FROM goals WHERE type = 'purchase' AND status = 'active'";
    const { results: activeGoals } = await db.prepare(activePurchaseGoalsQuery).all<{ id: string; name: string; user_id: string }>();

    if (!activeGoals || activeGoals.length === 0) {
      console.log("Nenhuma meta de compra ativa encontrada.");
      return;
    }

    let notificationsCreated = 0;
    for (const goal of activeGoals) {
      // Verificar se já existe uma reserva para esta meta e mês
      const reserveCheckQuery = "SELECT id FROM goal_reserves WHERE goal_id = ? AND user_id = ? AND month = ?";
      const existingReserve = await db.prepare(reserveCheckQuery).bind(goal.id, goal.user_id, currentMonthStr).first();

      if (existingReserve) {
        console.log(`Reserva já existe para meta ${goal.id} no mês ${currentMonthStr}. Pulando notificação.`);
        continue; // Pular se a reserva já foi feita
      }

      // Verificar se já existe notificação não lida para esta meta e mês
      // (Para evitar spammar o usuário com a mesma notificação)
      const unreadNotificationQuery = `
        SELECT id FROM notifications
        WHERE user_id = ? AND goal_id = ? AND type = 'goal_reserve_reminder' AND read = 0 AND message LIKE ?`;
      // Usar LIKE para o mês pode ser impreciso se a mensagem mudar. Idealmente, teríamos um campo para o mês na notificação.
      // Por agora, vamos manter simples, mas isso pode ser melhorado.
      const existingUnreadNotification = await db.prepare(unreadNotificationQuery)
        .bind(goal.user_id, goal.id, `%${currentMonthStr}%`)
        .first();

      if (existingUnreadNotification) {
        console.log(`Notificação não lida já existe para meta ${goal.id} no mês ${currentMonthStr}.`);
        continue;
      }

      const notificationData = {
        user_id: goal.user_id,
        type: 'goal_reserve_reminder',
        message: `Lembrete: Adicione sua reserva para a meta '${goal.name}' referente ao mês ${currentMonthStr}.`,
        goal_id: goal.id,
        // created_by: 'system' // Opcional
      };
      // @ts-ignore
      await createNotification(db, notificationData); // createNotification já está importado
      notificationsCreated++;
      console.log(`Notificação criada para meta ${goal.id}, usuário ${goal.user_id}, mês ${currentMonthStr}.`);
    }
    console.log(`Total de notificações de lembrete de reserva de meta criadas: ${notificationsCreated}`);

  } catch (error: any) {
    console.error("Erro durante execução do Cron Job para lembrete de reserva de meta:", error.message, error.stack);
  }
}

// Exportar o objeto default com o fetch handler e o scheduled handler
export default {
  fetch: app.fetch, // O handler Hono para requisições HTTP
  scheduled: handleScheduled, // O handler para Cron Triggers
};
