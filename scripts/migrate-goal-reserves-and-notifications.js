const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../finance.db');
const db = new Database(dbPath);

try {
  // Tabela de reservas mensais para metas de compra/objetivo
  db.exec(`
    CREATE TABLE IF NOT EXISTS goal_reserves (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      month TEXT NOT NULL, -- formato '2024-05'
      amount DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(goal_id, user_id, month),
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('Tabela goal_reserves criada ou já existia.');

  // Tabela de notificações
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('goal_reserve', 'goal_limit', 'update', 'announce')),
      goal_id TEXT,
      message TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0, -- 0 = não lida, 1 = lida
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );
  `);
  console.log('Tabela notifications criada ou já existia.');

  // Adicionar campos description e created_by se não existirem
  db.exec(`
    ALTER TABLE notifications ADD COLUMN description TEXT;
  `);
  db.exec(`
    ALTER TABLE notifications ADD COLUMN created_by TEXT;
  `);

  console.log('Migração concluída com sucesso!');
} catch (err) {
  console.error('Erro ao executar migração:', err);
  process.exit(1);
}

db.close(); 