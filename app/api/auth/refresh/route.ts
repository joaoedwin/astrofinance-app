import { NextResponse } from 'next/server'

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';

// URL da API Cloudflare
const API_URL = "https://astrofinance-api.joaoedumiranda.workers.dev/api";

export async function POST(request: Request) {
  try {
    // Obter o corpo da requisição
    const body = await request.json();
    
    // Encaminhar a requisição para a API Cloudflare
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Obter a resposta da API Cloudflare
    const data = await response.json();
    
    // Transformar a resposta no formato esperado pelo frontend
    const transformedData = {
      token: data.token,
      refreshToken: data.refreshToken
    };
    
    // Retornar a resposta com o mesmo status
    return NextResponse.json(transformedData, { status: response.status });
  } catch (error) {
    console.error('Erro ao encaminhar refresh para API Cloudflare:', error);
    return NextResponse.json(
      { error: 'Erro ao processar refresh token' },
      { status: 500 }
    );
  }
} 