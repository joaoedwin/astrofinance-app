import { randomUUID } from 'crypto'
import type { Category } from '../types/database' // Supondo que Transaction e outros tipos sejam importados onde são usados ou adicionados aqui.

// Nota: O tipo D1Database geralmente é fornecido globalmente em um ambiente Worker
// ou pode ser importado de '@cloudflare/workers-types' se você tiver esse pacote.
// Para este contexto, vamos assumir que ele está disponível no `env` do worker.

// Funções para manipulação de categorias

export async function getCategories(d1: D1Database, userId: string, type?: 'income' | 'expense'): Promise<Category[]> {
  let query = 'SELECT * FROM categories WHERE user_id = ?'
  const params: any[] = [userId]

  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }
  query += ' ORDER BY name'

  const { results } = await d1.prepare(query).bind(...params).all<Category>()
  return results || []
}

export async function createCategory(d1: D1Database, name: string, type: 'income' | 'expense', userId: string): Promise<Category | null> {
  const id = randomUUID()
  
  const insertQuery = 'INSERT INTO categories (id, name, type, user_id) VALUES (?, ?, ?, ?)'
  await d1.prepare(insertQuery).bind(id, name, type, userId).run()

  // Após inserir, buscar o registro para retornar o objeto completo
  const selectQuery = 'SELECT * FROM categories WHERE id = ? AND user_id = ?'
  const category = await d1.prepare(selectQuery).bind(id, userId).first<Category>()

  return category // Retorna o objeto Category ou null se não for encontrado (improvável após inserção bem-sucedida)
}

export async function updateCategory(d1: D1Database, id: string, name: string, type: 'income' | 'expense', userId: string): Promise<Category | null> {
  const updateQuery = 'UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?'
  await d1.prepare(updateQuery).bind(name, type, id, userId).run()

  // Após atualizar, buscar o registro para retornar o objeto atualizado
  const selectQuery = 'SELECT * FROM categories WHERE id = ? AND user_id = ?'
  const category = await d1.prepare(selectQuery).bind(id, userId).first<Category>()

  return category
}

export async function deleteCategory(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM categories WHERE id = ? AND user_id = ?'
  const { success } = await d1.prepare(query).bind(id, userId).run()
  return success
}

// Exportar randomUUID se ainda for necessário em outros lugares que importam de db.ts
export { randomUUID }

// Adicionar função para buscar uma categoria específica pelo ID e ID do usuário
export async function getCategoryById(d1: D1Database, categoryId: string, userId: string): Promise<Category | null> {
  const query = 'SELECT * FROM categories WHERE id = ? AND user_id = ?';
  const category = await d1.prepare(query).bind(categoryId, userId).first<Category>();
  return category;
}

// --- Funções para Transações ---
import type { Transaction } from '../types/database';

// Listar todas as transações de um usuário, opcionalmente por mês e tipo, incluindo nome da categoria
export async function getTransactions(
  d1: D1Database,
  userId: string,
  month?: string, // formato YYYY-MM
  type?: 'income' | 'expense'
): Promise<(Transaction & { category_name?: string })[]> {
  let query = `
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params: any[] = [userId];

  if (month) {
    query += " AND strftime('%Y-%m', t.date) = ?";
    params.push(month);
  }
  if (type) {
    query += " AND t.type = ?";
    params.push(type);
  }
  query += ' ORDER BY t.date DESC, t.created_at DESC';
  
  const { results } = await d1.prepare(query).bind(...params).all<Transaction & { category_name?: string }>();
  return results || [];
}

// Buscar uma transação específica pelo ID e ID do usuário
export async function getTransactionById(d1: D1Database, id: string, userId: string): Promise<(Transaction & { category_name?: string }) | null> {
  const query = `
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ? AND t.user_id = ?
  `;
  return await d1.prepare(query).bind(id, userId).first<Transaction & { category_name?: string }>();
}

// Criar uma nova transação
// O tipo do input pode ser Omit<Transaction, 'id' | 'user_id' | 'created_at'> e adicionar user_id internamente
export async function createTransaction(d1: D1Database, data: Omit<Transaction, 'id' | 'created_at'>): Promise<Transaction | null> {
  const id = randomUUID();
  const query = `
    INSERT INTO transactions (id, date, description, amount, type, category_id, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await d1.prepare(query).bind(
    id,
    data.date,
    data.description,
    data.amount,
    data.type,
    data.category_id,
    data.user_id
  ).run();

  return await getTransactionById(d1, id, data.user_id); // Retorna a transação completa com category_name
}

// Atualizar uma transação existente
export async function updateTransaction(d1: D1Database, id: string, userId: string, data: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>): Promise<Transaction | null> {
  // Construir a query de update dinamicamente baseado nos campos fornecidos em 'data'
  // Por simplicidade, vamos assumir que os campos principais podem ser atualizados.
  // Cuidado: não permitir update de user_id ou id.
  const { date, description, amount, type, category_id } = data;
  if (!date || !description || amount === undefined || !type || !category_id) {
    throw new Error("Campos insuficientes para atualização da transação.");
  }

  const query = `
    UPDATE transactions
    SET date = ?, description = ?, amount = ?, type = ?, category_id = ?
    WHERE id = ? AND user_id = ?
  `;
  await d1.prepare(query).bind(
    date,
    description,
    amount,
    type,
    category_id,
    id,
    userId
  ).run();

  return await getTransactionById(d1, id, userId);
}

// Deletar uma transação
export async function deleteTransaction(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
  const { success } = await d1.prepare(query).bind(id, userId).run();
  return success;
}


// TODO: Adicionar funções para outras entidades (Users, Goals, etc.)
// seguindo o mesmo padrão:
// - Aceitar d1: D1Database como primeiro parâmetro.
// - Usar d1.prepare(...).bind(...).all()/first()/run().
// - Remover qualquer referência a getDatabase() ou better-sqlite3.

// Exemplo para User (a ser expandido em lib/auth.ts ou aqui)
/*
import type { User } from '../types/database'; // Supondo que User está em types/database.d.ts

export async function getUserById(d1: D1Database, id: string): Promise<User | null> {
  const query = 'SELECT id, email, name, role, created_at FROM users WHERE id = ?';
  const user = await d1.prepare(query).bind(id).first<User>();
  if (user) {
    // @ts-ignore TODO: alinhar User com o que vem do DB ou o tipo no workers-types
    user.isAdmin = user.role === 'admin';
  }
  return user;
}

export async function getUserByEmail(d1: D1Database, email: string): Promise<User | null> {
  const query = 'SELECT * FROM users WHERE email = ?';
  return await d1.prepare(query).bind(email).first<User>();
}

export async function createUserInDB(d1: D1Database, user: Omit<User, 'created_at' | 'isAdmin'>, passwordHash: string): Promise<User | null> {
  const id = user.id || randomUUID();
  const query = 'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)';
  await d1.prepare(query).bind(id, user.email, user.name, passwordHash, user.role).run();

  // Retornar o usuário criado (sem o hash da senha)
  return await getUserById(d1, id);
}
*/