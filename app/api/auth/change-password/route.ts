import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const WORKER_API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '');

export async function POST(request: Request) {
  if (!WORKER_API_URL) {
    console.error("NEXT_PUBLIC_API_URL não está configurado.");
    return NextResponse.json(
      { error: "Configuração do servidor incompleta." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const authorizationHeader = request.headers.get('Authorization');
    if (!authorizationHeader) {
      return NextResponse.json({ error: "Token de autorização ausente." }, { status: 401 });
    }

    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      );
    }

    const workerResponse = await fetch(`${WORKER_API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorizationHeader,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const responseData = await workerResponse.json();

    return NextResponse.json(responseData, { status: workerResponse.status });

  } catch (error) {
    console.error("Erro ao encaminhar para /api/auth/change-password do Worker:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar a alteração de senha." },
      { status: 500 }
    );
  }
} 