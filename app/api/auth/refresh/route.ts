import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getDatabase } from '@/lib/db.js'
import type { User } from '@/types/database'
import type { AuthUser, AuthResponse, AuthTokenPayload } from '@/types/auth'

// Verificar se as variáveis de ambiente estão definidas
if (!process.env.JWT_SECRET) {
  console.error('AVISO: JWT_SECRET não está definido nas variáveis de ambiente. Usando valor padrão (inseguro para produção).')
}

// Usar a variável de ambiente JWT_SECRET ou um valor padrão para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || '99c30cac76ce9f79ba2cd54d472434d5a7eb36632c4b07d2329a3d187f3f7c23'

// Usar a variável de ambiente JWT_REFRESH_SECRET ou um valor padrão para desenvolvimento
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '37a8eec1ce19687d132fe29051dca629d164e2c4958ba141d5f4133a33f0688f'

export async function POST(request: Request) {
  try {
    const { refreshToken } = await request.json()
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Token de atualização não fornecido' },
        { status: 400 }
      )
    }

    let decoded: AuthTokenPayload
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as AuthTokenPayload
    } catch (error) {
      return NextResponse.json(
        { error: 'Token de atualização inválido' },
        { status: 401 }
      )
    }

    const db = getDatabase()
    const user = await db.get<User>('SELECT * FROM users WHERE id = ?', [decoded.id])

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'user' | 'admin' || 'user'
    }

    const response: AuthResponse = {
      user: authUser,
      tokens: {
      accessToken,
      refreshToken: newRefreshToken
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao atualizar token:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar token' },
      { status: 500 }
    )
  }
} 