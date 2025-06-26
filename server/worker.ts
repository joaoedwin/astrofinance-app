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

export default app
