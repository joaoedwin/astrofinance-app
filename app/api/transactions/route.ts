import { NextResponse } from "next/server"
import { handleApiError } from "../route-config"

// Forçar renderização dinâmica para evitar problemas de 404
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

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
    
    console.log("[TRANSACTIONS API] Enviando requisição para:", `${API_URL}/transactions`);
    
    // Encaminhar a requisição para a API Cloudflare
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TRANSACTIONS API] Erro na resposta:", response.status, errorText);
      return NextResponse.json(
        { error: `Erro ao buscar transações: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }
    
    // Obter a resposta da API Cloudflare
    const data = await response.json();
    console.log("[TRANSACTIONS API] Resposta recebida com sucesso");
    
    // Retornar a resposta
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "Erro ao buscar transações");
  }
}

export async function POST(request: Request) {
  try {
    // Obter o corpo da requisição
    const body = await request.json();
    
    // Obter o token de autenticação do cabeçalho
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticação não fornecido' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // Remover 'Bearer ' do início
    
    console.log("[TRANSACTIONS API] Enviando requisição para:", `${API_URL}/transactions`);
    console.log("[TRANSACTIONS API] Corpo da requisição:", JSON.stringify(body));
    
    // Encaminhar a requisição para a API Cloudflare
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TRANSACTIONS API] Erro na resposta:", response.status, errorText);
      return NextResponse.json(
        { error: `Erro ao criar transação: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }
    
    // Obter a resposta da API Cloudflare
    const data = await response.json();
    console.log("[TRANSACTIONS API] Transação criada com sucesso");
    
    // Retornar a resposta
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Erro ao criar transação");
  }
} 