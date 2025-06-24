import { cookies } from "next/headers"
import { getDatabase } from "@/lib/db"
import { verify } from "jsonwebtoken"
import { getUserById } from "@/lib/auth"
import { redirect } from "next/navigation"
import { TransactionsClient } from "@/components/transactions/transactions-client"

// Usar a variável de ambiente JWT_SECRET ou um valor padrão para desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || '99c30cac76ce9f79ba2cd54d472434d5a7eb36632c4b07d2329a3d187f3f7c23'

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

export default async function TransactionsPage() {
  try {
    const token = await getToken()
    if (!token) {
      console.log("[PAGE] Nenhum token encontrado, redirecionando para login")
      redirect("/login")
    }

    const decoded = verify(token, JWT_SECRET) as { userId: string }
    const user = await getUserById(decoded.userId)
    if (!user) {
      console.log("[PAGE] Usuário não encontrado, redirecionando para login")
      redirect("/login")
    }

    console.log(`[PAGE] Usuário autenticado: ${user.id}`)

    const db = getDatabase()
    const rawTransactions = db.prepare(`
      SELECT t.*, c.name as category 
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id 
      WHERE t.user_id = ? 
      ORDER BY date DESC
    `).all(user.id) as RawTransaction[]

    const transactions = rawTransactions.map(tx => ({
      ...tx,
      date: new Date(tx.date)
    })) as Transaction[]

    console.log(`[PAGE] Total de transações para o usuário ${user.id}: ${transactions.length}`)

    return (
      <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
        <TransactionsClient transactions={transactions} />
      </div>
    )
  } catch (error) {
    console.error("[PAGE] Erro ao carregar transações:", error)
    return (
      <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4">
        <TransactionsClient transactions={[]} />
      </div>
    )
  }
}

async function getToken() {
  const cookieStore = cookies()
  const token = cookieStore.get("token")?.value
  console.log(`[PAGE] Token obtido dos cookies: ${token ? 'Presente' : 'Ausente'}`)
  return token
}
