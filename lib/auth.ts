import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
// import { randomUUID } from './db' // randomUUID pode vir de crypto diretamente se necessário
import jwt from 'jsonwebtoken'
// O tipo D1Database é global no ambiente Worker ou de @cloudflare/workers-types
// import type { D1Database } from '@cloudflare/workers-types';

// Aumentar o fator de custo do bcrypt para 12
const BCRYPT_COST_FACTOR = 12;

// Interface User - garantir que corresponda ao schema do D1 e às necessidades da aplicação
// A coluna `password_hash` não deve ser exposta, exceto internamente.
// A propriedade `isAdmin` é derivada e pode ser adicionada após buscar o usuário.
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  created_at?: string; // D1 pode gerar isso automaticamente
  password_hash?: string; // Apenas para uso interno ao buscar do DB
  isAdmin?: boolean; // Derivado
}

// Função para buscar um usuário pelo email (necessário para registerUser)
async function getUserByEmail(d1: D1Database, email: string): Promise<User | null> {
  const query = 'SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?';
  // Especificar o tipo de retorno para first<User>()
  const user = await d1.prepare(query).bind(email).first<User>();
  return user;
}

// Função para buscar um usuário pelo ID (já existia, agora adaptada)
export async function getUserById(d1: D1Database, id: string): Promise<User | null> {
  try {
    // Selecionar password_hash aqui pode ser um risco se a função for usada em contextos não seguros.
    // Idealmente, selecione apenas os campos necessários para o contexto.
    // Por enquanto, manteremos para consistência com authenticateUser, mas com cuidado.
    const query = 'SELECT id, email, name, role, created_at FROM users WHERE id = ?';
    const userResult = await d1.prepare(query).bind(id).first<Omit<User, 'isAdmin' | 'password_hash'>>();
    
    if (userResult) {
      return { ...userResult, isAdmin: userResult.role === 'admin' };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    throw error; // Ou retornar null / tratar o erro de forma mais específica
  }
}

// Função para registrar um novo usuário
export async function registerUser(d1: D1Database, email: string, password: string, name: string, role: "admin" | "user" = 'user'): Promise<Omit<User, 'password_hash'>> {
  try {
    const existingUser = await getUserByEmail(d1, email);
    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const userId = uuidv4(); // Usar uuidv4 consistentemente

    const insertQuery = 'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)';
    await d1.prepare(insertQuery).bind(userId, email, name, passwordHash, role).run();

    // Retornar o usuário criado (sem o hash da senha)
    const newUser = await getUserById(d1, userId);
    if (!newUser) {
      // Isso não deveria acontecer se a inserção foi bem-sucedida e getUserById estiver correto.
      throw new Error('Falha ao buscar usuário recém-criado.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userToReturn } = newUser; // Remover password_hash antes de retornar
    return userToReturn;

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    // Se for um erro de constraint (ex: email unique), o D1 pode retornar um erro específico.
    // Tratar de acordo ou relançar.
    throw error;
  }
}

// Função para autenticar um usuário
export async function authenticateUser(d1: D1Database, email: string, password: string): Promise<Omit<User, 'password_hash'> | null> {
  try {
    const userWithPasswordHash = await getUserByEmail(d1, email); // getUserByEmail agora retorna password_hash
    if (!userWithPasswordHash || !userWithPasswordHash.password_hash) {
      // Usuário não encontrado ou não tem hash de senha (deve ter)
      return null; // Indicar falha na autenticação (usuário não encontrado)
    }

    const isValid = await bcrypt.compare(password, userWithPasswordHash.password_hash);
    if (!isValid) {
      return null; // Indicar falha na autenticação (senha incorreta)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userToReturn } = userWithPasswordHash;
    return { ...userToReturn, isAdmin: userToReturn.role === 'admin' };
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    throw error; // Ou retornar null para indicar falha genérica
  }
}


// As funções JWT não interagem com o banco de dados diretamente, então não precisam do d1 binding.
// Elas dependerão do JWT_SECRET do ambiente do worker (env.JWT_SECRET).

export interface JwtPayload {
  id: string;
  email: string;
  role: "admin" | "user";
  // iat, exp são adicionados automaticamente pelo jwt.sign
}

// Função para gerar token JWT
// O JWT_SECRET virá de env no contexto do Worker (ex: c.env.JWT_SECRET em Hono)
export function generateUserToken(user: Omit<User, 'password_hash' | 'isAdmin'>, jwtSecret: string): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' }); // Exemplo: token expira em 1 hora
}

export function generateRefreshToken(user: Omit<User, 'password_hash' | 'isAdmin'>, jwtSecret: string): string {
  // Para refresh tokens, pode-se usar um payload diferente ou um tempo de expiração maior
  const payload = {
    id: user.id,
    // Poderia adicionar um scopo ou tipo específico para refresh token
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' }); // Exemplo: refresh token expira em 7 dias
}


// Função para verificar token JWT (adaptada para Hono/jwt middleware ou uso direto)
// Retorna o payload decodificado ou lança erro se inválido.
export function verifyToken(token: string, jwtSecret: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar/decodificar token:', error);
    throw new Error('Token inválido ou expirado'); // Lançar um erro que pode ser capturado
  }
} 