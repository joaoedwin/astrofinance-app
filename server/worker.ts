import { Hono, Next } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { secureHeaders } from 'hono/secure-headers'

import { getCategories, createCategory, updateCategory, deleteCategory } from '../lib/db'
import {
  registerUser,
  authenticateUser,
  generateUserToken,
  generateRefreshToken,
  verifyToken,
  getUserById,
  User as AuthUser, // Renomear para evitar conflito com outros usos de 'User'
  JwtPayload
} from '../lib/auth'
import { Context } from 'hono/jsx';

// Tipos de Bindings e Variáveis de Ambiente que o Worker espera receber.
export type Bindings = {
  DB: D1Database; // Binding para o banco de dados D1
  JWT_SECRET: string; // Segredo para JWT
  // Adicione outras variáveis de ambiente aqui se necessário
  // EXEMPLO_VAR: string;
};

// Criar uma nova instância do Hono, especificando os tipos de Bindings
const app = new Hono<{ Bindings: Bindings }>()

// --- Middlewares ---

// 1. Headers de Segurança (recomendado)
app.use('*', secureHeaders())

// 2. CORS (Cross-Origin Resource Sharing)
// Permite que o frontend Vercel acesse a API.
app.use(
  '/api/*', // Aplicar CORS a todas as rotas /api/*
  cors({
    origin: ['https://astrofinance-app.vercel.app', 'http://localhost:3000'], // Permitir frontend Vercel e localhost (para dev Next.js)
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'], // Headers que o frontend pode enviar
    credentials: true, // Se você usa cookies ou sessions com Authorization Bearer
    maxAge: 86400, // Cache do preflight OPTIONS por 1 dia
  })
)

// 3. Middleware JWT para proteger rotas
// As rotas de login e registro não devem ser protegidas por este middleware.
// Este middleware irá verificar o token 'Authorization: Bearer <token>'
// e, se válido, adicionará `c.get('jwtPayload')` ao contexto.
const jwtMiddleware = jwt({
  secret: (c: Context) => c.env.JWT_SECRET, // Obtém o segredo dinamicamente do env
  // cookie: 'auth_token', // Alternativamente, se você estivesse usando tokens em cookies
})

// Função helper para aplicar middleware condicionalmente
const applyJwtMiddlewareIf = (condition: (c: Context) => boolean, middleware: any) => {
  return async (c: Context, next: Next) => {
    if (condition(c)) {
      return middleware(c, next)
    }
    return next()
  }
}

// Aplicar JWT exceto para login e registro
app.use(
  '/api/*',
  applyJwtMiddlewareIf(
    (c) => !/^\/api\/auth\/(login|register)$/.test(c.req.path),
    jwtMiddleware
  )
)


// --- Rotas de Autenticação (`/api/auth/*`) ---

// POST /api/auth/register
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
    const token = generateUserToken(newUser, c.env.JWT_SECRET)
    const refreshToken = generateRefreshToken(newUser, c.env.JWT_SECRET)

    return c.json({
      user: newUser,
      token,
      refreshToken,
    }, 201)
  } catch (error: any) {
    console.error("Register error:", error.message, error.stack)
    if (error.message.includes('Email já está em uso')) {
      return c.json({ error: error.message }, 409) // Conflict
    }
    return c.json({ error: 'Falha ao registrar usuário.', details: error.message }, 500)
  }
})

// POST /api/auth/login
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>()

    if (!email || !password) {
      return c.json({ error: 'Email e senha são obrigatórios.' }, 400)
    }

    const user = await authenticateUser(c.env.DB, email, password)
    if (!user) {
      return c.json({ error: 'Credenciais inválidas.' }, 401) // Unauthorized
    }

    const token = generateUserToken(user, c.env.JWT_SECRET)
    const refreshToken = generateRefreshToken(user, c.env.JWT_SECRET)

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

// POST /api/auth/refresh (Exemplo de rota de refresh token)
app.post('/api/auth/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json<{ refreshToken?: string }>();
    if (!refreshToken) {
      return c.json({ error: 'Refresh token é obrigatório.' }, 400);
    }

    const payload = verifyToken(refreshToken, c.env.JWT_SECRET) as JwtPayload; // Assegurar que o payload é o esperado
    const user = await getUserById(c.env.DB, payload.id); // Buscar usuário para garantir que ainda existe/é válido

    if (!user) {
      return c.json({ error: 'Usuário não encontrado ou token de atualização inválido.' }, 401);
    }

    const newAccessToken = generateUserToken(user, c.env.JWT_SECRET);
    // Opcional: gerar um novo refresh token também (para rotação de refresh token)
    // const newRefreshToken = generateRefreshToken(user, c.env.JWT_SECRET);

    return c.json({
      token: newAccessToken,
      // refreshToken: newRefreshToken, // se estiver rotacionando
      user, // opcional: retornar dados do usuário atualizados
    });

  } catch (error: any) {
    console.error("Refresh token error:", error.message);
    return c.json({ error: 'Token de atualização inválido ou expirado.' }, 401);
  }
});


// GET /api/auth/me (Exemplo de rota protegida para obter dados do usuário logado)
app.get('/api/auth/me', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload; // Obtém o payload do middleware JWT

  if (!payload || !payload.id) {
    return c.json({ error: 'Não autorizado ou payload do token inválido.' }, 401);
  }

  try {
    const user = await getUserById(c.env.DB, payload.id);
    if (!user) {
      return c.json({ error: 'Usuário não encontrado.' }, 404);
    }
    return c.json(user);
  } catch (error: any) {
    console.error("Get Me error:", error.message);
    return c.json({ error: 'Falha ao buscar dados do usuário.', details: error.message }, 500);
  }
});


