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
    console.log("[LOGIN API] Enviando requisição para:", `${API_URL}/auth/login`);
    console.log("[LOGIN API] Corpo da requisição:", JSON.stringify(body));
    
    // Encaminhar a requisição para a API Cloudflare
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LOGIN API] Erro na resposta:", response.status, errorText);
      return NextResponse.json(
        { error: `Falha na autenticação: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }
    
    // Obter a resposta da API Cloudflare
    const data = await response.json();
    console.log("[LOGIN API] Resposta recebida:", JSON.stringify(data));
    
    // Transformar a resposta no formato esperado pelo frontend
    const transformedData = {
      user: data.user,
      tokens: {
        accessToken: data.token,
        refreshToken: data.refreshToken
      }
    };
    
    console.log("[LOGIN API] Dados transformados:", JSON.stringify(transformedData));
    
    // Retornar a resposta transformada
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error("[LOGIN API] Erro ao processar login:", error);
    return NextResponse.json(
      { error: `Erro ao processar login: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 