import BetterSQLite3 from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import type { Database, Category, Transaction } from '../types/database'

// Configuração do banco de dados
let db: Database | null = null

// Função para obter uma conexão com o banco de dados
export function getDatabase(): Database {
  if (!db) {
    db = new BetterSQLite3('finance.db') as Database
    
    // Adiciona os métodos assíncronos
    const originalAll = db.prepare.bind(db)
    const originalGet = db.prepare.bind(db)
    const originalRun = db.prepare.bind(db)

    db.all = async function<T>(sql: string, params?: any[]): Promise<T[]> {
      const stmt = originalAll(sql)
      return stmt.all(params || []) as T[]
    }

    db.get = async function<T>(sql: string, params?: any[]): Promise<T> {
      const stmt = originalGet(sql)
      return stmt.get(params || []) as T
    }

    db.run = async function(sql: string, params?: any[]): Promise<{ lastID: number; changes: number }> {
      const stmt = originalRun(sql)
      const result = stmt.run(params || [])
      return {
        lastID: result.lastInsertRowid as number,
        changes: result.changes
      }
    }

    // Criação das tabelas (idempotente)
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        color TEXT,
        icon TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS installments (
        id TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        category_id TEXT NOT NULL,
        totalAmount DECIMAL(10,2) NOT NULL,
        installmentAmount DECIMAL(10,2) NOT NULL,
        totalInstallments INTEGER NOT NULL,
        paidInstallments INTEGER NOT NULL DEFAULT 0,
        startDate DATE NOT NULL,
        nextPaymentDate DATE NOT NULL,
        userId TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'expense',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        target_amount DECIMAL(10,2) NOT NULL,
        current_amount DECIMAL(10,2) DEFAULT 0,
        category_id TEXT,
        type TEXT NOT NULL CHECK (type IN ('saving', 'spending', 'purchase')),
        recurrence TEXT DEFAULT NULL, -- monthly, yearly, custom
        start_date DATE NOT NULL,
        end_date DATE,
        status TEXT NOT NULL DEFAULT 'active', -- active, completed, cancelled
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `)
  }
  return db
}

// Funções para manipulação de categorias
export async function getCategories(userId: string, type?: 'income' | 'expense'): Promise<Category[]> {
  const db = getDatabase()
  let query = 'SELECT * FROM categories WHERE user_id = ?'
  const params: any[] = [userId]

  if (type) {
    query += ' AND type = ?'
    params.push(type)
  }

  query += ' ORDER BY name'
  return await db.all<Category>(query, params)
}

export async function createCategory(name: string, type: 'income' | 'expense', userId: string): Promise<Category> {
  const db = getDatabase()
  const id = randomUUID()
  
  await db.run('INSERT INTO categories (id, name, type, user_id) VALUES (?, ?, ?, ?)', [id, name, type, userId])

  const category = await db.get<Category>('SELECT * FROM categories WHERE id = ?', [id])
  if (!category) throw new Error('Failed to create category')
  return category
}

export async function updateCategory(id: string, name: string, type: 'income' | 'expense', userId: string): Promise<Category> {
  const db = getDatabase()
  
  await db.run('UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?', [name, type, id, userId])

  const category = await db.get<Category>('SELECT * FROM categories WHERE id = ?', [id])
  if (!category) throw new Error('Category not found')
  return category
}

export async function deleteCategory(id: string, userId: string): Promise<void> {
  const db = getDatabase()
  await db.run('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId])
}

export { randomUUID } 