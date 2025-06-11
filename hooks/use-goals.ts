import { useState, useCallback } from "react"
import { useAuthContext } from "@/contexts/auth-context"

export interface Goal {
  id: string
  user_id: string
  name: string
  description: string
  target_amount: number
  current_amount: number
  category_id?: string | null
  type: "saving" | "spending" | "purchase"
  recurrence?: string | null
  start_date: string
  end_date?: string | null
  status: "active" | "completed" | "cancelled"
  created_at: string
  completed_at?: string | null
}

export function useGoals() {
  const { token } = useAuthContext()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/goals", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Erro ao buscar metas")
      const data = await res.json()
      setGoals(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const createGoal = useCallback(async (goal: Partial<Goal>) => {
    if (!token) return null
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(goal)
      })
      if (!res.ok) throw new Error("Erro ao criar meta")
      const data = await res.json()
      setGoals((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  const updateGoal = useCallback(async (goal: Partial<Goal>) => {
    if (!token || !goal.id) return null
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/goals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(goal)
      })
      if (!res.ok) throw new Error("Erro ao atualizar meta")
      const data = await res.json()
      setGoals((prev) => prev.map((g) => (g.id === data.id ? data : g)))
      return data
    } catch (err: any) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  const deleteGoal = useCallback(async (id: string) => {
    if (!token) return false
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/goals?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Erro ao deletar meta")
      setGoals((prev) => prev.filter((g) => g.id !== id))
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [token])

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    setGoals
  }
} 