import { useState, useCallback } from "react";
import { useAuthContext } from "@/contexts/auth-context";

export interface GoalReserve {
  id: string;
  goal_id: string;
  user_id: string;
  month: string; // formato '2024-05'
  amount: number;
  created_at: string;
}

export function useGoalReserves() {
  const { token } = useAuthContext();
  const [reserves, setReserves] = useState<GoalReserve[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReserves = useCallback(async (goalId?: string, month?: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      let url = "/api/goals/reserves";
      const params = [];
      if (goalId) params.push(`goal_id=${goalId}`);
      if (month) params.push(`month=${month}`);
      if (params.length > 0) url += `?${params.join("&")}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar reservas");
      const data = await res.json();
      setReserves((prev) => {
        if (goalId) {
          // Remove reservas do goalId e adiciona as novas
          const filtered = prev.filter(r => r.goal_id !== goalId);
          return [...filtered, ...data];
        }
        // Se não filtrando, sobrescreve tudo
        return data;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createReserve = useCallback(async (reserve: { goal_id: string; month: string; amount: number }) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals/reserves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reserve),
      });
      if (!res.ok) throw new Error("Erro ao criar reserva");
      const data = await res.json();
      setReserves((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateReserve = useCallback(async (id: string, amount: number) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/goals/reserves", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, amount }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar reserva");
      const data = await res.json();
      setReserves((prev) => prev.map((r) => (r.id === id ? data : r)));
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteReserve = useCallback(async (id: string) => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/reserves?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao deletar reserva");
      setReserves((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return {
    reserves,
    loading,
    error,
    fetchReserves,
    createReserve,
    updateReserve,
    deleteReserve,
    setReserves,
  };
} 