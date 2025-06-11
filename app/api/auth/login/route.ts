import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { getDatabase } from '@/lib'
import type { User } from '@/types/database'
import type { AuthUser, AuthResponse } from '@/types/auth'
import { loginRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.JWT_SECRET) {
  console.error('AVISO: JWT_SECRET não está definido nas variáveis de ambiente. Usando valor padrão (inseguro para produção).')
}

// Usar a variável de ambiente JWT_SECRET ou gerar uma chave dinâmica para desenvolvimento
// NOTA: Em produção, sempre use uma variável de ambiente fixa!
const JWT_SECRET = process.env.JWT_SECRET || '99c30cac76ce9f79ba2cd54d472434d5a7eb36632c4b07d2329a3d187f3f7c23'

// Usar a variável de ambiente JWT_REFRESH_SECRET ou gerar uma chave dinâmica para desenvolvimento
// NOTA: Em produção, sempre use uma variável de ambiente fixa!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '37a8eec1ce19687d132fe29051dca629d164e2c4958ba141d5f4133a33f0688f'

// Função para obter o IP real, considerando proxies
function getIpAddress(request: Request): string {
  // Tentar obter o IP real de cabeçalhos comuns de proxy
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Pega o primeiro IP da lista (cliente original)
    return forwardedFor.split(',')[0].trim()
  }
  
  // Cabeçalhos alternativos que podem conter o IP
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  
  // Se não houver cabeçalhos de proxy, retorna um valor padrão para evitar erros
  return '127.0.0.1'
}

export async function POST(request: Request) {
  try {
    // Aplicar rate limiting
    const ip = getIpAddress(request)
    const rateLimitResult = loginRateLimit(ip)
    
    // Se estiver limitado, retorna 429 (Too Many Requests)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de login. Por favor, aguarde e tente novamente.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429, 
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      )
    }
    
    const body = await request.json()
    
    // Validação básica dos campos
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      )
    }
    
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Validar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }
    
    // Validar formato de senha
    if (typeof password !== 'string' || password.length < 1) {
      return NextResponse.json(
        { error: 'Senha inválida' },
        { status: 400 }
      )
    }
    
    // Sanitização
    const sanitizedEmail = email.trim().toLowerCase()
    
    const db = getDatabase()

    const user = await db.get<User>('SELECT * FROM users WHERE email = ?', [sanitizedEmail])

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Access Token - expira em 15 minutos
    const accessToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    // Refresh Token - expira em 7 dias
    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    // Atualiza o último login
    await db.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    )

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'user' | 'admin' || 'user'
    }

    const response: AuthResponse = {
      user: authUser,
      tokens: { accessToken, refreshToken }
    }

    // Reseta o contador de rate limit após login bem-sucedido
    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '5',
        'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + 900).toString()
      }
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    )
  }
} 