import { NextResponse } from 'next/server'

// URL da API Cloudflare
const API_URL = "https://astrofinance-api.joaoedumiranda.workers.dev/api";

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
    // Obter o corpo da requisição
    const body = await request.json();
    
    // Encaminhar a requisição para a API Cloudflare
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Obter a resposta da API Cloudflare
    const data = await response.json();
    
    // Retornar a resposta com o mesmo status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Erro ao encaminhar login para API Cloudflare:', error);
    return NextResponse.json(
      { error: 'Erro ao processar login' },
      { status: 500 }
    );
  }
} 