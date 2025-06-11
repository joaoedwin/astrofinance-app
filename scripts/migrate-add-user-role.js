const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../finance.db');
const db = new Database(dbPath);

try {
  // Adiciona a coluna 'role' se não existir
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasRole = columns.some(col => col.name === 'role');
  if (!hasRole) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';`);
    console.log("Coluna 'role' adicionada à tabela users.");
  } else {
    console.log("A coluna 'role' já existe na tabela users.");
  }
  db.close();
} catch (err) {
  console.error('Erro ao adicionar coluna role:', err);
  process.exit(1);
} 