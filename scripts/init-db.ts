import BetterSQLite3 from 'better-sqlite3'; // Importar diretamente
import { randomUUID } from "crypto";
import path from 'path'; // Para construir o caminho do DB

// Definir o tipo para o DB local, similar ao que era antes
interface LocalDatabase extends BetterSQLite3.Database {
  // Se você tinha métodos customizados como db.all, db.get assíncronos,
  // eles não são padrão do better-sqlite3 e precisariam ser adicionados aqui se o script os usasse.
  // Este script usa apenas db.prepare(...).run(), que é síncrono.
}

async function main() {
  try {
    console.log("Inicializando banco de dados local (finance.db)...");
    // Assumindo que finance.db está na raiz do projeto
    const dbPath = path.resolve(process.cwd(), 'finance.db');
    const db: LocalDatabase = new BetterSQLite3(dbPath) as LocalDatabase;

    // Criação das tabelas (idempotente) - COPIADO DE lib/db.ts ORIGINAL
    // É importante que este schema seja compatível com o que o script espera.
    // Ou, se o arquivo finance.db já existir com as tabelas, esta parte pode ser desnecessária.
    // Por segurança, vamos incluir a criação de tabelas se elas não existirem.
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        role TEXT NOT NULL DEFAULT 'user'
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        user_id TEXT NOT NULL, -- 'system' para categorias padrão
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        color TEXT,
        icon TEXT
        -- Removido FOREIGN KEY (user_id) REFERENCES users(id) para categorias 'system'
        -- Ou criar um usuário 'system' se a FK for mantida.
        -- Para simplificar, vou remover a FK aqui neste script de init local.
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
        creditCardId INTEGER, -- Removida referência a credit_cards para simplificar init local
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
        recurrence TEXT DEFAULT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
       CREATE TABLE IF NOT EXISTS credit_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        lastFourDigits TEXT,
        bank TEXT,
        cardLimit REAL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
        -- FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE -- Removido para simplificar init
      );
      CREATE TABLE IF NOT EXISTS goal_reserves (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        month TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(goal_id, user_id, month),
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        type TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        read INTEGER DEFAULT 0,
        description TEXT,
        created_by TEXT,
        goal_id TEXT
        -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Removido para simplificar
        -- FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE -- Removido para simplificar
      );
    `);
    
    // Inserir categorias padrão
    const defaultCategories = [
      { name: "Salário", type: "income" },
      { name: "Investimentos", type: "income" },
      { name: "Alimentação", type: "expense" },
      { name: "Moradia", type: "expense" },
      { name: "Transporte", type: "expense" },
      { name: "Saúde", type: "expense" },
      { name: "Educação", type: "expense" },
      { name: "Lazer", type: "expense" },
      { name: "Outros", type: "expense" }
    ]

    for (const category of defaultCategories) {
      db.prepare("INSERT OR IGNORE INTO categories (id, name, type, user_id) VALUES (?, ?, ?, ?)")
        .run(randomUUID(), category.name, category.type, "system")
    }

    console.log("Banco de dados inicializado com sucesso!")
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error)
    process.exit(1)
  }
}

main() 