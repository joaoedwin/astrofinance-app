import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import * as jose from 'jose' // Alterado para jose

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
  // Adicionar exp e iat se quisermos que sejam parte do nosso payload explicitamente,
  // embora jose os adicione automaticamente.
  // exp?: number;
  // iat?: number;
}

// Helper para converter string para Uint8Array para a chave secreta do jose
const getJwtSecretKey = (secret: string): Uint8Array => {
  return new TextEncoder().encode(secret);
};

export async function generateUserToken(user: Omit<User, 'password_hash' | 'isAdmin'>, jwtSecret: string): Promise<string> {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  const secretKey = getJwtSecretKey(jwtSecret);
  const token = await new jose.SignJWT(payload as unknown as jose.JWTPayload) // Cast para JWTPayload
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // Tempo de expiração
    .sign(secretKey);
  return token;
}

export async function generateRefreshToken(user: Omit<User, 'password_hash' | 'isAdmin'>, jwtSecret: string): Promise<string> {
  const payload = {
    id: user.id,
    // Poderia adicionar um tipo/escopo específico para refresh token se necessário
  };
  const secretKey = getJwtSecretKey(jwtSecret);
  const token = await new jose.SignJWT(payload as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Refresh tokens geralmente têm vida mais longa
    .sign(secretKey);
  return token;
}

export async function verifyToken(token: string, jwtSecret: string): Promise<JwtPayload> {
  try {
    const secretKey = getJwtSecretKey(jwtSecret);
    const { payload } = await jose.jwtVerify(token, secretKey, {
      algorithms: ['HS256'], // Especificar o algoritmo esperado
    });
    return payload as JwtPayload;
  } catch (error: any) {
    console.error('Erro ao verificar/decodificar token com jose:', error.code, error.message);
    // error.code pode ser 'ERR_JWT_EXPIRED', 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED', etc.
    throw new Error('Token inválido ou expirado');
  }
} 