// --- Rotas de Categorias (`/api/categories/*`) ---

// GET /api/categories
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

// POST /api/categories
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

// PUT /api/categories/:id
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

    // Adicionar verificação se a categoria pertence ao usuário antes de atualizar (opcional, mas bom para segurança)
    // const existingCategory = await getCategoryByIdAndUser(c.env.DB, categoryId, payload.id);
    // if (!existingCategory) {
    //   return c.json({ error: 'Categoria não encontrada ou não pertence ao usuário.' }, 404);
    // }

    const updatedCategory = await updateCategory(c.env.DB, categoryId, name, type, payload.id);
     if (!updatedCategory) {
        return c.json({ error: 'Falha ao atualizar categoria, o objeto retornado é nulo ou não pertence ao usuário.' }, 404); // Ou 500 se for erro interno
    }
    return c.json(updatedCategory);
  } catch (error: any) {
    console.error("Update Category error:", error.message);
    return c.json({ error: 'Falha ao atualizar categoria.', details: error.message }, 500);
  }
});

// DELETE /api/categories/:id
app.delete('/api/categories/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const categoryId = c.req.param('id');
  if (!categoryId) return c.json({ error: 'ID da categoria é obrigatório.' }, 400);

  try {
    // Adicionar verificação se a categoria pertence ao usuário antes de deletar (opcional)
    const success = await deleteCategory(c.env.DB, categoryId, payload.id);
    if (success) {
      return c.json({ message: 'Categoria deletada com sucesso.' }, 200); // Ou 204 No Content
    } else {
      // Isso pode acontecer se a categoria não existir ou não pertencer ao usuário, resultando em 0 linhas afetadas.
      return c.json({ error: 'Falha ao deletar categoria ou categoria não encontrada.' }, 404);
    }
  } catch (error: any) {
    console.error("Delete Category error:", error.message);
    return c.json({ error: 'Falha ao deletar categoria.', details: error.message }, 500);
  }
});


// --- Rotas de Transações (`/api/transactions/*`) ---
// TODO: Migrar as rotas de transações de `server.mjs` (agora `server/worker.ts` original)
// para este formato Hono, usando funções de `lib/db.ts` (que precisam ser criadas/refatoradas para D1).
// Exemplo:
// app.get('/api/transactions', async (c) => { ... });
// app.post('/api/transactions', async (c) => { ... });

// GET /api/transactions
app.get('/api/transactions', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const month = c.req.query('month'); // formato YYYY-MM
  const type = c.req.query('type') as 'income' | 'expense' | undefined;

  try {
    const transactions = await getTransactions(c.env.DB, payload.id, month, type);
    return c.json(transactions);
  } catch (error: any) {
    console.error("Get Transactions error:", error.message);
    return c.json({ error: 'Falha ao buscar transações.', details: error.message }, 500);
  }
});

// GET /api/transactions/:id
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

// POST /api/transactions
app.post('/api/transactions', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  try {
    const body = await c.req.json<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>();

    // Validação básica (pode ser melhorada com Zod)
    if (!body.date || !body.description || body.amount === undefined || !body.type || !body.category_id) {
      return c.json({ error: 'Campos date, description, amount, type, category_id são obrigatórios.' }, 400);
    }
    if (!['income', 'expense'].includes(body.type)) {
      return c.json({ error: 'Tipo de transação inválido.' }, 400);
    }

    // Verificar se a categoria pertence ao usuário (opcional, mas boa prática)
    const category = await getCategoryById(c.env.DB, body.category_id, payload.id); // Supondo que getCategoryById exista
    if (!category) {
        return c.json({ error: 'Categoria não encontrada ou não pertence ao usuário.' }, 400);
    }

    const transactionData: Omit<Transaction, 'id' | 'created_at'> = {
      ...body,
      user_id: payload.id, // Adicionar user_id do token
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

// PUT /api/transactions/:id
app.put('/api/transactions/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const transactionId = c.req.param('id');
  if (!transactionId) return c.json({ error: 'ID da transação é obrigatório.' }, 400);

  try {
    const body = await c.req.json<Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>>();

    // Validação (melhorar com Zod)
    if (!body.date || !body.description || body.amount === undefined || !body.type || !body.category_id) {
      return c.json({ error: 'Campos date, description, amount, type, category_id são obrigatórios para atualização.' }, 400);
    }
     if (!['income', 'expense'].includes(body.type)) {
      return c.json({ error: 'Tipo de transação inválido.' }, 400);
    }

    // Verificar se a categoria nova pertence ao usuário
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

// DELETE /api/transactions/:id
app.delete('/api/transactions/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload;
  if (!payload || !payload.id) return c.json({ error: 'ID do usuário não encontrado no token' }, 401);

  const transactionId = c.req.param('id');
  if (!transactionId) return c.json({ error: 'ID da transação é obrigatório.' }, 400);

  try {
    const success = await deleteTransaction(c.env.DB, transactionId, payload.id);
    if (success) {
      return c.json({ message: 'Transação deletada com sucesso.' }, 200); // ou 204
    } else {
      return c.json({ error: 'Transação não encontrada ou não pertence ao usuário.' }, 404);
    }
  } catch (error: any) {
    console.error("Delete Transaction error:", error.message);
    return c.json({ error: 'Falha ao deletar transação.', details: error.message }, 500);
  }
});


// --- Handler de Erro Genérico e Not Found ---
app.notFound((c) => {
  return c.json({ error: 'Rota não encontrada.' }, 404)
})

app.onError((err, c) => {
  console.error(`Erro no servidor: ${err}`, err.stack)
  return c.json({ error: 'Erro interno do servidor.', message: err.message }, 500)
})

// Exportar o app Hono para ser usado pelo ambiente do Cloudflare Worker
export default app
