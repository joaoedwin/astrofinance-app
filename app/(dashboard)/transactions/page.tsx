import { cookies } from "next/headers"
// import { getDatabase } from "@/lib/db" // Removido
import { verify } from "jsonwebtoken" // Usado para decodificar, mas a validação final é no worker
// import { getUserById } from "@/lib/auth" // Removido - validação de usuário será feita pelo worker
import { redirect } from "next/navigation"
import { TransactionsClient } from "@/components/transactions/transactions-client"
import { Transaction as TransactionType } from "@/types/database"; // Importar tipo para clareza

// Usar a variável de ambiente JWT_SECRET ou um valor padrão para desenvolvimento
// O JWT_SECRET aqui é usado apenas para decodificar o token localmente para obter userId se necessário antes da chamada.
// A verificação da assinatura do token é responsabilidade primária do Worker.
const JWT_SECRET = process.env.JWT_SECRET || '99c30cac76ce9f79ba2cd54d472434d5a7eb36632c4b07d2329a3d187f3f7c23'
// É crucial que este JWT_SECRET seja o MESMO que o configurado no Cloudflare Worker.

// Interface para os dados da transação como vêm da API (com category_name)
interface ApiTransaction extends TransactionType {
  category_name?: string;
}

interface RawTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  category_id: string
}

interface Transaction {
  id: string
  date: Date
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  category_id: string
}

// Forçar renderização dinâmica para evitar problemas com cookies
export const dynamic = 'force-dynamic';

async function fetchTransactions(token: string): Promise<TransactionType[]> {
  // A URL da API do Worker é acessada via o rewrite do Next.js
  const apiUrl = '/api/transactions'; // O Next.js encaminhará isso para o Worker

  // Em um ambiente de produção real, a URL base (process.env.NEXT_PUBLIC_API_URL)
  // seria usada se a chamada fosse de client-side ou getStaticProps/getServerSideProps sem rewrites.
  // Mas como estamos em Server Component e temos rewrites, podemos usar o caminho relativo.
  // Para Server Components, precisamos da URL absoluta se não houver rewrites.
  // Vamos construir a URL absoluta para robustez, caso os rewrites não se apliquem no contexto do fetch server-side.
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || process.env.VERCEL_URL || 'http://localhost:3000';
  const absoluteApiUrl = `${baseUrl.startsWith('http') ? '' : 'https://'}${baseUrl}/api/transactions`;


  console.log(`[TRANSACTIONS_PAGE] Fetching transactions from: ${absoluteApiUrl}`);

  const response = await fetch(absoluteApiUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Garante que os dados sejam sempre buscados
  });

  if (!response.ok) {
    // Tratar erros de resposta da API
    console.error(`[TRANSACTIONS_PAGE] API Error: ${response.status} ${response.statusText}`);
    const errorBody = await response.text();
    console.error(`[TRANSACTIONS_PAGE] API Error Body: ${errorBody}`);
    // Lançar um erro ou retornar um array vazio/estado de erro
    // throw new Error(`Falha ao buscar transações: ${response.statusText}`);
    return []; // Retornar vazio em caso de erro para a UI não quebrar totalmente
  }

  const apiTransactions: ApiTransaction[] = await response.json();

  // Mapear para o tipo Transaction esperado pelo TransactionsClient, convertendo a data
  return apiTransactions.map(tx => ({
    ...tx,
    date: new Date(tx.date), // Converter string de data para objeto Date
    category: tx.category_name || 'N/A', // Usar category_name se disponível
  }));
}

export default async function TransactionsPage() {
  const cookieStore = cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    console.log("[TRANSACTIONS_PAGE] Nenhum token encontrado, redirecionando para login")
    redirect("/login")
  }

  // Opcional: decodificar o token para obter userId para logs, mas não para validação (Worker faz isso)
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string }
    console.log(`[TRANSACTIONS_PAGE] Usuário (decodificado localmente): ${decoded.userId}`)
  } catch (e) {
    console.warn("[TRANSACTIONS_PAGE] Token inválido localmente, mas prosseguindo para validação do worker.");
    // Não redirecionar aqui, deixar o Worker validar. Se o token for realmente inválido, o fetch falhará.
  }

  let transactions: TransactionType[] = [];
  try {
    transactions = await fetchTransactions(token);
    console.log(`[TRANSACTIONS_PAGE] Total de transações carregadas: ${transactions.length}`);
  } catch (error) {
    console.error("[TRANSACTIONS_PAGE] Erro ao carregar transações via fetch:", error);
    // transactions permanecerá como array vazio, o TransactionsClient deve lidar com isso.
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
      <TransactionsClient transactions={transactions} />
    </div>
  )
}

// getToken foi movido para dentro da função principal ou pode ser removido se não usado em outro lugar.
