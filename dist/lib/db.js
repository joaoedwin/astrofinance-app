"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomUUID = void 0;
exports.getDatabase = getDatabase;
exports.getCategories = getCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const crypto_1 = require("crypto");
Object.defineProperty(exports, "randomUUID", { enumerable: true, get: function () { return crypto_1.randomUUID; } });
// Configuração do banco de dados
let db = null;
// Função para obter uma conexão com o banco de dados
function getDatabase() {
    if (!db) {
        db = new better_sqlite3_1.default('finance.db');
        // Adiciona os métodos assíncronos
        const originalAll = db.prepare.bind(db);
        const originalGet = db.prepare.bind(db);
        const originalRun = db.prepare.bind(db);
        db.all = async function (sql, params) {
            const stmt = originalAll(sql);
            return stmt.all(params || []);
        };
        db.get = async function (sql, params) {
            const stmt = originalGet(sql);
            return stmt.get(params || []);
        };
        db.run = async function (sql, params) {
            const stmt = originalRun(sql);
            const result = stmt.run(params || []);
            return {
                lastID: result.lastInsertRowid,
                changes: result.changes
            };
        };
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
    `);
    }
    return db;
}
// Funções para manipulação de categorias
async function getCategories(userId, type) {
    const db = getDatabase();
    let query = 'SELECT * FROM categories WHERE user_id = ?';
    const params = [userId];
    if (type) {
        query += ' AND type = ?';
        params.push(type);
    }
    query += ' ORDER BY name';
    return await db.all(query, params);
}
async function createCategory(name, type, userId) {
    const db = getDatabase();
    const id = (0, crypto_1.randomUUID)();
    await db.run('INSERT INTO categories (id, name, type, user_id) VALUES (?, ?, ?, ?)', [id, name, type, userId]);
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category)
        throw new Error('Failed to create category');
    return category;
}
async function updateCategory(id, name, type, userId) {
    const db = getDatabase();
    await db.run('UPDATE categories SET name = ?, type = ? WHERE id = ? AND user_id = ?', [name, type, id, userId]);
    const category = await db.get('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category)
        throw new Error('Category not found');
    return category;
}
async function deleteCategory(id, userId) {
    const db = getDatabase();
    await db.run('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId]);
}
