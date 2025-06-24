import { randomUUID } from 'node:crypto';
import { hashPassword } from '../utils/auth';
import type { D1Database } from '@cloudflare/workers-types';

/**
 * Script para inicializar o banco de dados com categorias padrão e um usuário administrador.
 * Este script deve ser executado manualmente após o deploy da aplicação.
 */
export async function initializeDatabase(db: D1Database): Promise<void> {
  console.log('Inicializando banco de dados...');

  try {
    // Criar usuário administrador
    const adminId = randomUUID();
    const adminEmail = 'admin@astrofinance.com';
    const adminPassword = 'Admin@123'; // Senha temporária que deve ser alterada após o primeiro login
    const adminPasswordHash = await hashPassword(adminPassword);
    const now = new Date().toISOString();

    // Verificar se o usuário admin já existe
    const existingAdmin = await db.prepare('SELECT * FROM users WHERE email = ?').bind(adminEmail).first();
    
    if (!existingAdmin) {
      console.log('Criando usuário administrador...');
      await db.prepare(
        'INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(adminId, adminEmail, 'Administrador', adminPasswordHash, 'admin', now).run();
      console.log('Usuário administrador criado com sucesso!');
    } else {
      console.log('Usuário administrador já existe.');
    }

    // Verificar se já existem categorias padrão
    const existingDefaultUser = await db.prepare('SELECT * FROM users WHERE id = "default"').first();
    
    if (!existingDefaultUser) {
      console.log('Criando usuário padrão para categorias...');
      // Criar um usuário especial "default" para as categorias padrão
      await db.prepare(
        'INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind('default', 'default@astrofinance.com', 'Default User', 'no-password', 'system', now).run();
    }

    // Criar categorias padrão
    const defaultCategories = [
      // Categorias de receita
      { id: randomUUID(), name: 'Salário', type: 'income', color: '#4CAF50', icon: 'cash' },
      { id: randomUUID(), name: 'Investimentos', type: 'income', color: '#2196F3', icon: 'trending-up' },
      { id: randomUUID(), name: 'Freelance', type: 'income', color: '#9C27B0', icon: 'code' },
      { id: randomUUID(), name: 'Presentes', type: 'income', color: '#E91E63', icon: 'gift' },
      { id: randomUUID(), name: 'Outras Receitas', type: 'income', color: '#00BCD4', icon: 'plus-circle' },
      
      // Categorias de despesa
      { id: randomUUID(), name: 'Alimentação', type: 'expense', color: '#FF5722', icon: 'food' },
      { id: randomUUID(), name: 'Moradia', type: 'expense', color: '#795548', icon: 'home' },
      { id: randomUUID(), name: 'Transporte', type: 'expense', color: '#607D8B', icon: 'car' },
      { id: randomUUID(), name: 'Saúde', type: 'expense', color: '#F44336', icon: 'heart' },
      { id: randomUUID(), name: 'Educação', type: 'expense', color: '#3F51B5', icon: 'school' },
      { id: randomUUID(), name: 'Lazer', type: 'expense', color: '#FF9800', icon: 'ticket' },
      { id: randomUUID(), name: 'Roupas', type: 'expense', color: '#9E9E9E', icon: 'tshirt' },
      { id: randomUUID(), name: 'Assinaturas', type: 'expense', color: '#673AB7', icon: 'calendar' },
      { id: randomUUID(), name: 'Outras Despesas', type: 'expense', color: '#FFC107', icon: 'minus-circle' },
    ];

    console.log('Verificando categorias padrão...');
    
    // Verificar se já existem categorias padrão
    const existingCategories = await db.prepare('SELECT * FROM categories WHERE user_id = "default"').all();
    
    if (existingCategories.results.length === 0) {
      console.log('Criando categorias padrão...');
      // Inserir categorias padrão
      for (const category of defaultCategories) {
        await db.prepare(
          'INSERT INTO categories (id, name, type, user_id, color, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(category.id, category.name, category.type, 'default', category.color, category.icon, now, now).run();
      }
      console.log(`${defaultCategories.length} categorias padrão criadas com sucesso!`);
    } else {
      console.log('Categorias padrão já existem.');
    }

    console.log('Inicialização do banco de dados concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    throw error;
  }
}

// Exportar uma função para ser chamada via API
export async function initDbHandler(db: D1Database): Promise<{ success: boolean; message: string }> {
  try {
    await initializeDatabase(db);
    return { success: true, message: 'Banco de dados inicializado com sucesso!' };
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
    return { success: false, message: `Erro ao inicializar banco de dados: ${error}` };
  }
} 