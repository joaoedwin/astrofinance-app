import { useState, useEffect, useCallback } from "react"
import { useAuthContext } from "@/contexts/auth-context"

export function useDashboardData(token: string) {
  const { user } = useAuthContext()
  const [dashboard, setDashboard] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState<string>(() => (new Date().getMonth() + 1).toString().padStart(2, '0'))
  const [year, setYear] = useState<string>(() => new Date().getFullYear().toString())

  const fetchAll = useCallback(async () => {
    if (!user?.id) {
      setError("Usuário não autenticado")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        userId: user.id,
        month,
        year
      })
      const [dashboardRes, transactionsRes] = await Promise.all([
        fetch(`/api/dashboard?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/transactions", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const handleResponse = async (res: Response, errorMessage: string) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: errorMessage }))
          throw new Error(errorData.message || errorMessage)
        }
        return res.json()
      }

      const [dashboardData, transactionsData] = await Promise.all([
        handleResponse(dashboardRes, "Erro ao buscar dashboard"),
        handleResponse(transactionsRes, "Erro ao buscar transações"),
      ])

      setDashboard(dashboardData)
      setTransactions(transactionsData)
    } catch (e: any) {
      setDashboard(null)
      setTransactions([])
      setError(e.message || "Erro desconhecido ao buscar dados")
    } finally {
      setLoading(false)
    }
  }, [token, user, month, year])

  useEffect(() => {
    if (token && user?.id) fetchAll()
  }, [token, user, fetchAll])

  return { dashboard, transactions, loading, error, refetch: fetchAll, month, setMonth, year, setYear }
} 