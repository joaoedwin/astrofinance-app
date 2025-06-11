import { useState, useCallback } from "react"
import { useAuthContext } from "@/contexts/auth-context"

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  category_id?: string
}

export function useTransactions() {
  const { token } = useAuthContext()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Erro ao buscar transações")
      const data = await res.json()
      setTransactions(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    setTransactions
  }
} 