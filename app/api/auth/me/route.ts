import { NextResponse } from 'next/server'

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';

// URL da API Cloudflare
const API_URL = "https://astrofinance-api.joaoedumiranda.workers.dev/api";

export async function GET(request: Request) {
  try {
    // Obter o token de autenticação do cabeçalho
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // Remover 'Bearer ' do início
    
    // Encaminhar a requisição para a API Cloudflare
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      console.error('Erro ao encaminhar requisição de usuário para API Cloudflare:', response.status);
      return NextResponse.json(
        { error: 'Erro ao obter dados do usuário' },
        { status: response.status }
      );
    }
    
    // Obter a resposta da API Cloudflare
    const data = await response.json();
    
    // Retornar a resposta
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao encaminhar requisição de usuário para API Cloudflare:', error);
    return NextResponse.json(
      { error: 'Erro ao obter dados do usuário' },
      { status: 500 }
    );
  }
} 