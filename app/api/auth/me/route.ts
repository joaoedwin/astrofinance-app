import { NextResponse } from 'next/server'

// URL da API Cloudflare
const API_URL = "https://astrofinance-api.joaoedumiranda.workers.dev/api";

export async function GET(request: Request) {
  try {
    // Obter o token do cabeçalho de autorização
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Encaminhar a requisição para a API Cloudflare
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Obter a resposta da API Cloudflare
    const data = await response.json();
    
    // Retornar a resposta com o mesmo status
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Erro ao encaminhar requisição de usuário para API Cloudflare:', error);
    return NextResponse.json(
      { error: 'Erro ao obter informações do usuário' },
      { status: 500 }
    );
  }
} 