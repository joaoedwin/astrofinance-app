import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

const BCRYPT_COST_FACTOR = 12;

export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  created_at?: string;
  password_hash?: string;
  isAdmin?: boolean;
}

async function getUserByEmail(d1: D1Database, email: string): Promise<User | null> {
  const query = 'SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?';
  const user = await d1.prepare(query).bind(email).first<User>();
  return user;
}

export async function getUserById(d1: D1Database, id: string): Promise<User | null> {
  try {
    const query = 'SELECT id, email, name, role, created_at FROM users WHERE id = ?';
    const userResult = await d1.prepare(query).bind(id).first<Omit<User, 'isAdmin' | 'password_hash'>>();
    
    if (userResult) {
      return { ...userResult, isAdmin: userResult.role === 'admin' };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    throw error;
  }
}

export async function registerUser(d1: D1Database, email: string, password: string, name: string, role: "admin" | "user" = 'user'): Promise<Omit<User, 'password_hash'>> {
  try {
    const existingUser = await getUserByEmail(d1, email);
    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
    const userId = uuidv4();

    const insertQuery = 'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)';
    await d1.prepare(insertQuery).bind(userId, email, name, passwordHash, role).run();

    const newUser = await getUserById(d1, userId);
    if (!newUser) {
      throw new Error('Falha ao buscar usuário recém-criado.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userToReturn } = newUser;
    return userToReturn;

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    throw error;
  }
}

export async function authenticateUser(d1: D1Database, email: string, password: string): Promise<Omit<User, 'password_hash'> | null> {
  try {
    const userWithPasswordHash = await getUserByEmail(d1, email);
    if (!userWithPasswordHash || !userWithPasswordHash.password_hash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, userWithPasswordHash.password_hash);
    if (!isValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userToReturn } = userWithPasswordHash;
    return { ...userToReturn, isAdmin: userToReturn.role === 'admin' };
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
    throw error;
  }
}

export interface JwtPayload {
  id: string;
  email: string;
  role: "admin" | "user";
}

export function generateUserToken(user: Omit<User, 'password_hash' | 'isAdmin'>, jwtSecret: string): string {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
}

export function generateRefreshToken(user: Omit<User, 'password_hash' | 'isAdmin'>, jwtSecret: string): string {
  const payload = {
    id: user.id,
  };
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string, jwtSecret: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar/decodificar token:', error);
    throw new Error('Token inválido ou expirado');
  }
} 