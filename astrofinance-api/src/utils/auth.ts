import { compare, hash } from 'bcryptjs';
import { AuthPayload, User } from '../types';

// Constantes
const BCRYPT_COST_FACTOR = 12;
const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutos em segundos
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 dias em segundos

/**
 * Cria um hash da senha
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, BCRYPT_COST_FACTOR);
}

/**
 * Verifica se a senha está correta
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

/**
 * Gera um token JWT
 */
export function generateToken(payload: AuthPayload, secret: string, expiresIn: number = ACCESS_TOKEN_EXPIRY): string {
  // Na Cloudflare Workers, precisamos implementar manualmente a geração de JWT
  // pois não podemos usar a biblioteca jsonwebtoken
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(jwtPayload));
  const signature = createSignature(`${base64Header}.${base64Payload}`, secret);

  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Cria a assinatura para o JWT
 */
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Verifica um token JWT
 */
export async function verifyToken(token: string, secret: string): Promise<AuthPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [base64Header, base64Payload, signature] = parts;
    const expectedSignature = await createSignature(`${base64Header}.${base64Payload}`, secret);
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(atob(base64Payload));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) return null;
    
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

/**
 * Gera um token de atualização (refresh token)
 */
export function generateRefreshToken(payload: AuthPayload, secret: string): string {
  return generateToken(payload, secret, REFRESH_TOKEN_EXPIRY);
}

/**
 * Extrai o token do cabeçalho Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.substring(7); // Remove 'Bearer ' do início
}

/**
 * Cria uma resposta de usuário sem a senha
 */
export function createUserResponse(user: User) {
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
} 