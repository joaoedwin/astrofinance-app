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
      let url = "/api/goal-reserves"; // Corrigido
      const queryParams = new URLSearchParams();
      if (goalId) queryParams.append('goal_id', goalId);
      // O filtro por 'month' não está implementado na API do worker GET /api/goal-reserves
      // Se for necessário, precisará ser adicionado lá ou o frontend filtra os resultados.
      // if (month) queryParams.append('month', month);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Erro ao buscar reservas" }));
        throw new Error(errorData.message || "Erro ao buscar reservas");
      }
      const data = await res.json();
      // Atualização de estado mais robusta:
      // Se goalId for fornecido, atualiza/adiciona apenas as reservas para essa meta.
      // Se não, substitui todas as reservas.
      if (goalId) {
        setReserves(prev => {
          const otherReserves = prev.filter(r => r.goal_id !== goalId);
          return [...otherReserves, ...data];
        });
      } else {
        setReserves(data);
      }
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
      const res = await fetch("/api/goal-reserves", { // Corrigido
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reserve),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Erro ao criar reserva" }));
        throw new Error(errorData.message || "Erro ao criar reserva");
      }
      const data = await res.json();
      // Adicionar à lista local ou refazer o fetch para consistência, dependendo da preferência.
      // Adicionar localmente pode ser mais rápido, mas refazer fetch garante dados mais recentes se houver concorrência.
      setReserves((prev) => [...prev, data].sort((a,b) => b.month.localeCompare(a.month) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())); // Re-sort
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err; // Relançar para o componente poder tratar (ex: toast)
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateReserve = useCallback(async (id: string, amount: number) => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/goal-reserves/${id}`, { // Corrigido
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }), // Apenas 'amount' no corpo
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Erro ao atualizar reserva" }));
        throw new Error(errorData.message || "Erro ao atualizar reserva");
      }
      const data = await res.json();
      setReserves((prev) => prev.map((r) => (r.id === id ? data : r)));
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err; // Relançar para o componente poder tratar
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteReserve = useCallback(async (id: string) => {
    if (!token) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/goal-reserves/${id}`, { // Corrigido
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Erro ao deletar reserva" }));
        throw new Error(errorData.message || "Erro ao deletar reserva");
      }
      setReserves((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      throw err; // Relançar para o componente poder tratar
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