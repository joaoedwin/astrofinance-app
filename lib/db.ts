import { randomUUID } from 'crypto'
import type { Category, Transaction } from '../types/database' // Adicionado Transaction aqui

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

  const selectQuery = 'SELECT * FROM categories WHERE id = ? AND user_id = ?'
  const category = await d1.prepare(selectQuery).bind(id, userId).first<Category>()

  return category
}

export async function updateCategory(d1: D1Database, id: string, name: string, type: 'income' | 'expense', userId: string): Promise<Category | null> {
  const updateQuery = 'UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?'
  await d1.prepare(updateQuery).bind(name, type, id, userId).run()

  const selectQuery = 'SELECT * FROM categories WHERE id = ? AND user_id = ?'
  const category = await d1.prepare(selectQuery).bind(id, userId).first<Category>()

  return category
}

export async function deleteCategory(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM categories WHERE id = ? AND user_id = ?'
  const { success } = await d1.prepare(query).bind(id, userId).run()
  return success
}

export async function getCategoryById(d1: D1Database, categoryId: string, userId: string): Promise<Category | null> {
  const query = 'SELECT * FROM categories WHERE id = ? AND user_id = ?';
  const category = await d1.prepare(query).bind(categoryId, userId).first<Category>();
  return category;
}

// --- Funções para Transações ---
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

export async function getTransactionById(d1: D1Database, id: string, userId: string): Promise<(Transaction & { category_name?: string }) | null> {
  const query = `
    SELECT t.*, c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE t.id = ? AND t.user_id = ?
  `;
  return await d1.prepare(query).bind(id, userId).first<Transaction & { category_name?: string }>();
}

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

  return await getTransactionById(d1, id, data.user_id);
}

export async function updateTransaction(d1: D1Database, id: string, userId: string, data: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>): Promise<Transaction | null> {
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

export async function deleteTransaction(d1: D1Database, id: string, userId: string): Promise<boolean> {
  const query = 'DELETE FROM transactions WHERE id = ? AND user_id = ?';
  const { success } = await d1.prepare(query).bind(id, userId).run();
  return success;
}

export { randomUUID } 