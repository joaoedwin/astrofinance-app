import { useState, useCallback } from "react"
import { useAuthContext } from "@/contexts/auth-context"

export interface Installment {
  id: string
  description: string
  category_id: string
  category: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  startDate: string
  nextPaymentDate: string
  type: string
}

export function useInstallments() {
  const { token } = useAuthContext()
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInstallments = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/installments", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Erro ao buscar parcelamentos")
      const data = await res.json()
      setInstallments(data.installments || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  return {
    installments,
    loading,
    error,
    fetchInstallments,
    setInstallments
  }
} 