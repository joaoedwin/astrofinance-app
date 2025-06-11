import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase, randomUUID } from './db'

// Aumentar o fator de custo do bcrypt para 12 (era 10)
// Um fator mais alto significa mais segurança, mas também mais tempo de processamento
const BCRYPT_COST_FACTOR = 12;

interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  created_at: string
  isAdmin?: boolean
  password_hash?: string
}

// Função para registrar um novo usuário
export async function registerUser(email: string, password: string, name: string, role: string = 'user'): Promise<User> {
  try {
    const db = getDatabase()
    
    // Verificar se o email já está em uso
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    if (existingUser) {
      throw new Error('Email já está em uso')
    }

    // Criar hash da senha com fator de custo maior
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR)

    // Criar usuário
    const user: User = {
      id: uuidv4(),
      email,
      name,
      role: role as "admin" | "user",
      created_at: new Date().toISOString()
    }

    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(user.id, user.email, user.name, passwordHash, user.role)

    return user
  } catch (error) {
    console.error('Erro ao registrar usuário:', error)
    throw error
  }
}

// Função para autenticar um usuário
export async function authenticateUser(email: string, password: string): Promise<User> {
  try {
    const db = getDatabase()
    
    // Buscar usuário
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User
    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.password_hash || '')
    if (!isValid) {
      throw new Error('Senha incorreta')
    }

    // Retornar usuário sem a senha
    const { password_hash, ...userWithoutPassword } = user
    return { ...userWithoutPassword, isAdmin: user.role === 'admin' }
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error)
    throw error
  }
}

// Função para buscar um usuário pelo ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const db = getDatabase()
    const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id) as User | null
    if (user) {
      user.isAdmin = user.role === 'admin'
    }
    return user
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    throw error
  }
} 