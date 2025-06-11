import { NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"
import { registerRateLimit } from '@/lib/rate-limit'

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
    const rateLimitResult = registerRateLimit(ip)
    
    // Se estiver limitado, retorna 429 (Too Many Requests)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de registro. Por favor, aguarde e tente novamente mais tarde.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429, 
          headers: {
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': rateLimitResult.remainingRequests.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      )
    }
    
    const { email, password, name } = await request.json()

    // Validação mais rigorosa
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação de tamanho para todos os campos
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: 'Nome deve ter entre 2 e 100 caracteres' },
        { status: 400 }
      )
    }

    // Validar formato do email com regex mais robusto
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }
    
    // Validação de tamanho do email
    if (email.length > 255) {
      return NextResponse.json(
        { error: 'Email não pode exceder 255 caracteres' },
        { status: 400 }
      )
    }

    // Validação de força da senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }
    
    // Verificar se a senha contém pelo menos um número, uma letra maiúscula e um caractere especial
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'A senha deve conter pelo menos uma letra maiúscula, um número e um caractere especial' },
        { status: 400 }
      )
    }

    // Sanitização básica - remover espaços extras
    const sanitizedName = name.trim();
    const sanitizedEmail = email.trim().toLowerCase();

    const user = await registerUser(sanitizedEmail, password, sanitizedName)
    
    return NextResponse.json(
      { 
        message: 'Usuário registrado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'user'
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error)
    
    if (error.message === 'Email já está em uso') {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao registrar usuário' },
      { status: 500 }
    )
  }
} 