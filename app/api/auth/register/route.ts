import { NextResponse } from 'next/server'

// URL da API Cloudflare
const API_URL = "https://astrofinance-api.joaoedumiranda.workers.dev/api";

export async function POST(request: Request) {
  try {
    // Obter o corpo da requisição
    const body = await request.json();
    
    // Encaminhar a requisição para a API Cloudflare
    const response = await fetch(`${API_URL}/auth/register`, {
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
    console.error('Erro ao encaminhar registro para API Cloudflare:', error);
    return NextResponse.json(
      { error: 'Erro ao processar registro' },
      { status: 500 }
    );
  }
} 